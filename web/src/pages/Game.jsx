import { useState, useEffect, useRef } from "react";
import ChatWindow from "../components/ChatWindow";
import Scoreboard from "../components/Scoreboard";
import TurnIndicator from "../components/TurnIndicator";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { sendMessage, getMatchSummary } from "../api/room";

const MAX_ROUNDS = 6;
const FIRST_TURN_TIME_SEC = 240;
const OTHER_TURN_TIME_SEC = 120;

export default function Game({ room, nickname, team, onLeave }) {
  const roomCode = room?.code || "";
  const [messages, setMessages] = useState([]);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [currentTeam, setCurrentTeam] = useState("A");
  const [sending, setSending] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [timer, setTimer] = useState(room?.currentRound === 1 ? FIRST_TURN_TIME_SEC : OTHER_TURN_TIME_SEC);
  const timerRef = useRef();
  const unsubRef = useRef();

  const teamA = room?.players?.filter((p) => p.team === "A") || [];
  const teamB = room?.players?.filter((p) => p.team === "B") || [];

  useEffect(() => {
    if (!roomCode) return;
    if (unsubRef.current) unsubRef.current();
    const unsub = onSnapshot(doc(db, "rooms", roomCode), (docSnap) => {
      const data = docSnap.data();
      setMessages(data?.messages || []);
      setTeamAScore(data?.teamAScore || 0);
      setTeamBScore(data?.teamBScore || 0);
      setCurrentTeam(data?.currentTeam || "A");
      if ((data?.messages?.length || 0) / 2 >= MAX_ROUNDS && !showSummary) {
        setTimeout(() => setShowSummary(true), 800);
      }
    });
    unsubRef.current = unsub;
    return () => unsub();
  }, [roomCode, showSummary]);

  useEffect(() => {
    setTimer(room?.currentRound === 1 ? FIRST_TURN_TIME_SEC : OTHER_TURN_TIME_SEC);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [room?.currentRound]);

  useEffect(() => {
    if (timer <= 0) {
      if (team === currentTeam && !showSummary) {
        handleSend("", true);
      }
      setTimer(room?.currentRound === 1 ? FIRST_TURN_TIME_SEC : OTHER_TURN_TIME_SEC);
    }
  }, [timer, team, currentTeam, showSummary, roomCode, room?.currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showSummary && !summaryText && !loadingSummary) {
      setLoadingSummary(true);
      getMatchSummary(roomCode)
        .then((res) => setSummaryText(res.summary))
        .catch(() => setSummaryText("Erro ao gerar resumo da partida."))
        .finally(() => setLoadingSummary(false));
    }
  }, [showSummary, summaryText, loadingSummary, roomCode]);

  const handleSend = async (text, skip = false) => {
    if (!roomCode || sending || (!text && !skip)) return;
    setSending(true);
    try {
      await sendMessage(roomCode, nickname, team, text);
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  const getSummary = () => {
    let a = 0,
      b = 0;
    const highlights = [];
    (messages || []).forEach((msg, i) => {
      if (msg.type === "judge") {
        if (messages[i - 1]?.team === "A") a += msg.score || 0;
        if (messages[i - 1]?.team === "B") b += msg.score || 0;
        highlights.push({
          team: messages[i - 1]?.team,
          nickname: messages[i - 1]?.nickname,
          text: messages[i - 1]?.text,
          feedback: msg.text,
          score: msg.score,
        });
      }
    });
    return { a, b, highlights };
  };

  const summary = getSummary();
  const winner = summary.a > summary.b ? "Time Azul" : summary.b > summary.a ? "Time Laranja" : "Empate!";

  const timerMin = Math.floor(timer / 60);
  const timerSec = timer % 60;
  const timerStr = `${timerMin}:${timerSec.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      {sending && (
        <div className="fixed inset-0 bg-black opacity-20 flex items-center justify-center z-50 transition-all">
          <div className="animate-spin rounded-full border-4 border-blue-400 border-t-transparent w-14 h-14" />
        </div>
      )}
      {showSummary && (
        <div className="fixed inset-0 bg-black opacity-100 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-2 text-blue-700">Fim de Jogo!</h3>
            <div className="mb-2 text-lg">
              Vencedor: <span className="font-bold">{winner}</span>
            </div>
            <Scoreboard teamAScore={summary.a} teamBScore={summary.b} />
            <div className="w-full max-h-60 overflow-y-auto mt-2 mb-4">
              <div className="font-bold mb-1 text-gray-700">Resumo da Partida:</div>
              {loadingSummary ? (
                <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                  <div
                    className="loader"
                    style={{
                      width: 20,
                      height: 20,
                      border: "3px solid #3b82f6",
                      borderTop: "3px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Gerando resumo...
                </div>
              ) : (
                <div className="text-gray-800 whitespace-pre-line mb-2">{summaryText}</div>
              )}
              <div className="font-bold mb-1 text-gray-700 mt-4">Destaques:</div>
              {summary.highlights.map((h, i) => (
                <div key={i} className="mb-2 p-2 rounded border border-gray-200">
                  <div className={h.team === "A" ? "text-blue-700" : "text-orange-600"}>
                    <span className="font-semibold">{h.nickname}</span>: {h.text}
                  </div>
                  <div className="text-sm text-gray-700">
                    Feedback do Juiz: {h.feedback} <span className="ml-2 font-mono text-xs">({h.score} pts)</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-2 bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition" onClick={onLeave}>
              Voltar para o Lobby
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-2xl flex flex-col gap-2 items-center">
        <h2 className="text-xl font-bold text-blue-700 mb-1">Supp Trivia - Jogo</h2>
        <p className="text-base text-lg mb-4">
          Sala: <span className="font-mono">{roomCode}</span>
        </p>
        {room?.ticket && (
          <div className="w-full bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-1 rounded">
            <div className="font-bold text-yellow-700 mb-1">Chamado de Suporte:</div>
            <pre className="whitespace-pre-wrap text-xs text-gray-800">{room.ticket}</pre>
          </div>
        )}
        <div className="flex items-center w-full justify-center flex-col">
          <span className="text-gray-700 font-mono text-base">
            Rodada: {room?.currentRound || 1} / {MAX_ROUNDS}
          </span>
          <Scoreboard teamAScore={teamAScore} teamBScore={teamBScore} />
        </div>
        <div className="w-full flex gap-2 justify-center mb-1">
          <div className="flex-1 flex flex-col items-center">
            <ul className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
              {teamA.map((p) => (
                <li key={p.nickname} className="text-blue-700 text-xs">
                  {p.nickname}
                  {p.nickname === nickname ? " (Você)" : ""}
                  {room.host === p.nickname ? " (Host)" : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <ul className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
              {teamB.map((p) => (
                <li key={p.nickname} className="text-orange-600 text-xs">
                  {p.nickname}
                  {p.nickname === nickname ? " (Você)" : ""}
                  {room.host === p.nickname ? " (Host)" : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full justify-center mb-1 mt-3">
          <TurnIndicator currentTeam={currentTeam} />
          <span className={currentTeam === "A" ? "text-blue-700 font-mono text-base" : "text-orange-600 font-mono text-base"}>⏰ {timerStr}</span>
        </div>
        <div className="w-full flex flex-col" style={{ minHeight: 420, height: 420 }}>
          <ChatWindow
            messages={messages}
            onSend={handleSend}
            disabled={team !== currentTeam || sending || showSummary}
            nickname={nickname}
            team={team}
          />
        </div>
        <button className="mt-2 bg-gray-300 text-gray-700 rounded px-3 py-1 font-semibold hover:bg-gray-400 transition text-sm" onClick={onLeave}>
          Sair do Jogo
        </button>
      </div>
      <footer className="w-full flex justify-center items-center fixed bottom-0 left-0 pb-2 pointer-events-none">
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
