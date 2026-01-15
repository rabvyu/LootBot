# Roadmap - Bot de Gamificacao

## Funcionalidades Atuais (Implementadas)

- [x] Sistema de XP (mensagens, voz, reacoes, daily)
- [x] Sistema de Niveis com notificacoes
- [x] 151 Badges em 11 categorias
- [x] Leaderboard (diario, semanal, mensal, geral)
- [x] Comandos de perfil e rank
- [x] Sistema anti-exploit
- [x] Comandos admin (give/remove XP, badges, reset)
- [x] Notificacoes de badges raras+
- [x] Catalogo de badges com filtros
- [x] Exibicao de badges por raridade no perfil

---

## Fase 1: Sistema de Economia (Prioridade Alta)

### 1.1 Moedas (Coins)
- Ganhar moedas junto com XP (proporcao configuravel)
- Bonus de moedas no daily
- Moedas por conquistas especiais
- Comando `/saldo` para ver moedas

### 1.2 Loja do Servidor
- Comando `/loja` para ver itens disponiveis
- Categorias de itens:
  - **Cargos Temporarios** - Cores customizadas por X dias
  - **Boosters de XP** - 1.5x XP por 24h
  - **Titulos** - Titulos customizados no perfil
  - **Badges Exclusivas** - Badges compraveis (nao automaticas)
  - **Lottery Tickets** - Para sorteios semanais
- Comando `/comprar <item>` para comprar
- Precos configuraveis pelo admin

### 1.3 Transferencia
- Comando `/transferir @user <quantidade>`
- Taxa de transferencia configuravel (ex: 10%)
- Limite diario de transferencias

### 1.4 Lottery/Sorteio Semanal
- Comprar tickets com moedas
- Sorteio automatico todo domingo
- Premio: pool de moedas dos tickets

---

## Fase 2: Sistema de Missoes/Quests (Prioridade Alta)

### 2.1 Missoes Diarias
- 3 missoes aleatorias por dia
- Tipos de missoes:
  - "Envie 30 mensagens"
  - "Fique 30 min em call"
  - "De 15 reacoes"
  - "Responda a 5 mensagens"
  - "Use um comando"
- Recompensas: XP + Moedas
- Comando `/missoes` para ver missoes ativas

### 2.2 Missoes Semanais
- 5 missoes maiores por semana
- Exemplos:
  - "Envie 500 mensagens esta semana"
  - "Fique 5 horas em call"
  - "Alcance top 10 do leaderboard diario"
  - "Colete daily 5 dias seguidos"
- Recompensas maiores + badge exclusiva mensal

### 2.3 Missoes de Conquista (One-time)
- Missoes unicas que dao badges:
  - "Primeira mensagem no servidor"
  - "Primeira hora em call"
  - "Primeiro nivel up"
  - "Convide seu primeiro amigo"

---

## Fase 3: Cargos por Nivel (Prioridade Alta)

### 3.1 Reward Roles
- Configurar cargos automaticos por nivel
- Comando `/config level-roles`
- Exemplo:
  - Level 5: @Membro Ativo
  - Level 15: @Veterano
  - Level 30: @Elite
  - Level 50: @Lenda
- Remove cargo anterior ao ganhar novo (opcional)

### 3.2 Cargos por Badge
- Cargo automatico ao conquistar badge especifica
- Exemplo: Badge "Fundador" da cargo @Fundador

### 3.3 Cargos por Leaderboard
- Cargo para top 3 do leaderboard
- Atualiza automaticamente (diario/semanal)

---

## Fase 4: Eventos e Desafios (Prioridade Media)

### 4.1 Eventos Temporarios
- Comando `/evento iniciar <tipo> <duracao> <multiplicador>`
- Tipos de eventos:
  - **XP Boost** - Multiplicador global de XP
  - **Coins Boost** - Multiplicador de moedas
  - **Double Daily** - Daily da o dobro
  - **Badge Hunt** - Badges especiais temporarias
- Notificacao no canal de anuncios

### 4.2 Desafios da Comunidade
- Meta coletiva do servidor
- Exemplo: "Comunidade: 50.000 mensagens esta semana"
- Barra de progresso
- Recompensa para todos se completar

### 4.3 Eventos Sazonais
- Natal, Halloween, Ano Novo, etc.
- Badges tematicas limitadas
- Missoes especiais
- Decoracoes nos embeds

---

## Fase 5: Sistema de Titulos (Prioridade Media)

