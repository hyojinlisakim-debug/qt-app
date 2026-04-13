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
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(year, month - 1, day);
  return year + '년 ' + month + '월 ' + day + '일 (' + weekdays[d.getDay()] + ')';
}

export function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Edmonton' });
}

// ── Comments ───────────────────────────────────────────────────────────────
export async function addComment(entryId, comment) {
  const id = Date.now().toString();
  await setDoc(doc(db, 'comments', id), {
    ...comment,
    entryId,
    createdAt: Date.now(),
    read: false,
  });
}

export async function getCommentsByEntry(entryId) {
  const q = query(collection(db, 'comments'), where('entryId', '==', entryId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt - b.createdAt);
}

export async function getUnreadComments(author) {
  const q = query(collection(db, 'comments'), where('entryAuthor', '==', author), where('read', '==', false));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markCommentsRead(commentIds) {
  for (const id of commentIds) {
    await setDoc(doc(db, 'comments', id), { read: true }, { merge: true });
  }
}
