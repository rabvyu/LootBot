# Sistema Completo de Classes e Progressão - Plano de Implementação

## Visão Geral

Este documento detalha o sistema completo de progressão de personagens, incluindo:
- Sistema de Skill Tree com 4 árvores por classe
- Classes intermediárias e avançadas
- Distribuição de atributos
- Lojas especializadas
- Bônus de pets e equipamentos

---

## 1. Sistema de Pontos

### 1.1 Pontos de Habilidade (Skill Points)
- **Ganho:** 1 ponto a cada nível
- **Bônus a cada 10 níveis:** +2 pontos extras
- **Total no nível 100:** 100 + 20 = **120 pontos**

### 1.2 Pontos de Atributo (Attribute Points)
- **Ganho:** 3 pontos a cada nível
- **Total no nível 100:** **300 pontos**

### 1.3 Distribuição de Atributos
Os pontos podem ser distribuídos em:

| Atributo | Efeito por ponto |
|----------|------------------|
| Força (STR) | +2 Ataque físico, +0.5% dano crítico |
| Inteligência (INT) | +2 Ataque mágico, +0.3% chance crítico |
| Vitalidade (VIT) | +10 HP, +1 Defesa |
| Agilidade (AGI) | +1% Evasão, +0.5% Velocidade de ataque |
| Sorte (LUK) | +0.5% Chance crítico, +1% Drop rate |

---

## 2. Árvore de Classes

### 2.1 Classes Base (Nível 1)
```
Guerreiro (Warrior) ⚔️
Mago (Mage) 🔮
Arqueiro (Archer) 🏹
Paladino (Paladin) 🛡️
```

### 2.2 Classes Intermediárias (Nível 30)
Cada classe base evolui para 2 classes intermediárias:

```
Guerreiro ⚔️
├── Berserker 🔥 (Dano + Fúria)
└── Cavaleiro 🐴 (Tanque + Contra-ataque)

Mago 🔮
├── Elementalista ⚡ (Dano elemental)
└── Necromante 💀 (Invocações + Drain)

Arqueiro 🏹
├── Atirador de Elite 🎯 (Precisão + Crítico)
└── Caçador 🐾 (Armadilhas + Bônus com pets)

Paladino 🛡️
├── Cruzado ✝️ (Dano sagrado + Cura)
└── Guardião 🏰 (Defesa máxima + Proteção)
```

### 2.3 Classes Avançadas (Nível 60)
Cada classe intermediária evolui para 2 classes avançadas:

```
Berserker 🔥
├── Senhor da Guerra ⚔️🔥 (Líder de grupo + AoE)
└── Destruidor 💥 (Dano máximo + Glass cannon)

Cavaleiro 🐴
├── Paladino Negro 🖤 (Dano + Tanque híbrido)
└── General 👑 (Comandante + Buffs de grupo)

Elementalista ⚡
├── Arquimago 🌟 (Mestre de todos elementos)
└── Tempestade ⛈️ (Dano AoE devastador)

Necromante 💀
├── Lich 👻 (Undead poderoso + Imortalidade)
└── Senhor das Almas 💫 (Army of undead)

Atirador de Elite 🎯
├── Sniper 🔫 (One-shot + Invisibilidade)
└── Artilheiro 💣 (Explosivos + AoE)

Caçador 🐾
├── Mestre das Feras 🦁 (Pets supremos)
└── Ranger 🌲 (Natureza + Venenos)

Cruzado ✝️
├── Inquisidor ⚖️ (Dano sagrado máximo)
└── Santo 😇 (Cura suprema + Ressurreição)

Guardião 🏰
├── Titã 🗿 (Imortalidade temporária)
└── Protetor Divino ✨ (Escudos para aliados)
```

### 2.4 Classes Wildcard (Especiais)

#### Intermediárias Wildcard (5% chance ao evoluir)
```
🌀 Discípulo do Caos - +15% todos atributos
   Habilidades de TODAS as classes intermediárias (mais fracas)

🌟 Avatar da Luz - +15% todos atributos
   Habilidades de cura E dano sagrado combinadas
```

#### Avançadas Wildcard (1% chance ao evoluir)
```
💎 Transcendente - +20% todos atributos
   Acesso a 2 skill trees de classes diferentes

🌌 Void Walker - +20% todos atributos
   Habilidades únicas de manipulação dimensional

👹 Demônio Interior - +25% ataque, +15% outros
   Transformação temporária com stats massivos

🏆 Herói Lendário - +15% todos atributos
   Todas as habilidades passivas de todas as classes
```

