require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

admin.initializeApp();

const app = express();

const allowedOrigins = [
  "https://supp-trivia.web.app",
  "https://supp-trivia.firebaseapp.com",
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
}));
app.use(express.json());

app.get("/", (req, res) => res.send("Supp Trivia Functions Running"));

/**
 * Generates a random 5-letter room code for game sessions
 * @return {string} A random 5-letter uppercase alphanumeric code
 */
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

/**
 * Assigns a player to a team, balancing between teams A and B
 * @param {Array} players - The current list of players in the room
 * @return {string|null} The team designation ("A" or "B") or null
 * if both teams are full
 */
function assignTeam(players) {
  const teamA = players.filter((p) => p.team === "A").length;
  const teamB = players.filter((p) => p.team === "B").length;
  if (teamA <= teamB && teamA < 4) return "A";
  if (teamB < 4) return "B";
  return null;
}

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable. Set it in your environment or secret manager as per Firebase documentation");
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

/**
 * Extracts JSON content from a Markdown code block
 * @param {string} text - The Markdown text containing a code block
 * @return {string} The extracted content from inside the code block or the original text if no code block is found
 */
function extractJsonFromMarkdown(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    return match[1];
  }
  return text;
}

// POST /room - create a new room
app.post("/room", async (req, res) => {
  try {
    const {nickname} = req.body;
    if (!nickname) {
      return res.status(400).json({error: "Nome de usuário necessário"});
    }
    let code;
    let exists = true;

    while (exists) {
      code = generateRoomCode();
      const doc = await admin.firestore().collection("rooms").doc(code).get();
      exists = doc.exists;
    }

    const room = {
      code,
      host: nickname,
      players: [{nickname, team: "A"}],
      state: "lobby",
      created: Date.now(),
    };
    await admin.firestore().collection("rooms").doc(code).set(room);
    res.json(room);
  } catch (err) {
    console.error("POST /room error:", err);
    res.status(500).json({error: err && (err.message || err)});
  }
});

// POST /room/:code/join - join a room
app.post("/room/:code/join", async (req, res) => {
  try {
    const {code} = req.params;
    const {nickname, isReconnect = false} = req.body;
    if (!nickname) {
      return res.status(400).json({error: "Nome de usuário necessário"});
    }
    const ref = admin.firestore().collection("rooms").doc(code);
    const doc = await ref.get();
    if (!doc.exists) {
      console.error("POST /room/:code/join: Room not found");
      return res.status(404).json({error: "Sala não encontrada"});
    }
    const room = doc.data();
    const playerExists = room.players.find((p) => p.nickname === nickname);
    if (isReconnect && playerExists) {
      return res.json({...room});
    }
    if (room.state !== "lobby" && !isReconnect) {
      return res.status(400).json({error: "Jogo já começou"});
    }
    if (playerExists && !isReconnect) {
      console.error("POST /room/:code/join: Nickname already taken");
      return res.status(400).json({error: "Nome de usuário já usado por alguém"});
    }
    if (room.players.length >= 8 && !isReconnect) {
      console.error("POST /room/:code/join: Room full");
      return res.status(400).json({error: "Sala lotada"});
    }
    const team = assignTeam(room.players);
    if (!team) {
      console.error("POST /room/:code/join: Team assignment failed");
      return res.status(400).json({error: "Sala lotada"});
    }
    const player = {nickname, team};
    await ref.update({players: admin.firestore.FieldValue.arrayUnion(player)});
    res.json({...room, players: [...room.players, player]});
  } catch (err) {
    console.error("POST /room/:code/join error:", err);
    res.status(500).json({error: err && (err.message || err)});
  }
});

// GET /room/:code - get room state
app.get("/room/:code", async (req, res) => {
  try {
    const {code} = req.params;
    const doc = await admin.firestore().collection("rooms").doc(code).get();
    if (!doc.exists) {
      console.error("GET /room/:code: Room not found");
      return res.status(404).json({error: "Sala não encontrada"});
    }
    res.json(doc.data());
  } catch (err) {
    console.error("GET /room/:code error:", err);
    res.status(500).json({error: err && (err.message || err)});
  }
});

