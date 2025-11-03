import { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('대기 중');
  const [roomId, setRoomId] = useState('');
  const [guess, setGuess] = useState('');
  const [log, setLog] = useState([]);
  const [nickname, setNickname] = useState('');
  const [lobby, setLobby] = useState({ rooms: [], queue: [] });
  const [role, setRole] = useState('guest');
  const [spectators, setSpectators] = useState(0);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [board, setBoard] = useState([]); // {guess, result}
  const [lastRoom, setLastRoom] = useState('');

  const backendUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', []);

  useEffect(() => {
    const s = io(backendUrl, { transports: ['websocket'] });
    setSocket(s);
    s.on('connect', () => setStatus('서버 연결'));
    s.on('lobby_state', (state) => setLobby(state));
    s.on('match_found', ({ roomId, players }) => {
      setRoomId(roomId);
      setStatus('매치 성사');
    });
    s.on('room_joined', ({ yourRole }) => { setRole(yourRole); setStatus('방 입장'); });
    s.on('guess_result', (payload) => { 
      setLog((prev) => [...prev, payload]); 
      setBoard((b)=>[...b, { guess: payload.guess, result: payload.result }].slice(0,7)); 
      playSound(payload.result?.every((c)=> c==='🥕') ? 'win' : 'tick');
    });
    s.on('game_over', (payload) => setLog((prev) => [...prev, { type: 'game_over', ...payload }]));
    s.on('spectator_count', ({ count }) => setSpectators(count));
    s.on('chat_message', (msg) => setChat((c)=>[...c, msg]));
    // 새로고침 재진입(관전)
    const savedRoom = localStorage.getItem('roomId');
    if (savedRoom) {
      setLastRoom(savedRoom);
      s.on('connect', () => s.emit('spectate_room', { roomId: savedRoom }));
    }
    // 주기적으로 로비 요청
    const iv = setInterval(() => { s.emit('request_lobby'); }, 5000);
    // 탭 활성화 시 즉시 요청
    const onVis = () => { if (document.visibilityState === 'visible') s.emit('request_lobby'); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); s.disconnect(); };
  }, [backendUrl]);

  const hello = () => socket?.emit('hello', { nickname });
  const joinQueue = () => socket?.emit('join_queue', {});
  const leaveQueue = () => socket?.emit('leave_queue');
  const makeGuess = () => socket?.emit('make_guess', { roomId, guess });
  const spectate = (roomId) => socket?.emit('spectate_room', { roomId });
  const sendChat = () => { if (chatInput) { socket?.emit('chat_message', { roomId, text: chatInput }); setChatInput(''); } };

  // 상태 저장
  useEffect(() => {
    if (roomId) localStorage.setItem('roomId', roomId);
  }, [roomId]);

  return (
    <main style={{ maxWidth: 680, margin: '40px auto', padding: 16 }}>
      <h1>쌍근 멀티플레이(MVP)</h1>
      <div>상태: {status}</div>
      <div style={{ marginTop: 12 }}>
        <input placeholder="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <button onClick={hello}>입장</button>
      </div>
      <div style={{ marginTop: 12, display:'flex', gap:8 }}>
        <button onClick={joinQueue}>매치 대기열 참가</button>
        <button onClick={leaveQueue}>대기열 나가기</button>
      </div>
      <div style={{ marginTop: 16, display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <section>
          <h3>게임</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 56px)', gap:8 }}>
            {[...Array(7)].map((_, row) => (
              [0,1].map((col) => {
                const cell = board[row]?.result?.[col];
                const bg = cell === '🥕' ? '#ff5a5a' : cell === '🍄' ? '#ff9f43' : cell === '🧄' ? '#b56bf3' : cell === '🍆' ? '#6b5b95' : cell === '🍌' ? '#ffd166' : '#eee';
                return (
                  <div key={`${row}-${col}`} style={{ width:56, height:56, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:bg, color:'#111', fontSize:24 }}>
                    {cell || ''}
                  </div>
                );
              })
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <input placeholder="두 글자 입력" value={guess} onChange={(e) => setGuess(e.target.value)} maxLength={2} />
            <button onClick={makeGuess} disabled={!roomId || role==='spectator'}>제출</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <JamoKeyboard onKey={(k)=> setGuess((g)=> (g + k).slice(0,2))} onBackspace={()=> setGuess((g)=> g.slice(0,-1))} />
          </div>
        </section>
        <aside>
          <h3>관전자 패널</h3>
          <div>관전자 수: {spectators}</div>
          <div style={{ marginTop:8, border:'1px solid #ddd', borderRadius:6, height:160, overflow:'auto', padding:8 }}>
            {chat.map((m,i)=> (
              <div key={i}><strong>{m.by}</strong>: {m.text}</div>
            ))}
          </div>
          <div style={{ marginTop:8, display:'flex', gap:8 }}>
            <input value={chatInput} onChange={(e)=> setChatInput(e.target.value)} placeholder="메시지" />
            <button onClick={sendChat} disabled={!roomId}>전송</button>
          </div>
        </aside>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3>로비</h3>
        <div>
          <strong>진행중 방</strong>
          <ul>
            {lobby.rooms.map((r) => (
              <li key={r.roomId}>
                방 {r.roomId.slice(0,8)} — {r.players.map(p=>p.name).join(' vs ')} · 관전 {r.spectators}
                <button onClick={() => spectate(r.roomId)} style={{ marginLeft: 8 }}>관전</button>
              </li>
            ))}
          </ul>
          <strong>대기열</strong>
          <ul>
            {lobby.queue.map((u) => (<li key={u.id}>{u.name}</li>))}
          </ul>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3>로그</h3>
        <ul>
          {log.map((item, idx) => (
            <li key={idx}>
              {item.type === 'game_over' ? (
                <span>게임 종료: 결과 {item.result}, 정답 {JSON.stringify(item.solution)}</span>
              ) : (
                <span>{item.by ? `${item.by}의 ` : ''}추측: {item.guess} → 힌트 {JSON.stringify(item.result)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Noto Sans KR, Apple SD Gothic Neo, sans-serif; }
        button { margin-left: 8px; }
      `}</style>
    </main>
  );
}

function JamoKeyboard({ onKey, onBackspace }) {
  const chos = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const jungs = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {chos.map((k)=> (<Key key={k} label={k} onClick={()=> onKey(k)} />))}
      </div>
      <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:6 }}>
        {jungs.map((k)=> (<Key key={k} label={k} onClick={()=> onKey(k)} />))}
        <Key label="⌫" onClick={onBackspace} />
      </div>
    </div>
  );
}

function Key({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ minWidth:32, padding:'6px 8px', borderRadius:6, background:'#f5f5f5', border:'1px solid #ddd' }}>{label}</button>
  );
}

// 간단한 사운드
let audioCtx;
function playSound(kind) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = kind === 'win' ? 880 : 440;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); }, kind === 'win' ? 250 : 120);
  } catch {}
}