---

## 3. Sistema de Skill Tree

### 3.1 Estrutura
Cada classe tem 4 árvores de habilidades:
- **Ofensiva** (Dano)
- **Defensiva** (Sobrevivência)
- **Utilidade** (Suporte)
- **Ultimate** (Habilidades finais)

### 3.2 Skill Trees por Classe Base

#### GUERREIRO ⚔️

**Árvore Ofensiva (Fúria)**
```
Tier 1 (1 pt cada):
├── Golpe Pesado: +10% dano do ataque básico
├── Sede de Sangue: +5% lifesteal
└── Força Bruta: +3 Ataque base

Tier 2 (2 pts cada, requer 3 pts em Tier 1):
├── Execução: +50% dano em inimigos <30% HP
├── Frenesi: Cada hit +2% velocidade (max 20%)
└── Impacto: 15% chance de atordoar 1 turno

Tier 3 (3 pts cada, requer 6 pts em Tier 2):
├── Massacre: Ataques atingem todos inimigos (50% dano)
├── Raiva Infinita: Dano +1% por 1% HP perdido
└── Corte Profundo: Causa sangramento (5% HP/turno, 3 turnos)

Ultimate (5 pts, requer 9 pts em Tier 3):
└── Fúria do Berserker: Por 5 turnos: +100% dano, -50% defesa
```

**Árvore Defensiva (Resistência)**
```
Tier 1 (1 pt cada):
├── Pele de Ferro: +5% redução de dano
├── Vitalidade: +50 HP máximo
└── Regeneração: +2% HP/turno

Tier 2 (2 pts cada):
├── Bloqueio: 20% chance de bloquear (0 dano)
├── Fortitude: Imune a atordoamento
└── Segundo Fôlego: Ao chegar em 10% HP, cura 30% (1x/batalha)

Tier 3 (3 pts cada):
├── Armadura Viva: +1 Defesa por nível
├── Desafio: Inimigos focam em você, +30% defesa
└── Imortal: Sobrevive com 1 HP uma vez por batalha

Ultimate (5 pts):
└── Modo Titã: Por 3 turnos: Dano recebido reduzido em 75%
```

**Árvore Utilidade (Tática)**
```
Tier 1 (1 pt cada):
├── Grito de Guerra: +10% dano para aliados, 3 turnos
├── Intimidar: -10% ataque inimigo, 3 turnos
└── Experiência de Batalha: +10% XP ganho

Tier 2 (2 pts cada):
├── Liderança: Aliados +5% todos stats
├── Provocar: Inimigo ataca só você por 2 turnos
└── Veterano: +15% dano contra tipos já derrotados

Tier 3 (3 pts cada):
├── Comando: Aliado ataca junto com você (50% dano)
├── Moral Alto: Grupo imune a debuffs por 2 turnos
└── Estrategista: Primeiro turno sempre seu

Ultimate (5 pts):
└── Exército de Um: Conta como 3 membros em raids
```

**Árvore Ultimate (Lendário)**
```
Requer Nível 50+, 30 pontos distribuídos

├── Lâmina Suprema (10 pts): Ataque ignora 50% da defesa
├── Corpo Fechado (10 pts): 25% chance de evadir qualquer ataque
└── Alma de Aço (10 pts): Não pode morrer nos primeiros 3 turnos
```

---

#### MAGO 🔮

**Árvore Ofensiva (Destruição)**
```
Tier 1:
├── Poder Arcano: +10% dano mágico
├── Foco Mental: +5% chance crítico mágico
└── Amplificar: Magias custam -10% mana

Tier 2:
├── Bola de Fogo: Dano de fogo + queimadura
├── Raio Gélido: Dano de gelo + slow
├── Relâmpago: Dano elétrico + paralisia

Tier 3:
├── Meteoro: Dano massivo AoE (cooldown 5 turnos)
├── Explosão Arcana: Dano = 200% do INT
└── Drenar Vida: 30% do dano vira cura

Ultimate:
└── Apocalipse Arcano: 500% dano mágico, ignora resistências
```

