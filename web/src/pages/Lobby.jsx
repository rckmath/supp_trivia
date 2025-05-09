import { useState } from "react";

export default function Lobby({ onCreateRoom, onJoinRoom, error }) {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <h1 className="text-4xl font-extrabold mb-2 text-blue-700 drop-shadow-lg tracking-tight">Supp Trivia</h1>
      <p className="text-xs text-gray-600 mb-10">Um jogo de perguntas e respostas baseado em chamados de suporte onde a IA é o juiz!</p>
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg flex flex-col gap-8 border border-gray-100">
        <input
          className="border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg mb-2"
          type="text"
          placeholder="Seu apelido/nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
          <div className="flex-1 flex flex-col items-center w-full">
            <button
              className="bg-blue-600 text-white rounded-lg px-6 py-3 font-bold text-lg shadow hover:bg-blue-700 transition w-full"
              onClick={() => onCreateRoom(nickname)}
              disabled={!nickname}
            >
              Criar Sala
            </button>
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <span className="bg-gray-200 text-gray-600 font-semibold px-4 py-1 rounded-full text-sm shadow-sm">OU</span>
          </div>
          <div className="flex-1 flex flex-col items-center w-full">
            <div className="relative w-full">
              <input
                className="border rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg pr-12"
                type="text"
                placeholder="Cód. Sala"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && roomCode && nickname) onJoinRoom(roomCode, nickname);
                }}
              />
              <button
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-orange-500 text-white rounded-full p-2 shadow hover:bg-orange-600 transition disabled:opacity-60 flex items-center justify-center"
                onClick={() => onJoinRoom(roomCode, nickname)}
                disabled={!roomCode || !nickname}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 12H6.75m6 6 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm mt-2 text-center">{error}</div>}
      </div>
    </div>
  );
}
