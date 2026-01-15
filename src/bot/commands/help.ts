import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
} from 'discord.js';

const HELP_CATEGORIES = {
  inicio: {
    title: '🚀 Começando',
    description: 'Primeiros passos no bot de gamificação',
    content: `**Bem-vindo ao LootBot!** 🎮

Este bot transforma seu servidor em um RPG com gamificação completa!

**Como ganhar XP:**
• 💬 Enviando mensagens (15-25 XP, cooldown 60s)
• 🎙️ Ficando em call de voz (5 XP/min)
• 😀 Dando/recebendo reações
• 📅 Coletando recompensa diária (\`/daily\`)

**Comandos essenciais:**
• \`/rank\` - Ver seu nível e XP
• \`/profile\` - Ver seu perfil completo
• \`/daily\` - Coletar recompensa diária
• \`/badges\` - Ver suas badges

**Dica:** Mantenha uma streak diária para ganhar bônus!`,
  },
  economia: {
    title: '💰 Economia',
    description: 'Sistema de coins, loja e transferências',
    content: `**Sistema de Coins** 💰

**Como ganhar coins:**
• 📅 \`/daily\` - 100-500 coins por dia
• ⚔️ Batalhas no RPG
• 🎣 Pescando e vendendo peixes
• 🎰 Jogos do cassino
• 📦 Expedições

**Comandos:**
• \`/saldo\` - Ver seu saldo
• \`/loja\` - Ver itens à venda
• \`/comprar <item>\` - Comprar item
• \`/transferir @user <valor>\` - Enviar coins
• \`/catalogo\` - Ver todos os itens disponíveis

**Dica:** Use \`/recursos vender-tudo\` para vender recursos rapidamente!`,
  },
  rpg: {
    title: '⚔️ RPG Combat',
    description: 'Crie personagens e batalhe contra monstros',
    content: `**Sistema de RPG** ⚔️

**Classes disponíveis:**
• ⚔️ **Guerreiro** - HP alto, defesa média
• 🔮 **Mago** - Dano alto, vida baixa
• 🏹 **Arqueiro** - Alto crítico, balanceado
• 🛡️ **Paladino** - Defesa máxima, dano baixo

**Comandos:**
• \`/rpg criar <nome>\` - Criar personagem
• \`/rpg status\` - Ver seu personagem
• \`/rpg monstros\` - Ver monstros disponíveis
• \`/rpg batalhar <id>\` - Lutar contra monstro
• \`/rpg curar\` - Curar personagem (custa coins)
• \`/rpg ranking\` - Ver ranking de personagens

**Dica:** Comece com Slimes e suba de nível antes de enfrentar bosses!`,
  },
  pets: {
    title: '🐾 Pets',
    description: 'Adote e cuide de pets que geram coins',
    content: `**Sistema de Pets** 🐾

Pets geram coins passivamente enquanto você joga!

**Raridades:**
• 🟢 Comum - 2-5 coins/hora
• 🔵 Incomum - 8-12 coins/hora
• 🟣 Raro - 15-20 coins/hora
• 🟡 Épico - 25-35 coins/hora
• 🔴 Lendário - 50 coins/hora

**Comandos:**
• \`/pet loja\` - Ver pets à venda
• \`/pet comprar <id>\` - Comprar pet
• \`/pet meus\` - Ver seus pets
• \`/pet ativar <id>\` - Ativar um pet
• \`/pet alimentar <id>\` - Alimentar pet
• \`/pet coletar\` - Coletar coins gerados

**Dica:** Mantenha seus pets alimentados para máxima produção!`,
  },
  expedicoes: {
    title: '🗺️ Expedições',
    description: 'Envie expedições para ganhar recursos',
    content: `**Sistema de Expedições** 🗺️

Envie expedições que coletam recursos automaticamente!

**Locais disponíveis:**
• 🌲 Floresta - 30min, fácil
• 🦇 Caverna - 1h, médio
• 🏛️ Ruínas - 2h, médio
• 🐊 Pântano - 3h, difícil
• 🌋 Vulcão - 4h, muito difícil
• 🏰 Dungeon - 6h, extremo
• 🕳️ Abismo - 8h, impossível

**Comandos:**
• \`/expedicao lista\` - Ver expedições
• \`/expedicao iniciar <id>\` - Iniciar expedição
• \`/expedicao status\` - Ver expedição ativa
• \`/expedicao resgatar\` - Coletar recompensas

**Dica:** Expedições mais longas dão mais recompensas!`,
  },
  recursos: {
    title: '🎣 Pesca & Recursos',
    description: 'Pesque e gerencie seus recursos',
    content: `**Pesca & Recursos** 🎣

**Pescaria:**
• \`/pescar\` - Pescar (cooldown 30min)
• Pode pegar peixes de várias raridades
• Peixes lendários valem até 1000 coins!

**Recursos:**
• 🪵 Madeira, 🪨 Pedra, ⚙️ Ferro
• 🥇 Ouro, 💎 Diamante, ✨ Essência
• 🐟 Peixes de várias raridades

**Comandos:**
• \`/pescar\` - Pescar
• \`/recursos ver\` - Ver seus recursos
• \`/recursos vender <id> <qtd>\` - Vender recurso
• \`/recursos vender-tudo\` - Vender tudo
• \`/recursos lista\` - Ver todos os recursos

**Dica:** Use iscas para aumentar chance de peixes raros!`,
  },
  crafting: {
    title: '🔨 Crafting',
    description: 'Crie itens com seus recursos',
    content: `**Sistema de Crafting** 🔨

Transforme recursos em itens valiosos!

**Categorias:**
• 🔧 Materiais - Refinar recursos
• 🧪 Consumíveis - Poções de XP
• 🛠️ Ferramentas - Varas de pesca
• 🥚 Especiais - Ovos de pet

**Comandos:**
• \`/crafting receitas\` - Ver todas as receitas
• \`/crafting info <id>\` - Detalhes da receita
• \`/crafting criar <id>\` - Criar item
• \`/crafting stats\` - Ver suas estatísticas

**Receitas populares:**
• 🥚 Ovo de Pet Comum - Chance de pet!
• 🧪 Poção de XP - Ganhe XP bônus
• 🎣 Vara Melhorada - Melhores peixes

**Dica:** Guarde essências para criar itens especiais!`,
  },
  clas: {
    title: '🏰 Clãs',
    description: 'Crie ou entre em um clã',
    content: `**Sistema de Clãs** 🏰

Una-se a outros jogadores!

**Cargos:**
• 👑 Líder - Controle total
• ⭐ Vice-Líder - Promover/expulsar
• 🔹 Ancião - Ajudante
• • Membro - Participante

**Comandos:**
• \`/clan criar <nome> <tag>\` - Criar clã (5000 coins)
• \`/clan info\` - Ver seu clã
• \`/clan listar\` - Ver clãs públicos
• \`/clan entrar <id>\` - Entrar em clã
• \`/clan membros\` - Ver membros
• \`/clan contribuir <valor>\` - Doar coins
• \`/clan ranking\` - Ranking de clãs

**Comandos de líder:**
• \`/clan promover/rebaixar/expulsar @user\`
• \`/clan transferir @user\` - Passar liderança
• \`/clan dissolver\` - Fechar o clã

**Dica:** Clãs de nível alto têm mais vagas!`,
  },
  cassino: {
    title: '🎰 Cassino',
    description: 'Jogos de aposta com seus coins',
    content: `**Cassino** 🎰

Aposte seus coins e tente a sorte!

**Jogos disponíveis:**
• 🪙 **Coinflip** - Cara/Coroa (1.9x)
• 🎲 **Dados** - Maior que a casa (1.9x)
• 🎰 **Slots** - 3 símbolos (1.5x-10x)
• 🎡 **Roleta** - Cor/Número (2x-35x)
• 📈 **Crash** - Saia a tempo (1.1x-10x)
• ⬆️ **Maior/Menor** - Adivinhe (1.9x-5x)

**Comandos:**
• \`/cassino coinflip <aposta> <escolha>\`
• \`/cassino dados <aposta>\`
• \`/cassino slots <aposta>\`
• \`/cassino roleta <aposta> <tipo>\`
• \`/cassino crash <aposta> <mult>\`
• \`/cassino maiormenor <aposta> <escolha>\`
• \`/cassino ajuda\` - Ver todos os jogos

**Limites:** 10 - 50.000 coins por aposta

⚠️ **Jogue com responsabilidade!**`,
  },
  missoes: {
    title: '📋 Missões',
    description: 'Complete missões para ganhar recompensas',
    content: `**Sistema de Missões** 📋

Complete objetivos diários e semanais!

**Tipos de missão:**
• 📅 Diárias - Resetam todo dia
• 📆 Semanais - Resetam toda semana
• 🎯 Especiais - Eventos limitados

**Comandos:**
• \`/missoes lista\` - Ver missões disponíveis
• \`/missoes ativas\` - Ver progresso
• \`/missoes resgatar\` - Coletar recompensas

**Exemplos de missões:**
• Enviar 50 mensagens
• Ficar 30min em call
• Vencer 5 batalhas
• Pescar 10 peixes

**Dica:** Missões semanais dão mais recompensas!`,
  },
  badges: {
    title: '🏅 Badges & Títulos',
    description: 'Conquiste badges e títulos especiais',
    content: `**Badges & Títulos** 🏅

**Badges** são conquistas permanentes!
• Por nível (5, 10, 25, 50, 100)
• Por tempo no servidor
• Por conquistas especiais
• Por eventos

**Títulos** aparecem no seu perfil!
• Desbloqueie com badges
• Compre na loja
• Ganhe em eventos

**Comandos:**
• \`/badges\` - Ver suas badges
• \`/titulos lista\` - Ver títulos disponíveis
• \`/titulos equipar <id>\` - Equipar título
• \`/titulos meus\` - Ver seus títulos
• \`/perfil-config titulo <id>\` - Definir título

**Dica:** Badges raras dão títulos exclusivos!`,
  },
  admin: {
    title: '⚙️ Admin',
    description: 'Comandos para administradores',
    content: `**Comandos Admin** ⚙️

Apenas para administradores do servidor!

**Gerenciamento de usuários:**
• \`/give-xp @user <quantidade>\`
• \`/remove-xp @user <quantidade>\`
• \`/give-coins @user <quantidade>\`
• \`/give-badge @user <badge>\`
• \`/remove-badge @user <badge>\`
• \`/reset-user @user\` - Resetar progresso
• \`/logs @user\` - Ver atividade

**Configurações:**
• \`/config\` - Configurar canais/cargos
• \`/level-roles\` - Cargos por nível
• \`/shop-manage\` - Gerenciar loja

**Eventos:**
• \`/event-manage criar\` - Criar evento
• \`/event-manage ativar/desativar\`
• \`/event-manage meta\` - Criar meta

**Utilitários:**
• \`/check-badges @user\` - Verificar badges
• \`/test-xp @user <quantidade>\` - Testar XP`,
  },
};

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Central de ajuda e onboarding do bot')
  .addStringOption(opt =>
    opt
      .setName('categoria')
      .setDescription('Categoria específica de ajuda')
      .setRequired(false)
      .addChoices(
        { name: '🚀 Começando', value: 'inicio' },
        { name: '💰 Economia', value: 'economia' },
        { name: '⚔️ RPG Combat', value: 'rpg' },
        { name: '🐾 Pets', value: 'pets' },
        { name: '🗺️ Expedições', value: 'expedicoes' },
        { name: '🎣 Pesca & Recursos', value: 'recursos' },
        { name: '🔨 Crafting', value: 'crafting' },
        { name: '🏰 Clãs', value: 'clas' },
        { name: '🎰 Cassino', value: 'cassino' },
        { name: '📋 Missões', value: 'missoes' },
        { name: '🏅 Badges & Títulos', value: 'badges' },
        { name: '⚙️ Admin', value: 'admin' }
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
      'Bem-vindo ao **LootBot**! 🎮\n\n' +
      'Este bot transforma seu servidor Discord em um RPG completo com:\n' +
      '• 📊 Sistema de XP e Níveis\n' +
      '• 💰 Economia com loja\n' +
      '• ⚔️ Combate RPG\n' +
      '• 🐾 Pets que geram coins\n' +
      '• 🗺️ Expedições automáticas\n' +
      '• 🎣 Sistema de pesca\n' +
      '• 🔨 Crafting de itens\n' +
      '• 🏰 Sistema de clãs\n' +
      '• 🎰 Jogos de cassino\n' +
      '• 🏅 Badges e títulos\n\n' +
      '**Selecione uma categoria abaixo para saber mais!**'
    )
    .setColor('#5865F2')
    .addFields(
      { name: '🚀 Começando', value: 'Primeiros passos', inline: true },
      { name: '💰 Economia', value: 'Coins e loja', inline: true },
      { name: '⚔️ RPG', value: 'Combate e classes', inline: true },
      { name: '🐾 Pets', value: 'Cuidar de pets', inline: true },
      { name: '🗺️ Expedições', value: 'Ganhar recursos', inline: true },
      { name: '🎣 Recursos', value: 'Pesca e coleta', inline: true },
      { name: '🔨 Crafting', value: 'Criar itens', inline: true },
      { name: '🏰 Clãs', value: 'Jogar em grupo', inline: true },
      { name: '🎰 Cassino', value: 'Apostar coins', inline: true }
    )
    .setFooter({ text: 'Use /help <categoria> ou selecione no menu abaixo' });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('Escolha uma categoria...')
    .addOptions(
      Object.entries(HELP_CATEGORIES).map(([key, cat]) => ({
        label: cat.title,
        description: cat.description,
        value: key,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  try {
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
      if (selectInteraction.user.id !== interaction.user.id) {
        await selectInteraction.reply({
          content: '❌ Este menu não é seu! Use `/help` para abrir o seu.',
          ephemeral: true,
        });
        return;
      }

      const selectedCategory = selectInteraction.values[0];
      const category = HELP_CATEGORIES[selectedCategory as keyof typeof HELP_CATEGORIES];

      if (!category) return;

      const categoryEmbed = new EmbedBuilder()
        .setTitle(category.title)
        .setDescription(category.content)
        .setColor('#5865F2')
        .setFooter({ text: 'Use o menu para ver outras categorias' });

      await selectInteraction.update({
        embeds: [categoryEmbed],
        components: [row],
      });
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
      content: '❌ Categoria não encontrada.',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(category.title)
    .setDescription(category.content)
    .setColor('#5865F2')
    .setFooter({ text: 'Use /help para ver todas as categorias' });

  await interaction.reply({ embeds: [embed] });
}
