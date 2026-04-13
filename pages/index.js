import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  getUser, createUser, getMyEntries, getAllEntries,
  saveEntry, updateEntry, deleteEntry, getPastorWords, getTodayWord,
  savePastorWord, addComment, updateComment, deleteComment, getCommentsByEntry, getUnreadComments,
  markCommentsRead, PASTOR_CODE, formatDate, today
} from '../lib/storage';

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast${type === 'error' ? ' error' : ''}`}>{message}</div>
    </div>
  );
}

function WordBox({ word, showFull }) {
  if (!word) return (
    <div className="word-box" style={{ background: 'var(--cream-dark)', color: 'var(--text-soft)' }}>
      <div className="word-box-label">오늘의 말씀</div>
      <div style={{ fontSize: 14, opacity: 0.7 }}>목사님이 아직 오늘의 말씀을 올리지 않으셨습니다.</div>
    </div>
  );

  if (showFull) {
    const sections = [
      { title: '✦ 들어가는 기도', content: word.prayerIn },
      { title: '2. 본문 요약', content: word.summary },
      { title: '3. 붙잡은 말씀', content: word.verse, highlight: true },
      { title: '4. 느낌과 묵상', content: word.meditation },
      { title: '5. 적용과 결단 — 성품', content: word.applyChar },
      { title: '5. 적용과 결단 — 행동', content: word.applyAct },
      { title: '6. 올려드리는 기도', content: word.prayerOut },
    ].filter(s => s.content);

    return (
      <div>
        <div className="word-box" style={{ marginBottom: '1rem' }}>
          <div className="word-box-label">✝ 오늘의 말씀 · {formatDate(word.date)}</div>
          <div className="word-box-ref" style={{ fontSize: 16, fontWeight: 500 }}>{word.book}</div>
        </div>
        <div className="card">
          {sections.map((s, i) => (
            <div key={i} className="detail-section" style={{ paddingTop: i === 0 ? 0 : '1rem', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <div className="detail-section-title">{s.title}</div>
              {s.highlight
                ? <div className="verse-highlight detail-content">{s.content}</div>
                : <div className="detail-content">{s.content}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="word-box">
      <div className="word-box-label">✝ 오늘의 말씀 · {formatDate(word.date)}</div>
      <div className="word-box-ref" style={{ fontSize: 15, fontWeight: 500 }}>{word.book}</div>
      {word.verse && <div className="word-box-verse serif" style={{ marginTop: 8 }}>&ldquo;{word.verse}&rdquo;</div>}
    </div>
  );
}

function AllWordsList() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getPastorWords().then(data => { setWords(data); setLoading(false); });
  }, []);

  if (loading) return <div className="empty">불러오는 중...</div>;
  if (!words.length) return (
    <div className="empty">
      <div className="empty-icon">📖</div>
      <div>아직 올라온 말씀이 없습니다.</div>
    </div>
  );

  if (selected) {
    return (
      <div>
        <button className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setSelected(null)}>← 목록으로</button>
        <WordBox word={selected} showFull={true} />
      </div>
    );
  }

  return (
    <div>
      {words.map((w, i) => (
        <div key={i} className="entry-card" onClick={() => setSelected(w)}>
          <div className="entry-card-meta">
            <span className="entry-date">{formatDate(w.date)}</span>
            <span className="badge badge-pastor">목사님</span>
          </div>
          <div className="entry-book serif">{w.book}</div>
          {w.verse && <div className="entry-preview">{w.verse.substring(0, 60)}{w.verse.length > 60 ? '...' : ''}</div>}
        </div>
      ))}
    </div>
  );
}

function CommentModal({ entry, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    getCommentsByEntry(entry.id).then(data => { setComments(data); setLoading(false); });
  }, [entry.id]);

  async function handleSubmit() {
    if (!text.trim()) return;
    setSaving(true);
    await addComment(entry.id, { text: text.trim(), entryAuthor: entry.author, entryBook: entry.book });
    const updated = await getCommentsByEntry(entry.id);
    setComments(updated);
    setText('');
    setSaving(false);
  }

  async function handleUpdate(id) {
    if (!editText.trim()) return;
    setSaving(true);
    await updateComment(id, editText.trim());
    const updated = await getCommentsByEntry(entry.id);
    setComments(updated);
    setEditingId(null);
    setEditText('');
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('코멘트를 삭제하시겠습니까?')) return;
    await deleteComment(id);
    const updated = await getCommentsByEntry(entry.id);
    setComments(updated);
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditText(c.text);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div className="serif" style={{ fontSize: 16, fontWeight: 500, color: 'var(--brown-dark)' }}>{entry.book}</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>{entry.author} · {formatDate(entry.date)}</div>
          </div>
          <button className="btn btn-sm" onClick={onClose}>닫기</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div className="section-label" style={{ marginBottom: 8 }}>목사님 코멘트</div>
          {loading && <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>불러오는 중...</div>}
          {!loading && !comments.length && (
            <div style={{ fontSize: 13, color: 'var(--text-soft)', padding: '12px 0' }}>아직 코멘트가 없습니다.</div>
          )}
          {comments.map((c, i) => (
            <div key={i} style={{ background: 'var(--forest-light)', borderLeft: '3px solid var(--forest)', borderRadius: '0 8px 8px 0', padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 500 }}>목사님</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" style={{ padding: '2px 10px', fontSize: 12 }} onClick={() => startEdit(c)}>수정</button>
                  <button className="btn btn-sm btn-danger" style={{ padding: '2px 10px', fontSize: 12 }} onClick={() => handleDelete(c.id)}>삭제</button>
                </div>
              </div>
              {editingId === c.id ? (
                <div>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} style={{ minHeight: 80, marginBottom: 6 }} />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => setEditingId(null)}>취소</button>
                    <button className="btn btn-sm btn-pastor" onClick={() => handleUpdate(c.id)} disabled={saving}>{saving ? '저장 중...' : '수정 완료'}</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{c.text}</div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 6 }}>
                {new Date(c.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {c.updatedAt && ' (수정됨)'}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>새 코멘트 작성</div>
          <textarea
            placeholder="이 큐티에 대한 코멘트를 남겨주세요..."
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ minHeight: 90, marginBottom: 8 }}
          />
          <div className="btn-row">
            <button className="btn btn-pastor" onClick={handleSubmit} disabled={saving || !text.trim()}>
              {saving ? '저장 중...' : '코멘트 달기 ✝'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ currentUser, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getUnreadComments(currentUser).then(async data => {
      setComments(data);
      setLoading(false);
      if (data.length > 0) {
        await markCommentsRead(data.map(c => c.id));
      }
    });
  }, [currentUser]);

  // Note: after viewing, badge clears but comments stay visible in each entry

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="serif" style={{ fontSize: 18, fontWeight: 500, color: 'var(--brown-dark)' }}>새 코멘트</div>
          <button className="btn btn-sm" onClick={onClose}>닫기</button>
        </div>
        {loading && <div className="empty">불러오는 중...</div>}
        {!loading && !comments.length && (
          <div className="empty">
            <div className="empty-icon" style={{ fontSize: 24 }}>💬</div>
            <div>새 코멘트가 없습니다.</div>
          </div>
        )}
        {comments.map((c, i) => (
          <div key={i} style={{ background: 'var(--forest-light)', border: '1px solid rgba(61,107,79,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 500, marginBottom: 4 }}>
              목사님 코멘트 · {c.entryBook}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{c.text}</div>
            <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 6 }}>
              {new Date(c.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailModal({ entry, isPastor, onClose, onDelete, onEdit }) {
  if (!entry) return null;
  const sections = [
    { title: '✦ 들어가는 기도', content: entry.prayerIn },
    { title: '2. 본문 요약', content: entry.summary },
    { title: '3. 붙잡은 말씀', content: entry.verse, highlight: true },
    { title: '4. 느낌과 묵상', content: entry.meditation },
    { title: '5. 적용과 결단 — 성품', content: entry.applyChar },
    { title: '5. 적용과 결단 — 행동', content: entry.applyAct },
    { title: '6. 올려드리는 기도', content: entry.prayerOut },
  ].filter(s => s.content);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex-between mb-2">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500, color: 'var(--brown-dark)' }}>{entry.book}</div>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 2 }}>{formatDate(entry.date)} · {entry.author}</div>
          </div>
          <button className="btn btn-sm" onClick={onClose}>닫기</button>
        </div>
        {sections.map((s, i) => (
          <div key={i} className="detail-section">
            <div className="detail-section-title">{s.title}</div>
            {s.highlight
              ? <div className="verse-highlight detail-content">{s.content}</div>
              : <div className="detail-content">{s.content}</div>}
          </div>
        ))}
        {!isPastor && entry.commentCount > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">💬 목사님 코멘트</div>
            {(entry.comments || []).map((c, i) => (
              <div key={i} style={{ background: 'var(--forest-light)', borderLeft: '3px solid var(--forest)', borderRadius: '0 8px 8px 0', padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 500, marginBottom: 4 }}>목사님</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.text}</div>
                <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 4 }}>
                  {new Date(c.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
        {!isPastor && (
          <div className="btn-row">
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(entry.id)}>삭제</button>
            <button className="btn btn-primary btn-sm" onClick={() => onEdit(entry)}>수정</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PastorWordModal({ onClose, onSave, existing }) {
  const empty = { book: existing?.book || '', date: existing?.date || today(), prayerIn: existing?.prayerIn || '', summary: existing?.summary || '', verse: existing?.verse || '', meditation: existing?.meditation || '', applyChar: existing?.applyChar || '', applyAct: existing?.applyAct || '', prayerOut: existing?.prayerOut || '' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [showPaste, setShowPaste] = useState(true);

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })); }

  async function handleParse() {
    if (!pasteText.trim()) return;
    setParsing(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: '큐티 텍스트를 분석해서 각 항목으로 분류해주세요. 반드시 JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.',
          messages: [{
            role: 'user',
            content: '아래 큐티 텍스트를 분석해서 정확히 이 JSON 형식으로만 반환해주세요:\n{"date":"YYYY-MM-DD","book":"본문구절","prayerIn":"들어가는기도","summary":"본문요약","verse":"붙잡은말씀","meditation":"느낌과묵상","applyChar":"적용결단성품","applyAct":"적용결단행동","prayerOut":"올려드리는기도"}\n\n날짜가 없으면 오늘 날짜 ' + today() + ' 사용. 각 항목 텍스트에서 번호나 제목은 제거하고 내용만 넣어주세요.\n\n텍스트:\n' + pasteText
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const parsed = JSON.parse(text.trim());
      setForm(f => ({ ...f, ...parsed }));
      setShowPaste(false);
    } catch(e) {
      alert('분석 중 오류가 발생했습니다. 직접 입력해주세요.');
    }
    setParsing(false);
  }

  async function handleSave() {
    if (!form.book.trim()) return;
    setSaving(true);
    await onSave({ ...form });
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div className="serif" style={{ fontSize: 18, fontWeight: 500, color: 'var(--brown-dark)' }}>오늘의 말씀 올리기</div>
          <button className="btn btn-sm" onClick={onClose}>닫기</button>
        </div>

        {showPaste ? (
          <div>
            <div className="card">
              <div className="qt-block-title" style={{ marginBottom: 8 }}>📋 큐티 내용 붙여넣기</div>
              <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 10, lineHeight: 1.6 }}>
                카카오톡에 올리신 큐티 내용을 그대로 복사해서 붙여넣으시면 자동으로 각 칸에 채워집니다.
              </div>
              <textarea
                placeholder={"2026.04.08 시편 91:1-16\n1.들어가는 기도\n주님 감사합니다...\n2.본문 요약\n..."}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                style={{ minHeight: 180, fontSize: 13 }}
              />
            </div>
            <div className="btn-row">
              <button className="btn" onClick={() => setShowPaste(false)}>직접 입력</button>
              <button className="btn btn-pastor" onClick={handleParse} disabled={parsing || !pasteText.trim()}>
                {parsing ? '분석 중...' : '✦ 자동 분류하기'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
              <button className="btn btn-sm" onClick={() => setShowPaste(true)}>← 다시 붙여넣기</button>
            </div>
            <div className="card">
              <div className="field-group">
                <label className="field-label">📖 오늘 본문</label>
                <input type="text" placeholder="예) 시편 91:1-16" value={form.book} onChange={set('book')} />
              </div>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label">날짜</label>
                <input type="date" value={form.date} onChange={set('date')} />
              </div>
            </div>
            <div className="card">
              {[
                { key: 'prayerIn', label: '✦ 큐티 전재 / 들어가는 기도', ph: '큐티를 시작하기 전, 마음을 여는 기도를 적어주세요...' },
                { key: 'summary', label: '2. 본문 요약', ph: '본문을 간단히 두 세 줄로 요약해주세요...', short: true },
                { key: 'verse', label: '3. 붙잡은 말씀', ph: '내가 은혜 받은 성경 구절을 적어주세요...' },
                { key: 'meditation', label: '4. 느낌과 묵상', ph: '말씀을 통해 느끼고 묵상한 것을 자유롭게 적어주세요...', tall: true },
              ].map(({ key, label, ph, tall, short }) => (
                <div key={key} className="qt-block">
                  <div className="qt-block-title">{label}</div>
                  <textarea placeholder={ph} value={form[key]} onChange={set(key)} style={{ minHeight: tall ? 110 : short ? 70 : 90 }} />
                </div>
              ))}
              <div className="qt-block">
                <div className="qt-block-title">5. 적용과 결단</div>
                <div style={{ marginBottom: 8 }}>
                  <div className="field-label" style={{ marginBottom: 4 }}>성품)</div>
                  <textarea placeholder="성품 면에서의 적용..." value={form.applyChar} onChange={set('applyChar')} style={{ minHeight: 70 }} />
                </div>
                <div>
                  <div className="field-label" style={{ marginBottom: 4 }}>행동)</div>
                  <textarea placeholder="행동 면에서의 결단..." value={form.applyAct} onChange={set('applyAct')} style={{ minHeight: 70 }} />
                </div>
              </div>
              <div className="qt-block" style={{ marginBottom: 0 }}>
                <div className="qt-block-title">6. 올려드리는 기도</div>
                <textarea placeholder="마무리 기도를 적어주세요..." value={form.prayerOut} onChange={set('prayerOut')} />
              </div>
            </div>
            <div className="btn-row">
              <button className="btn" onClick={onClose}>취소</button>
              <button className="btn btn-pastor" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '올리기 ✝'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WriteForm({ currentUser, onSaved, todayWord, editingEntry, onCancelEdit }) {
  const empty = { book: '', date: today(), prayerIn: '', summary: '', verse: '', meditation: '', applyChar: '', applyAct: '', prayerOut: '' };
  const [form, setForm] = useState(editingEntry || empty);
  const [saving, setSaving] = useState(false);
  const isEditing = !!editingEntry;

  useEffect(() => {
    setForm(editingEntry || empty);
  }, [editingEntry]);

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })); }

  async function handleSave() {
    const bookValue = isEditing ? form.book : (todayWord ? todayWord.book : '');
    setSaving(true);
    if (isEditing) {
      await updateEntry(editingEntry.id, { ...form, author: currentUser });
    } else {
      await saveEntry({ ...form, book: bookValue, author: currentUser });
    }
    setForm(empty);
    setSaving(false);
    onSaved();
  }

  return (
    <div>
      {!isEditing && todayWord && <WordBox word={todayWord} />}
      {isEditing && (
        <div style={{ background: 'var(--gold-light)', border: '1px solid var(--gold)', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 14, color: 'var(--brown-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✏️ 큐티 수정 중</span>
          <button className="btn btn-sm" onClick={onCancelEdit}>취소</button>
        </div>
      )}
      <div className="card">
        <div className="field-group" style={{ marginBottom: 0 }}>
          <label className="field-label">날짜</label>
          <input type="date" value={form.date} onChange={set('date')} />
        </div>
      </div>
      <div className="card">
        {[
          { key: 'prayerIn', label: '✦ 큐티 전재 / 들어가는 기도', ph: '큐티를 시작하기 전, 마음을 여는 기도를 적어주세요...' },
          { key: 'summary', label: '2. 본문 요약', ph: '본문을 간단히 두 세 줄로 요약해주세요...', short: true },
          { key: 'verse', label: '3. 붙잡은 말씀', ph: '내가 은혜 받은 성경 구절을 적어주세요...' },
          { key: 'meditation', label: '4. 느낌과 묵상', ph: '말씀을 통해 느끼고 묵상한 것을 자유롭게 적어주세요...', tall: true },
        ].map(({ key, label, ph, tall, short }) => (
          <div key={key} className="qt-block">
            <div className="qt-block-title">{label}</div>
            <textarea placeholder={ph} value={form[key]} onChange={set(key)} style={{ minHeight: tall ? 110 : short ? 70 : 90 }} />
          </div>
        ))}
        <div className="qt-block">
          <div className="qt-block-title">5. 적용과 결단</div>
          <div style={{ marginBottom: 8 }}>
            <div className="field-label" style={{ marginBottom: 4 }}>성품)</div>
            <textarea placeholder="성품 면에서의 적용..." value={form.applyChar} onChange={set('applyChar')} style={{ minHeight: 70 }} />
          </div>
          <div>
            <div className="field-label" style={{ marginBottom: 4 }}>행동)</div>
            <textarea placeholder="행동 면에서의 결단..." value={form.applyAct} onChange={set('applyAct')} style={{ minHeight: 70 }} />
          </div>
        </div>
        <div className="qt-block" style={{ marginBottom: 0 }}>
          <div className="qt-block-title">6. 올려드리는 기도</div>
          <textarea placeholder="마무리 기도를 적어주세요..." value={form.prayerOut} onChange={set('prayerOut')} />
        </div>
      </div>
      <div className="btn-row">
        <button className="btn" onClick={() => setForm(empty)}>초기화</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : isEditing ? '수정 완료 ✝' : '저장하기 ✝'}
        </button>
      </div>
    </div>
  );
}

function MyList({ currentUser, onSelect, refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyEntries(currentUser).then(data => { setEntries(data); setLoading(false); });
  }, [currentUser, refreshKey]);

  const [commentCounts, setCommentCounts] = useState({});

  useEffect(() => {
    entries.forEach(e => {
      getCommentsByEntry(e.id).then(comments => {
        setCommentCounts(prev => ({ ...prev, [e.id]: comments.length }));
      });
    });
  }, [entries]);

  if (loading) return <div className="empty">불러오는 중...</div>;
  if (!entries.length) return (
    <div className="empty">
      <div className="empty-icon">✝</div>
      <div>아직 작성한 큐티가 없습니다.</div>
      <div style={{ marginTop: 4, fontSize: 12 }}>새로 작성 탭에서 시작해보세요</div>
    </div>
  );

  return (
    <div>
      {entries.map(e => (
        <div key={e.id} className="entry-card" onClick={() => onSelect(e)}>
          <div className="entry-card-meta">
            <span className="entry-date">{formatDate(e.date)}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {commentCounts[e.id] > 0 && (
                <span style={{ background: 'var(--forest-light)', color: 'var(--forest)', fontSize: 12, padding: '2px 8px', borderRadius: 100, fontWeight: 500 }}>
                  💬 {commentCounts[e.id]}
                </span>
              )}
              <span className="badge badge-user">{e.author}</span>
            </div>
          </div>
          <div className="entry-book">{e.book}</div>
          {e.verse && <div className="entry-preview">{e.verse}</div>}
        </div>
      ))}
    </div>
  );
}

function PastorList({ onSelect, onComment }) {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllEntries().then(data => {
      setEntries(data);
      setAuthors([...new Set(data.map(e => e.author))]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="empty">불러오는 중...</div>;
  const filtered = filter === 'all' ? entries : entries.filter(e => e.author === filter);

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm${filter === 'all' ? ' btn-primary' : ''}`} onClick={() => setFilter('all')}>전체</button>
        {authors.map(a => (
          <button key={a} className={`btn btn-sm${filter === a ? ' btn-primary' : ''}`} onClick={() => setFilter(a)}>{a}</button>
        ))}
      </div>
      {!filtered.length && <div className="empty"><div className="empty-icon">✝</div><div>아직 작성된 큐티가 없습니다.</div></div>}
      {filtered.map(e => (
        <div key={e.id} className="entry-card">
          <div className="entry-card-meta">
            <span className="entry-date">{formatDate(e.date)}</span>
            <span className="badge badge-user">{e.author}</span>
          </div>
          <div className="entry-book">{e.book}</div>
          {e.verse && <div className="entry-preview">{e.verse}</div>}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => onSelect(e)}>상세 보기</button>
            <button className="btn btn-sm btn-pastor" style={{ flex: 1 }} onClick={() => onComment(e)}>💬 코멘트 달기</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PastorWords({ onPost, onEdit }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPastorWords().then(data => { setWords(data); setLoading(false); });
  }, []);

  if (loading) return <div className="empty">불러오는 중...</div>;
  return (
    <div>
      <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
        <button className="btn btn-pastor" onClick={onPost}>+ 오늘의 말씀 올리기</button>
      </div>
      {!words.length && <div className="empty"><div className="empty-icon">📖</div><div>아직 올린 말씀이 없습니다.</div></div>}
      {words.map((w, i) => (
        <div key={i} className="entry-card" onClick={() => onEdit(w)}>
          <div className="entry-card-meta">
            <span className="entry-date">{formatDate(w.date)}</span>
            <span className="badge badge-pastor">목사님</span>
          </div>
          <div className="entry-book serif">{w.book}</div>
          {w.verse && <div className="entry-preview">{w.verse.substring(0, 60)}{w.verse.length > 60 ? '...' : ''}</div>}
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--brown)' }}>✏️ 클릭해서 수정</div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState('');
  const [isPastor, setIsPastor] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [pastorTab, setPastorTab] = useState('entries');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [todayWord, setTodayWord] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [commentEntry, setCommentEntry] = useState(null);

  const [loginName, setLoginName] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [pastorPw, setPastorPw] = useState('');
  const [regName, setRegName] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regPw2, setRegPw2] = useState('');

  function showToast(msg, type = 'ok') {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: '' }), 2500);
  }

  async function doLogin() {
    if (!loginName.trim() || !loginPw) { showToast('이름과 비밀번호를 입력하세요', 'error'); return; }
    setLoading(true);
    const user = await getUser(loginName.trim());
    setLoading(false);
    if (!user) { showToast('등록된 사용자가 없습니다', 'error'); return; }
    if (user.password !== loginPw) { showToast('비밀번호가 틀렸습니다', 'error'); return; }
    const uname = loginName.trim();
    setCurrentUser(uname);
    setScreen('main');
    setActiveTab('list');
    getTodayWord().then(setTodayWord);
    getUnreadComments(uname).then(data => setUnreadCount(data.length));
  }

  function doPastorLogin() {
    if (pastorPw === PASTOR_CODE) { setIsPastor(true); setScreen('pastor'); setPastorTab('entries'); }
    else showToast('코드가 올바르지 않습니다', 'error');
  }

  async function doRegister() {
    if (!regName.trim() || !regPw) { showToast('이름과 비밀번호를 입력하세요', 'error'); return; }
    if (regPw !== regPw2) { showToast('비밀번호가 일치하지 않습니다', 'error'); return; }
    setLoading(true);
    const existing = await getUser(regName.trim());
    if (existing) { showToast('이미 등록된 이름입니다', 'error'); setLoading(false); return; }
    await createUser(regName.trim(), regPw);
    setLoading(false);
    showToast('가입 완료! 로그인해주세요');
    setRegName(''); setRegPw(''); setRegPw2('');
    setScreen('login');
  }

  function doLogout() {
    setCurrentUser(''); setIsPastor(false); setScreen('login');
    setLoginName(''); setLoginPw(''); setPastorPw('');
    setUnreadCount(0); setShowNotif(false); setCommentEntry(null);
  }

  function handleEditEntry(entry) {
    setSelectedEntry(null);
    setEditingEntry(entry);
    setActiveTab('write');
  }

  async function handleDeleteEntry(id) {
    await deleteEntry(id);
    setSelectedEntry(null);
    setRefreshKey(k => k + 1);
    showToast('삭제되었습니다');
  }

  async function handleSaveWord(word) {
    await savePastorWord(word);
    setShowWordModal(false);
    setEditingWord(null);
    getTodayWord().then(setTodayWord);
    showToast('말씀이 저장되었습니다 ✝');
  }

  return (
    <>
      <Head>
        <title>큐티 나눔 · 청년부</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="site-header">
        <div className="container">
          <div className="site-header-inner">
            <div className="site-logo serif">✝ 큐티 나눔</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {screen === 'main' && (
                <button
                  onClick={() => setShowNotif(true)}
                  style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 20 }}
                >
                  💬
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 0, right: 0, background: '#A32D2D', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
              {(screen === 'main' || screen === 'pastor') && (
                <button className="btn btn-sm" onClick={doLogout}>로그아웃</button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingBottom: '3rem' }}>

        {screen === 'login' && (
          <div>
            <div style={{ textAlign: 'center', padding: '1.5rem 0 1.25rem' }}>
              <div className="serif" style={{ fontSize: 14, color: 'var(--text-soft)', letterSpacing: '0.08em' }}>말씀 안에서 함께 자라는</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 4, color: 'var(--brown-dark)' }}>청년부 큐티 나눔</div>
            </div>
            <div className="card">
              <div className="section-label">청년 로그인</div>
              <div className="field-group">
                <label className="field-label">이름</label>
                <input type="text" placeholder="이름" value={loginName} onChange={e => setLoginName(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} />
              </div>
              <div className="field-group">
                <label className="field-label">비밀번호</label>
                <input type="password" placeholder="비밀번호" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} />
              </div>
              <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm text-soft">
                  처음이신가요?{' '}
                  <span style={{ color: 'var(--brown)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setScreen('register')}>회원가입</span>
                </span>
                <button className="btn btn-primary" onClick={doLogin} disabled={loading}>{loading ? '확인 중...' : '로그인'}</button>
              </div>
            </div>
            <div className="divider">담당 목사님</div>
            <div className="card">
              <div className="section-label">목사님 전용</div>
              <div className="field-group">
                <input type="password" placeholder="목사님 전용 코드 입력" value={pastorPw} onChange={e => setPastorPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && doPastorLogin()} />
              </div>
              <div className="btn-row">
                <button className="btn btn-pastor" onClick={doPastorLogin}>목사님 로그인</button>
              </div>
            </div>
          </div>
        )}

        {screen === 'register' && (
          <div>
            <div style={{ padding: '1.5rem 0 1.25rem' }}>
              <div className="serif" style={{ fontSize: 20, fontWeight: 500, color: 'var(--brown-dark)' }}>회원가입</div>
            </div>
            <div className="card">
              <div className="field-group">
                <label className="field-label">이름</label>
                <input type="text" placeholder="실명 입력" value={regName} onChange={e => setRegName(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">비밀번호</label>
                <input type="password" placeholder="비밀번호 설정" value={regPw} onChange={e => setRegPw(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">비밀번호 확인</label>
                <input type="password" placeholder="비밀번호 재입력" value={regPw2} onChange={e => setRegPw2(e.target.value)} onKeyDown={e => e.key === 'Enter' && doRegister()} />
              </div>
              <div className="btn-row">
                <button className="btn" onClick={() => setScreen('login')}>취소</button>
                <button className="btn btn-primary" onClick={doRegister} disabled={loading}>{loading ? '처리 중...' : '가입하기'}</button>
              </div>
            </div>
          </div>
        )}

        {screen === 'main' && (
          <div>
            <div className="user-chip">
              <div className="avatar">{currentUser.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{currentUser}</div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>청년부</div>
              </div>
            </div>
            <div className="tabs">
              <div className={`tab-item${activeTab === 'list' ? ' active' : ''}`} onClick={() => setActiveTab('list')}>내 큐티 목록</div>
              <div className={`tab-item${activeTab === 'write' ? ' active' : ''}`} onClick={() => setActiveTab('write')}>새로 작성</div>
              <div className={`tab-item${activeTab === 'word' ? ' active' : ''}`} onClick={() => setActiveTab('word')}>오늘의 말씀</div>
            </div>
            {activeTab === 'list' && <MyList currentUser={currentUser} onSelect={async (e) => {
                const comments = await getCommentsByEntry(e.id);
                setSelectedEntry({ ...e, comments, commentCount: comments.length });
              }} refreshKey={refreshKey} />}
            {activeTab === 'write' && (
              <WriteForm
                currentUser={currentUser}
                todayWord={todayWord}
                editingEntry={editingEntry}
                onCancelEdit={() => { setEditingEntry(null); setActiveTab('list'); }}
                onSaved={() => {
                  showToast(editingEntry ? '수정되었습니다 ✝' : '큐티가 저장되었습니다 ✝');
                  setEditingEntry(null);
                  setActiveTab('list');
                  setRefreshKey(k => k + 1);
                }}
              />
            )}
            {activeTab === 'word' && <AllWordsList />}
          </div>
        )}

        {screen === 'pastor' && (
          <div>
            <div className="user-chip">
              <div className="avatar avatar-pastor">목</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>담당 목사님</div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>전체 큐티 열람 · 말씀 등록</div>
              </div>
            </div>
            <div className="tabs">
              <div className={`tab-item${pastorTab === 'entries' ? ' active' : ''}`} onClick={() => setPastorTab('entries')}>청년 큐티 전체</div>
              <div className={`tab-item${pastorTab === 'words' ? ' active' : ''}`} onClick={() => setPastorTab('words')}>말씀 관리</div>
            </div>
            {pastorTab === 'entries' && <PastorList onSelect={setSelectedEntry} onComment={setCommentEntry} />}
            {pastorTab === 'words' && <PastorWords onPost={() => { setEditingWord(null); setShowWordModal(true); }} onEdit={w => { setEditingWord(w); setShowWordModal(true); }} />}
          </div>
        )}
      </div>

      {selectedEntry && (
        <DetailModal entry={selectedEntry} isPastor={isPastor} onClose={() => setSelectedEntry(null)} onDelete={handleDeleteEntry} onEdit={handleEditEntry} />
      )}
      {commentEntry && (
        <CommentModal entry={commentEntry} onClose={() => setCommentEntry(null)} />
      )}
      {showNotif && (
        <NotificationPanel currentUser={currentUser} onClose={() => { setShowNotif(false); setUnreadCount(0); }} />
      )}
      {showWordModal && (
        <PastorWordModal onClose={() => { setShowWordModal(false); setEditingWord(null); }} onSave={handleSaveWord} existing={editingWord} />
      )}
      <Toast message={toast.message} type={toast.type} />
    </>
  );
}
