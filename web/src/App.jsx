import { useEffect, useState } from "react";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import Game from "./pages/Game";
import { createRoom, joinRoom, startGame, markReady } from "./api/room";
import { db } from "./firebase";

import { doc, onSnapshot } from "firebase/firestore";

function App() {
  const [page, setPage] = useState("lobby");
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [team, setTeam] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [roomUnsub, setRoomUnsub] = useState(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, "");
    if (path && path.length === 5) { // Likely a room code
      const storedNickname = localStorage.getItem("supptrivia_nickname");
      const storedRoomCode = localStorage.getItem("supptrivia_roomcode");
      if (storedNickname && storedRoomCode && storedRoomCode === path.toUpperCase()) {
        handleJoinRoom(path.toUpperCase(), storedNickname, true);
      } else {
        setError("Você não pode entrar em uma sala que não participou antes com este navegador.");
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (roomUnsub) roomUnsub();
    };
  }, [roomUnsub]);

  const handleCreateRoom = async (nicknameInput) => {
    setError("");
    setCreatingRoom(true);
    try {
      const roomData = await createRoom(nicknameInput);

      setNickname(nicknameInput);
      setRoomCode(roomData.code);
      setTeam("A");
      setRoom(roomData);
      setPage("room");

      localStorage.setItem("supptrivia_nickname", nicknameInput);
      localStorage.setItem("supptrivia_roomcode", roomData.code);

      if (roomUnsub) roomUnsub();

      const unsub = onSnapshot(doc(db, "rooms", roomData.code), (docSnap) => {
        const data = docSnap.data();
        setRoom(data);
        if (data && data.state === "game") {
          setPage("game");
        }
      });
      setRoomUnsub(() => unsub);
      setCreatingRoom(false);
    } catch (e) {
      setError(e.message);
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (code, nicknameInput, isReconnect = false) => {
    setError("");
    try {
      const roomData = await joinRoom(code, nicknameInput, isReconnect);

      setNickname(nicknameInput);
      setRoomCode(code);

      let player = roomData.players.find((p) => p.nickname === nicknameInput);
      let assignedTeam = player ? player.team : "";
      if (!assignedTeam) {
        const storedTeam = localStorage.getItem("supptrivia_team");
        if (storedTeam) assignedTeam = storedTeam;
      }
      setTeam(assignedTeam);
      setRoom(roomData);
      setPage("room");
      localStorage.setItem("supptrivia_nickname", nicknameInput);
      localStorage.setItem("supptrivia_roomcode", code);
      if (assignedTeam) localStorage.setItem("supptrivia_team", assignedTeam);

      if (roomUnsub) roomUnsub();
      const unsub = onSnapshot(doc(db, "rooms", code), (docSnap) => {
        const data = docSnap.data();
        setRoom(data);
        if (data && data.state === "game") {
          setPage("game");
        }
      });
      setRoomUnsub(() => unsub);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLeave = () => {
    setNickname("");
    setRoomCode("");
    setTeam("");
    setRoom(null);
    setPage("lobby");
    setError("");
    if (roomUnsub) roomUnsub();
    localStorage.removeItem("supptrivia_nickname");
    localStorage.removeItem("supptrivia_roomcode");
  };

  const handleStartGame = async () => {
    setError("");
    setStartingGame(true);
    try {
      await startGame(roomCode);
      setStartingGame(false);
    } catch (e) {
      setError(e.message);
      setStartingGame(false);
    }
  };

  const handleMarkReady = async () => {
    setError("");
    try {
      await markReady(roomCode, nickname, true);
    } catch (e) {
      setError(e.message);
    }
  };

  let mainContent = null;
  if (page === "lobby") {
    mainContent = <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} error={error} />;
  } else if (page === "room") {
    mainContent = (
      <Room
        room={room}
        nickname={nickname}
        team={team}
        onLeave={handleLeave}
        onStartGame={handleStartGame}
        onMarkReady={handleMarkReady}
        error={error}
        creatingRoom={creatingRoom}
        startingGame={startingGame}
      />
    );
  } else if (page === "game") {
    mainContent = <Game room={room} nickname={nickname} team={team} onLeave={handleLeave} />;
  }

  return (
    <div className="relative min-h-screen pb-8">
      {creatingRoom ? (
        <div className="fixed inset-0 bg-black opacity-20 flex items-center justify-center z-50 transition-all">
          <div className="animate-spin rounded-full border-4 border-blue-400 border-t-transparent w-14 h-14" />
        </div>
      ) : null}
      {mainContent}
      <footer className="w-full flex justify-center items-center fixed bottom-0 left-0 pb-2 pointer-events-none z-50">
        <span className="text-xs text-gray-400 pointer-events-auto">
          Desenvolvido por Erick M. L. P. Pacheco @
          <a href="https://github.com/rckmath" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 ml-1">
            GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
