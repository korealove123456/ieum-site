const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 8e6 });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_, res) => res.json({ ok: true }));
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1314';
let currentPost = null;
let revealed = false;
const clients = new Map();
const answers = new Map();
const adminSessions = new Set();
function safeUser(c) { return { id: c.id, nickname: c.nickname, admitted: c.admitted, connected: true }; }
function snapshot(forAdmin=false) {
  const users = [...clients.values()].map(safeUser);
  return { users, post: currentPost, revealed, answers: forAdmin ? Object.fromEntries(answers) : undefined };
}
function sync() { io.emit('state', snapshot(false)); for (const id of adminSessions) io.to(id).emit('adminState', snapshot(true)); }
function requireAdmin(socket) { return adminSessions.has(socket.id); }
io.on('connection', socket => {
  clients.set(socket.id, { id: socket.id, nickname: '', admitted: false });
  socket.emit('state', snapshot(false));
  socket.on('join', nickname => {
    const n = String(nickname || '').trim().slice(0, 30);
    if (!n) return socket.emit('notice', '닉네임을 입력해 주세요.');
    const duplicate = [...clients.values()].some(c => c.id !== socket.id && c.nickname.toLowerCase() === n.toLowerCase());
    if (duplicate) return socket.emit('notice', '이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.');
    const c = clients.get(socket.id); c.nickname = n; c.admitted = false; sync();
  });
  socket.on('adminLogin', pw => {
    if (String(pw) === ADMIN_PASSWORD) { adminSessions.add(socket.id); socket.emit('adminLoginResult', {ok:true}); socket.emit('adminState', snapshot(true)); }
    else socket.emit('adminLoginResult', {ok:false, message:'비밀번호가 올바르지 않습니다.'});
  });
  socket.on('adminAction', data => {
    if (!requireAdmin(socket)) return socket.emit('notice', '관리자 로그인이 필요합니다.');
    if (!data || typeof data.action !== 'string') return;
    switch(data.action) {
      case 'admitAll': for (const c of clients.values()) if(c.nickname) c.admitted = true; break;
      case 'waitAll': for (const c of clients.values()) c.admitted = false; break;
      case 'kick': { const c=clients.get(String(data.id)); if(c) c.admitted=false; break; }
      case 'publish': {
        const p=data.post||{}; const type=['quiz','post','text','photo','both'].includes(p.type)?p.type:'text';
        currentPost={id:crypto.randomUUID(),type,title:String(p.title||'').slice(0,150),body:String(p.body||'').slice(0,10000),mode:p.mode==='view'?'view':'participate',questions:Array.isArray(p.questions)?p.questions.slice(0,30).map((q,i)=>({id:String(i),text:String(q.text||'').slice(0,1000),kind:q.kind==='text'?'text':'choice',choices:Array.isArray(q.choices)?q.choices.slice(0,8).map(x=>String(x).slice(0,300)):[],answer:String(q.answer||'').slice(0,300)})):[],photo:p.photo||null,createdAt:Date.now()};
        revealed=false; answers.clear(); break;
      }
      case 'reveal': revealed=!revealed; break;
      case 'end': { for (const c of clients.values()) c.admitted=false; currentPost=null; revealed=false; answers.clear(); break; }
      case 'clearPost': currentPost=null; revealed=false; answers.clear(); break;
    }
    sync();
  });
  socket.on('submitAnswers', payload => {
    const c=clients.get(socket.id); if(!c || !c.nickname || !c.admitted || !currentPost || currentPost.type!=='quiz' || currentPost.mode==='view') return;
    if (answers.has(socket.id)) return socket.emit('notice','이미 답변을 제출했어요. 답변은 수정할 수 없습니다.');
    const vals=Array.isArray(payload)?payload.slice(0,30).map(x=>String(x||'').slice(0,1000)):[];
    answers.set(socket.id,{nickname:c.nickname, values:vals, submittedAt:Date.now()});
    socket.emit('notice','답변이 제출되었어요. 제출한 답변은 변경할 수 없습니다.');
    sync();
  });
  socket.on('disconnect', () => { clients.delete(socket.id); adminSessions.delete(socket.id); answers.delete(socket.id); sync(); });
});
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => console.log(`Ieum listening on ${port}`));
