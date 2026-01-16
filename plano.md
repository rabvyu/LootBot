# Plano da Próxima Fase - Bot de Gamificação Discord

## Resumo da Fase Anterior (Concluída)

### Sistemas Implementados:
- **Sistema de Classes Completo:** 4 classes base, 8 intermediárias, 16 avançadas, 6 wildcards (34 total)
- **Sistema de Skills:** Skill tree com 4 branches por classe (Ofensiva, Defensiva, Utilidade, Ultimate)
- **Sistema de Atributos:** STR, INT, VIT, AGI, LUK com efeitos calculados
- **Evolução de Classes:** Nível 30 (intermediária), Nível 60 (avançada), wildcards por sorte
- **Lojas:** Loja de Melhoria e Loja do Alquimista com estoque rotativo
- **Integração de Combate:** Skills e atributos afetam dano, defesa, crítico, evasão, lifesteal
- **Drops de Equipamento:** Implementado em caçadas e Boss Raids

---

## Próxima Fase: Sistema de Guildas e Conteúdo Endgame

### 1. Sistema de Guildas (Clãs)

#### Funcionalidades:
```
/guilda criar <nome>      - Criar uma guilda (custa 50.000 coins)
/guilda convidar <@user>  - Convidar jogador
/guilda expulsar <@user>  - Expulsar membro (líder/oficiais)
/guilda sair              - Sair da guilda
/guilda info              - Ver informações da guilda
/guilda membros           - Listar membros
/guilda ranking           - Ranking de guildas
/guilda definir-cargo     - Definir cargo de membro
```

#### Cargos:
- **Líder:** Controle total
- **Vice-Líder:** Pode convidar/expulsar
- **Oficial:** Pode convidar
- **Membro:** Participante

#### Benefícios de Guilda:
- Bônus de XP coletivo (+5% por cada 10 membros ativos)
- Loja exclusiva de guilda
- Banco de recursos compartilhado
- Missões de guilda

### 2. Guerra de Guildas

#### Mecânica:
```
/guerra declarar <guilda>  - Declarar guerra (precisa 80% dos oficiais aprovarem)
/guerra status             - Ver status da guerra atual
/guerra placar             - Ver placar
```

#### Sistema:
- Duração: 7 dias
- Pontos por vitórias em PvP contra membros inimigos
- Pontos bônus por Boss Raids concluídas durante guerra
- Prêmios: Coins, recursos raros, título exclusivo

### 3. Dungeons de Guilda

#### Tipos:
| Dungeon | Mínimo | Dificuldade | Recompensas |
|---------|--------|-------------|-------------|
| Catacumbas Antigas | 3 players | Normal | Recursos Tier 4 |
| Fortaleza Sombria | 5 players | Difícil | Equipamentos Tier 7 |
| Abismo do Caos | 8 players | Extremo | Materiais Lendários |
| Trono do Demônio | 10 players | Impossível | Itens Únicos |

#### Mecânica:
- Ondas de monstros com dificuldade crescente
- Boss final com mecânicas especiais
- Loot distribuído por contribuição de dano

### 4. Sistema de Crafting Avançado

#### Novas Receitas:
```
/craftar equipamento <tier> <slot>  - Criar equipamento
/craftar consumivel <item>          - Criar consumível
/craftar receitas                   - Ver receitas disponíveis
```

#### Materiais:
- **Drops de Monstros:** Já existentes
- **Drops de Dungeon:** Novos materiais
- **Coleta:** Sistema de mineração/herbalismo

#### Equipamentos Craftáveis:
- Tier 8-10 com opções de customização
- Slots de encantamento
- Sets com bônus de conjunto

### 5. Sistema de Encantamentos

#### Funcionalidades:
```
/encantar <equipamento> <encantamento>  - Aplicar encantamento
/encantamentos                           - Ver encantamentos disponíveis
```

#### Tipos de Encantamento:
| Encantamento | Efeito | Material Necessário |
|--------------|--------|---------------------|
| Fúria | +15% Dano | Essência de Fúria |
| Proteção | +10% Defesa | Escama de Dragão |
| Vampírico | +5% Lifesteal | Sangue Amaldiçoado |
| Precisão | +8% Crítico | Olho de Águia |
| Velocidade | +10% Evasão | Pena de Fênix |

#### Níveis:
- Encantamento I-V (cada nível aumenta efeito em 50%)
- Chance de falha em níveis altos (pode destruir item)

### 6. Arena PvP Ranqueada

#### Funcionalidades:
```
/arena entrar           - Entrar na fila de arena
/arena ranking          - Ver ranking de arena
/arena temporada        - Ver informações da temporada
/arena historico        - Ver histórico de partidas
```

#### Sistema de Ranking:
- Bronze → Prata → Ouro → Platina → Diamante → Mestre → Grão-Mestre
- Matchmaking baseado em ELO
- Temporadas de 30 dias
- Recompensas exclusivas por rank

### 7. Eventos Mundiais

#### Sistema:
- Eventos automáticos a cada 4-6 horas
- Boss mundial que todos podem atacar
- Ranking de dano = melhores recompensas

