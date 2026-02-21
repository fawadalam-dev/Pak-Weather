import { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  // State variables to store data
  const [city, setCity] = useState('Islamabad'); // Current city name
  const [weather, setWeather] = useState(null); // Weather data from API
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error message
  const [coords, setCoords] = useState({ latitude: 33.7298, longitude: 73.1786 }); // City coordinates

  // Function to get weather data using latitude and longitude
  const fetchWeather = async (latitude, longitude, cityName) => {
    try {
      setLoading(true); // Show loading spinner
      setError(''); // Clear previous errors

      // Step 1: Get weather data from Open-Meteo API
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      
      const response = await fetch(weatherUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      // Step 2: Convert response to JSON
      const data = await response.json();
      const current = data.current;

      // Step 3: Format the weather data
      setWeather({
        city: cityName,
        temperature: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
        description: getWeatherDescription(current.weather_code, current.is_day),
        weatherCode: current.weather_code,
        isDay: current.is_day,
        daily: data.daily,
      });
      
      setLoading(false); // Hide loading spinner
    } catch (err) {
      setError('Unable to fetch weather. Please try again.');
      setLoading(false);
      console.error(err);
    }
  };

  // Function to convert weather code to readable text
  const getWeatherDescription = (code, isDay) => {
    // Weather code mapping from API
    const descriptions = {
      0: 'Clear Sky',
      1: 'Mostly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light Drizzle',
      53: 'Moderate Drizzle',
      55: 'Dense Drizzle',
      61: 'Slight Rain',
      63: 'Moderate Rain',
      65: 'Heavy Rain',
      71: 'Slight Snow',
      73: 'Moderate Snow',
      75: 'Heavy Snow',
      77: 'Snow Grains',
      80: 'Slight Rain Showers',
      81: 'Moderate Rain Showers',
      82: 'Violent Rain Showers',
      85: 'Slight Snow Showers',
      86: 'Heavy Snow Showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with Hail',
      99: 'Thunderstorm with Hail',
    };
    
    // Return description if code exists, otherwise return 'Unknown'
    return descriptions[code] || 'Unknown';
  };

  // Function to show emoji based on weather code
  const getWeatherEmoji = (code, isDay) => {
    // Clear sky - show sun or moon based on day/night
    if (code === 0) {
      return isDay ? '☀️' : '🌙';
    }
    // Partly cloudy
    if (code === 1 || code === 2) {
      return isDay ? '🌤️' : '🌥️';
    }
    // Overcast
    if (code === 3) {
      return '☁️';
    }
    // Foggy
    if (code === 45 || code === 48) {
      return '🌫️';
    }
    // Drizzle and light rain
    if (code === 51 || code === 53 || code === 55 || code === 80 || code === 81 || code === 82) {
      return '🌧️';
    }
    // Moderate to heavy rain
    if (code === 61 || code === 63 || code === 65) {
      return '🌦️';
    }
    // Snow
    if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
      return '❄️';
    }
    // Thunderstorm
    if (code === 95 || code === 96 || code === 99) {
      return '⛈️';
    }
    // Default emoji
    return '🌤️';
  };

  // Function to handle city search
  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent page reload
    
    // Check if city name is empty
    if (!city.trim()) {
      return;
    }

    try {
      setLoading(true); // Show loading spinner
      setError(''); // Clear previous errors

      // Step 1: Convert city name to coordinates using Nominatim API (OpenStreetMap)
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${city},Pakistan&format=json&limit=1`;
      const geoResponse = await fetch(geoUrl);

      // Check if the request was successful
      if (!geoResponse.ok) {
        throw new Error('City not found');
      }

      // Step 2: Convert response to JSON
      const geoData = await geoResponse.json();

      // Step 3: Check if city exists in results
      if (geoData.length === 0) {
        setError('City not found. Please try another city name.');
        setLoading(false);
        return;
      }

      // Step 4: Extract latitude, longitude and city name
      const { lat, lon, display_name } = geoData[0];
      const cityName = display_name.split(',')[0]; // Get first part of name

      // Step 5: Save coordinates and fetch weather
      setCoords({ 
        latitude: parseFloat(lat), 
        longitude: parseFloat(lon) 
      });
      
      fetchWeather(parseFloat(lat), parseFloat(lon), cityName);
    } catch (err) {
      setError('Error searching for city. Please try again.');
      setLoading(false);
      console.error(err);
    }
  };

  // useEffect hook: runs once when component loads
  // Fetches weather data for default city (Islamabad)
  useEffect(() => {
    fetchWeather(coords.latitude, coords.longitude, city);
  }, []); // Empty dependency array means run only on mount

  // Render the app UI
  return (
    <div className="app">
      <div className="container">
        {/* App Title */}
        <h1 className="title">🇵🇰 Pakistan Weather</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)} // Update city state as user types
            placeholder="Enter city name..."
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        {/* Show error message if there's an error */}
        {error && <div className="error">{error}</div>}

        {/* Show loading message while fetching data */}
        {loading && <div className="loading">Loading weather data...</div>}

        {/* Show weather data if available and not loading */}
        {weather && !loading && (
          <div className="weather-container">
            {/* Main Weather Information */}
            <div className="weather-main">
              <div className="city-name">{weather.city}</div>
              <div className="weather-emoji">
                {getWeatherEmoji(weather.weatherCode, weather.isDay)}
              </div>
              <div className="temperature">{weather.temperature}°C</div>
              <div className="description">{weather.description}</div>
            </div>

            {/* Weather Details (Humidity & Wind Speed) */}
            <div className="weather-details">
              <div className="detail-card">
                <div className="detail-icon">💧</div>
                <div className="detail-label">Humidity</div>
                <div className="detail-value">{weather.humidity}%</div>
              </div>
              <div className="detail-card">
                <div className="detail-icon">💨</div>
                <div className="detail-label">Wind Speed</div>
                <div className="detail-value">{weather.windSpeed} km/h</div>
              </div>
            </div>

            {/* 5-Day Weather Forecast */}
            {weather.daily && (
              <div className="forecast">
                <h2>5-Day Forecast</h2>
                <div className="forecast-grid">
                  {/* Loop through each day and display forecast card */}
                  {weather.daily.time.slice(0, 5).map((date, index) => (
                    <div key={index} className="forecast-card">
                      <div className="forecast-date">{date}</div>
                      <div className="forecast-emoji">
                        {getWeatherEmoji(weather.daily.weather_code[index], true)}
                      </div>
                      <div className="forecast-temps">
                        <span className="max-temp">
                          {Math.round(weather.daily.temperature_2m_max[index])}°
                        </span>
                        <span className="min-temp">
                          {Math.round(weather.daily.temperature_2m_min[index])}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
