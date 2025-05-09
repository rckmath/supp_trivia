# Supp Trivia

Supp Trivia é um jogo interativo de perguntas e respostas em equipes, desenvolvido para fins educacionais na ETEC de Hortolândia. O objetivo do sistema é proporcionar um ambiente dinâmico de ensino, onde os alunos aprendem a resolver cenários de suporte técnico de forma colaborativa, com avaliação automatizada por IA.

## Propósito

Este sistema foi criado para ser utilizado em aulas práticas na ETEC de Hortolândia, promovendo o ensino ativo e o trabalho em equipe. Através de partidas gamificadas, os estudantes desenvolvem habilidades de resolução de problemas, comunicação e raciocínio lógico, simulando situações reais de atendimento a chamados de suporte.

## Como Funciona

- O jogo é disputado entre duas equipes (até 4 jogadores por equipe, máximo de 8 por sala).
- A cada rodada, a IA gera um cenário de chamado de suporte (título e descrição detalhada).
- As equipes se revezam para propor soluções via chat compartilhado.
- Após cada resposta, a IA avalia a proposta, atribui uma pontuação (0–10) e fornece feedback público destacando acertos e pontos a melhorar.
- Se uma equipe apresentar uma solução completa e correta, recebe pontos bônus.
- O jogo termina após um número fixo de rodadas ou quando o chamado é resolvido. A IA faz o resumo da partida e apresenta o placar final.

## Principais Funcionalidades

- **Salas e Lobby:** Criação de salas com código único, entrada de jogadores com apelido, divisão automática em equipes.
- **Comunicação em Tempo Real:** Chat e atualizações de turno com Firestore.
- **Gestão de Turnos:** Apenas a equipe da vez pode enviar mensagens; indicador claro de "É a vez da Equipe X".
- **Feedback da IA:** Avaliação automática das respostas, com pontuação e comentários inline no chat.
- **Placar:** Pontuação por equipe exibida em tempo real, com bônus para soluções completas.
- **Resumo Final:** Ao término, a IA apresenta um relatório dos destaques e o placar final.

## Tecnologias Utilizadas

- **Frontend:** React (Vite) e Tailwind CSS
- **Comunicação em "Tempo Real" e Database:** Firebase Firestore
- **IA:** OpenAI API (GPT o4-mini)
- **Backend:** Firebase Functions
- **Hospedagem:** Firebase Hosting

## Como Contribuir

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b minha-feature`)
3. Commit suas alterações (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin minha-feature`)
5. Abra um Pull Request

---

Este projeto é mantido para fins didáticos e de inovação no ensino técnico. Dúvidas ou sugestões? Entre em contato com o professor responsável (eu).
