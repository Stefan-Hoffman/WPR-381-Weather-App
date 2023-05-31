const express = require('express');
const app = express();
const axios = require('axios');

const port = process.env.PORT;
const HOST = process.env.HOST;
const URL = process.env.URL;

const mongoose = require('mongoose');
require('dotenv').config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a Weather schema and model
const weatherSchema = new mongoose.Schema({
  zip: String,
  data: Object,
});

const Weather = mongoose.model('Weather', weatherSchema);

// Connect to MongoDB
try{mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})}
catch(error){
  console.log(error);
}
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// GET route to fetch weather data
function getWeather() 
{app.get('/weather/:zip', async (req, res) => {
  try {
    const { zip } = req.params;
    
    // Check if weather data exists in MongoDB
    const weather = await Weather.findOne({ zip });

    if (weather) {
      // If weather data exists, return it from the database
      res.json(weather.data);
    } else {
      // Make a request to OpenWeatherMap API
      const apiKey = process.env.WEATHERAPI;
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=${apiKey}`;
      const response = await axios.get(apiUrl);
      const weatherData = response.data;

      // Save weather data to MongoDB
      const newWeather = new Weather({
        zip,
        data: weatherData,
      });
      await newWeather.save();
      res.json(weatherData);
    }
  } catch (error) {
    res.status(404).json({ message: 'Weather data not found' });
  }
});
};
// Start the server
app.listen(port, HOST, () => {
  console.log('Server is running on PORT: ${port} and HOST: ${HOST}');
});


//start of front end react
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [zipCode, setZipCode] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [unit, setUnit] = useState('C');

  useEffect(() => {
    // Fetch weather data when zipCode changes
    if (zipCode) {
      getWeather();
    }
  }, [zipCode]);

  const handleZipCodeChange = (event) => {
    setZipCode(event.target.value);
  };

  const handleUnitChange = () => {
    setUnit(unit === 'C' ? 'F' : 'C');
  };

  return (
    <div>
      <h1>Weather App</h1>
      <div style="background-image: url(BG1.jpg);">
        <label htmlFor="zipCode">Enter ZIP code:</label>
        <input
          type="text"
          name="weatherzipcode"
          id="zipCode"
          value={zipCode}
          onChange={handleZipCodeChange}
        />
        <button onClick={fetchWeatherData}>Get Weather</button>
      </div>
      { weatherData ? (
        <div>
          <h2>Current Weather</h2>
          <p>Location: {weatherData.location.name}</p>
          <p>Temperature: {weatherData.current.temp_c}°C</p>
          <p>Condition: {weatherData.current.condition.text}</p>
          <p>
            <button onClick={handleUnitChange}>
              Toggle Unit ({unit === 'C' ? 'Fahrenheit' : 'Celsius'})
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
};
export default App;
