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

const CALAPAN_WEATHER_API = '/api/weather/calapan';

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

export async function fetchCalapanWeather(): Promise<CalapanWeatherConditions> {
  const response = await fetch(CALAPAN_WEATHER_API);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(body) && isText(body.error)
      ? body.error
      : `Calapan weather request failed (${response.status}).`;
    throw new Error(message);
  }
  if (!isCalapanWeatherConditions(body)) {
    throw new Error('Calapan weather service returned invalid data.');
  }
  return body;
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
