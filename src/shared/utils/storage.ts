import { supabase } from '@/lib/supabase';
import type { AppState } from '@/shared/types';

const STORAGE_KEY = 'class-management-system';

// === localStorage (local cache) ===

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

export function hasLocalData(): boolean {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    // Check if there's meaningful data (at least one class or student)
    return (parsed.classes?.length > 0 || parsed.students?.length > 0);
  } catch {
    return false;
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// === Supabase (cloud) ===

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export async function loadFromCloud(userId: string): Promise<Partial<AppState> | null> {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = no rows found (new user)
      if (error.code === 'PGRST116') return null;
      console.error('Failed to load from cloud:', error);
      return null;
    }

    return data?.data as Partial<AppState> | null;
  } catch (error) {
    console.error('Failed to load from cloud:', error);
    return null;
  }
}

export async function saveToCloud(userId: string, state: AppState): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert(
        {
          user_id: userId,
          data: state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Failed to save to cloud:', error);
    }
  } catch (error) {
    console.error('Failed to save to cloud:', error);
  }
}

// Debounced cloud save (avoid too many writes)
export function saveToCloudDebounced(userId: string, state: AppState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveToCloud(userId, state);
  }, 1500);
}

// === Export / Import ===

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
