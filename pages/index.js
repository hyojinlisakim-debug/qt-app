import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  getUser, createUser, getMyEntries, getAllEntries,
  saveEntry, deleteEntry, getPastorWords, getTodayWord,
  savePastorWord, PASTOR_CODE, formatDate, today
} from '../lib/storage';

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast${type === 'error' ? ' error' : ''}`}>{message}</div>
    </div>
  );
}

function WordBox({ word }) {
  if (!word) return (
    <div className="word-box" style={{ background: 'var(--cream-dark)', color: 'var(--text-soft)' }}>
      <div className="word-box-label">오늘의 말씀</div>
      <div style={{ fontSize: 14, opacity: 0.7 }}>목사님이 아직 오늘의 말씀을 올리지 않으셨습니다.</div>
    </div>
  );
  return (
    <div className="word-box">
      <div className="word-box-label">✝ 오늘의 말씀 · {formatDate(word.date)}</div>
      <div className="word-box-verse serif">&ldquo;{word.verse}&rdquo;</div>
      <div className="word-box-ref">{word.reference}</div>
      {word.body && <div className="word-box-body">{word.body}</div>}
    </div>
  );
}

function DetailModal({ entry, isPastor, onClose, onDelete }) {
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
        {!isPastor && (
          <div className="btn-row">
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(entry.id)}>삭제</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PastorWordModal({ onClose, onSave, existing }) {
  const [verse, setVerse] = useState(existing?.verse || '');
  const [reference, setReference] = useState(existing?.reference || '');
  const [body, setBody] = useState(existing?.body || '');
  const [date, setDate] = useState(existing?.date || today());
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!verse.trim() || !reference.trim()) return;
    setSaving(true);
    await onSave({ verse: verse.trim(), reference: reference.trim(), body: body.trim(), date });
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ marginBottom: '1.25rem', fontSize: 18 }}>오늘의 말씀 올리기</h2>
        <div className="field-group">
          <label className="field-label">날짜</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">성경 구절 본문</label>
          <textarea rows={4} placeholder="예) 하나님이 세상을 이처럼 사랑하사..." value={verse} onChange={e => setVerse(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">출처 (예: 요한복음 3:16)</label>
          <input type="text" placeholder="요한복음 3:16" value={reference} onChange={e => setReference(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">말씀 나눔 / 설명 (선택)</label>
          <textarea rows={4} placeholder="해당 말씀에 대한 목사님의 나눔..." value={body} onChange={e => setBody(e.target.value)} />
        </div>
        <div className="btn-row">
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-pastor" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '올리기'}</button>
        </div>
      </div>
    </div>
  );
}

function WriteForm({ currentUser, onSaved, todayWord }) {
  const empty = { book: '', date: today(), prayerIn: '', summary: '', verse: '', meditation: '', applyChar: '', applyAct: '', prayerOut: '' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })); }

  async function handleSave() {
    if (!form.book.trim()) return;
    setSaving(true);
    await saveEntry({ ...form, author: currentUser });
    setForm(empty);
    setSaving(false);
    onSaved();
  }

  return (
    <div>
      {todayWord && <WordBox word={todayWord} />}
      <div className="card">
        <div className="field-group">
          <label className="field-label">📖 오늘 본문</label>
          <input type="text" placeholder="예) 요한복음 3:16-17" value={form.book} onChange={set('book')} />
        </div>
        <div className="field-group">
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
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장하기 ✝'}</button>
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
            <span className="badge badge-user">{e.author}</span>
          </div>
          <div className="entry-book">{e.book}</div>
          {e.verse && <div className="entry-preview">{e.verse}</div>}
        </div>
      ))}
    </div>
  );
}

function PastorList({ onSelect }) {
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
        <div key={e.id} className="entry-card" onClick={() => onSelect(e)}>
          <div className="entry-card-meta">
            <span className="entry-date">{formatDate(e.date)}</span>
            <span className="badge badge-user">{e.author}</span>
          </div>
          <div className="entry-book">{e.book}</div>
          {e.verse && <div className="entry-preview">{e.verse}</div>}
        </div>
      ))}
    </div>
  );
}

function PastorWords({ onPost }) {
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
        <div key={i} className="entry-card" style={{ cursor: 'default' }}>
          <div className="entry-card-meta">
            <span className="entry-date">{formatDate(w.date)}</span>
            <span className="badge badge-pastor">목사님</span>
          </div>
          <div className="entry-book serif">&ldquo;{w.verse?.substring(0, 60)}{w.verse?.length > 60 ? '...' : ''}&rdquo;</div>
          <div className="entry-preview">{w.reference}</div>
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
  const [todayWord, setTodayWord] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

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
    setCurrentUser(loginName.trim());
    setScreen('main');
    setActiveTab('list');
    getTodayWord().then(setTodayWord);
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
    getTodayWord().then(setTodayWord);
    showToast('오늘의 말씀이 올라갔습니다 ✝');
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
            {(screen === 'main' || screen === 'pastor') && (
              <button className="btn btn-sm" onClick={doLogout}>로그아웃</button>
            )}
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
            {activeTab === 'list' && <MyList currentUser={currentUser} onSelect={setSelectedEntry} refreshKey={refreshKey} />}
            {activeTab === 'write' && (
              <WriteForm currentUser={currentUser} todayWord={todayWord} onSaved={() => { showToast('큐티가 저장되었습니다 ✝'); setActiveTab('list'); setRefreshKey(k => k + 1); }} />
            )}
            {activeTab === 'word' && <WordBox word={todayWord} />}
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
            {pastorTab === 'entries' && <PastorList onSelect={setSelectedEntry} />}
            {pastorTab === 'words' && <PastorWords onPost={() => setShowWordModal(true)} />}
          </div>
        )}
      </div>

      {selectedEntry && (
        <DetailModal entry={selectedEntry} isPastor={isPastor} onClose={() => setSelectedEntry(null)} onDelete={handleDeleteEntry} />
      )}
      {showWordModal && (
        <PastorWordModal onClose={() => setShowWordModal(false)} onSave={handleSaveWord} existing={todayWord} />
      )}
      <Toast message={toast.message} type={toast.type} />
    </>
  );
}