**Árvore Defensiva (Proteção)**
```
Tier 1:
├── Barreira Mágica: +20% resistência mágica
├── Manto de Mana: 10% dano absorvido por mana
└── Teleporte Curto: 15% evasão

Tier 2:
├── Escudo Arcano: Absorve dano = 50% INT
├── Contra-Magia: Reflete 20% dano mágico
└── Invisibilidade: 1 turno sem receber dano (CD: 5)

Tier 3:
├── Tempo Parado: Pula turno do inimigo (1x/batalha)
├── Clone Ilusório: 30% chance de desviar ataque
└── Absorção: Converte 25% dano mágico em HP

Ultimate:
└── Imunidade Arcana: 5 turnos imune a magia
```

**Árvore Utilidade (Conhecimento)**
```
Tier 1:
├── Identificar: Vê stats do inimigo
├── Sabedoria: +15% XP
└── Meditação: Recupera HP/Mana entre batalhas

Tier 2:
├── Encantamento: +20% stats de equipamento
├── Analisar Fraqueza: +25% dano ao tipo do inimigo
└── Portal: Pode fugir de qualquer batalha

Tier 3:
├── Buff de Grupo: +15% dano mágico para aliados
├── Debuff AoE: -20% defesa de todos inimigos
└── Visão Arcana: +30% chance de drop raro

Ultimate:
└── Onisciência: Sempre acerta, sempre critica por 3 turnos
```

**Árvore Ultimate (Arquimago)**
```
├── Mestre dos Elementos (10 pts): +30% dano de todos elementos
├── Reserva Infinita (10 pts): Magias não consomem mana
└── Transcendência (10 pts): Dano mágico escala com HP também
```

---

#### ARQUEIRO 🏹

**Árvore Ofensiva (Precisão)**
```
Tier 1:
├── Mira Firme: +15% precisão
├── Flecha Perfurante: Ignora 10% armadura
└── Velocidade: +1 ataque por turno

Tier 2:
├── Tiro Certeiro: +30% crítico contra inimigo sozinho
├── Chuva de Flechas: Ataca todos (70% dano)
└── Flecha Explosiva: Dano AoE em área

Tier 3:
├── Headshot: 10% chance de matar instantaneamente
├── Rajada: 5 ataques rápidos (40% dano cada)
└── Marca da Morte: Alvo recebe +50% dano por 3 turnos

Ultimate:
└── Tiro Perfeito: 1000% dano, sempre crítico, ignora defesa
```

**Árvore Defensiva (Evasão)**
```
Tier 1:
├── Reflexos: +10% evasão
├── Rolamento: Evita o primeiro ataque do turno
└── Agilidade Felina: +5 AGI

Tier 2:
├── Sombras: 25% chance de ficar invisível após evadir
├── Contra-ataque: Ao evadir, ataca de volta (50% dano)
└── Esquiva Perfeita: Evasão dobrada contra ataques críticos

Tier 3:
├── Intangível: 40% evasão por 2 turnos (CD: 5)
├── Passo das Sombras: Próximo ataque não pode ser evadido
└── Último Suspiro: Ao morrer, evade e recupera 20% HP

Ultimate:
└── Fantasma: 100% evasão por 3 turnos, não pode atacar
```

**Árvore Utilidade (Caça)**
```
Tier 1:
├── Rastreamento: +20% dano em monstros já derrotados
├── Armadilha Básica: Dano no início do turno inimigo
└── Companheiro Animal: Pet +10% stats

Tier 2:
├── Veneno: Ataques causam veneno (3% HP/turno)
├── Armadilha Explosiva: AoE no início do combate
└── Empatia Animal: Pet ataca junto (30% dano)

Tier 3:
├── Mestre Caçador: +50% dano contra bosses
├── Laço Animal: Pet não pode morrer enquanto você viver
└── Território: +30% stats se batalha for em local já visitado

Ultimate:
└── Pack Leader: Todos os pets atacam simultaneamente
```

**Árvore Ultimate (Elite)**
```
├── Olho de Águia (10 pts): Alcance infinito, +50% precisão
├── Assassino Silencioso (10 pts): Primeiro ataque sempre crítico
└── Mestre do Arco (10 pts): Ataques não podem ser bloqueados
```

---

#### PALADINO 🛡️

**Árvore Ofensiva (Luz Sagrada)**
```
Tier 1:
├── Golpe Sagrado: +15% dano contra undead/demônios
├── Luz Divina: Ataques curam 5% do dano
└── Benção: +10% dano sagrado

Tier 2:
├── Martelo da Justiça: Atordoa por 1 turno (CD: 3)
├── Chamas Sagradas: Dano contínuo sagrado
└── Julgamento: +100% dano se HP > 80%

Tier 3:
├── Ira Divina: +30% dano por aliado caído
├── Exorcismo: Dano triplo contra evil types
└── Luz Cegante: Reduz precisão inimiga em 30%

Ultimate:
└── Avatar da Luz: Dano sagrado = 300% + cura grupo 50% HP
```