// POST /room/:code/start - start the game
app.post("/room/:code/start", async (req, res) => {
  try {
    const {code} = req.params;
    const ref = admin.firestore().collection("rooms").doc(code);
    const doc = await ref.get();
    if (!doc.exists) {
      console.error("POST /room/:code/start: Room not found");
      return res.status(404).json({error: "Sala não encontrada"});
    }
    const room = doc.data();
    if (room.state !== "lobby") {
      console.error("POST /room/:code/start: Game already started");
      return res.status(400).json({error: "Jogo já começou"});
    }

    // Generate a support ticket using OpenAI
    let ticket = null;

    try {
      const prompt =
        "Gere um chamado de suporte fictício que servirá de estudo de caso em um jogo de perguntas e respostas. " +
        "Inclua um título curto e uma descrição detalhada (não tão longa) do problema. " +
        "Responda em JSON: {\"title\": string, \"description\": string, \"difficulty\": string}. " +
        "O chamado deve ser plausível e em português brasileiro, e deve ter um nível de dificuldade (campo difficulty) entre 'easy', 'medium' ou 'hard'. " +
        "A dificuldade deve ser baseada em níveis de suporte (N1, N2, N3, etc.) ao gerar o chamado. Isso não deve estar explícito no chamado." +
        "Os chamados podem ter temas diversos, desde problemas em apps bancários, streaming de vídeo, e-commerces, jogos, etc. a ERPs e/ou " +
        "sistemas operacionais Windows, Android, iOS, etc. Evite termos muito técnicos na descrição do problema e repasse o problema como um usuário final.";

      const aiRes = await openai.responses.create({
        model: "o4-mini",
        instructions: "Você é um criador de chamados de suporte. Sempre responda em português brasileiro.",
        input: prompt,
      });

      const content = aiRes.output_text;
      const jsonString = extractJsonFromMarkdown(content);
      const json = JSON.parse(jsonString);

      ticket = `Título: ${json.title}\n\nDescrição: ${json.description}`;
    } catch (e) {
      console.error("Erro ao gerar ticket com OpenAI:", e);
      return res.status(500).json({error: "Erro ao gerar chamado de suporte. Tente novamente."});
    }

    if (!ticket) {
      return res.status(500).json({error: "Erro ao gerar chamado de suporte. Tente novamente."});
    }

    await ref.update({
      state: "game",
      started: Date.now(),
      messages: [],
      currentTeam: "A",
      teamAScore: 0,
      teamBScore: 0,
      ticket,
      currentRound: 1,
    });
    res.json({
      ...room,
      state: "game",
      started: Date.now(),
      messages: [],
      currentTeam: "A",
      teamAScore: 0,
      teamBScore: 0,
      ticket,
      currentRound: 1,
    });
  } catch (err) {
    console.error("POST /room/:code/start error:", err);
    res.status(500).json({error: err && (err.message || err)});
  }
});