### 5.1 Titulos no Perfil
- Campo "titulo" exibido no perfil
- Titulos desbloqueados por:
  - Conquistas/Badges
  - Compra na loja
  - Eventos especiais
  - Admin

### 5.2 Comando de Titulo
- `/titulo ver` - Ver titulos disponiveis
- `/titulo equipar <titulo>` - Equipar titulo
- `/titulo remover` - Remover titulo

### 5.3 Titulos Especiais
- "Fundador" - Primeiros 100 membros
- "Campeao Semanal" - #1 da semana
- "Lenda Viva" - Level 100+
- "Colecionador" - 50+ badges

---

## Fase 6: Personalizacao de Perfil (Prioridade Media)

### 6.1 Bio/Descricao
- Campo de texto livre (limite de caracteres)
- Comando `/bio <texto>`

### 6.2 Badges em Destaque
- Escolher 3-5 badges para destacar no perfil
- Comando `/destaque <badge1> <badge2> ...`

### 6.3 Cor do Perfil
- Cor customizada do embed
- Desbloqueado por nivel ou compra

### 6.4 Banner (Futuro)
- Imagem de fundo no perfil
- Requer integracao com canvas/imagens

---

## Fase 7: Times/Guildas (Prioridade Baixa)

### 7.1 Criar Time
- Comando `/time criar <nome>`
- Limite de membros (configuravel)
- Lider pode convidar/remover

### 7.2 Leaderboard de Times
- XP combinado dos membros
- Ranking de times

### 7.3 Desafios de Time
- Missoes exclusivas para times
- Competicao entre times
- Recompensas para o time vencedor

---

## Fase 8: Notificacoes e Lembretes (Prioridade Baixa)

### 8.1 DM de Streak
- Aviso quando streak esta para expirar
- Configuravel pelo usuario

### 8.2 Resumo Semanal
- DM com estatisticas da semana
- XP ganho, posicao no leaderboard, badges

### 8.3 Notificacao de Badge Proxima
- "Voce esta a 10 mensagens da badge X!"

---

## Fase 9: Mini-games (Prioridade Baixa)

### 9.1 Trivia
- Perguntas sobre o tema do servidor (hardware/OC)
- Comando `/trivia`
- Recompensa: XP + moedas

### 9.2 Adivinhacao
- Adivinhar especificacoes de hardware
- "Qual GPU tem 24GB VRAM e 16384 CUDA cores?"

### 9.3 Duelos
- Desafiar outro membro
- Mini-game de reacao rapida
- Apostas de moedas

---

## Fase 10: Integracoes (Prioridade Baixa)

### 10.1 Webhook para Site
- Enviar eventos para o site Next.js
- Level up, badges, leaderboard updates

### 10.2 API Publica
- Endpoints para consultar dados
- Autenticacao por API key

### 10.3 Logs Avancados
- Canal de logs detalhado
- Filtros por tipo de evento

---

## Ordem de Implementacao Sugerida

1. **Fase 3: Cargos por Nivel** - Mais pedido, alto impacto
2. **Fase 2: Missoes** - Engajamento diario
3. **Fase 1: Economia** - Monetizacao e loja
4. **Fase 4: Eventos** - Manter interesse
5. **Fase 5: Titulos** - Personalizacao
6. **Fase 6: Perfil** - Personalizacao avancada
7. **Fase 8: Notificacoes** - Retencao
8. **Fase 7: Times** - Social
9. **Fase 9: Mini-games** - Diversao
10. **Fase 10: Integracoes** - Expansao

---

## Estimativa de Complexidade

| Fase | Complexidade | Arquivos Novos | Impacto |
|------|--------------|----------------|---------|
| Cargos por Nivel | Baixa | 2-3 | Alto |
| Missoes | Media | 5-7 | Alto |
| Economia | Media | 6-8 | Alto |
| Eventos | Media | 3-4 | Medio |
| Titulos | Baixa | 2-3 | Medio |
| Perfil | Baixa | 1-2 | Medio |
| Notificacoes | Media | 3-4 | Medio |
| Times | Alta | 8-10 | Medio |
| Mini-games | Alta | 5-7 | Baixo |
| Integracoes | Media | 4-5 | Baixo |

---

## Proximos Passos Imediatos

1. Implementar cargos automaticos por nivel
2. Criar sistema basico de missoes diarias
3. Adicionar sistema de moedas
4. Criar loja simples

Cada fase pode ser dividida em PRs menores para facilitar review e teste.
