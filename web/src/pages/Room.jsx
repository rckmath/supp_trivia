const MAX_PLAYERS = 8;

export default function Room({ room, nickname, onLeave, onStartGame, onMarkReady, error, startingGame }) {
  if (!room) return null;

  const isHost = room.host === nickname;
  const playerCount = room.players.length;
  const teamA = room.players.filter((p) => p.team === "A");
  const teamB = room.players.filter((p) => p.team === "B");
  const allReady = room.players.filter((p) => p.nickname !== room.host).every((p) => p.ready);
  const currentPlayer = room.players.find((p) => p.nickname === nickname);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg flex flex-col gap-8 border border-gray-100 items-center">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-2 gap-2">
          <h2 className="text-2xl font-bold text-blue-700">
            Sala: <span className="font-mono">{room.code}</span>
          </h2>
          <span className="bg-gray-100 text-gray-700 rounded-full px-4 py-1 text-sm font-semibold shadow-sm">
            {playerCount}/{MAX_PLAYERS} jogadores
          </span>
        </div>
        <p className="text-lg">
          Bem-vindo(a), <span className="font-semibold">{nickname}</span>!
        </p>
        <div className="w-full flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-blue-50 rounded-lg p-3">
              <span className="font-bold text-blue-700">Time Azul</span>
              <ul className="mt-2 space-y-1">
                {teamA.map((p) => (
                  <li key={p.nickname} className="flex items-center gap-2 text-blue-700">
                    <span>
                      {p.nickname}
                      {p.nickname === nickname ? " (Você)" : ""}
                      {room.host === p.nickname ? " (Host)" : ""}
                    </span>
                    {p.ready && p.nickname !== room.host && (
                      <span className="ml-1 bg-green-200 text-green-800 rounded-full px-2 py-0.5 text-xs font-semibold">Pronto</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-orange-50 rounded-lg p-3">
              <span className="font-bold text-orange-600">Time Laranja</span>
              <ul className="mt-2 space-y-1">
                {teamB.map((p) => (
                  <li key={p.nickname} className="flex items-center gap-2 text-orange-600">
                    <span>
                      {p.nickname}
                      {p.nickname === nickname ? " (Você)" : ""}
                      {room.host === p.nickname ? " (Host)" : ""}
                    </span>
                    {p.ready && p.nickname !== room.host && (
                      <span className="ml-1 bg-green-200 text-green-800 rounded-full px-2 py-0.5 text-xs font-semibold">Pronto</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center items-center">
          <button
            className="bg-gray-300 text-gray-700 rounded px-4 py-2 font-semibold hover:bg-gray-400 transition w-full sm:w-auto"
            onClick={onLeave}
          >
            Sair da Sala
          </button>
          {!isHost && currentPlayer && !currentPlayer.ready && (
            <button
              className="bg-green-500 text-white rounded px-4 py-2 font-semibold hover:bg-green-600 transition w-full sm:w-auto"
              onClick={onMarkReady}
            >
              Pronto!
            </button>
          )}
          {isHost && room.state === "lobby" && (
            <button
              className={`rounded px-4 py-2 font-semibold transition w-full sm:w-auto ${
                allReady && playerCount >= 2 && !startingGame
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-200 text-blue-400 cursor-not-allowed"
              }`}
              onClick={onStartGame}
              disabled={!allReady || playerCount < 2 || startingGame}
              title={
                startingGame
                  ? "Aguardando resposta do servidor..."
                  : !allReady
                  ? "Todos os jogadores precisam marcar Pronto!"
                  : playerCount < 2
                  ? "Precisa de pelo menos 2 jogadores pra começar"
                  : ""
              }
            >
              {startingGame ? "Aguarde..." : "Começar Jogo"}
            </button>
          )}
        </div>
        {isHost && (!allReady || playerCount < 2) && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            Todos os jogadores (exceto o host) precisam marcar Pronto!
            <br />
            Precisa de pelo menos 2 jogadores pra começar a brincadeira.
          </div>
        )}
      </div>
    </div>
  );
}
