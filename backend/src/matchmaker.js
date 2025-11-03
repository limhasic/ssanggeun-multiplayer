import { randomUUID } from 'crypto';

const SAMPLE_WORDS = ['사과', '가지', '마늘', '당근'];

export class Matchmaker {
  constructor(io) {
    this.io = io;
    this.queue = [];
    this.games = new Map();
    this.userNick = new Map();
  }

  enqueue(socket, payload) {
    if (this.queue.find((s) => s.id === socket.id)) return;
    this.queue.push(socket);
    this.tryMatch();
  }

  dequeue(socketId) {
    this.queue = this.queue.filter((s) => s.id !== socketId);
  }

  registerUser(socket, nickname) {
    const safe = (nickname || '').trim() || `게스트-${socket.id.slice(0, 4)}`;
    this.userNick.set(socket.id, safe);
  }

  getNickname(socketId) {
    return this.userNick.get(socketId) || '알수없음';
  }

  tryMatch() {
    while (this.queue.length >= 2) {
      const a = this.queue.shift();
      const b = this.queue.shift();
      if (!a || !b) return;
      const roomId = randomUUID();

      const secret = this.pickSecret();
      const game = {
        id: roomId,
        players: [
          { socketId: a.id, role: 'playerA', name: this.getNickname(a.id), secret, usedPumpkin: false },
          { socketId: b.id, role: 'playerB', name: this.getNickname(b.id), secret, usedPumpkin: false }
        ],
        turns: 0,
        secretFor: (socketId) => this.games.get(roomId).players.find((p) => p.socketId === socketId)?.secret || '',
        solutionForAll: () => secret,
        spectators: new Set()
      };
      this.games.set(roomId, game);

      a.join(roomId);
      b.join(roomId);
      this.io.to(roomId).emit('match_found', { roomId, players: game.players.map(p => ({ id: p.socketId, name: p.name, role: p.role })) });
      this.io.to(a.id).emit('room_joined', { roomId, yourRole: 'playerA', pumpkinAvailable: true });
      this.io.to(b.id).emit('room_joined', { roomId, yourRole: 'playerB', pumpkinAvailable: true });
    }
  }

  pickSecret() {
    // TODO: 실제 사전/DB 무작위 2글자 단어 선택
    return SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)];
  }

  getGame(roomId) {
    return this.games.get(roomId);
  }

  usePumpkin(socketId) {
    for (const game of this.games.values()) {
      const player = game.players.find((p) => p.socketId === socketId);
      if (player && !player.usedPumpkin) {
        player.usedPumpkin = true;
        return ['🍆', '🍆'];
      }
    }
    return ['🍆', '🍆'];
  }

  finish(roomId) {
    this.games.delete(roomId);
  }

  handleDisconnect(socketId) {
    this.dequeue(socketId);
    for (const [roomId, game] of this.games.entries()) {
      if (game.players.some((p) => p.socketId === socketId)) {
        this.io.to(roomId).emit('game_over', { result: 'abandoned', winner: null, solution: game.solutionForAll() });
        this.finish(roomId);
      }
      if (game.spectators?.has(socketId)) {
        game.spectators.delete(socketId);
        this.io.to(roomId).emit('spectator_count', { roomId, count: game.spectators.size });
      }
    }
    this.userNick.delete(socketId);
  }

  addSpectator(roomId, socketId) {
    const game = this.games.get(roomId);
    if (!game) return;
    if (!game.spectators) game.spectators = new Set();
    game.spectators.add(socketId);
    this.io.to(roomId).emit('spectator_count', { roomId, count: game.spectators.size });
  }

  getLobbyState() {
    const rooms = [];
    for (const [roomId, game] of this.games.entries()) {
      rooms.push({
        roomId,
        players: game.players.map((p) => ({ id: p.socketId, name: p.name, role: p.role })),
        spectators: game.spectators ? game.spectators.size : 0,
        turns: game.turns
      });
    }
    const queue = this.queue.map((s) => ({ id: s.id, name: this.getNickname(s.id) }));
    return { rooms, queue };
  }
}


