const CALAPAN_WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=13.4148&longitude=121.1803&current=temperature_2m%2Capparent_temperature%2Crelative_humidity_2m%2Cweather_code%2Cwind_speed_10m%2Cprecipitation&hourly=precipitation_probability%2Cprecipitation&forecast_days=2&timezone=Asia%2FManila';

export async function fetchCalapanWeather() {
  const response = await fetch(CALAPAN_WEATHER_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Calapan weather request failed (${response.status}).`);
  }

  const body = await response.json();
  const current = body?.current;
  const hourly = body?.hourly;
  if (!current || !hourly
    || typeof current.time !== 'string'
    || !Number.isFinite(current.temperature_2m)
    || !Number.isFinite(current.apparent_temperature)
    || !Number.isFinite(current.relative_humidity_2m)
    || !Number.isFinite(current.weather_code)
    || !Number.isFinite(current.wind_speed_10m)
    || !Number.isFinite(current.precipitation)
    || !Array.isArray(hourly.time)
    || !Array.isArray(hourly.precipitation_probability)
    || !Array.isArray(hourly.precipitation)
    || hourly.time.length !== hourly.precipitation_probability.length
    || hourly.time.length !== hourly.precipitation.length) {
    throw new Error('Calapan weather service returned invalid conditions.');
  }

  const currentHour = current.time.slice(0, 13);
  const currentHourIndex = hourly.time.findIndex((hour) => (
    typeof hour === 'string' && hour.startsWith(`${currentHour}:`)
  ));
  if (currentHourIndex < 0) {
    throw new Error('Rain forecast data is unavailable for the current hour.');
  }
  const currentRainChance = hourly.precipitation_probability[currentHourIndex];
  if (!Number.isFinite(currentRainChance)) {
    throw new Error('Calapan rain forecast data is invalid.');
  }

  return {
    source: 'Open-Meteo',
    location: 'Calapan City, Oriental Mindoro',
    temperatureC: current.temperature_2m,
    apparentTemperatureC: current.apparent_temperature,
    humidityPercent: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    windSpeedKmh: current.wind_speed_10m,
    observedAt: current.time,
    rainChancePercent: currentRainChance,
    precipitationMm: current.precipitation,
  };
}
