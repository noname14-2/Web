// API Key từ OpenWeatherMap
const apiKey = '1eb0ddc1b16e83cf956300b0da1216cc'; // Thay bằng API Key của bạn

// Đối tượng chứa các bản dịch và emoji thời tiết
const translations = {
  en: {
    title: "Weather Forecast",
    languageLabel: "Language:",
    searchPlaceholder: "Enter city name",
    temperature: "Temperature",
    feels_like: "Feels Like",
    weather: "Weather",
    humidity: "Humidity",
    wind: "Wind Speed",
    pressure: "Pressure",
    dew_point: "Dew Point",
    forecast: "Weekly Forecast",
    error: "City not found"
  },
  vi: {
    title: "Dự báo thời tiết",
    languageLabel: "Ngôn ngữ:",
    searchPlaceholder: "Nhập tên thành phố",
    temperature: "Nhiệt độ",
    feels_like: "Cảm giác như",
    weather: "Thời tiết",
    humidity: "Độ ẩm",
    wind: "Tốc độ gió",
    pressure: "Áp suất",
    dew_point: "Điểm sương",
    forecast: "Dự báo hàng tuần",
    error: "Thành phố không tồn tại"
  }
};

// Chuyển đổi giữa chế độ ban đêm và ban ngày
function toggleMode() {
  document.body.classList.toggle('dark-mode');
  document.querySelector('.weather-app').classList.toggle('dark-mode');
  const button = document.querySelector('.mode-toggle button');
  if (document.body.classList.contains('dark-mode')) {
    button.textContent = '🌞 Ban ngày';
  } else {
    button.textContent = '🌙 Đêm';
  }
}

// Ngôn ngữ hiện tại (mặc định là tiếng Việt)
let currentLanguage = 'vi';

// Hàm chọn emoji phù hợp với điều kiện thời tiết
function getWeatherEmoji(weatherDescription) {
  const description = weatherDescription.toLowerCase();
  if (description.includes("clear")) return "☀️"; // Trời trong
  if (description.includes("clouds")) return "☁️"; // Có mây
  if (description.includes("rain")) return "🌧️"; // Mưa
  if (description.includes("thunderstorm")) return "⛈️"; // Bão
  if (description.includes("snow")) return "❄️"; // Tuyết
  if (description.includes("mist") || description.includes("fog")) return "🌫️"; // Sương mù
  if (description.includes("drizzle")) return "🌦️"; // Mưa phùn
  return "🌡️"; // Thời tiết khác
}

// Hàm cập nhật ngôn ngữ
function updateLanguage(language) {
  currentLanguage = language;
  
  // Cập nhật các nhãn
  document.getElementById('title').textContent = translations[language].title;
  document.getElementById('languageLabel').textContent = translations[language].languageLabel;
  document.getElementById('city').placeholder = translations[language].searchPlaceholder;
  
  // Nếu đã có dữ liệu thời tiết, cập nhật lại bằng ngôn ngữ mới
  const city = document.getElementById('city').value;
  if (city) {
    getWeather();
  }
}

// Xử lý sự kiện khi người dùng thay đổi ngôn ngữ
document.addEventListener('DOMContentLoaded', () => {
  const languageSelect = document.getElementById('languageSelect');
  languageSelect.value = currentLanguage;
  languageSelect.addEventListener('change', function (e) {
    updateLanguage(e.target.value);
  });
  
  // Thêm sự kiện cho nút chuyển chế độ ban đêm/bạn ngày
  const modeToggleButton = document.querySelector('.mode-toggle button');
  modeToggleButton.addEventListener('click', toggleMode);
});

// Hàm lấy dữ liệu thời tiết
async function getWeather() {
  const city = document.getElementById('city').value.trim();
  if (!city) return;

  const urlCurrent = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=${currentLanguage}`;
  const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=${currentLanguage}`;

  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(urlCurrent),
      fetch(urlForecast)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) throw new Error(translations[currentLanguage].error);

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Hiển thị thông tin thời tiết hiện tại
    const weatherEmoji = getWeatherEmoji(currentData.weather[0].description);
    document.getElementById('weather-main').innerHTML = `
      <h2>${currentData.name}, ${currentData.sys.country}</h2>
      <p>${new Date().toLocaleDateString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US')}</p>
      <p>${weatherEmoji} ${currentData.weather[0].description}</p>
      <p>${translations[currentLanguage].temperature}: ${currentData.main.temp} °C</p>
      <p>${translations[currentLanguage].feels_like}: ${currentData.main.feels_like} °C</p>
      <p>${translations[currentLanguage].humidity}: ${currentData.main.humidity}%</p>
      <p>${translations[currentLanguage].wind}: ${currentData.wind.speed} m/s</p>
    `;

    // Hiển thị thông tin thời tiết chi tiết
    const dewPoint = calculateDewPoint(currentData.main.temp, currentData.main.humidity);
    const detailsHTML = `
      <div><p>${translations[currentLanguage].pressure}: ${currentData.main.pressure} hPa</p></div>
      <div><p>${translations[currentLanguage].dew_point}: ${dewPoint} °C</p></div>
    `;
    document.getElementById('weather-details').innerHTML = detailsHTML;

    // Hiển thị dự báo tuần
    let weeklyHTML = `<h3>${translations[currentLanguage].forecast}</h3>`;
    for (let i = 0; i < forecastData.list.length; i += 8) {  // Lấy dữ liệu dự báo mỗi ngày một lần
      const day = forecastData.list[i];
      const dateOptions = { weekday: 'short', day: 'numeric', month: 'short' };
      const date = new Date(day.dt * 1000).toLocaleDateString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', dateOptions);
      const dayEmoji = getWeatherEmoji(day.weather[0].description);
      weeklyHTML += `
        <div>
          <p>${date}</p>
          <p>${dayEmoji} ${day.weather[0].description}</p>
          <p>${translations[currentLanguage].temperature}: ${day.main.temp_min}° - ${day.main.temp_max}°C</p>
        </div>
      `;
    }
    document.getElementById('weather-weekly').innerHTML = weeklyHTML;

  } catch (error) {
    document.getElementById('weather-main').innerHTML = `<p style="color: red;">${error.message}</p>`;
    document.getElementById('weather-details').innerHTML = '';
    document.getElementById('weather-weekly').innerHTML = '';
  }
}

// Hàm tính điểm sương (tùy chọn)
function calculateDewPoint(temp, humidity) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100.0);
  const dewPoint = (b * alpha) / (a - alpha);
  return dewPoint.toFixed(1);
}
