import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { COLORS } from '../../utils/constants';

// Tutorial steps for the interactive onboarding
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: '🎮 Bem-vindo ao LootBot!',
    description: `**Olá, aventureiro!**

Este tutorial vai te guiar pelos primeiros passos no bot de gamificação mais completo do Discord!

**O que você vai aprender:**
• Como ganhar XP e subir de nível
• Como usar o sistema de economia
• Como criar seu personagem de RPG
• Como participar de dungeons e raids
• E muito mais!

**Dica:** Este tutorial é interativo! Use os botões abaixo para navegar.

Clique em **Próximo** para começar!`,
    image: null,
  },
  {
    id: 'xp_system',
    title: '📊 Sistema de XP e Níveis',
    description: `**Como ganhar XP:**

💬 **Mensagens** (1-5 XP)
• Envie mensagens no servidor
• Cooldown de 60 segundos
• Mínimo 3 caracteres

🎙️ **Voz** (1 XP/min por pessoa)
• Fique em calls de voz
• Precisa ter 2+ pessoas
• Não conta em canal AFK

😀 **Reações** (1-2 XP)
• Dê reações: +1 XP
• Receba reações: +2 XP

📅 **Daily** (50+ XP)
• Use \`/daily\` todo dia
• Mantém streak para bônus

**Comandos úteis:**
• \`/rank\` - Ver seu nível
• \`/leaderboard\` - Ver ranking`,
    image: null,
  },
  {
    id: 'economy',
    title: '💰 Sistema de Economia',
    description: `**Como ganhar coins:**

📅 **Daily** - Use \`/daily\` diariamente
⚔️ **RPG** - Derrote monstros
🎣 **Pesca** - Pesque e venda peixes
📦 **Expedições** - Envie expedições
🐾 **Pets** - Colete coins dos pets
🎰 **Cassino** - Aposte (com cuidado!)

**Como gastar coins:**

🛒 **Loja** - \`/loja\` para ver itens
🐾 **Pets** - \`/pet loja\` para comprar pets
🏠 **Casa** - \`/house comprar\` para casas
💎 **Mercado** - Compre de outros jogadores

**Comandos:**
• \`/saldo\` - Ver seu saldo
• \`/transferir @user <valor>\` - Enviar coins`,
    image: null,
  },
  {
    id: 'rpg_basics',
    title: '⚔️ RPG - Criando seu Personagem',
    description: `**Passo 1: Crie seu personagem**
\`\`\`/rpg criar <nome>\`\`\`

**Classes disponíveis:**
• ⚔️ **Guerreiro** - Tank, muito HP
• 🔮 **Mago** - DPS mágico, pouco HP
• 🏹 **Arqueiro** - DPS crítico, balanceado
• 🛡️ **Paladino** - Tank/Healer híbrido
• 🗡️ **Assassino** - DPS burst extremo
• 🧙 **Necromante** - Invocador de minions

**Passo 2: Comece a batalhar**
\`\`\`/rpg batalhar slime\`\`\`

Comece com Slimes e vá subindo!

**Comandos básicos:**
• \`/rpg status\` - Ver personagem
• \`/rpg batalhar <monstro>\` - Lutar
• \`/rpg curar\` - Recuperar HP`,
    image: null,
  },
  {
    id: 'rpg_advanced',
    title: '⚔️ RPG - Equipamentos e Skills',
    description: `**Equipamentos:**

Seus slots de equipamento:
• ⚔️ Arma | 🛡️ Escudo | 🪖 Capacete
• 👕 Armadura | 👖 Calças | 👢 Botas
• 💍 Anel | 📿 Amuleto

**Comandos:**
• \`/rpg equipar <slot> <id>\` - Equipar
• \`/inventory equipamentos\` - Ver itens

**Habilidades (Skills):**

Desbloqueie conforme sobe de nível:
• Nível 5: Primeira skill
• Nível 10: Segunda skill
• Nível 20: Terceira skill
• Nível 30: Passiva
• Nível 50: Ultimate!

**Comandos:**
• \`/rpg skills\` - Ver suas skills`,
    image: null,
  },
  {
    id: 'dungeons',
    title: '🏰 Dungeons - Conteúdo em Grupo',
    description: `**O que são Dungeons?**
Aventuras cooperativas com waves de monstros e boss final!

**Como participar:**
1. Crie ou entre em uma run
2. Espere outros jogadores (2-4)
3. Líder inicia a dungeon
4. Lutem juntos contra as waves!

**Dungeons disponíveis:**
• 🌲 Floresta (Nv. 10+)
• 🦇 Caverna (Nv. 20+)
• 🏛️ Ruínas (Nv. 35+)
• 🌋 Vulcão (Nv. 50+)
• 🕳️ Abismo (Nv. 70+)

**Comandos:**
• \`/dungeon criar <tipo>\` - Criar run
• \`/dungeon entrar <id>\` - Entrar
• \`/dungeon status\` - Ver progresso`,
    image: null,
  },
  {
    id: 'raids',
    title: '🐉 Raids - Desafio Máximo',
    description: `**O que são Raids?**
Batalhas massivas contra bosses lendários!

**Diferenças de Dungeon:**
• 5-10 jogadores
• Múltiplas fases por boss
• Mecânicas especiais
• Lockout semanal (reset segunda)
• Loot muito melhor!

**Raids disponíveis:**
• 🐉 Covil do Dragão (Nv. 50+)
• 👹 Fortaleza Demoníaca (Nv. 70+)
• 🌌 Nexus Dimensional (Nv. 90+)

**Comandos:**
• \`/raid criar <tipo>\` - Criar raid
• \`/raid entrar <id>\` - Entrar

**Dica:** Monte um grupo equilibrado!`,
    image: null,
  },
  {
    id: 'pets',
    title: '🐾 Sistema de Pets',
    description: `**Por que ter um Pet?**
Pets geram coins passivamente enquanto você joga!

**Raridades e geração:**
• 🟢 Comum - 2-5 coins/hora
• 🔵 Incomum - 8-12 coins/hora
• 🟣 Raro - 15-20 coins/hora
• 🟡 Épico - 25-35 coins/hora
• 🔴 Lendário - 50+ coins/hora

**Como conseguir pets:**
1. Compre na loja: \`/pet loja\`
2. Choque ovos do crafting
3. Drops de dungeons/raids

**Comandos principais:**
• \`/pet comprar <id>\` - Comprar
• \`/pet ativar <id>\` - Ativar
• \`/pet alimentar <id>\` - Alimentar
• \`/pet coletar\` - Pegar coins`,
    image: null,
  },
  {
    id: 'clans',
    title: '🏰 Sistema de Clãs',
    description: `**Por que entrar em um Clã?**
• Jogue com outros membros
• Bônus de XP em grupo
• Guerras de clãs
• Missões exclusivas
• Banco compartilhado

**Como entrar:**
\`\`\`/clan listar\`\`\`
Veja clãs públicos e entre em um!

**Como criar (5.000 coins):**
\`\`\`/clan criar <nome> <tag>\`\`\`

**Cargos do clã:**
• 👑 Líder
• ⭐ Vice-Líder
• 🔹 Ancião
• • Membro

**Comandos:**
• \`/clan info\` - Ver seu clã
• \`/clan contribuir <valor>\` - Doar`,
    image: null,
  },
  {
    id: 'expeditions_fishing',
    title: '🗺️ Expedições e Pesca',
    description: `**Expedições** 🗺️
Coletam recursos automaticamente!

\`/expedicao iniciar floresta\`

Locais: Floresta (30min) → Abismo (8h)
Mais tempo = Mais recompensas!

**Pesca** 🎣
Pesque peixes para vender!

\`/pescar\`

Cooldown: 30 minutos
Peixes raros = Muito dinheiro!

**Recursos coletados:**
• 🪵 Madeira | 🪨 Pedra | ⚙️ Ferro
• 🥇 Ouro | 💎 Diamante | ✨ Essência

**Use para:**
• Vender por coins
• Crafting de itens`,
    image: null,
  },
  {
    id: 'crafting',
    title: '🔨 Sistema de Crafting',
    description: `**O que é Crafting?**
Transforme recursos em itens valiosos!

**Categorias:**
• 🔧 Materiais refinados
• 🧪 Poções (XP, HP, etc.)
• 🛠️ Ferramentas (varas, picaretas)
• 🥚 Ovos de pet
• ⚔️ Equipamentos

**Como craftar:**
\`\`\`/crafting receitas\`\`\`
Veja o que você pode criar!

\`\`\`/crafting criar <id>\`\`\`
Crie o item!

**Níveis de crafting:**
Quanto mais crafta, melhor fica!
• Nível 1-10: Iniciante
• Nível 11-25: Aprendiz
• Nível 26-50: Artesão
• Nível 51+: Mestre`,
    image: null,
  },
  {
    id: 'badges_titles',
    title: '🏅 Badges e Títulos',
    description: `**Badges (182 disponíveis!)**
Conquistas permanentes que mostram seu progresso!

**Categorias:**
• 📊 Progressão (níveis)
• ⏰ Tempo (permanência)
• 🎯 Conquistas (feitos)
• ⚔️ RPG (batalhas)
• 💰 Economia (coins)
• 🏆 Campeonatos
• E muito mais!

**Títulos**
Aparecem no seu perfil!

**Como conseguir:**
• Algumas vêm com badges
• Compre na loja
• Ganhe em eventos

**Comandos:**
• \`/badges\` - Ver suas badges
• \`/titulos equipar <id>\` - Equipar título`,
    image: null,
  },
  {
    id: 'prestige',
    title: '⭐ Sistema de Prestígio',
    description: `**O que é Prestígio?**
Resete seu progresso para ganhar bônus permanentes!

**Requisitos:**
• Nível 100 para o primeiro

**Bônus por prestígio:**
• +5% XP permanente
• +5% Coins permanente
• Badges exclusivas
• Títulos especiais
• Mais slots de pet

**O que mantém:**
• Badges, Pets, Títulos
• Equipamentos lendários+
• Bônus anteriores

**O que reseta:**
• Nível e XP
• Alguns recursos

\`/prestige info\` - Ver detalhes
\`/prestige confirmar\` - Fazer prestígio`,
    image: null,
  },
  {
    id: 'housing',
    title: '🏠 Sistema de Housing',
    description: `**Sua própria casa!**

**Tipos de casa:**
• 🏚️ Cabana - Grátis (básica)
• 🏠 Casa - 5.000 coins
• 🏡 Mansão - 25.000 coins
• 🏰 Castelo - 100.000 coins

**Benefícios:**
• Armazenamento extra
• Geração passiva de recursos
• Bônus de XP (descanso)
• Decorações no perfil
• Visitas de amigos

**Comandos:**
• \`/house info\` - Ver sua casa
• \`/house comprar <tipo>\` - Comprar
• \`/house decorar\` - Decorar
• \`/house visitar @user\` - Visitar`,
    image: null,
  },
  {
    id: 'casino',
    title: '🎰 Cassino',
    description: `**Jogos disponíveis:**

• 🪙 **Coinflip** - Cara ou Coroa
• 🎲 **Dados** - Maior que a casa
• 🎰 **Slots** - 3 símbolos iguais
• 🎡 **Roleta** - Cor ou número
• 📈 **Crash** - Saia a tempo
• 🃏 **Blackjack** - Chegue a 21

**Limites:**
• Mínimo: 10 coins
• Máximo: 50.000 coins

**Comandos:**
\`/cassino <jogo> <aposta>\`

Exemplo:
\`/cassino coinflip 100 cara\`

⚠️ **Jogue com responsabilidade!**
Não aposte mais do que pode perder.`,
    image: null,
  },
  {
    id: 'final',
    title: '🎉 Tutorial Completo!',
    description: `**Parabéns!** Você completou o tutorial!

**Seus próximos passos:**

1. **Agora:** Use \`/daily\` para começar!

2. **Crie seu personagem:**
   \`/rpg criar <nome>\`

3. **Comece a batalhar:**
   \`/rpg batalhar slime\`

4. **Compre um pet:**
   \`/pet loja\`

5. **Entre em um clã:**
   \`/clan listar\`

**Comandos de ajuda:**
• \`/help\` - Central de ajuda
• \`/help <categoria>\` - Ajuda específica

**Boa sorte, aventureiro!** 🎮

*Use os botões para revisar qualquer parte do tutorial.*`,
    image: null,
  },
];

