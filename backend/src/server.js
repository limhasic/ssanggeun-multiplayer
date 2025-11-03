import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { judgeTwoLetterWord } from './jamo-judge.js';
import { Matchmaker } from './matchmaker.js';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const matchmaker = new Matchmaker(io);

io.on('connection', (socket) => {
  socket.on('hello', ({ nickname } = {}) => {
    matchmaker.registerUser(socket, nickname);
    io.to(socket.id).emit('lobby_state', matchmaker.getLobbyState());
  });

  socket.on('join_queue', (payload = {}) => {
    matchmaker.enqueue(socket, payload);
    io.emit('lobby_state', matchmaker.getLobbyState());
  });

  socket.on('leave_queue', () => {
    matchmaker.dequeue(socket.id);
  });

  socket.on('make_guess', ({ roomId, guess }) => {
    const game = matchmaker.getGame(roomId);
    if (!game) return;
    const player = game.players.find((p) => p.socketId === socket.id);
    if (!player) return; // 관전자는 추측 불가

    const result = judgeTwoLetterWord(game.secretFor(socket.id), guess);
    io.to(roomId).emit('guess_result', { roomId, guess, result, pumpkinAvailable: !player.usedPumpkin, by: matchmaker.getNickname(socket.id) });

    const isWin = result.every((cell) => cell === '🥕');
    game.turns += 1;
    if (isWin || game.turns >= 7) {
      const winner = isWin ? socket.id : null;
      io.to(roomId).emit('game_over', { result: isWin ? 'win' : 'lose', winner, solution: game.solutionForAll() });
      matchmaker.finish(roomId);
      io.emit('lobby_state', matchmaker.getLobbyState());
    }
  });

  socket.on('use_pumpkin', ({ roomId }) => {
    const game = matchmaker.getGame(roomId);
    if (!game) return;
    const hint = game.usePumpkin(socket.id);
    io.to(socket.id).emit('guess_result', { roomId, guess: '', result: hint, pumpkinAvailable: false });
  });

  socket.on('spectate_room', ({ roomId }) => {
    const game = matchmaker.getGame(roomId);
    if (!game) return;
    matchmaker.addSpectator(roomId, socket.id);
    socket.join(roomId);
    io.to(socket.id).emit('room_joined', { roomId, yourRole: 'spectator', pumpkinAvailable: false });
  });

  socket.on('chat_message', ({ roomId, text }) => {
    if (!text) return;
    const by = matchmaker.getNickname(socket.id);
    io.to(roomId).emit('chat_message', { roomId, by, text, ts: Date.now() });
  });

  socket.on('disconnect', () => {
    matchmaker.handleDisconnect(socket.id);
    io.emit('lobby_state', matchmaker.getLobbyState());
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[ssanggeun-backend] listening on ${PORT}`);
});