**Árvore Defensiva (Proteção Divina)**
```
Tier 1:
├── Escudo da Fé: +20% defesa
├── Aura Protetora: Aliados próximos +10% defesa
└── Resistência Sagrada: +30% resistência a dark

Tier 2:
├── Intervenção: Absorve dano de um aliado
├── Escudo Divino: Imune a dano por 1 turno (CD: 5)
└── Cura Menor: Cura 20% HP (CD: 3)

Tier 3:
├── Martírio: Recebe dano no lugar de aliados
├── Santuário: Área onde aliados recebem -30% dano
└── Graça Divina: Ao morrer, revive com 50% HP (1x)

Ultimate:
└── Invulnerabilidade: Grupo imune a dano por 2 turnos
```

**Árvore Utilidade (Suporte)**
```
Tier 1:
├── Benção de Grupo: +5% todos stats aliados
├── Purificar: Remove debuffs
└── Inspiração: +10% XP para o grupo

Tier 2:
├── Aura de Cura: Grupo regenera 3% HP/turno
├── Ressurreição: Revive aliado com 30% HP
└── Benção Maior: +15% dano aliados por 5 turnos

Tier 3:
├── Proteção Divina: Aliado recebe 0 dano por 2 turnos
├── Cura em Massa: Cura 40% HP de todos aliados
└── Aura Suprema: Todos os buffs +50% efetividade

Ultimate:
└── Milagre: Cura total + remove todos debuffs + +50% stats
```

**Árvore Ultimate (Divindade)**
```
├── Campeão da Luz (10 pts): Dano sagrado ignora todas resistências
├── Imortalidade Temporária (10 pts): Não pode cair abaixo de 1 HP por 5 turnos
└── Arauto Divino (10 pts): Todas as curas +100% efetividade
```

---

## 4. Sistema de Lojas

### 4.1 Loja de Melhoria de Personagem

**Resets e Respec**
| Item | Preço | Efeito |
|------|-------|--------|
| Pergaminho de Reset de Skills | 5.000 coins | Reseta todos os skill points |
| Pergaminho de Reset de Atributos | 5.000 coins | Reseta todos os attribute points |
| Pergaminho de Reset Total | 8.000 coins | Reseta skills E atributos |
| Poção de Mudança de Classe | 25.000 coins | Volta para classe base |

**Melhorias Permanentes**
| Item | Preço | Efeito |
|------|-------|--------|
| Tomo da Sabedoria | 10.000 coins | +5 pontos de skill permanente |
| Tomo do Poder | 10.000 coins | +10 pontos de atributo permanente |
| Cristal de Evolução | 50.000 coins | Pode evoluir de classe 5 níveis antes |
| Essência de Wildcard | 100.000 coins | +5% chance de classe wildcard |

**Bônus Temporários**
| Item | Preço | Efeito |
|------|-------|--------|
| Bênção do XP | 1.000 coins | +50% XP por 24 horas |
| Bênção do Guerreiro | 2.000 coins | +20% dano por 24 horas |
| Bênção do Sobrevivente | 2.000 coins | +20% defesa por 24 horas |
| Bênção Completa | 5.000 coins | +30% todos stats por 24 horas |

### 4.2 Loja do Alquimista

**Poções Comuns (sempre disponíveis)**
| Item | Preço | Efeito |
|------|-------|--------|
| Poção de Cura Menor | 50 coins | Cura 100 HP |
| Poção de Cura | 150 coins | Cura 300 HP |
| Poção de Cura Maior | 400 coins | Cura 800 HP |
| Poção de Cura Suprema | 1.000 coins | Cura total |
| Poção de Mana | 200 coins | Restaura mana |
| Antídoto | 100 coins | Remove veneno |
| Poção de Força | 300 coins | +20% ATK por 1 batalha |
| Poção de Ferro | 300 coins | +20% DEF por 1 batalha |

