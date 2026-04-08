import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, orderBy
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
  const q = query(collection(db, 'entries'), where('author', '==', author), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllEntries() {
  const q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  const q = query(collection(db, 'words'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTodayWord() {
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'words', today);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function savePastorWord(word) {
  await setDoc(doc(db, 'words', word.date), word);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export function today() {
  return new Date().toISOString().split('T')[0];
}
