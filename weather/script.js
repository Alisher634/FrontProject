const apikey = "4abb1dd3c5e615b0d434b6ec276ecf40";

const main = document.getElementById("main");
const form = document.getElementById("form");
const search = document.getElementById("search");
const geolocationButton = document.getElementById("geolocation-button");
const unitToggle = document.getElementById("unit-toggle");
const suggestionsList = document.getElementById("suggestions-list");
const errorMessage = document.createElement("p");

let useCelsius = true; // По умолчанию используем Цельсий

// Функция для построения URL для текущей погоды по названию города
const url = (city) =>
  `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}`;

// Функция для автозаполнения названия города
async function getCitySuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apikey}`;

  try {
    const response = await fetch(url);
    const cities = await response.json();
    displaySuggestions(cities);
  } catch (error) {
    console.error("Ошибка при получении данных о городах:", error);
  }
}

function displaySuggestions(cities) {
  suggestionsList.innerHTML = "";

  if (cities.length === 0) {
    suggestionsList.style.display = "none";
    errorMessage.textContent = "Город не найден!";
    errorMessage.classList.add("error-message");
    main.appendChild(errorMessage);
    return;
  }

  errorMessage.textContent = "";
  suggestionsList.style.display = "block";

  cities.forEach((city) => {
    const suggestionItem = document.createElement("li");
    // Если у нас есть страна, добавляем ее
    const country = city.country ? `, ${city.country}` : '';
    suggestionItem.innerHTML = highlightText(city.name + country, search.value); // Теперь показываем и город, и страну
    suggestionItem.addEventListener("click", () => {
      search.value = suggestionItem.textContent;
      suggestionsList.style.display = "none";
      getWeatherByLocation(city.name); // Получаем погоду для выбранного города
    });
    suggestionsList.appendChild(suggestionItem);
  });
}

// Функция для подсветки совпадений
function highlightText(text, query) {
  const regex = new RegExp(`(${query})`, 'gi'); // Поиск всех совпадений
  return text.replace(regex, '<strong>$1</strong>'); // Подсвечиваем совпадения
}

// Функция для получения текущей погоды по названию города
async function getWeatherByLocation(city) {
  const resp = await fetch(url(city));
  const respData = await resp.json();

  if (respData.cod !== 200) {
    alert("Город не найден!");
    return;
  }

  addWeatherToPage(respData);
  getFiveDayForecast(city); // Получаем прогноз на 5 дней
}

// Функция для получения 5-дневного прогноза по названию города
async function getFiveDayForecast(city) {
  const resp = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apikey}`
  );
  const respData = await resp.json();

  if (respData.cod !== "200") {
    alert("Прогноз не найден!");
    return;
  }

  addFiveDayForecast(respData);
}

// Добавление информации о текущей погоде на страницу
function addWeatherToPage(data) {
  const temp = convertTemperature(data.main.temp);
  const humidity = data.main.humidity;
  const windSpeed = data.wind.speed;

  const weather = document.createElement("div");
  weather.classList.add("weather");

  weather.innerHTML = `
    <h2>${data.name} <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" /> ${temp} <span>${useCelsius ? "°C" : "°F"}</span></h2>
    <small>${data.weather[0].main}</small>
    <div class="more-info">
      <p>Humidity : <span>${humidity}%</span></p>
      <p>Wind speed : <span>${Math.trunc(windSpeed * 3.6)} km/h</span></p>
    </div>
  `;

  main.innerHTML = "";
  main.appendChild(weather);
}

// Добавление 5-дневного прогноза на страницу
function addFiveDayForecast(data) {
  const forecast = document.createElement("div");
  forecast.classList.add("forecast");

  const fiveDayData = data.list.filter((item, index) => index % 8 === 0);

  fiveDayData.forEach((item) => {
    const tempMin = convertTemperature(item.main.temp_min);
    const tempMax = convertTemperature(item.main.temp_max);
    const weatherIcon = item.weather[0].icon;
    const date = new Date(item.dt * 1000).toLocaleDateString();

    const dayForecast = document.createElement("div");
    dayForecast.classList.add("daily-forecast");

    dayForecast.innerHTML = `
      <h3>${date}</h3>
      <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" />
      <p>${tempMin} / ${tempMax}</p>
      <small>${item.weather[0].main}</small>
    `;

    forecast.appendChild(dayForecast);
  });

  main.appendChild(forecast);
}

// Функция для получения погоды по текущему местоположению
async function getCurrentLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherByLocationByCoordinates(lat, lon);
      },
      (error) => {
        alert("Не удалось получить ваше местоположение.");
      }
    );
  } else {
    alert("Ваш браузер не поддерживает геолокацию.");
  }
}

// Функция для получения текущей погоды по координатам
async function getWeatherByLocationByCoordinates(lat, lon) {
  const resp = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}`
  );
  const respData = await resp.json();

  if (respData.cod !== 200) {
    alert("Weather data not found for this location!");
    return;
  }

  addWeatherToPage(respData);
  getFiveDayForecastByCoordinates(lat, lon);
}

// Функция для получения 5-дневного прогноза по координатам
async function getFiveDayForecastByCoordinates(lat, lon) {
  const resp = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apikey}`
  );
  const respData = await resp.json();
  addFiveDayForecast(respData);
}

// Конвертация температуры
function convertTemperature(K) {
  const celsius = Math.floor(K - 273.15);
  return useCelsius ? celsius : Math.floor(celsius * 9 / 5 + 32);
}

// Обработка ввода для автозаполнения
search.addEventListener("input", (e) => {
  const query = e.target.value;
  if (query.length >= 2) {
    getCitySuggestions(query);
  } else {
    suggestionsList.style.display = "none";
    errorMessage.textContent = "";
  }
});

// Обработка отправки формы
form.addEventListener("submit", (e) => {
  e.preventDefault();
  getWeatherByLocation(search.value);
});

// Обработка кнопки геолокации
geolocationButton.addEventListener("click", () => {
  getCurrentLocationWeather();
});

// Обработка переключения единиц измерения
unitToggle.addEventListener("change", () => {
  useCelsius = unitToggle.checked; // Обновляем значение useCelsius
  const city = search.value; // Получаем название города из поля поиска

  if (city) {
    getWeatherByLocation(city); // Перезагружаем погоду с новым состоянием температуры
  }
});