**Itens Raros (aparecem aleatoriamente, refresh a cada 6 horas)**
| Item | Preço | Chance de Aparecer | Efeito |
|------|-------|-------------------|--------|
| Elixir da Vida | 5.000 coins | 10% | +100 HP máximo permanente |
| Elixir do Poder | 5.000 coins | 10% | +5 ATK permanente |
| Elixir da Proteção | 5.000 coins | 10% | +5 DEF permanente |
| Poção da Sorte | 3.000 coins | 15% | +10% drop rate por 24h |
| Essência Rara | 10.000 coins | 5% | Usado para crafting lendário |
| Lágrima de Fênix | 8.000 coins | 8% | Revive automaticamente 1x |
| Poção de Transcendência | 20.000 coins | 3% | +1 nível instantâneo |
| Cristal Temporal | 15.000 coins | 5% | Reseta cooldowns |

**Itens Lendários (aparecem muito raramente)**
| Item | Preço | Chance de Aparecer | Efeito |
|------|-------|-------------------|--------|
| Coração de Dragão | 100.000 coins | 1% | +500 HP máximo permanente |
| Lâmina Amaldiçoada | 100.000 coins | 1% | +30 ATK permanente, -50 HP máx |
| Escudo dos Deuses | 100.000 coins | 1% | +30 DEF permanente |
| Runa Antiga | 150.000 coins | 0.5% | +3 pontos de skill |
| Fragmento Dimensional | 200.000 coins | 0.3% | Garante próxima evolução wildcard |

---

## 5. Bônus de Pets e Monstros Domados

### 5.1 Tipos de Pet e Seus Bônus

**Pets Comuns**
| Pet | Bônus Passivo |
|-----|--------------|
| Lobo | +5% ATK, +3% Velocidade |
| Urso | +50 HP, +3% DEF |
| Águia | +5% Crítico, +3% Precisão |
| Cobra | +5% Veneno dmg, +3% Evasão |

**Pets Incomuns**
| Pet | Bônus Passivo |
|-----|--------------|
| Lobo Alfa | +10% ATK, +5% Velocidade |
| Urso das Cavernas | +100 HP, +7% DEF |
| Falcão Real | +10% Crítico, +5% Precisão |
| Víbora Mortal | +10% Veneno, +5% Evasão |

**Pets Raros**
| Pet | Bônus Passivo |
|-----|--------------|
| Lobo Espectral | +15% ATK, +8% Lifesteal |
| Golem de Pedra | +200 HP, +15% DEF |
| Grifo | +15% Crítico, +10% Dano Crítico |
| Hidra Menor | Ataca 2x por turno (50% dmg) |

**Pets Épicos**
| Pet | Bônus Passivo |
|-----|--------------|
| Dragão Menor | +20% ATK, +10% todos elementos |
| Elemental de Fogo | +25% Dano de Fogo, imune a fogo |
| Elemental de Gelo | +25% Dano de Gelo, imune a gelo |
| Fênix Bebê | Revive com 30% HP 1x por dia |

**Pets Lendários**
| Pet | Bônus Passivo |
|-----|--------------|
| Dragão Ancião | +30% todos stats, ataque de fogo |
| Fenix | +25% stats, revive infinito (CD: 1 dia) |
| Unicórnio | +50% cura, imune a debuffs |
| Behemoth | +500 HP, +20% DEF, +15% ATK |

### 5.2 Sinergia Classe + Pet

| Classe | Pet Ideal | Bônus de Sinergia |
|--------|-----------|-------------------|
| Guerreiro | Lobo/Urso | +10% stats do pet |
| Mago | Elemental | Magias +15% dano |
| Arqueiro | Águia/Falcão | Crítico +10% |
| Paladino | Unicórnio/Fênix | Cura +20% |
| Caçador (intermediária) | Qualquer | Pet +25% stats |
| Mestre das Feras (avançada) | Qualquer | Pet +50% stats, 2 pets ativos |

---

## 6. Bônus de Equipamentos

### 6.1 Bônus por Raridade

| Raridade | Multiplicador de Stats |
|----------|----------------------|
| Comum | 1.0x |
| Incomum | 1.3x |
| Raro | 1.7x |
| Épico | 2.2x |
| Lendário | 3.0x |

### 6.2 Bônus de Set Completo

Equipar 4+ peças do mesmo set:
- **Set Comum:** +5% stats base
- **Set Incomum:** +10% stats base, +1 habilidade passiva
- **Set Raro:** +15% stats base, +1 habilidade ativa
- **Set Épico:** +25% stats base, +2 habilidades
- **Set Lendário:** +40% stats base, +1 habilidade ultimate

