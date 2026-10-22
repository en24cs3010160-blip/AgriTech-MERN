
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const city = (req.query.city || '').trim();

    if (!city) {
      return res.status(400).json({
        message: 'Please provide a city name'
      });
    }

    if (!process.env.OPENWEATHER_API_KEY) {
      return res.status(500).json({
        message: 'Weather API key is not configured'
      });
    }

    const url = new URL(
      'https://api.openweathermap.org/data/2.5/weather'
    );

    url.searchParams.set('q', city);
    url.searchParams.set('appid', process.env.OPENWEATHER_API_KEY);
    url.searchParams.set('units', 'metric');

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: data.message || 'Unable to fetch weather'
      });
    }

    res.json({
      city: data.name,
      country: data.sys.country,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed
    });
  } catch (error) {
    res.status(500).json({
      message: 'Weather service is temporarily unavailable'
    });
  }
});

module.exports = router;
