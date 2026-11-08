import { ref } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'ride.theme-mode';
const mode = ref<ThemeMode>('system');
let mediaQuery: MediaQueryList | null = null;
let mediaListenerAttached = false;

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(value: ThemeMode): ResolvedTheme {
  if (value === 'system') return prefersDark() ? 'dark' : 'light';
  return value;
}

function paint(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document.body?.classList.toggle('dark', resolved === 'dark');
}

function attachSystemListener() {
  if (mediaListenerAttached || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (mode.value === 'system') paint(resolveTheme('system'));
  };
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(onChange);
  }
  mediaListenerAttached = true;
}

export function getThemeMode(): ThemeMode {
  return mode.value;
}

export function getResolvedTheme(): ResolvedTheme {
  return resolveTheme(mode.value);
}

export function applyThemeMode(next: ThemeMode) {
  mode.value = next;
  paint(resolveTheme(next));
}

export function setThemeMode(next: ThemeMode) {
  applyThemeMode(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* Storage may be unavailable; the theme still applies for this session. */
  }
}

export function initTheme() {
  let stored: unknown = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  applyThemeMode(isThemeMode(stored) ? stored : 'system');
  attachSystemListener();
}