#### Tipos de Eventos:
| Evento | Duração | Recompensas |
|--------|---------|-------------|
| Invasão Demoníaca | 1 hora | XP 3x, Drops raros |
| Eclipse | 30 min | Monstros wildcards aparecem |
| Chuva de Meteoros | 2 horas | Materiais de crafting |
| Boss Mundial | Até morte | Top 10 ganha lendários |

### 8. Sistema de Conquistas

#### Categorias:
- **Combate:** Matar X monstros, derrotar bosses
- **Progressão:** Atingir níveis, evoluir classes
- **Social:** Participar de guildas, ajudar outros
- **Coleção:** Obter equipamentos, pets, badges
- **PvP:** Vitórias em arena, ranking

#### Recompensas:
- Títulos exclusivos
- Badges especiais
- Bônus permanentes pequenos
- Cosméticos para perfil

### 9. Melhorias no Sistema de Pets

#### Evolução de Pets:
```
/pet evoluir           - Evoluir pet (requer materiais)
/pet fundir <pet1> <pet2>  - Fundir dois pets
```

#### Níveis de Raridade:
- Common → Uncommon → Rare → Epic → Legendary → Mythic

#### Sinergia de Guilda:
- Pets da mesma guilda ganham bônus quando lutam juntos

### 10. Interface e QoL

#### Melhorias:
- Dashboard web (próxima fase maior)
- Notificações de eventos
- Logs detalhados de batalha
- Histórico de transações
- Sistema de favoritos (equipamentos, locais)

---

## Ordem de Implementação Sugerida

### Sprint 1: Guildas Básicas
1. Model e service de Guild
2. Comandos básicos (/guilda criar, info, convidar, sair)
3. Sistema de cargos
4. Banco de recursos de guilda

### Sprint 2: Dungeons
1. Sistema de dungeons cooperativas
2. 4 dungeons iniciais
3. Sistema de loot por contribuição
4. Boss com mecânicas

### Sprint 3: Crafting e Encantamentos
1. Sistema de crafting expandido
2. Receitas de equipamentos Tier 8-10
3. Sistema de encantamentos
4. Materiais de dungeon

### Sprint 4: PvP e Arena
1. Arena ranqueada com matchmaking
2. Sistema de ELO
3. Temporadas e recompensas
4. Guerra de guildas

### Sprint 5: Eventos e Conquistas
1. Sistema de eventos mundiais
2. Boss mundial
3. Sistema de conquistas
4. Títulos e recompensas

### Sprint 6: Polish e QoL
1. Melhorias de interface
2. Balanceamento
3. Documentação
4. Testes finais

---

## Arquivos a Criar

### Database Models:
- `src/database/models/Guild.ts`
- `src/database/models/GuildWar.ts`
- `src/database/models/Dungeon.ts`
- `src/database/models/CraftingRecipe.ts`
- `src/database/models/Enchantment.ts`
- `src/database/models/ArenaMatch.ts`
- `src/database/models/Achievement.ts`
- `src/database/models/WorldEvent.ts`

### Services:
- `src/services/guildService.ts`
- `src/services/dungeonService.ts`
- `src/services/craftingService.ts`
- `src/services/enchantmentService.ts`
- `src/services/arenaService.ts`
- `src/services/achievementService.ts`
- `src/services/worldEventService.ts`

### Commands:
- `src/bot/commands/guilda.ts`
- `src/bot/commands/dungeon.ts`
- `src/bot/commands/craftar.ts`
- `src/bot/commands/encantar.ts`
- `src/bot/commands/arena.ts`
- `src/bot/commands/conquistas.ts`

### Data:
- `src/data/dungeons/` (dungeons e bosses)
- `src/data/crafting/` (receitas e materiais)
- `src/data/enchantments/` (encantamentos)
- `src/data/achievements/` (conquistas)
- `src/data/events/` (eventos mundiais)

---

## Prioridades

### Alta Prioridade:
1. Sistema de Guildas (comunidade)
2. Dungeons (conteúdo coop)
3. Arena PvP (competição)

### Média Prioridade:
4. Crafting avançado
5. Encantamentos
6. Eventos mundiais

### Baixa Prioridade:
7. Conquistas
8. Melhorias de pets
9. Dashboard web

---

## Métricas de Sucesso

- [ ] Guildas: 50% dos jogadores ativos em uma guilda
- [ ] Dungeons: 100 dungeons completadas por semana
- [ ] Arena: Sistema de matchmaking funcional com <2min de espera
- [ ] Crafting: 500 itens craftados por semana
- [ ] Eventos: 80% de participação em eventos mundiais

---

## Notas Técnicas

### Considerações:
- Manter arquivos pequenos (<500 linhas)
- Usar transações MongoDB para operações de guilda
- Implementar rate limiting para comandos de guilda
- Cache para rankings frequentemente acessados
- Logs detalhados para debug de batalhas multiplayer

### Performance:
- Índices MongoDB para queries frequentes
- Agregações para rankings
- Background jobs para eventos automáticos
