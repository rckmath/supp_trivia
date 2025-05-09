**Project Name**
Supp Trivia

**Tech Stack**

* **Frontend:** React (latest), Vite (latest), Tailwind CSS (latest)
* **Realtime Communication:** WebSockets (e.g. Socket.IO)
* **AI Integration:** OpenAI API (GPT-4o or o4-mini) (should use latest APIs/updates)
* **Backend (optional):** Node.js/Express or similar for room management and WebSocket server. Should use Firebase Functions.
* **Hosting:** It will be hosted using Firebase (https://vite.dev/guide/static-deploy#google-firebase)

---

## Game Concept

A turn-based, team-vs-team “support ticket” trivia game where an AI acts as judge:

1. **Ticket Generation:** AI generates a “support ticket” scenario (title + detailed problem description).
2. **Teams:** Two teams (up to 4 players each) compete to propose solutions, methods, and troubleshooting steps.
3. **Turns:** Teams alternate turns. On their turn, a team submits their proposed solution(s) via a shared chat.
4. **Judging:** After each submission, the AI:

   * Parses the chat message.
   * Scores the proposal.
   * Provides public feedback in chat, highlighting strengths (correct points) and weaknesses (errors or omissions).
5. **Final Solution:** If a team submits a complete, correct solution that resolves the ticket, they earn bonus points.
6. **Victory:** After a fixed number of rounds or when the ticket is solved, the AI tallies scores; the team with the highest total wins. AI then posts a match summary and highlights.

---

## Functional Requirements

1. **Room & Lobby**

   * Host creates a room and receives a unique room code.
   * The players should provide a nickname when joining a room.
   * Up to 8 players join via code; they’re automatically split into Team A and Team B (max 4 players each).

2. **WebSocket Channels**

   * **Lobby Channel** for waiting/ready states.
   * **Game Channel** for real-time chat and turn updates.

3. **Turn Management**

   * Enforce turn order: only the active team can send chat messages during their turn; other team’s input is disabled.
   * Display a clear “It’s Team X’s turn” indicator.

4. **Chat UI**

   * Shared chat window visible to all players and the AI bot.
   * Player messages styled by team and turn.
   * AI feedback messages appear inline, tagged as “Judge”.

5. **AI Integration**

   * On game start, call OpenAI to generate a ticket prompt.
   * After each team submission, send the message plus ticket context to OpenAI.
   * Parse AI response to extract:

     * **Score:** numeric (e.g. 0–10)
     * **Feedback:** text with pros/cons, optionally marking specific bullet points.

6. **Scoring & Progress**

   * Maintain per-team score in state/store.
   * Assign bonus points for fully correct final solution.
   * Display running score scoreboard.

7. **End of Match**

   * After N rounds or when one team solves the ticket:

     * AI compiles a summary of proposals, highlights key winning points.
     * Display final scoreboard and AI’s match report.

---

## Non-Functional Requirements

* **Performance:** Real-time updates < 200 ms latency.
* **Scalability:** Stateless frontend; WebSocket server can scale horizontally.
* **Security:**

  * Room codes should be non-predictable.
  * Validate WebSocket messages and enforce turn rules on server side.
* **Accessibility:** Keyboard-accessible chat and clear focus indicators.
* **UX:**

  * Mobile-responsive layout.
  * Tailwind-powered themes for team distinction (e.g. blue vs. orange).
