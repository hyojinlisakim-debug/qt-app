import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where
} from 'firebase/firestore';

export const PASTOR_CODE = 'pastor2024';

export async function getUser(name) {
  const ref = doc(db, 'users', name);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function createUser(name, password) {
  await setDoc(doc(db, 'users', name), { password });
}

export async function getMyEntries(author) {
  const q = query(collection(db, 'entries'), where('author', '==', author));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllEntries() {
  const snap = await getDocs(collection(db, 'entries'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveEntry(entry) {
  const id = Date.now().toString();
  await setDoc(doc(db, 'entries', id), { ...entry, createdAt: Date.now() });
}

export async function updateEntry(id, entry) {
  await setDoc(doc(db, 'entries', id), { ...entry, updatedAt: Date.now() }, { merge: true });
}

export async function deleteEntry(id) {
  await deleteDoc(doc(db, 'entries', id));
}

export async function getPastorWords() {
  const snap = await getDocs(collection(db, 'words'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getTodayWord() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Edmonton' });
  const ref = doc(db, 'words', today);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function savePastorWord(word) {
  await setDoc(doc(db, 'words', word.date), word);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Edmonton' });
}