export const data = new SlashCommandBuilder()
  .setName('tutorial')
  .setDescription('Tutorial interativo para novos jogadores')
  .addIntegerOption(opt =>
    opt
      .setName('pagina')
      .setDescription('Ir para uma página específica do tutorial')
      .setMinValue(1)
      .setMaxValue(TUTORIAL_STEPS.length)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const startPage = (interaction.options.getInteger('pagina') || 1) - 1;
  let currentPage = Math.max(0, Math.min(startPage, TUTORIAL_STEPS.length - 1));

  const createEmbed = (page: number): EmbedBuilder => {
    const step = TUTORIAL_STEPS[page];
    const embed = new EmbedBuilder()
      .setTitle(step.title)
      .setDescription(step.description)
      .setColor(COLORS.PRIMARY)
      .setFooter({ text: `📖 Página ${page + 1}/${TUTORIAL_STEPS.length} • Use /help para mais detalhes` });

    if (step.image) {
      embed.setImage(step.image);
    }

    return embed;
  };

  const createButtons = (page: number): ActionRowBuilder<ButtonBuilder> => {
    const row = new ActionRowBuilder<ButtonBuilder>();

    // First button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_first')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0)
    );

    // Previous button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_prev')
        .setLabel('Anterior')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0)
    );

    // Page indicator
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_page')
        .setLabel(`${page + 1}/${TUTORIAL_STEPS.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    // Next button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_next')
        .setLabel('Próximo')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === TUTORIAL_STEPS.length - 1)
    );

    // Last button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_last')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === TUTORIAL_STEPS.length - 1)
    );

    return row;
  };

  const response = await interaction.reply({
    embeds: [createEmbed(currentPage)],
    components: [createButtons(currentPage)],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 600000, // 10 minutes
  });

  collector.on('collect', async (buttonInteraction) => {
    if (buttonInteraction.user.id !== interaction.user.id) {
      await buttonInteraction.reply({
        content: '❌ Este tutorial não é seu! Use `/tutorial` para abrir o seu.',
        ephemeral: true,
      });
      return;
    }

    switch (buttonInteraction.customId) {
      case 'tutorial_first':
        currentPage = 0;
        break;
      case 'tutorial_prev':
        currentPage = Math.max(0, currentPage - 1);
        break;
      case 'tutorial_next':
        currentPage = Math.min(TUTORIAL_STEPS.length - 1, currentPage + 1);
        break;
      case 'tutorial_last':
        currentPage = TUTORIAL_STEPS.length - 1;
        break;
    }

    await buttonInteraction.update({
      embeds: [createEmbed(currentPage)],
      components: [createButtons(currentPage)],
    });
  });

  collector.on('end', async () => {
    try {
      // Remove buttons after timeout
      const finalEmbed = createEmbed(currentPage);
      finalEmbed.setFooter({ text: `📖 Tutorial encerrado • Use /tutorial para recomeçar` });

      await interaction.editReply({
        embeds: [finalEmbed],
        components: [],
      });
    } catch {
      // Message may have been deleted
    }
  });
}
