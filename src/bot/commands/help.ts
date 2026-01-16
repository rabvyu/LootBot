import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

const HELP_CATEGORIES = {
  inicio: {
    title: '🚀 Começando',
    description: 'Primeiros passos no bot',
    content: `**Bem-vindo ao LootBot!** 🎮

Este bot transforma seu servidor em um RPG completo com gamificação!

**Como ganhar XP:**
• 💬 Enviando mensagens (1-5 XP, cooldown 60s)
• 🎙️ Ficando em call de voz (1 XP/min por pessoa)
• 😀 Dando/recebendo reações
• 📅 Coletando recompensa diária (\`/daily\`)

**Comandos essenciais:**
• \`/rank\` - Ver seu nível e XP
• \`/profile\` - Ver seu perfil completo
• \`/daily\` - Coletar recompensa diária
• \`/badges\` - Ver suas badges
• \`/inventory\` - Ver seu inventário
• \`/tutorial\` - Tutorial interativo completo

**Dica:** Mantenha uma streak diária para ganhar bônus!
Use \`/tutorial\` para um guia passo a passo!`,
  },
  economia: {
    title: '💰 Economia',
    description: 'Coins, loja e transferências',
    content: `**Sistema de Economia** 💰

**Como ganhar coins:**
• 📅 \`/daily\` - 100-500 coins por dia
• ⚔️ Batalhas no RPG e Dungeons
• 🎣 Pescando e vendendo peixes
• 🎰 Jogos do cassino
• 📦 Expedições
• 🐾 Pets geram coins passivamente
• 🏪 Vendendo no mercado

**Comandos:**
• \`/saldo\` - Ver seu saldo
• \`/loja\` - Ver itens à venda
• \`/comprar <item>\` - Comprar item
• \`/transferir @user <valor>\` - Enviar coins
• \`/catalogo\` - Ver todos os itens
• \`/mercado\` - Mercado entre jogadores

**Dica:** Use \`/recursos vender-tudo\` para vender recursos rapidamente!`,
  },
  rpg: {
    title: '⚔️ RPG Combat',
    description: 'Personagens, classes e batalhas',
    content: `**Sistema de RPG** ⚔️

**Classes disponíveis:**
• ⚔️ **Guerreiro** - HP alto, defesa média
• 🔮 **Mago** - Dano mágico alto, vida baixa
• 🏹 **Arqueiro** - Alto crítico, balanceado
• 🛡️ **Paladino** - Defesa máxima, cura
• 🗡️ **Assassino** - Dano crítico extremo
• 🧙 **Necromante** - Invoca minions

**Comandos básicos:**
• \`/rpg criar <nome>\` - Criar personagem
• \`/rpg status\` - Ver seu personagem
• \`/rpg batalhar <id>\` - Lutar contra monstro
• \`/rpg curar\` - Curar personagem
• \`/rpg ranking\` - Ver ranking

**Comandos avançados:**
• \`/rpg skills\` - Ver habilidades
• \`/rpg equipar <slot> <item>\` - Equipar item
• \`/rpg desequipar <slot>\` - Remover equipamento
• \`/rpg stats\` - Ver estatísticas detalhadas

**Dica:** Suba de nível para desbloquear novas skills!`,
  },
  equipamentos: {
    title: '🛡️ Equipamentos',
    description: 'Armas, armaduras e acessórios',
    content: `**Sistema de Equipamentos** 🛡️

**Slots de equipamento:**
• ⚔️ **Arma** - Aumenta dano
• 🛡️ **Escudo** - Aumenta defesa
• 🪖 **Capacete** - Bônus de HP
• 👕 **Armadura** - Defesa principal
• 👖 **Calças** - Defesa secundária
• 👢 **Botas** - Velocidade/Evasão
• 💍 **Anel** - Bônus especiais
• 📿 **Amuleto** - Bônus mágicos

**Raridades:**
• ⚪ Comum | 🟢 Incomum | 🔵 Raro
• 🟣 Épico | 🟠 Lendário | 🔴 Mítico

**Comandos:**
• \`/inventory equipamentos\` - Ver equipamentos
• \`/rpg equipar <slot> <id>\` - Equipar item
• \`/rpg desequipar <slot>\` - Remover item
• \`/mercado buscar equipamento\` - Comprar

**Dica:** Equipamentos míticos têm efeitos especiais únicos!`,
  },
  skills: {
    title: '✨ Habilidades',
    description: 'Skills ativas e passivas',
    content: `**Sistema de Habilidades** ✨

**Tipos de skill:**
• ⚔️ **Ativas** - Use em batalha
• 🛡️ **Passivas** - Sempre ativas
• 🔥 **Ultimate** - Super poderosas

**Desbloqueio:**
• Nível 5: Skill básica da classe
• Nível 10: Segunda skill
• Nível 20: Terceira skill
• Nível 30: Skill passiva
• Nível 50: Ultimate

**Comandos:**
• \`/rpg skills\` - Ver suas habilidades
• \`/rpg skill usar <id>\` - Usar skill em batalha
• \`/rpg skill info <id>\` - Detalhes da skill

**Exemplos por classe:**
• Guerreiro: Golpe Devastador, Provocar
• Mago: Bola de Fogo, Nevasca
• Arqueiro: Flecha Perfurante, Chuva de Flechas

**Dica:** Skills ultimate têm cooldown longo mas são muito fortes!`,
  },
  dungeons: {
    title: '🏰 Dungeons',
    description: 'Dungeons cooperativas em grupo',
    content: `**Sistema de Dungeons** 🏰

Dungeons são aventuras em grupo com waves de monstros e boss!

**Dungeons disponíveis:**
• 🌲 **Floresta** - Nível 10+ (fácil)
• 🦇 **Caverna** - Nível 20+ (médio)
• 🏛️ **Ruínas** - Nível 35+ (difícil)
• 🌋 **Vulcão** - Nível 50+ (muito difícil)
• 🕳️ **Abismo** - Nível 70+ (extremo)

**Dificuldades:**
• Normal (1x loot)
• Hard (1.5x loot)
• Expert (2x loot)
• Nightmare (3x loot)

**Comandos:**
• \`/dungeon criar <tipo> <dificuldade>\` - Criar run
• \`/dungeon entrar <id>\` - Entrar em run
• \`/dungeon iniciar\` - Começar (líder)
• \`/dungeon status\` - Ver progresso
• \`/dungeon atacar\` - Atacar na wave

**Recompensas:**
• XP, Coins, Equipamentos, Materiais raros

**Dica:** Monte um grupo equilibrado (tank, dps, healer)!`,
  },
  raids: {
    title: '🐉 Raids',
    description: 'Batalhas épicas contra world bosses',
    content: `**Sistema de Raids** 🐉

Raids são batalhas massivas contra bosses lendários!

**Raids disponíveis:**
• 🐉 **Covil do Dragão** - Nível 50+
• 👹 **Fortaleza Demoníaca** - Nível 70+
• 🌌 **Nexus Dimensional** - Nível 90+

**Mecânicas:**
• Múltiplas fases por boss
• Mecânicas especiais por fase
• Enrage timer (DPS check)
• Lockout semanal

**Comandos:**
• \`/raid criar <tipo>\` - Criar raid
• \`/raid entrar <id>\` - Entrar em raid
• \`/raid iniciar\` - Começar
• \`/raid status\` - Ver progresso
• \`/raid atacar\` - Atacar boss

**Recompensas:**
• Equipamentos lendários/míticos
• Materiais únicos
• Badges exclusivas
• Títulos de raid

**Dica:** Raids resetam toda segunda-feira!`,
  },
  party: {
    title: '👥 Party',
    description: 'Sistema de grupos',
    content: `**Sistema de Party** 👥

Forme grupos para dungeons e raids!

**Limites:**
• Dungeon: 2-4 jogadores
• Raid: 5-10 jogadores

**Papéis:**
• 🛡️ **Tank** - Aguenta dano
• ⚔️ **DPS** - Causa dano
• 💚 **Healer** - Cura aliados
• 🎯 **Support** - Buffs/Debuffs

**Comandos:**
• \`/party criar\` - Criar grupo
• \`/party convidar @user\` - Convidar
• \`/party aceitar <id>\` - Aceitar convite
• \`/party sair\` - Sair do grupo
• \`/party listar\` - Ver membros
• \`/party kick @user\` - Expulsar (líder)
• \`/party transferir @user\` - Passar liderança

**Bônus de party:**
• +10% XP quando em grupo
• Loot compartilhado
• Combos de habilidades

**Dica:** Um grupo balanceado é essencial para raids!`,
  },
  pets: {
    title: '🐾 Pets',
    description: 'Adote pets que geram coins',
    content: `**Sistema de Pets** 🐾

Pets geram coins passivamente e ajudam em batalhas!

**Raridades e geração:**
• 🟢 Comum - 2-5 coins/hora
• 🔵 Incomum - 8-12 coins/hora
• 🟣 Raro - 15-20 coins/hora
• 🟡 Épico - 25-35 coins/hora
• 🔴 Lendário - 50+ coins/hora

**Comandos:**
• \`/pet loja\` - Ver pets à venda
• \`/pet comprar <id>\` - Comprar pet
• \`/pet meus\` - Ver seus pets
• \`/pet ativar <id>\` - Ativar um pet
• \`/pet alimentar <id>\` - Alimentar
• \`/pet coletar\` - Coletar coins
• \`/pet treinar <id>\` - Treinar pet
• \`/pet info <id>\` - Ver detalhes

**Ovos de pet:**
• Crie com crafting
• Chance de raridades maiores
• Pets exclusivos de ovos

**Dica:** Pets lendários podem ajudar em batalhas!`,
  },
  expedicoes: {
    title: '🗺️ Expedições',
    description: 'Missões automáticas',
    content: `**Sistema de Expedições** 🗺️

Envie expedições que coletam recursos automaticamente!

**Locais disponíveis:**
• 🌲 Floresta - 30min (fácil)
• 🦇 Caverna - 1h (médio)
• 🏛️ Ruínas - 2h (médio)
• 🐊 Pântano - 3h (difícil)
• 🌋 Vulcão - 4h (muito difícil)
• 🏰 Dungeon - 6h (extremo)
• 🕳️ Abismo - 8h (impossível)

**Comandos:**
• \`/expedicao lista\` - Ver expedições
• \`/expedicao iniciar <id>\` - Iniciar
• \`/expedicao status\` - Ver ativa
• \`/expedicao resgatar\` - Coletar

**Recompensas:**
• Recursos (madeira, pedra, ferro, etc.)
• Coins
• Chance de itens raros

**Dica:** Expedições mais longas dão mais recompensas!`,
  },
  recursos: {
    title: '🎣 Pesca & Recursos',
    description: 'Coleta e gerenciamento',
    content: `**Pesca & Recursos** 🎣

**Pescaria:**
• \`/pescar\` - Pescar (cooldown 30min)
• Peixes de várias raridades
• Peixes lendários valem até 1000 coins!

**Tipos de recursos:**
• 🪵 Madeira - Crafting básico
• 🪨 Pedra - Construção
• ⚙️ Ferro - Equipamentos
• 🥇 Ouro - Itens valiosos
• 💎 Diamante - Itens raros
• ✨ Essência - Itens especiais
• 🐟 Peixes - Venda/Crafting

**Comandos:**
• \`/pescar\` - Pescar
• \`/recursos ver\` - Ver seus recursos
• \`/recursos vender <id> <qtd>\` - Vender
• \`/recursos vender-tudo\` - Vender todos
• \`/recursos lista\` - Lista completa

**Dica:** Use iscas especiais para peixes raros!`,
  },
  crafting: {
    title: '🔨 Crafting',
    description: 'Criação de itens',
    content: `**Sistema de Crafting** 🔨

Transforme recursos em itens valiosos!

**Categorias:**
• 🔧 **Materiais** - Refinar recursos
• 🧪 **Consumíveis** - Poções de XP/HP
• 🛠️ **Ferramentas** - Varas, picaretas
• 🥚 **Especiais** - Ovos de pet
• ⚔️ **Equipamentos** - Armas/armaduras

**Níveis de crafting:**
• Iniciante (1-10) - Receitas básicas
• Aprendiz (11-25) - Receitas médias
• Artesão (26-50) - Receitas avançadas
• Mestre (51-75) - Receitas raras
• Grão-Mestre (76-100) - Receitas lendárias

**Comandos:**
• \`/crafting receitas\` - Ver receitas
• \`/crafting info <id>\` - Detalhes
• \`/crafting criar <id>\` - Criar item
• \`/crafting stats\` - Suas estatísticas

**Dica:** Nível de crafting aumenta qualidade dos itens!`,
  },
  clas: {
    title: '🏰 Clãs',
    description: 'Guilds e comunidades',
    content: `**Sistema de Clãs** 🏰

Una-se a outros jogadores em um clã!

**Cargos:**
• 👑 Líder - Controle total
• ⭐ Vice-Líder - Promover/expulsar
• 🔹 Ancião - Ajudante
• • Membro - Participante

**Benefícios de clã:**
• Banco compartilhado
• Bônus de XP em grupo
• Guerras de clãs
• Missões de clã
• Ranking de clãs

**Comandos:**
• \`/clan criar <nome> <tag>\` - Criar (5000 coins)
• \`/clan info\` - Ver seu clã
• \`/clan listar\` - Ver clãs públicos
• \`/clan entrar <id>\` - Entrar
• \`/clan membros\` - Ver membros
• \`/clan contribuir <valor>\` - Doar
• \`/clan ranking\` - Ranking de clãs
• \`/clan guerra\` - Sistema de guerras

**Comandos de líder:**
• \`/clan promover/rebaixar/expulsar @user\`

**Dica:** Clãs de nível alto têm bônus maiores!`,
  },
  cassino: {
    title: '🎰 Cassino',
    description: 'Jogos de aposta',
    content: `**Cassino** 🎰

Aposte seus coins e tente a sorte!

**Jogos disponíveis:**
• 🪙 **Coinflip** - Cara/Coroa (1.9x)
• 🎲 **Dados** - Maior que a casa (1.9x)
• 🎰 **Slots** - 3 símbolos (1.5x-10x)
• 🎡 **Roleta** - Cor/Número (2x-35x)
• 📈 **Crash** - Saia a tempo (1.1x-10x)
• ⬆️ **Maior/Menor** - Adivinhe (1.9x-5x)
• 🃏 **Blackjack** - 21 (2x)

**Comandos:**
• \`/cassino coinflip <aposta> <escolha>\`
• \`/cassino dados <aposta>\`
• \`/cassino slots <aposta>\`
• \`/cassino roleta <aposta> <tipo>\`
• \`/cassino crash <aposta> <mult>\`
• \`/cassino blackjack <aposta>\`
• \`/cassino ajuda\` - Ver todos

**Limites:** 10 - 50.000 coins por aposta

⚠️ **Jogue com responsabilidade!**`,
  },
  missoes: {
    title: '📋 Missões',
    description: 'Objetivos e recompensas',
    content: `**Sistema de Missões** 📋

Complete objetivos para ganhar recompensas!

**Tipos de missão:**
• 📅 **Diárias** - Resetam às 00h
• 📆 **Semanais** - Resetam segunda
• 🏆 **Achievements** - Permanentes
• 🎯 **Eventos** - Tempo limitado

**Exemplos:**
• Enviar 50 mensagens
• Ficar 30min em call
• Vencer 5 batalhas
• Pescar 10 peixes
• Completar 1 dungeon
• Doar para o clã

**Comandos:**
• \`/missoes lista\` - Ver disponíveis
• \`/missoes ativas\` - Ver progresso
• \`/missoes resgatar\` - Coletar
• \`/missoes historico\` - Histórico

**Recompensas:**
• XP, Coins, Itens, Badges

**Dica:** Missões de clã dão recompensas para todos!`,
  },
  badges: {
    title: '🏅 Badges & Títulos',
    description: 'Conquistas e customização',
    content: `**Badges & Títulos** 🏅

**Tipos de badges (182 total):**
• 📊 Progressão - Por nível
• ⏰ Tempo - Por permanência
• 🎯 Conquistas - Por feitos
• ⚔️ RPG - Por batalhas
• 💰 Economia - Por coins
• 🤝 Social - Por interações
• 🏆 Campeonatos - Por competições
• 🔧 Hardware - Por setup
• 🖨️ 3D Print - Por impressão
• 🎨 Modding - Por customização
• ⭐ Especiais - Exclusivas

**Títulos:**
• Desbloqueie com badges
• Compre na loja
• Ganhe em eventos
• Aparecem no perfil

**Comandos:**
• \`/badges\` - Ver suas badges
• \`/badges catalogo\` - Todas disponíveis
• \`/titulos lista\` - Ver títulos
• \`/titulos equipar <id>\` - Equipar
• \`/titulos meus\` - Seus títulos

**Dica:** Badges lendárias anunciam no servidor!`,
  },
  prestige: {
    title: '⭐ Prestígio',
    description: 'Sistema de reset com bônus',
    content: `**Sistema de Prestígio** ⭐

Resete seu progresso para ganhar bônus permanentes!

**Requisitos:**
• Nível 100 para primeiro prestígio
• Cada prestígio aumenta requisito

**Bônus por prestígio:**
• +5% XP permanente
• +5% Coins permanente
• Badges exclusivas
• Títulos especiais
• Slots de pet extras
• Desconto na loja

**O que reseta:**
• Nível e XP
• Alguns recursos

**O que mantém:**
• Badges conquistadas
• Pets
• Títulos
• Equipamentos lendários+
• Bônus de prestígio anterior

**Comandos:**
• \`/prestige info\` - Ver informações
• \`/prestige confirmar\` - Fazer prestígio
• \`/prestige ranking\` - Ranking de prestígio

**Dica:** Planeje seu prestígio para máximo benefício!`,
  },
  housing: {
    title: '🏠 Housing',
    description: 'Sistema de casas',
    content: `**Sistema de Housing** 🏠

Tenha sua própria casa no servidor!

**Tipos de casa:**
• 🏚️ Cabana - Básica (grátis)
• 🏠 Casa - Média (5.000 coins)
• 🏡 Mansão - Grande (25.000 coins)
• 🏰 Castelo - Épica (100.000 coins)

**Benefícios:**
• Armazenamento extra
• Geração passiva de recursos
• Decorações exibidas no perfil
• Bônus de descanso (XP)
• Visitas de outros jogadores

**Comandos:**
• \`/house info\` - Ver sua casa
• \`/house comprar <tipo>\` - Comprar
• \`/house upgrade\` - Melhorar
• \`/house decorar\` - Decorar
• \`/house visitar @user\` - Visitar

**Móveis e decorações:**
• Aumentam bônus da casa
• Compre na loja de móveis
• Crie com crafting

**Dica:** Casas maiores geram mais recursos!`,
  },
  autobattle: {
    title: '🤖 Auto-Battle',
    description: 'Farming automático',
    content: `**Sistema de Auto-Battle** 🤖

Configure farming automático enquanto está offline!

**Tipos de farming:**
• 🏰 Dungeon - Farm de dungeons
• ⚔️ Arena - Farm de PvP
• ⛏️ Mineração - Farm de recursos
• 🎣 Pesca - Farm de peixes
• 🗼 Torre - Desafio infinito

**Configurações:**
• Local alvo
• Dificuldade
• Máximo de runs
• Duração máxima
• Parar em HP baixo
• Auto-vender loot

**Comandos:**
• \`/autobattle config\` - Configurar
• \`/autobattle iniciar\` - Começar sessão
• \`/autobattle status\` - Ver progresso
• \`/autobattle parar\` - Parar sessão
• \`/autobattle historico\` - Ver histórico

**Limites:**
• 50 runs por dia
• 500 energia por dia
• Requer nível 20+

**Dica:** Configure loot settings para maximizar lucro!`,
  },
  mercado: {
    title: '🏪 Mercado',
    description: 'Comércio entre jogadores',
    content: `**Sistema de Mercado** 🏪

Compre e venda itens com outros jogadores!

**Tipos de listagem:**
• 💰 Venda direta - Preço fixo
• 🔨 Leilão - Lance mínimo

**O que pode vender:**
• Equipamentos
• Recursos
• Consumíveis
• Pets (alguns)
• Materiais de crafting

**Comandos:**
• \`/mercado buscar <item>\` - Buscar
• \`/mercado listar\` - Ver suas listagens
• \`/mercado vender <item> <preço>\` - Vender
• \`/mercado leilao <item> <lance>\` - Leiloar
• \`/mercado comprar <id>\` - Comprar
• \`/mercado lance <id> <valor>\` - Dar lance
• \`/mercado cancelar <id>\` - Cancelar

**Taxa:** 5% sobre vendas

**Dica:** Verifique preços antes de vender!`,
  },
  favoritos: {
    title: '⭐ Favoritos',
    description: 'Acesso rápido',
    content: `**Sistema de Favoritos** ⭐

Salve comandos e itens favoritos para acesso rápido!

**O que pode favoritar:**
• Comandos frequentes
• Itens do inventário
• Equipamentos
• Receitas de crafting
• Locais de expedição
• Monstros para farm

**Comandos:**
• \`/favoritos lista\` - Ver favoritos
• \`/favoritos add <tipo> <id>\` - Adicionar
• \`/favoritos remover <id>\` - Remover
• \`/favoritos usar <id>\` - Usar favorito

**Atalhos:**
• Até 10 favoritos
• Acesso com 1 clique
• Organização por categoria

**Dica:** Favorite seu combo de farm diário!`,
  },
  notificacoes: {
    title: '🔔 Notificações',
    description: 'Alertas e avisos',
    content: `**Sistema de Notificações** 🔔

Configure quais alertas você quer receber!

**Tipos de notificação:**
• 📈 Level up
• 🏅 Badge conquistada
• 📅 Daily disponível
• 📦 Expedição completa
• 🐾 Pet com fome
• ⚔️ Dungeon/Raid pronta
• 💰 Venda no mercado
• 🎯 Missão completa
• 🏰 Notícias do clã

**Comandos:**
• \`/notificacoes ver\` - Ver configurações
• \`/notificacoes toggle <tipo>\` - Ativar/desativar
• \`/notificacoes dm\` - Receber por DM
• \`/notificacoes canal\` - Receber no canal

**Preferências:**
• Notificações por DM
• Notificações no canal
• Resumo diário
• Modo silencioso

**Dica:** Ative notificação de daily para não perder streak!`,
  },
  perfil: {
    title: '👤 Perfil',
    description: 'Customização do perfil',
    content: `**Customização de Perfil** 👤

Personalize como seu perfil aparece!

**Opções de customização:**
• 🎨 Cor do embed
• 📝 Bio/descrição
• 🏷️ Título exibido
• 🏅 Badges em destaque
• 📊 Stats visíveis
• 🔒 Perfil privado

**Comandos:**
• \`/profile\` - Ver seu perfil
• \`/profile @user\` - Ver perfil de outro
• \`/perfil-config cor <hex>\` - Mudar cor
• \`/perfil-config bio <texto>\` - Mudar bio
• \`/perfil-config titulo <id>\` - Equipar título
• \`/perfil-config privado\` - Tornar privado
• \`/perfil-config stats\` - Toggle de stats

**Dica:** Um perfil bonito impressiona outros jogadores!`,
  },
  ranking: {
    title: '🏆 Rankings',
    description: 'Leaderboards e competição',
    content: `**Sistema de Rankings** 🏆

Compete pelos primeiros lugares!

**Rankings disponíveis:**
• 📊 XP Total
• 💰 Coins
• ⚔️ Nível de RPG
• 🏰 Dungeons completadas
• 🐉 Raids completadas
• 🎣 Peixes pescados
• 🔨 Itens craftados
• 🏆 Achievements
• 👥 Clãs

**Períodos:**
• 📅 Diário
• 📆 Semanal
• 📅 Mensal
• ♾️ Geral (all-time)

**Comandos:**
• \`/leaderboard\` - Top 10 geral
• \`/leaderboard <tipo>\` - Ranking específico
• \`/rank\` - Sua posição
• \`/clan ranking\` - Ranking de clãs

**Recompensas:**
• Top 1 semanal: Badge especial
• Top 3 mensal: Títulos exclusivos
• Top 10: Bônus de XP

**Dica:** Mantenha atividade consistente para subir no rank!`,
  },
  inventario: {
    title: '🎒 Inventário',
    description: 'Gerenciamento de itens',
    content: `**Sistema de Inventário** 🎒

Gerencie todos seus itens!

**Categorias:**
• ⚔️ Equipamentos
• 🧪 Consumíveis
• 📦 Recursos
• 🎣 Peixes
• 🥚 Ovos
• 🔧 Materiais
• 📜 Receitas
• 🎫 Tickets

**Comandos:**
• \`/inventory\` - Ver inventário
• \`/inventory <categoria>\` - Ver categoria
• \`/inventory usar <id>\` - Usar item
• \`/inventory descartar <id>\` - Descartar
• \`/inventory ordenar\` - Organizar
• \`/inventory buscar <nome>\` - Buscar item

**Limite de slots:**
• Padrão: 100 slots
• Expansão: +50 por upgrade
• Casa: +storage adicional

**Dica:** Organize por raridade para encontrar fácil!`,
  },
  admin: {
    title: '⚙️ Admin',
    description: 'Comandos administrativos',
    content: `**Comandos Admin** ⚙️

Apenas para administradores do servidor!

**Gerenciamento de usuários:**
• \`/give-xp @user <qtd>\` - Dar XP
• \`/remove-xp @user <qtd>\` - Remover XP
• \`/give-coins @user <qtd>\` - Dar coins
• \`/give-badge @user <badge>\` - Dar badge
• \`/remove-badge @user <badge>\` - Remover
• \`/reset-user @user\` - Resetar tudo
• \`/logs @user\` - Ver atividade

**Configurações:**
• \`/config\` - Configurar bot
• \`/level-roles\` - Cargos por nível
• \`/shop-manage\` - Gerenciar loja

**Eventos:**
• \`/event-manage criar\` - Criar evento
• \`/event-manage ativar/desativar\`
• \`/event-manage meta\` - Meta comunitária

**Utilitários:**
• \`/check-badges @user\` - Verificar badges
• \`/test-xp @user <qtd>\` - Testar XP
• \`/backup\` - Backup de dados
• \`/announce\` - Anúncio do bot`,
  },
};

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Central de ajuda completa do bot')
  .addStringOption(opt =>
    opt
      .setName('categoria')
      .setDescription('Categoria específica de ajuda')
      .setRequired(false)
      .addChoices(
        { name: '🚀 Começando', value: 'inicio' },
        { name: '💰 Economia', value: 'economia' },
        { name: '⚔️ RPG Combat', value: 'rpg' },
        { name: '🛡️ Equipamentos', value: 'equipamentos' },
        { name: '✨ Habilidades', value: 'skills' },
        { name: '🏰 Dungeons', value: 'dungeons' },
        { name: '🐉 Raids', value: 'raids' },
        { name: '👥 Party', value: 'party' },
        { name: '🐾 Pets', value: 'pets' },
        { name: '🗺️ Expedições', value: 'expedicoes' },
        { name: '🎣 Pesca & Recursos', value: 'recursos' },
        { name: '🔨 Crafting', value: 'crafting' },
        { name: '🏰 Clãs', value: 'clas' },
        { name: '🎰 Cassino', value: 'cassino' },
        { name: '📋 Missões', value: 'missoes' },
        { name: '🏅 Badges & Títulos', value: 'badges' },
        { name: '⭐ Prestígio', value: 'prestige' },
        { name: '🏠 Housing', value: 'housing' },
        { name: '🤖 Auto-Battle', value: 'autobattle' },
        { name: '🏪 Mercado', value: 'mercado' },
        { name: '⭐ Favoritos', value: 'favoritos' },
        { name: '🔔 Notificações', value: 'notificacoes' },
        { name: '👤 Perfil', value: 'perfil' },
        { name: '🏆 Rankings', value: 'ranking' },
        { name: '🎒 Inventário', value: 'inventario' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const categoria = interaction.options.getString('categoria');

  if (categoria) {
    await showCategory(interaction, categoria);
    return;
  }

  await showMainMenu(interaction);
}

async function showMainMenu(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('📚 Central de Ajuda - LootBot')
    .setDescription(
      '**Bem-vindo ao LootBot!** 🎮\n\n' +
      'O bot de RPG e gamificação mais completo para Discord!\n\n' +
      '**Sistemas principais:**\n' +
      '• 📊 XP, Níveis e Badges (182 badges!)\n' +
      '• 💰 Economia completa com mercado\n' +
      '• ⚔️ RPG com 6 classes e skills\n' +
      '• 🏰 Dungeons cooperativas\n' +
      '• 🐉 Raids com mecânicas complexas\n' +
      '• 🐾 Pets que geram coins\n' +
      '• 🔨 Sistema de crafting\n' +
      '• 🏠 Housing com decorações\n' +
      '• 🎰 Cassino com 7 jogos\n' +
      '• ⭐ Sistema de prestígio\n\n' +
      '**Novo aqui?** Use `/tutorial` para começar!\n\n' +
      '**Selecione uma categoria abaixo:**'
    )
    .setColor('#5865F2')
    .setThumbnail(interaction.client.user?.displayAvatarURL() || '')
    .addFields(
      { name: '🎮 Gameplay', value: '`RPG` `Dungeons` `Raids` `Party`', inline: true },
      { name: '💰 Economia', value: '`Coins` `Loja` `Mercado` `Cassino`', inline: true },
      { name: '📦 Coleta', value: '`Expedições` `Pesca` `Crafting`', inline: true },
      { name: '🐾 Companheiros', value: '`Pets` `Clãs` `Party`', inline: true },
      { name: '🏆 Progressão', value: '`Badges` `Títulos` `Prestígio`', inline: true },
      { name: '⚙️ Outros', value: '`Housing` `Favoritos` `Config`', inline: true }
    )
    .setFooter({ text: 'Use /help <categoria> ou selecione no menu • /tutorial para onboarding' });

  // Split categories into pages for the select menu (max 25 options)
  const categoryKeys = Object.keys(HELP_CATEGORIES);
  const mainCategories = categoryKeys.slice(0, 25);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('🔍 Escolha uma categoria...')
    .addOptions(
      mainCategories.map(key => {
        const cat = HELP_CATEGORIES[key as keyof typeof HELP_CATEGORIES];
        return {
          label: cat.title,
          description: cat.description.substring(0, 50),
          value: key,
          emoji: cat.title.split(' ')[0],
        };
      })
    );

  const tutorialButton = new ButtonBuilder()
    .setCustomId('help_tutorial')
    .setLabel('📖 Tutorial Completo')
    .setStyle(ButtonStyle.Primary);

  const quickStartButton = new ButtonBuilder()
    .setCustomId('help_quickstart')
    .setLabel('⚡ Início Rápido')
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(tutorialButton, quickStartButton);

  const response = await interaction.reply({
    embeds: [embed],
    components: [row1, row2],
    fetchReply: true,
  });

  try {
    const collector = response.createMessageComponentCollector({
      time: 300000, // 5 minutes
    });

    collector.on('collect', async (componentInteraction) => {
      if (componentInteraction.user.id !== interaction.user.id) {
        await componentInteraction.reply({
          content: '❌ Este menu não é seu! Use `/help` para abrir o seu.',
          ephemeral: true,
        });
        return;
      }

      if (componentInteraction.isStringSelectMenu()) {
        const selectedCategory = componentInteraction.values[0];
        const category = HELP_CATEGORIES[selectedCategory as keyof typeof HELP_CATEGORIES];

        if (!category) return;

        const categoryEmbed = new EmbedBuilder()
          .setTitle(category.title)
          .setDescription(category.content)
          .setColor('#5865F2')
          .setFooter({ text: 'Use o menu para ver outras categorias • /tutorial para onboarding' });

        await componentInteraction.update({
          embeds: [categoryEmbed],
          components: [row1, row2],
        });
      } else if (componentInteraction.isButton()) {
        if (componentInteraction.customId === 'help_tutorial') {
          const tutorialEmbed = new EmbedBuilder()
            .setTitle('📖 Tutorial - Primeiros Passos')
            .setDescription(
              '**Passo 1: Crie seu personagem**\n' +
              '```/rpg criar <nome>```\n' +
              'Escolha uma das 6 classes disponíveis!\n\n' +
              '**Passo 2: Colete sua recompensa diária**\n' +
              '```/daily```\n' +
              'Ganhe XP e coins todos os dias!\n\n' +
              '**Passo 3: Comece a batalhar**\n' +
              '```/rpg batalhar slime```\n' +
              'Derrote monstros para ganhar XP e loot!\n\n' +
              '**Passo 4: Explore o sistema**\n' +
              '• `/pescar` - Pesque para ganhar recursos\n' +
              '• `/expedicao iniciar floresta` - Envie expedições\n' +
              '• `/pet loja` - Compre um pet\n' +
              '• `/crafting receitas` - Crie itens\n\n' +
              '**Passo 5: Entre em um clã**\n' +
              '```/clan listar```\n' +
              'Jogue com outros membros!\n\n' +
              '**Dica:** Use `/tutorial` para um guia interativo completo!'
            )
            .setColor('#00FF00')
            .setFooter({ text: 'Use /tutorial para o guia interativo completo' });

          await componentInteraction.update({
            embeds: [tutorialEmbed],
            components: [row1, row2],
          });
        } else if (componentInteraction.customId === 'help_quickstart') {
          const quickstartEmbed = new EmbedBuilder()
            .setTitle('⚡ Início Rápido')
            .setDescription(
              '**Comandos essenciais para começar AGORA:**\n\n' +
              '```\n' +
              '/daily          → Coins + XP grátis\n' +
              '/rpg criar      → Criar personagem\n' +
              '/rpg batalhar   → Lutar e ganhar XP\n' +
              '/pescar         → Pegar peixes\n' +
              '/rank           → Ver seu nível\n' +
              '/profile        → Ver seu perfil\n' +
              '/badges         → Ver conquistas\n' +
              '/inventory      → Ver itens\n' +
              '```\n\n' +
              '**Como ganhar XP:**\n' +
              '• 💬 Envie mensagens\n' +
              '• 🎙️ Fique em calls de voz\n' +
              '• 📅 Use `/daily` todo dia\n' +
              '• ⚔️ Batalhe no RPG\n\n' +
              '**Próximos passos:**\n' +
              '• Compre um pet (`/pet loja`)\n' +
              '• Entre em um clã (`/clan listar`)\n' +
              '• Faça dungeons (`/dungeon criar`)'
            )
            .setColor('#FFD700')
            .setFooter({ text: 'Boa sorte, aventureiro!' });

          await componentInteraction.update({
            embeds: [quickstartEmbed],
            components: [row1, row2],
          });
        }
      }
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {
        // Message may have been deleted
      }
    });
  } catch {
    // Interaction may have expired
  }
}

async function showCategory(interaction: ChatInputCommandInteraction, categoryKey: string) {
  const category = HELP_CATEGORIES[categoryKey as keyof typeof HELP_CATEGORIES];

  if (!category) {
    await interaction.reply({
      content: '❌ Categoria não encontrada. Use `/help` para ver todas as categorias.',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(category.title)
    .setDescription(category.content)
    .setColor('#5865F2')
    .setFooter({ text: 'Use /help para ver todas as categorias • /tutorial para onboarding' });

  await interaction.reply({ embeds: [embed] });
}
