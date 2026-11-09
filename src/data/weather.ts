export interface CalapanWeatherConditions {
  source: 'Open-Meteo' | 'Demo';
  location: string;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  weatherCode: number;
  windSpeedKmh: number;
  observedAt: string;
  rainChancePercent: number;
  precipitationMm: number;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const CALAPAN_WEATHER_API = `${API_BASE}/weather/calapan`;
const OPEN_METEO_WEATHER_API = 'https://api.open-meteo.com/v1/forecast?latitude=13.4148&longitude=121.1803&current=temperature_2m%2Capparent_temperature%2Crelative_humidity_2m%2Cweather_code%2Cwind_speed_10m%2Cprecipitation&hourly=precipitation_probability%2Cprecipitation&forecast_days=2&timezone=Asia%2FManila';
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCalapanWeatherConditions(value: unknown): value is CalapanWeatherConditions {
  return isRecord(value)
    && value.source === 'Open-Meteo'
    && isText(value.location)
    && isFiniteNumber(value.temperatureC)
    && isFiniteNumber(value.apparentTemperatureC)
    && isFiniteNumber(value.humidityPercent)
    && isFiniteNumber(value.weatherCode)
    && isFiniteNumber(value.windSpeedKmh)
    && isText(value.observedAt)
    && isFiniteNumber(value.rainChancePercent)
    && isFiniteNumber(value.precipitationMm);
}

function parseOpenMeteoConditions(body: unknown): CalapanWeatherConditions | null {
  if (!isRecord(body)) return null;
  const current = body.current;
  const hourly = body.hourly;
  if (!isRecord(current) || !isRecord(hourly)) return null;
  if (!isText(current.time)
    || !isFiniteNumber(current.temperature_2m)
    || !isFiniteNumber(current.apparent_temperature)
    || !isFiniteNumber(current.relative_humidity_2m)
    || !isFiniteNumber(current.weather_code)
    || !isFiniteNumber(current.wind_speed_10m)
    || !isFiniteNumber(current.precipitation)
    || !Array.isArray(hourly.time)
    || !Array.isArray(hourly.precipitation_probability)
    || !Array.isArray(hourly.precipitation)
    || hourly.time.length !== hourly.precipitation_probability.length
    || hourly.time.length !== hourly.precipitation.length) {
    return null;
  }
  const currentHour = current.time.slice(0, 13);
  const currentHourIndex = hourly.time.findIndex((hour) => isText(hour) && hour.startsWith(`${currentHour}:`));
  if (currentHourIndex < 0) return null;
  const rainChancePercent = hourly.precipitation_probability[currentHourIndex];
  if (!isFiniteNumber(rainChancePercent)) return null;
  return {
    source: 'Open-Meteo',
    location: 'Calapan City, Oriental Mindoro',
    temperatureC: current.temperature_2m,
    apparentTemperatureC: current.apparent_temperature,
    humidityPercent: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    windSpeedKmh: current.wind_speed_10m,
    observedAt: current.time,
    rainChancePercent,
    precipitationMm: current.precipitation,
  };
}

async function fetchCalapanWeatherDirect(): Promise<CalapanWeatherConditions> {
  const response = await fetch(OPEN_METEO_WEATHER_API, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Calapan weather request failed (${response.status}).`);
  }
  const body: unknown = await response.json().catch(() => null);
  const conditions = parseOpenMeteoConditions(body);
  if (!conditions) {
    throw new Error('Calapan weather service returned invalid data.');
  }
  return conditions;
}

export async function fetchCalapanWeather(): Promise<CalapanWeatherConditions> {
  try {
    const response = await fetch(CALAPAN_WEATHER_API, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (response.ok && isCalapanWeatherConditions(body)) return body;
    throw new Error(isRecord(body) && isText(body.error)
      ? body.error
      : `Calapan weather request failed (${response.status}).`);
  } catch {
    return fetchCalapanWeatherDirect();
  }
}

export function getDemoCalapanWeather(): CalapanWeatherConditions {
  return {
    source: 'Demo',
    location: 'Calapan City (sample data)',
    temperatureC: 29,
    apparentTemperatureC: 33,
    humidityPercent: 78,
    weatherCode: 2,
    windSpeedKmh: 12,
    observedAt: new Date().toISOString(),
    rainChancePercent: 35,
    precipitationMm: 0.2,
  };
}

export function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Conditions unavailable';
}

const RAIN_WEATHER_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

export function isRainyWeather(
  conditions: Pick<CalapanWeatherConditions, 'weatherCode' | 'precipitationMm'>,
): boolean {
  return RAIN_WEATHER_CODES.includes(conditions.weatherCode)
    || conditions.precipitationMm >= 0.5;
}
