// Client-side storage utility
// Uses localStorage — for production, swap with Vercel KV or PlanetScale

export const PASTOR_CODE = 'pastor2024'; // 변경 가능

export function getUsers() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('qt_users') || '{}'); } catch { return {}; }
}

export function saveUsers(users) {
  localStorage.setItem('qt_users', JSON.stringify(users));
}

export function getEntries() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('qt_entries') || '[]'); } catch { return []; }
}

export function saveEntries(entries) {
  localStorage.setItem('qt_entries', JSON.stringify(entries));
}

export function getPastorWords() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('qt_words') || '[]'); } catch { return []; }
}

export function savePastorWords(words) {
  localStorage.setItem('qt_words', JSON.stringify(words));
}

export function getTodayWord() {
  const words = getPastorWords();
  const today = new Date().toISOString().split('T')[0];
  return words.find(w => w.date === today) || null;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export function today() {
  return new Date().toISOString().split('T')[0];
}