// POST /room/:code/message - team submits a message, AI judges, updates Firestore
app.post("/room/:code/message", async (req, res) => {
  try {
    const {code} = req.params;
    const {nickname, team, text} = req.body;
    if (!nickname || !team) {
      return res.status(400).json({error: "Faltam nickname ou time"});
    }
    const ref = admin.firestore().collection("rooms").doc(code);
    const docSnap = await ref.get();
    if (!docSnap.exists) return res.status(404).json({error: "Sala não encontrada"});
    const room = docSnap.data();
    if (room.state !== "game") return res.status(400).json({error: "Jogo não está em andamento"});
    if (room.currentTeam !== team) return res.status(400).json({error: "Não é a vez do seu time"});

    let playerMsg;
    let aiMsg;
    const skip = !text || text.trim() === "";
    if (skip) {
      playerMsg = {text: "", nickname, team, type: "player", ts: Date.now()};
      aiMsg = {type: "judge", text: `Time ${team === "A" ? "Azul" : "Laranja"} perdeu a rodada`, score: 0, ts: Date.now()};
    } else {
      const ticket = room.ticket || "Detalhes do chamado de suporte não encontrados.";
      const prompt =
        `Chamado de Suporte:\n${ticket}\n\n` +
        `O time ${team} propõe: ${text}\n\n` +
        `Esta é a rodada ${room.round} de 6. Considere isso ao avaliar a resposta.\n\n` +
        `Como um juiz especialista, avalie esta proposta (0-10) e fornecer uma dica (feedback) para o time ${team === "A" ? "Azul" : "Laranja"}. ` +
        `A dica deve destacar aleatoriamente algo que está certo ou errado na resposta, mas não entregue o bolo de uma só vez,` +
        `continue instigando os times a pensar mais sobre a resposta, exceto que ela esteja excelente e resolva o problema.\n\n` +
        `Responda em JSON: {\"score\": número, \"feedback\": string, \"isTheAnswerPerfect\": booleano}. ` +
        `O feedback deve estar em português brasileiro. ` +
        `O booleano isTheAnswerPerfect deve ser true se a resposta está perfeita e resolve o problema, ou false caso contrário.` +
        `Sua resposta não deve ser grande (máximo 3 linhas)`;

      const role =
        "Você é um juiz especialista em suporte técnico para um jogo de perguntas e respostas." + " " + "Sempre responda em português brasileiro.";

      // Call OpenAI
      const aiRes = await openai.responses.create({
        model: "o4-mini",
        instructions: role,
        input: prompt,
      });

      let score = 0;
      let feedback = "";
      let isTheAnswerPerfect = false;
      try {
        const jsonString = extractJsonFromMarkdown(aiRes.output_text);
        const json = JSON.parse(jsonString);
        score = json.score;
        feedback = json.feedback;
        isTheAnswerPerfect = json.isTheAnswerPerfect;
      } catch (e) {
        feedback = aiRes.output_text;
      }
      playerMsg = {text, nickname, team, type: "player", ts: Date.now()};
      aiMsg = {type: "judge", text: feedback, score, isTheAnswerPerfect, ts: Date.now()};
    }

    const messages = [...(room.messages || []), playerMsg, aiMsg];

    let teamAScore = room.teamAScore || 0;
    let teamBScore = room.teamBScore || 0;

    if (!skip) {
      if (team === "A") teamAScore += aiMsg.score || 0;
      if (team === "B") teamBScore += aiMsg.score || 0;
    }

    const nextTeam = team === "A" ? "B" : "A";

    const newCurrentRound = Math.floor(messages.length / 2) + 1;
    await ref.update({
      messages,
      teamAScore,
      teamBScore,
      currentTeam: nextTeam,
      currentRound: newCurrentRound,
    });
    res.json({ok: true, aiMsg, teamAScore, teamBScore, currentTeam: nextTeam});
  } catch (err) {
    console.error("POST /room/:code/message error:", err);
    res.status(500).json({error: err && (err.message || err)});
  }
});

// POST /room/:code/summary - generate AI match summary
app.post("/room/:code/summary", async (req, res) => {
  try {
    const {code} = req.params;
    const ref = admin.firestore().collection("rooms").doc(code);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({error: "Sala não encontrada"});
    }
    const room = doc.data();
    const ticket = room.ticket || "(Sem chamado de suporte)";
    const messages = room.messages || [];
    let transcript = "";

    for (let i = 0; i < messages.length; i += 2) {
      const playerMsg = messages[i];
      const judgeMsg = messages[i + 1];
      if (playerMsg && judgeMsg) {
        transcript +=
          `\n[${playerMsg.team === "A" ? "Azul" : "Laranja"}] ${playerMsg.nickname}: ` +
          `${playerMsg.text}\nJuiz: ${judgeMsg.text} (Nota: ${judgeMsg.score})\n`;
      }
    }

    const prompt =
      `Resumo da partida do Supp Trivia!\n\n` +
      `Chamado de Suporte:\n${ticket}\n\n` +
      `Transcrição das rodadas:${transcript}\n\n` +
      `Faça um resumo divertido e descontraído da partida, destacando os melhores momentos, ` +
      `o time vencedor, e encerrando com uma frase de efeito. Responda em português brasileiro.`;

    const aiRes = await openai.responses.create({
      model: "o4-mini",
      instructions: "Você é um comentarista esportivo animado. Sempre responda em português brasileiro.",
      input: prompt,
    });

    const summary = aiRes.output_text;
    res.json({summary});
  } catch (err) {
    console.error("POST /room/:code/summary error:", err);
    res.status(500).json({error: err && (err.message || err)});
  }
});

// POST /room/:code/ready - mark a player as ready or not ready
app.post("/room/:code/ready", async (req, res) => {
  try {
    const {code} = req.params;
    const {nickname, ready} = req.body;
    if (!nickname || typeof ready !== "boolean") {
      return res.status(400).json({error: "Nickname e ready (boolean) são obrigatórios"});
    }
    const ref = admin.firestore().collection("rooms").doc(code);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({error: "Sala não encontrada"});
    }
    const room = doc.data();
    const players = (room.players || []).map((p) => (p.nickname === nickname ? {...p, ready} : p));
    await ref.update({players});
    res.json({...room, players});
  } catch (err) {
    console.error("POST /room/:code/ready error:", err);
    res.status(500).json({error: err && (err.message || err)});
  }
});

exports.api = functions.https.onRequest(app);