### 6.3 Encantamentos

| Encantamento | Efeito | Slots |
|--------------|--------|-------|
| Vampírico | +5% Lifesteal | Arma |
| Proteção | +10% DEF | Armadura, Elmo |
| Velocidade | +10% Vel. Ataque | Botas, Luvas |
| Crítico | +5% Chance Crítica | Anel, Amuleto |
| Elemental | +15% Dano Elemental | Qualquer |
| Abençoado | +10% XP | Qualquer |

---

## 7. Implementação Técnica

### 7.1 Arquivos a Criar

```
src/
├── data/
│   ├── classes/
│   │   ├── baseClasses.ts       # Classes base
│   │   ├── intermediateClasses.ts # Classes intermediárias
│   │   ├── advancedClasses.ts   # Classes avançadas
│   │   ├── wildcardClasses.ts   # Classes wildcard
│   │   └── index.ts             # Exporta tudo
│   ├── skills/
│   │   ├── warriorSkills.ts     # Skills do guerreiro
│   │   ├── mageSkills.ts        # Skills do mago
│   │   ├── archerSkills.ts      # Skills do arqueiro
│   │   ├── paladinSkills.ts     # Skills do paladino
│   │   └── index.ts
│   ├── shops/
│   │   ├── upgradeShop.ts       # Loja de melhorias
│   │   ├── alchemistShop.ts     # Loja do alquimista
│   │   └── index.ts
│   └── petBonuses.ts            # Bônus de pets
├── database/models/
│   ├── CharacterSkills.ts       # Skills aprendidas
│   ├── CharacterAttributes.ts   # Atributos distribuídos
│   └── AlchemistInventory.ts    # Itens do alquimista
├── services/
│   ├── skillTreeService.ts      # Lógica de skill tree
│   ├── classEvolutionService.ts # Evolução de classes
│   ├── upgradeShopService.ts    # Loja de melhorias
│   └── alchemistService.ts      # Loja do alquimista
└── bot/commands/
    ├── skills.ts                # Comando /skills
    ├── atributos.ts             # Comando /atributos
    ├── evoluir.ts               # Comando /evoluir
    ├── loja-melhoria.ts         # Comando /loja melhoria
    └── alquimista.ts            # Comando /alquimista
```

### 7.2 Ordem de Implementação

1. **Fase 1: Dados**
   - Criar arquivos de dados das classes
   - Criar arquivos de skills
   - Criar dados das lojas

2. **Fase 2: Database**
   - Criar models para skills e atributos
   - Atualizar model de Character

3. **Fase 3: Services**
   - Implementar skillTreeService
   - Implementar classEvolutionService
   - Implementar serviços das lojas

4. **Fase 4: Commands**
   - Criar comandos de skills e atributos
   - Criar comando de evolução
   - Criar comandos das lojas

5. **Fase 5: Integração**
   - Integrar skills no sistema de combate
   - Integrar bônus de pets
   - Integrar encantamentos

6. **Fase 6: Testes**
   - Testar evolução de classes
   - Testar balanceamento de skills
   - Testar economia das lojas

---

## 8. Comandos do Sistema

### Comandos de Classe e Skills
```
/classe info - Ver sua classe atual e opções de evolução
/classe evoluir - Evoluir para próxima classe
/skills ver - Ver sua skill tree
/skills aprender <skill> - Aprender uma skill
/skills reset - Resetar skills (requer item)
/atributos ver - Ver seus atributos
/atributos distribuir <atributo> <quantidade> - Distribuir pontos
/atributos reset - Resetar atributos (requer item)
```

### Comandos de Loja
```
/loja melhoria - Abre loja de melhorias
/alquimista - Abre loja do alquimista
/alquimista raros - Ver itens raros disponíveis
/usar <item> - Usar um item consumível
```

---

## Resumo de Números

| Sistema | Quantidade |
|---------|-----------|
| Classes Base | 4 |
| Classes Intermediárias | 8 + 2 wildcard = 10 |
| Classes Avançadas | 16 + 4 wildcard = 20 |
| Skills por Classe Base | ~40 |
| Total de Skills | ~160+ |
| Itens na Loja de Melhoria | 12 |
| Itens Comuns do Alquimista | 8 |
| Itens Raros do Alquimista | 8 |
| Itens Lendários do Alquimista | 5 |
| Tipos de Pet | 20+ |
| Encantamentos | 6 |
