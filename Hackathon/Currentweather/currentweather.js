        const apiKey = "82e62cf98050080ccef38650495ecfff";

        // Loader control functions
        function showLoader() {
            document.getElementById("loader").style.display = "flex";
        }
        
        function hideLoader() {
            document.getElementById("loader").style.display = "none";
        }

        // Event listener for search button
        document.querySelector(".search-bar button").addEventListener("click", () => {
            const city = document.querySelector(".search-bar input").value.trim();
            if (city) getWeatherByCity(city);
        });

        // Enter key support for search input
        document.getElementById("cityInput").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                const city = this.value.trim();
                if (city) getWeatherByCity(city);
            }
        });

        // Run geolocation on page load
        window.onload = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(successLocation, errorLocation);
            } else {
                alert("Geolocation is not supported by your browser");
                getWeatherByCity("Hyderabad,pk");
            }
        };

        function successLocation(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByCoords(lat, lon);
        }

        function errorLocation() {
            getWeatherByCity("Hyderabad,pk");
        }

        // Get weather by city name
        async function getWeatherByCity(city) {
            try {
                showLoader();

                const weatherRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
                );
                const weatherData = await weatherRes.json();
                if (weatherData.cod !== 200) {
                    alert("City not found!");
                    hideLoader();
                    return;
                }
                updateWeatherUI(weatherData);

                const forecastRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
                );
                const forecastData = await forecastRes.json();
                updateForecastUI(forecastData);
            } catch (error) {
                console.error("Error fetching weather data:", error);
                alert("Error fetching weather data. Please try again.");
            } finally {
                hideLoader();
            }
        }

        // Get weather by coordinates
        async function getWeatherByCoords(lat, lon) {
            try {
                showLoader();

                const weatherRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
                );
                const weatherData = await weatherRes.json();
                updateWeatherUI(weatherData);

                const forecastRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
                );
                const forecastData = await forecastRes.json();
                updateForecastUI(forecastData);
            } catch (error) {
                console.error("Error fetching weather data:", error);
                alert("Error fetching weather data. Please try again.");
            } finally {
                hideLoader();
            }
        }

        // Update current weather
        function updateWeatherUI(weatherData) {
            document.getElementById("cityName").innerText = `${weatherData.name}, ${weatherData.sys.country}`;
            document.getElementById("temperature").innerText = `${Math.round(weatherData.main.temp)}°C`;
            document.getElementById("description").innerText = weatherData.weather[0].description;

            document.getElementById("feelsLike").innerText = `${Math.round(weatherData.main.feels_like)}°C`;
            document.getElementById("humidity").innerText = `${weatherData.main.humidity}%`;

            // Wind + compass
            document.getElementById("wind").innerText = `${weatherData.wind.speed} m/s`;
            document.getElementById("compass").innerText = `${weatherData.wind.deg}° (${getWindDirection(weatherData.wind.deg)})`;

            document.getElementById("visibility").innerText = `${(weatherData.visibility / 1000).toFixed(1)} km`;

            // Precipitation
            let precipitation = 0;
            if (weatherData.rain && weatherData.rain["1h"]) precipitation = weatherData.rain["1h"];
            else if (weatherData.snow && weatherData.snow["1h"]) precipitation = weatherData.snow["1h"];
            document.getElementById("precipitation").innerText = `${precipitation} mm`;
        }

        // Update forecast
        function updateForecastUI(forecastData) {
            if (forecastData.cod !== "200") {
                console.warn("Forecast data not available");
                return;
            }

            // Hourly Forecast
            const hourlyContainer = document.getElementById("hourlyForecast");
            hourlyContainer.innerHTML = "";
            forecastData.list.slice(0, 8).forEach(item => {
                const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
                hourlyContainer.innerHTML += `
                <div class="forecast-card">
                    <p>${time}</p>
                    <img src="${iconUrl}" alt="${item.weather[0].description}">
                    <p>${Math.round(item.main.temp)}°C</p>
                </div>
                `;
            });

            // Daily Forecast
            const dailyContainer = document.getElementById("dailyForecast");
            dailyContainer.innerHTML = "";
            const dailyMap = {};
            forecastData.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const day = date.toLocaleDateString("en-US", { weekday: "short" });

                if (
                !dailyMap[day] ||
                Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyMap[day].dt * 1000).getHours() - 12)
                ) {
                dailyMap[day] = item;
                }
            });

            const selectedDays = Object.keys(dailyMap).slice(0, 5);
            selectedDays.forEach(day => {
                const item = dailyMap[day];
                const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
                dailyContainer.innerHTML += `
                <div class="forecast-card">
                    <p>${day}</p>
                    <img src="${iconUrl}" alt="${item.weather[0].description}">
                    <p>${Math.round(item.main.temp)}°C</p>
                </div>
                `;
            });
        }

        // Helper functions
        function getWindDirection(deg) {
            const directions = ["N","NE","E","SE","S","SW","W","NW"];
            return directions[Math.round(deg / 45) % 8];
        }

        // Simple wrapper function for backward compatibility
        function getWeather() {
            const city = document.getElementById("cityInput").value.trim();
            if (city) getWeatherByCity(city);
        }
        
        function navigateTo(page) {
            window.location.href = page; 
          }