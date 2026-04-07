const STORAGE_KEYS = {
  VEICULOS: 'scolfaro_veiculos',
  THEME: 'scolfaro_theme',
} as const;

export function getVeiculos(): string | null {
  return localStorage.getItem(STORAGE_KEYS.VEICULOS);
}

export function setVeiculos(data: string): void {
  localStorage.setItem(STORAGE_KEYS.VEICULOS, data);
}

export function getTheme(): string | null {
  return localStorage.getItem(STORAGE_KEYS.THEME);
}

export function setTheme(theme: string): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}
