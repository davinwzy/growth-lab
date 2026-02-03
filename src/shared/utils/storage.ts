import type { AppState } from '@/shared/types';

const STORAGE_KEY = 'class-management-system';

export function loadFromStorage(): Partial<AppState> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
}

export function saveToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function exportData(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function downloadData(state: AppState, filename: string = 'class-data.json'): void {
  const data = exportData(state);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(jsonString: string): Partial<AppState> | null {
  try {
    const data = JSON.parse(jsonString);
    // Basic validation
    if (typeof data === 'object' && data !== null) {
      return data as Partial<AppState>;
    }
  } catch (error) {
    console.error('Failed to parse import data:', error);
  }
  return null;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
