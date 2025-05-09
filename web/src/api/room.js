// Room API utility for Supp Trivia
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/supp-trivia/us-central1/api';

export async function createRoom(nickname) {
  console.log()

  const res = await fetch(`${API_BASE}/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create room');
  return res.json();
}

export async function joinRoom(code, nickname, isReconnect = false) {
  const res = await fetch(`${API_BASE}/room/${code}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, isReconnect }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to join room');
  return res.json();
}

export async function getRoom(code) {
  const res = await fetch(`${API_BASE}/room/${code}`);
  if (!res.ok) throw new Error((await res.json()).error || 'Room not found');
  return res.json();
}

export async function startGame(code) {
  const res = await fetch(`${API_BASE}/room/${code}/start`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to start game');
  return res.json();
}

export async function sendMessage(code, nickname, team, text) {
  const res = await fetch(`${API_BASE}/room/${code}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, team, text }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao enviar mensagem');
  return res.json();
}

export async function getMatchSummary(code) {
  const res = await fetch(`${API_BASE}/room/${code}/summary`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao gerar resumo da partida');
  return res.json();
}

export async function markReady(code, nickname, ready) {
  const res = await fetch(`${API_BASE}/room/${code}/ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, ready }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao marcar pronto');
  return res.json();
} 