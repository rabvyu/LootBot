# Fase 3: Expansão e Polimento - Plano Detalhado

## Visão Geral

Este documento detalha as melhorias e novos sistemas planejados para a Fase 3 do bot de gamificação Discord. O foco está em:
- **Economia robusta** com marketplace e trading
- **Conteúdo endgame** para jogadores de alto nível
- **Sistemas sociais avançados** para engajamento
- **Quality of Life** para melhor experiência
- **Mini-games** para diversão casual

---

## Sumário

1. [Sistema de Economia Avançada](#1-sistema-de-economia-avançada)
2. [Sistema de Quests e História](#2-sistema-de-quests-e-história)
3. [Raids e Conteúdo Endgame](#3-raids-e-conteúdo-endgame)
4. [Sistema de Temporadas](#4-sistema-de-temporadas)
5. [Mini-Games](#5-mini-games)
6. [Sistema de Housing/Base Pessoal](#6-sistema-de-housingbase-pessoal)
7. [Melhorias em Sistemas Existentes](#7-melhorias-em-sistemas-existentes)
8. [Quality of Life](#8-quality-of-life)
9. [Sistema de Prestige/Rebirth](#9-sistema-de-prestigerebirth)
10. [Infraestrutura e Performance](#10-infraestrutura-e-performance)

---

## 1. Sistema de Economia Avançada

### 1.1 Casa de Leilões (Auction House)

**Descrição:** Marketplace onde jogadores podem listar e comprar itens de outros jogadores.

**Funcionalidades:**
- Listar equipamentos, materiais e consumíveis
- Sistema de lances (bid) e compra direta (buyout)
- Taxa de listagem (5%) e taxa de venda (10%)
- Filtros por tipo, raridade, stats, preço
- Histórico de preços para itens populares
- Limite de 10 listagens ativas por jogador
- Duração de 24h, 48h ou 72h

**Modelo de Dados:**
```typescript
interface AuctionListing {
  listingId: string;
  sellerId: string;
  itemType: 'equipment' | 'material' | 'consumable';
  itemData: any; // Equipment ou item específico
  startingBid: number;
  buyoutPrice?: number;
  currentBid: number;
  currentBidderId?: string;
  bids: Array<{ bidderId: string; amount: number; timestamp: Date }>;
  duration: 24 | 48 | 72; // horas
  expiresAt: Date;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  createdAt: Date;
}
```

**Comandos:**
- `/leilao listar <item> <preco_inicial> [buyout] [duracao]` - Listar item
- `/leilao buscar [tipo] [raridade] [stats]` - Buscar itens
- `/leilao dar-lance <id> <valor>` - Dar lance
- `/leilao comprar <id>` - Comprar (buyout)
- `/leilao minhas-listagens` - Ver suas listagens
- `/leilao meus-lances` - Ver seus lances ativos
- `/leilao historico` - Ver histórico de compras/vendas

**Anti-Exploit:**
- Preço mínimo baseado no valor do item
- Preço máximo 1000x o valor base
- Cooldown de 1 minuto entre listagens
- Detecção de manipulação de mercado (mesmo IP/padrões suspeitos)
- Proibido dar lance em próprios itens

---

### 1.2 Sistema de Trading (P2P)

**Descrição:** Troca direta de itens e coins entre jogadores.

**Funcionalidades:**
- Trade window com confirmação dupla
- Suporte a múltiplos itens + coins
- Histórico de trades para auditoria
- Sistema de reputação de trader
- Limite de 5 trades por hora
- Trade lock para novos jogadores (7 dias)

**Comandos:**
- `/trocar iniciar @usuario` - Iniciar trade
- `/trocar adicionar <item> [quantidade]` - Adicionar item ao trade
- `/trocar coins <quantidade>` - Adicionar coins
- `/trocar confirmar` - Confirmar oferta
- `/trocar cancelar` - Cancelar trade
- `/trocar historico [@usuario]` - Ver histórico

**Fluxo:**
1. Jogador A inicia trade com Jogador B
2. Ambos adicionam itens/coins
3. Ambos confirmam (botões no embed)
4. Sistema valida e executa a troca
5. Log registrado para ambos

---

### 1.3 Banco do Reino

**Descrição:** Sistema bancário com depósitos, juros e empréstimos.

**Funcionalidades:**
- Depósito com rendimento de 0.1% ao dia (máx 1M)
- Empréstimos com juros de 5% (pagamento em 7 dias)
- Cofre pessoal para itens (slots limitados)
- Transferências entre jogadores (taxa de 2%)
- Histórico de transações

**Limites:**
| Nível | Depósito Máx | Empréstimo Máx | Slots Cofre |
|-------|--------------|----------------|-------------|
| 1-25  | 100.000      | 10.000         | 5           |
| 26-50 | 500.000      | 50.000         | 10          |
| 51-75 | 1.000.000    | 100.000        | 20          |
| 76+   | 5.000.000    | 500.000        | 50          |

**Comandos:**
- `/banco depositar <quantidade>`
- `/banco sacar <quantidade>`
- `/banco saldo`
- `/banco emprestar <quantidade>`
- `/banco pagar`
- `/banco cofre` - Gerenciar cofre de itens
- `/banco transferir @usuario <quantidade>`

---

## 2. Sistema de Quests e História

### 2.1 Quest System

**Descrição:** Sistema de missões com história, recompensas e progressão.

**Tipos de Quest:**
1. **Main Story** - Linha principal, desbloqueia conteúdo
2. **Side Quests** - Histórias secundárias, boas recompensas
3. **Daily Quests** - Renovam diariamente, recompensas moderadas
4. **Weekly Quests** - Objetivos maiores, grandes recompensas
5. **Guild Quests** - Cooperativas para guildas
6. **Event Quests** - Temporárias durante eventos

**Modelo de Dados:**
```typescript
interface Quest {
  questId: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'weekly' | 'guild' | 'event';
  chapter?: number; // Para main story
  prerequisites: string[]; // Quests que precisam ser completadas antes
  levelRequired: number;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  dialogue: QuestDialogue[]; // NPCs e conversas
  timeLimit?: number; // Em horas, para quests temporárias
  repeatable: boolean;
  cooldown?: number; // Em horas, para repetíveis
}

interface QuestObjective {
  type: 'kill' | 'collect' | 'craft' | 'visit' | 'talk' | 'win_pvp' | 'complete_dungeon';
  target: string; // monsterId, itemId, locationId, npcId
  quantity: number;
  description: string;
}

interface QuestDialogue {
  npcId: string;
  npcName: string;
  npcEmoji: string;
  text: string;
  choices?: Array<{ text: string; nextDialogue?: number; action?: string }>;
}
```

**Main Story Chapters (Exemplo):**
1. **O Despertar** (Nível 1-10) - Tutorial expandido, introdução ao mundo
2. **Sombras no Horizonte** (Nível 11-25) - Ameaça emergente, primeira dungeon
3. **A Ordem dos Guardiões** (Nível 26-40) - Introdução às guildas, facções
4. **Guerra nas Fronteiras** (Nível 41-55) - PvP, conflitos territoriais
5. **Segredos Ancestrais** (Nível 56-70) - Lore profundo, raids desbloqueadas
6. **O Cataclismo** (Nível 71-85) - Eventos mundiais, ameaça global
7. **Ascensão** (Nível 86-100) - Conclusão, prestige disponível

**Comandos:**
- `/quest listar [tipo]` - Ver quests disponíveis
- `/quest aceitar <id>` - Aceitar quest
- `/quest progresso` - Ver quests ativas e progresso
- `/quest abandonar <id>` - Abandonar quest
- `/quest historia` - Ver progresso na main story
- `/quest npc <nome>` - Interagir com NPC

---

### 2.2 NPCs e Interações

**NPCs do Mundo:**
| NPC | Localização | Função |
|-----|-------------|--------|
| Mestre Aldric | Cidade | Main quests, lore |
| Ferreiro Grimm | Forja | Side quests crafting |
| Mercador Lyra | Mercado | Side quests economia |
| Capitão Vorn | Arena | Quests PvP |
| Anciã Seraphina | Templo | Quests especiais |
| Explorador Rex | Dungeons | Quests exploração |

---

## 3. Raids e Conteúdo Endgame

### 3.1 Sistema de Raids

**Descrição:** Instâncias de grande escala para 8-20 jogadores, com mecânicas complexas.

**Características:**
- Grupos de 8, 12 ou 20 jogadores
- Múltiplos bosses por raid (3-5)
- Mecânicas únicas que requerem coordenação
- Loot único e poderoso
- Lockout semanal por dificuldade
- Dificuldades: Normal, Heroico, Mítico

**Raids Planejadas:**

#### Raid 1: Fortaleza do Rei Caído (8 jogadores)
- **Nível:** 60+
- **Bosses:** 3
- **Lore:** Rei corrompido pela escuridão
- **Mecânicas especiais:**
  - Boss 1: Tanque deve trocar posição com healer periodicamente
  - Boss 2: DPS devem destruir cristais em ordem específica
  - Boss 3: Toda raid deve se mover junto para evitar wipe

#### Raid 2: Abismo Eterno (12 jogadores)
- **Nível:** 75+
- **Bosses:** 4
- **Lore:** Portal para dimensão sombria
- **Mecânicas especiais:**
  - Fases alternadas entre luz e escuridão
  - Jogadores marcados devem se afastar
  - Boss final com 3 fases distintas

#### Raid 3: Trono Celestial (20 jogadores)
- **Nível:** 90+
- **Bosses:** 5
- **Lore:** Confronto com entidade divina
- **Mecânicas especiais:**
  - Grupos devem se dividir em múltiplas plataformas
  - Mecânicas de timing preciso
  - Boss final é o mais difícil do jogo

**Modelo de Dados:**
```typescript
interface Raid {
  raidId: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  levelRequired: number;
  bosses: RaidBoss[];
  difficulties: RaidDifficulty[];
  weeklyLockout: boolean;
}

interface RaidBoss {
  bossId: string;
  name: string;
  hp: Record<string, number>; // Por dificuldade
  phases: BossPhase[];
  mechanics: BossMechanic[];
  lootTable: RaidLoot[];
}

interface BossMechanic {
  name: string;
  description: string;
  triggerCondition: string;
  effect: string;
  counterplay: string;
}
```

**Comandos:**
- `/raid criar <raid_id> <dificuldade>` - Criar grupo de raid
- `/raid entrar <codigo>` - Entrar em raid existente
- `/raid listar` - Ver raids disponíveis
- `/raid progresso` - Ver progresso semanal
- `/raid iniciar` - Iniciar a raid (líder)

---

### 3.2 World Bosses Schedulados

**Descrição:** Bosses que aparecem em horários específicos, batalhas épicas abertas.

**Schedule:**
| Boss | Dia | Horário | Nível | Participantes |
|------|-----|---------|-------|---------------|
| Dragão Ancião | Segunda | 20:00 | 50+ | Ilimitado |
| Hydra das Profundezas | Quarta | 21:00 | 60+ | Ilimitado |
| Titã de Ferro | Sexta | 20:00 | 70+ | Ilimitado |
| Avatar do Caos | Domingo | 19:00 | 80+ | Ilimitado |

**Mecânicas:**
- Spawn em canal específico com anúncio
- HP escala com número de participantes
- Recompensas baseadas em contribuição (dano, cura, suporte)
- Top 10 recebem loot especial
- Todos participantes recebem recompensa base

---

### 3.3 Tower of Trials (Torre dos Desafios)

**Descrição:** Conteúdo infinito com andares cada vez mais difíceis.

**Mecânicas:**
- 100 andares base, depois andares infinitos com scaling
- Cada 10 andares tem um boss
- Andares aleatórios com modificadores (mais dano inimigo, menos cura, etc.)
- Ranking de maior andar alcançado
- Reset mensal do progresso
- Recompensas exclusivas baseadas no andar

**Modificadores de Andar:**
| Modificador | Efeito | Andares |
|-------------|--------|---------|
| Fortified | Inimigos +50% HP | 11-20 |
| Enraged | Inimigos +30% dano | 21-30 |
| Cursed | -25% cura recebida | 31-40 |
| Tyrannical | Bosses +100% HP | 41-50 |
| Necrotic | Dano aplica DoT | 51-60 |
| Bolstering | Inimigos mortos buffam outros | 61-70 |
| Explosive | Inimigos explodem ao morrer | 71-80 |
| Infernal | Todas as combinações | 81+ |

**Comandos:**
- `/torre entrar` - Entrar na torre
- `/torre status` - Ver andar atual e modificadores
- `/torre ranking` - Ver ranking mensal
- `/torre recompensas` - Ver recompensas por andar

---

## 4. Sistema de Temporadas

### 4.1 Temporadas de Arena

**Descrição:** Ciclos competitivos com reset de rating e recompensas exclusivas.

**Duração:** 3 meses por temporada

**Estrutura:**
```
Temporada → Divisões → Ranks → Tiers

Exemplo:
Temporada 1: "Era do Ferro"
├── Divisão Bronze (0-999)
│   ├── Bronze I (0-333)
│   ├── Bronze II (334-666)
│   └── Bronze III (667-999)
├── Divisão Prata (1000-1399)
├── Divisão Ouro (1400-1699)
├── Divisão Platina (1700-1999)
├── Divisão Diamante (2000-2299)
├── Divisão Mestre (2300-2599)
└── Divisão Lenda (2600+)
    └── Top 100 com ranking numérico
```

**Recompensas de Fim de Temporada:**
| Rank Final | Coins | Materiais | Título | Cosmético |
|------------|-------|-----------|--------|-----------|
| Bronze | 1.000 | 5 comuns | - | - |
| Prata | 5.000 | 10 comuns | - | Borda prata |
| Ouro | 15.000 | 5 raros | "Gladiador" | Borda ouro |
| Platina | 30.000 | 10 raros | "Campeão" | Borda platina + aura |
| Diamante | 50.000 | 5 épicos | "Diamante" | Set cosmético |
| Mestre | 100.000 | 10 épicos | "Mestre da Arena" | Set + montaria |
| Lenda | 250.000 | 5 lendários | "Lenda Viva" | Set + montaria + efeito |
| Top 10 | 500.000 | 10 lendários | "Immortal" | Tudo + título único |

**Decay:**
- Diamante+: -50 rating por semana de inatividade
- Máximo 2 semanas sem jogar antes de começar decay

---

### 4.2 Battle Pass

**Descrição:** Sistema de progressão sazonal com trilha gratuita e premium.

**Duração:** Coincide com temporada de arena (3 meses)

**Estrutura:**
- 100 níveis
- XP de Battle Pass ganho por atividades diárias/semanais
- Trilha gratuita: recompensas básicas a cada 2 níveis
- Trilha premium: recompensas extras em todos os níveis

**Missões de Battle Pass:**
| Tipo | Exemplo | XP |
|------|---------|-----|
| Diária | Derrote 20 monstros | 100 |
| Diária | Complete 1 dungeon | 150 |
| Diária | Vença 1 PvP | 200 |
| Semanal | Derrote 200 monstros | 500 |
| Semanal | Complete 10 dungeons | 750 |
| Semanal | Vença 10 PvP | 1000 |
| Semanal | Participe de evento mundial | 500 |

**Recompensas (Exemplo níveis 1-20):**
| Nível | Gratuito | Premium |
|-------|----------|---------|
| 1 | 500 coins | + 500 coins |
| 5 | 1 material raro | + 2 materiais raros |
| 10 | Título "Viajante" | + Pet cosmético |
| 15 | 5.000 coins | + Caixa de equipamento |
| 20 | 1 material épico | + Skin de arma |

**Comandos:**
- `/battlepass status` - Ver nível e progresso
- `/battlepass recompensas` - Ver e coletar recompensas
- `/battlepass missoes` - Ver missões ativas
- `/battlepass premium` - Info sobre upgrade

---

## 5. Mini-Games

### 5.1 Sistema de Pesca

**Descrição:** Minigame relaxante com colecionáveis e recompensas.

**Mecânicas:**
- Diferentes zonas de pesca (lago, rio, mar, abismo)
- Cada zona tem peixes únicos
- Peixes raros com baixa chance
- Iscas melhoram chances de peixes raros
- Eventos de pesca com peixes especiais

**Zonas:**
| Zona | Nível | Peixes | Raridade Máx |
|------|-------|--------|--------------|
| Lago da Vila | 1+ | 10 tipos | Raro |
| Rio Serpente | 15+ | 15 tipos | Épico |
| Costa Azul | 30+ | 20 tipos | Lendário |
| Profundezas | 50+ | 25 tipos | Mítico |
| Void Waters | 75+ | 10 tipos | Mítico |

**Usos dos Peixes:**
- Vender por coins
- Cozinhar para buffs
- Trocar por materiais raros
- Completar coleção (conquistas)
- Alguns peixes são pets

**Comandos:**
- `/pescar` - Pescar na zona atual
- `/pescar zona <nome>` - Mudar zona
- `/pescar colecao` - Ver peixes capturados
- `/pescar ranking` - Ranking de pescadores
- `/pescar loja` - Comprar iscas/varas

---

### 5.2 Sistema de Mineração

**Descrição:** Exploração de minas para recursos e tesouros.

**Mecânicas:**
- Minas com veios de minério
- Diferentes ferramentas (picareta de ferro → diamante → mítica)
- Chance de encontrar gemas raras
- Minas especiais com tempo limitado
- Eventos de "Gold Rush"

**Minérios:**
| Minério | Zona | Uso |
|---------|------|-----|
| Cobre | Mina Inicial | Crafting básico |
| Ferro | Mina Profunda | Crafting intermediário |
| Prata | Caverna Lunar | Encantamentos |
| Ouro | Veio Dourado | Economia/Crafting |
| Mithril | Abismo | Crafting avançado |
| Adamantium | Núcleo | Crafting lendário |
| Void Crystal | Fenda | Crafting mítico |

**Comandos:**
- `/minerar` - Minerar na mina atual
- `/minerar mina <nome>` - Mudar mina
- `/minerar ferramentas` - Ver/equipar ferramentas
- `/minerar inventario` - Ver minérios coletados

---

### 5.3 Cassino do Reino

**Descrição:** Jogos de azar com coins (com limites para responsabilidade).

**Jogos:**

#### Roleta
- Apostar em número (35x), cor (2x), par/ímpar (2x)
- Aposta mínima: 100 coins
- Aposta máxima: 10.000 coins

#### Blackjack
- Regras clássicas
- Aposta mínima: 500 coins
- Aposta máxima: 50.000 coins

#### Slots
- 3 rolos com símbolos
- Jackpot progressivo
- Aposta: 100-1.000 coins

#### Dados
- Apostar maior/menor que 7
- Apostar número exato
- Aposta: 100-5.000 coins

**Limites de Responsabilidade:**
- Máximo de 100.000 coins perdidos por dia
- Cooldown de 1 hora após perder 50.000
- Aviso após 10 perdas consecutivas
- Opção de auto-exclusão temporária

**Comandos:**
- `/cassino roleta <aposta> <tipo> [numero]`
- `/cassino blackjack <aposta>`
- `/cassino slots <aposta>`
- `/cassino dados <aposta> <tipo>`
- `/cassino limite` - Ver/definir limites pessoais

---

### 5.4 Trivia do Reino

**Descrição:** Quiz com perguntas sobre o jogo e cultura geral.

**Mecânicas:**
- Perguntas sobre lore do jogo
- Perguntas de cultura geral
- Eventos de trivia com premiação
- Ranking de conhecimento
- Perguntas diárias com streak

**Recompensas:**
| Streak | Recompensa |
|--------|------------|
| 3 dias | 500 coins |
| 7 dias | 2.000 coins + material |
| 14 dias | 5.000 coins + caixa |
| 30 dias | 15.000 coins + título |

**Comandos:**
- `/trivia jogar` - Responder pergunta do dia
- `/trivia ranking` - Ver ranking
- `/trivia streak` - Ver streak atual

---

## 6. Sistema de Housing/Base Pessoal

### 6.1 Base do Aventureiro

**Descrição:** Espaço pessoal customizável com funcionalidades úteis.

**Funcionalidades:**
- Decoração cosmética
- Estações de crafting (bônus de sucesso)
- Armazém expandido
- NPCs contratáveis (buffs passivos)
- Jardim para cultivar materiais
- Portal para dungeons (reduz cooldown)

**Estrutura de Upgrade:**
| Nível Base | Custo | Benefícios |
|------------|-------|------------|
| 1 (Tenda) | Grátis | 10 slots armazém |
| 2 (Cabana) | 50.000 | +20 slots, jardim pequeno |
| 3 (Casa) | 200.000 | +30 slots, estação crafting |
| 4 (Mansão) | 500.000 | +50 slots, NPC, jardim médio |
| 5 (Fortaleza) | 1.000.000 | +100 slots, 2 NPCs, portal |
| 6 (Castelo) | 5.000.000 | Máximo, todos benefícios |

**NPCs Contratáveis:**
| NPC | Custo/Semana | Benefício |
|-----|--------------|-----------|
| Ferreiro | 5.000 | +5% sucesso crafting |
| Alquimista | 5.000 | +10% duração poções |
| Treinador | 10.000 | +5% XP ganho |
| Mercador | 10.000 | -5% preços em lojas |
| Guardião | 15.000 | +5% defesa em dungeons |
| Sábio | 15.000 | +10% loot raro |

**Comandos:**
- `/base ver` - Ver sua base
- `/base upgrade` - Melhorar base
- `/base decorar` - Customizar decoração
- `/base armazem` - Acessar armazém
- `/base jardim` - Gerenciar jardim
- `/base npc` - Gerenciar NPCs

---

### 6.2 Sistema de Jardim

**Descrição:** Cultivar materiais passivamente.

**Mecânicas:**
- Plantar sementes de materiais
- Tempo de crescimento varia por raridade
- Regar aumenta qualidade
- Fertilizante acelera crescimento
- Colher materiais maduros

**Sementes:**
| Semente | Tempo | Resultado | Quantidade |
|---------|-------|-----------|------------|
| Erva Comum | 4h | Ervas comuns | 5-10 |
| Cristal Raro | 12h | Cristais raros | 2-5 |
| Essência Épica | 24h | Essências épicas | 1-3 |
| Fragmento Lendário | 48h | Fragmentos lendários | 1 |

---

## 7. Melhorias em Sistemas Existentes

### 7.1 Melhorias no Sistema de Classes

**Novas Subclasses (Tier 4):**
Disponíveis após level 80 e completar quest especial.

| Classe Base | Tier 4 Options |
|-------------|----------------|
| Guerreiro | Campeão, Guardião Sagrado |
| Mago | Arquimago, Cronomante |
| Arqueiro | Atirador de Elite, Mestre das Feras |
| Assassino | Sombra Letal, Ninja |
| Paladino | Arauto da Luz, Vingador |
| Necromante | Senhor dos Mortos, Ceifador |
| Druida | Guardião Ancião, Elementalista |
| Monge | Mestre Asceta, Avatar |

**Árvore de Talentos:**
- 3 especializações por classe
- 50 pontos de talento (1 por nível após 50)
- Talentos passivos e ativos
- Reset de talentos por 10.000 coins

---

### 7.2 Melhorias em Guildas

**Novos Recursos:**
- **Guild Bank** com logs de transação
- **Guild Calendar** para eventos
- **Guild Quests** cooperativas
- **Guild Wars** (batalhas 5v5 entre guildas)
- **Territórios** - Guildas podem controlar áreas
- **Guild Level** - XP coletivo com perks

**Perks por Guild Level:**
| Nível | Perk |
|-------|------|
| 5 | +5% XP para membros |
| 10 | +10% loot em dungeons |
| 15 | Banco expandido (+100 slots) |
| 20 | -10% custo de crafting |
| 25 | +15% XP para membros |
| 30 | Fortaleza de guilda |

---

### 7.3 Melhorias em Dungeons

**Afixos Semanais:**
Sistema de modificadores rotativos que mudam toda semana.

| Afixo | Efeito |
|-------|--------|
| Fortified | Mobs +30% HP |
| Tyrannical | Bosses +50% HP |
| Sanguine | Mobs curam ao morrer |
| Volcanic | Vulcões surgem aleatoriamente |
| Necrotic | Ataques reduzem cura |
| Quaking | Terremotos periódicos |
| Explosive | Orbes explosivos surgem |
| Grievous | Dano causa DoT |

**Mythic+ System:**
- Chaves que aumentam dificuldade
- Timer para completar
- Quanto maior o nível, melhores recompensas
- Leaderboard de melhores tempos

---

### 7.4 Melhorias em PvP

**Novos Modos:**
1. **2v2 Arena** - Duplas ranqueadas
2. **3v3 Arena** - Trios ranqueados
3. **Battleground 10v10** - Capture the Flag
4. **Battleground 20v20** - Domination
5. **Guild Wars 5v5** - Competição entre guildas
6. **Free For All** - Todos contra todos (8 jogadores)

**Sistema de Honra:**
- Ganhe Honra em qualquer modo PvP
- Gaste Honra em loja exclusiva
- Ranks de Honra com títulos

---

### 7.5 Melhorias em Crafting

**Qualidade de Item:**
- Normal (100% stats base)
- Superior (110% stats) - 20% chance
- Excepcional (120% stats) - 5% chance
- Obra-Prima (130% stats) - 1% chance

**Blueprints Raros:**
- Drops de raids e eventos
- Permitem craftar itens exclusivos
- Alguns são tradeable

**Crafting em Batch:**
- Criar múltiplos itens de uma vez
- Desconto de materiais para batches grandes

---

## 8. Quality of Life

### 8.1 Sistema de Notificações

**Notificações Configuráveis:**
- Eventos mundiais iniciando
- Raid disponível (cooldown resetou)
- Item vendido no leilão
- Guild quest disponível
- Amigo online
- Battle Pass nível up

**Comandos:**
- `/notificacoes config` - Configurar notificações
- `/notificacoes toggle <tipo>` - Ligar/desligar específica

---

### 8.2 Auto-Battle (Farming)

**Descrição:** Sistema para farming passivo com limites.

**Mecânicas:**
- Definir área de farming
- Bot luta automaticamente por X minutos
- Recompensas reduzidas (50% do normal)
- Limite de 2 horas por dia
- Requer consumível "Pergaminho de Automação"

**Comandos:**
- `/autofarming iniciar <zona> <duracao>`
- `/autofarming status`
- `/autofarming coletar` - Coletar recompensas
- `/autofarming parar`

---

### 8.3 Sistema de Favoritos

**Funcionalidades:**
- Marcar itens como favoritos (proteção contra venda)
- Builds salvas (equipamentos + skills)
- Atalhos para comandos frequentes

**Comandos:**
- `/favoritos item <id>` - Favoritar item
- `/favoritos build salvar <nome>` - Salvar build
- `/favoritos build carregar <nome>` - Carregar build

---

### 8.4 Histórico e Estatísticas

**Dashboard de Stats:**
- DPS médio
- Maior dano single hit
- Total de dano causado/recebido
- Win rate PvP
- Dungeons completadas
- Tempo jogado
- Coins ganhos/gastos
- Itens craftados

**Comandos:**
- `/stats geral` - Visão geral
- `/stats combate` - Stats de combate
- `/stats economia` - Stats de economia
- `/stats comparar @usuario` - Comparar com outro jogador

---

### 8.5 Sistema de Tutoriais

**Tutoriais Interativos:**
- Tutorial de combate
- Tutorial de crafting
- Tutorial de dungeons
- Tutorial de PvP
- Tutorial de guilds

**Recompensas por Completar:**
- XP bônus
- Itens iniciais
- Conquistas

---

## 9. Sistema de Prestige/Rebirth

### 9.1 Visão Geral

**Descrição:** Ao atingir level 100, jogadores podem "renascer" trocando progresso por bônus permanentes.

**O que se mantém:**
- Conquistas
- Títulos
- Cosméticos
- Moeda de Prestige
- Coins (50%)
- Alguns itens especiais

**O que se perde:**
- Level (volta para 1)
- Equipamentos (maioria)
- Materiais (maioria)
- Skills (resetadas)
- Quests (resetadas)

**O que se ganha:**
- Pontos de Prestige
- Bônus permanentes
- Acesso a conteúdo exclusivo
- Título de Prestige
- Multiplicador de XP

---

### 9.2 Sistema de Pontos de Prestige

**Ganho de Pontos:**
| Condição ao Renascer | Pontos |
|---------------------|--------|
| Level 100 básico | 100 |
| +10 por conquista rara+ | Variável |
| +50 se completou raids | 50 |
| +25 por temporada de arena | 25 |
| Bônus primeiro rebirth | 50 |

**Uso de Pontos:**
| Upgrade | Custo | Efeito |
|---------|-------|--------|
| XP Boost I-V | 50-250 | +2%/+4%/+6%/+8%/+10% XP |
| Loot Boost I-V | 50-250 | +2%/+4%/+6%/+8%/+10% loot |
| Gold Boost I-V | 50-250 | +2%/+4%/+6%/+8%/+10% coins |
| Stats Boost I-V | 100-500 | +1%/+2%/+3%/+4%/+5% todas stats |
| Slot Extra | 200 | +1 slot de skill |
| Herança | 500 | Manter 1 equipamento no rebirth |
| Memória | 300 | Manter progresso de 1 quest chain |
| Talento Inato | 1000 | Começar com 10 pontos de talento |

---

### 9.3 Níveis de Prestige

| Prestige | Total Rebirths | Título | Cor do Nome |
|----------|---------------|--------|-------------|
| I | 1 | Renascido | Verde |
| II | 3 | Ascendido | Azul |
| III | 5 | Transcendente | Roxo |
| IV | 10 | Imortal | Dourado |
| V | 20 | Eterno | Arco-íris |
| VI+ | 20+ | Deus [N] | Brilhante |

**Comandos:**
- `/prestige info` - Ver informações sobre prestige
- `/prestige renascer` - Iniciar rebirth
- `/prestige loja` - Gastar pontos de prestige
- `/prestige ranking` - Ranking de prestige

---

## 10. Infraestrutura e Performance

### 10.1 Otimizações de Database

**Índices Recomendados:**
```javascript
// Users - queries frequentes
db.users.createIndex({ discordId: 1 });
db.users.createIndex({ level: -1, xp: -1 }); // Leaderboard
db.users.createIndex({ "stats.pvpRating": -1 }); // PvP ranking

// Equipment
db.equipment.createIndex({ discordId: 1, slot: 1 });
db.equipment.createIndex({ discordId: 1, isEquipped: 1 });

// Auction
db.auctions.createIndex({ status: 1, expiresAt: 1 });
db.auctions.createIndex({ itemType: 1, status: 1 });

// Quests
db.questProgress.createIndex({ discordId: 1, status: 1 });
```

**Caching Strategy:**
- Redis para dados frequentes (leaderboards, configs)
- Cache de 5 minutos para rankings
- Cache de 1 hora para dados estáticos
- Invalidação inteligente em updates

---

### 10.2 Rate Limiting Avançado

**Limites por Categoria:**
| Categoria | Limite | Janela |
|-----------|--------|--------|
| Comandos gerais | 30 | 60s |
| Combate | 10 | 60s |
| Trading | 5 | 60s |
| Crafting | 20 | 60s |
| Leilão | 10 | 60s |
| Admin | 100 | 60s |

---

### 10.3 Sistema de Logs Avançado

**Logs Estruturados:**
```typescript
interface GameLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'combat' | 'economy' | 'social' | 'admin' | 'system';
  action: string;
  discordId?: string;
  details: Record<string, any>;
  metadata: {
    serverId: string;
    channelId: string;
    commandUsed: string;
  };
}
```

**Dashboard Admin:**
- Visualização de logs em tempo real
- Filtros por categoria/usuário
- Alertas automáticos para anomalias
- Métricas de uso

---

### 10.4 Backup e Recovery

**Estratégia de Backup:**
- Backup completo diário
- Backup incremental a cada hora
- Retenção de 30 dias
- Teste de restore semanal

**Recovery Points:**
- Rollback de transação individual
- Restore de personagem específico
- Restore completo do servidor

---

### 10.5 Monitoramento

**Métricas Chave:**
- Comandos por minuto
- Latência média de resposta
- Erros por hora
- Usuários ativos (DAU/MAU)
- Economia (coins criados/destruídos)
- Tempo médio de sessão

**Alertas:**
- Latência > 2s
- Error rate > 1%
- Database connections > 80%
- Memory usage > 80%

---

## Cronograma Sugerido de Implementação

### Sprint 1: Economia (2-3 semanas)
- [ ] Casa de Leilões
- [ ] Sistema de Trading
- [ ] Banco do Reino

### Sprint 2: Quests (2-3 semanas)
- [ ] Sistema de Quests base
- [ ] Main Story Chapter 1-2
- [ ] Daily/Weekly quests

### Sprint 3: Endgame (3-4 semanas)
- [ ] Sistema de Raids
- [ ] World Bosses schedulados
- [ ] Tower of Trials

### Sprint 4: Temporadas (2 semanas)
- [ ] Temporadas de Arena
- [ ] Battle Pass

### Sprint 5: Mini-games (2-3 semanas)
- [ ] Pesca
- [ ] Mineração
- [ ] Cassino
- [ ] Trivia

### Sprint 6: Housing (2 semanas)
- [ ] Base do Aventureiro
- [ ] Sistema de Jardim

### Sprint 7: Melhorias (2-3 semanas)
- [ ] Melhorias em classes
- [ ] Melhorias em guildas
- [ ] Melhorias em dungeons
- [ ] Melhorias em PvP
- [ ] Melhorias em crafting

### Sprint 8: QoL e Prestige (2 semanas)
- [ ] Sistema de notificações
- [ ] Auto-battle
- [ ] Favoritos e builds
- [ ] Stats dashboard
- [ ] Sistema de Prestige

### Sprint 9: Infraestrutura (1-2 semanas)
- [ ] Otimizações de database
- [ ] Rate limiting avançado
- [ ] Sistema de logs
- [ ] Monitoramento

---

## Priorização Recomendada

**Alta Prioridade (Impacto Alto, Essencial):**
1. Sistema de Quests - Fundamental para engajamento
2. Casa de Leilões - Economia entre jogadores
3. Raids - Conteúdo endgame
4. Temporadas - Ciclo de engajamento

**Média Prioridade (Bom para ter):**
5. Tower of Trials - Conteúdo infinito
6. Battle Pass - Monetização e engajamento
7. Mini-games - Diversão casual
8. Melhorias em sistemas existentes

**Baixa Prioridade (Nice to have):**
9. Housing - Cosmético e QoL
10. Sistema de Prestige - Para jogadores dedicados
11. Infraestrutura avançada - Scaling futuro

---

## Conclusão

Este documento apresenta um roadmap completo para transformar o bot de gamificação em uma experiência de RPG completa. A implementação deve ser feita de forma iterativa, priorizando sistemas que tragam maior engajamento e valor para os jogadores.

Cada sistema foi desenhado para:
- Ser tecnicamente viável com a stack atual
- Integrar-se com sistemas existentes
- Oferecer progressão e recompensas significativas
- Manter o balanceamento econômico
- Prevenir exploits e abusos

O sucesso da Fase 3 dependerá de:
- Feedback contínuo da comunidade
- Testes extensivos antes de release
- Monitoramento pós-launch
- Iteração baseada em dados

---

*Documento criado para planejamento da Fase 3 do Bot de Gamificação Discord*
*Versão: 2.0*
*Data: Janeiro 2026*
