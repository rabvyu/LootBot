import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { craftingService } from '../../services/craftingService';
import { resourceService } from '../../services/resourceService';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

const CATEGORY_NAMES: Record<string, string> = {
  consumable: '🧪 Consumiveis',
  equipment: '⚔️ Equipamentos',
  material: '🔧 Materiais',
  special: '✨ Especiais',
};

const RESOURCE_NAMES: Record<string, string> = {
  wood: '🪵 Madeira',
  stone: '🪨 Pedra',
  iron: '🔩 Ferro',
  gold: '🥇 Ouro',
  diamond: '💎 Diamante',
  essence: '✨ Essencia',
  fish_common: '🐟 Peixe Comum',
  fish_rare: '🐠 Peixe Raro',
  fish_golden: '🐡 Peixe Dourado',
  bait: '🪱 Isca',
  refined_iron: '⚙️ Ferro Refinado',
  gold_bar: '🏅 Barra de Ouro',
};

export const data = new SlashCommandBuilder()
  .setName('crafting')
  .setDescription('Sistema de criacao de itens')
  .addSubcommand((sub) =>
    sub.setName('receitas').setDescription('Ver todas as receitas')
  )
  .addSubcommand((sub) =>
    sub
      .setName('criar')
      .setDescription('Criar um item')
      .addStringOption((opt) =>
        opt.setName('receita').setDescription('ID da receita').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('info')
      .setDescription('Ver detalhes de uma receita')
      .addStringOption((opt) =>
        opt.setName('receita').setDescription('ID da receita').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName('stats').setDescription('Ver suas estatisticas de crafting')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'receitas':
      await handleRecipes(interaction);
      break;
    case 'criar':
      await handleCraft(interaction);
      break;
    case 'info':
      await handleInfo(interaction);
      break;
    case 'stats':
      await handleStats(interaction);
      break;
  }
}

async function handleRecipes(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const recipes = await craftingService.getAllRecipes();

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('📜 Receitas de Crafting')
    .setDescription('Use `/crafting criar <id>` para criar um item.')
    .setFooter({ text: 'Use /crafting info <id> para mais detalhes' });

  const grouped: Record<string, string[]> = {};

  for (const recipe of recipes) {
    const ingredientList = recipe.ingredients.map(i => {
      const name = RESOURCE_NAMES[i.resourceId] || i.resourceId;
      return `${i.amount}x ${name}`;
    }).join(', ');

    const line = `${recipe.emoji} **${recipe.name}** (\`${recipe.id}\`)\n` +
      `┗ Lv.${recipe.levelRequired} | ${ingredientList}`;

    if (!grouped[recipe.category]) grouped[recipe.category] = [];
    grouped[recipe.category].push(line);
  }

  const order = ['material', 'consumable', 'equipment', 'special'];
  for (const cat of order) {
    if (grouped[cat] && grouped[cat].length > 0) {
      embed.addFields({
        name: CATEGORY_NAMES[cat],
        value: grouped[cat].join('\n\n'),
        inline: false,
      });
    }
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleCraft(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const recipeId = interaction.options.getString('receita', true);

  // First check if can craft
  const canCraft = await craftingService.canCraft(interaction.user.id, recipeId);

  if (!canCraft.canCraft) {
    let message = canCraft.reason || 'Nao pode craftar.';

    if (canCraft.missingIngredients && canCraft.missingIngredients.length > 0) {
      message += '\n\n**Ingredientes faltando:**\n';
      for (const missing of canCraft.missingIngredients) {
        const name = RESOURCE_NAMES[missing.resourceId] || missing.resourceId;
        message += `${name}: ${missing.have}/${missing.need}\n`;
      }
    }

    await interaction.editReply({
      embeds: [createErrorEmbed('Nao Pode Craftar', message)],
    });
    return;
  }

  // Craft!
  const result = await craftingService.craft(interaction.user.id, recipeId);

  if (result.success) {
    let description = `${result.message}\n\n**Itens criados:**\n`;

    for (const item of result.results!) {
      description += `${item.emoji} ${item.name} x${item.amount}\n`;
    }

    description += `\n✨ **+${result.xpGained} XP**`;

    if (result.cooldownEnd) {
      const timestamp = Math.floor(result.cooldownEnd.getTime() / 1000);
      description += `\n\n⏱️ Proximo craft disponivel: <t:${timestamp}:R>`;
    }

    await interaction.editReply({
      embeds: [createSuccessEmbed('Item Criado!', description)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleInfo(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const recipeId = interaction.options.getString('receita', true);
  const recipe = await craftingService.getRecipe(recipeId);

  if (!recipe) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Receita nao encontrada.')],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${recipe.emoji} ${recipe.name}`)
    .setDescription(recipe.description);

  // Ingredients with user's current amounts
  let ingredientText = '';
  for (const ing of recipe.ingredients) {
    const name = RESOURCE_NAMES[ing.resourceId] || ing.resourceId;
    const userAmount = await resourceService.getUserResourceAmount(interaction.user.id, ing.resourceId);
    const hasEnough = userAmount >= ing.amount;
    const status = hasEnough ? '✅' : '❌';
    ingredientText += `${status} ${name}: ${userAmount}/${ing.amount}\n`;
  }

  embed.addFields(
    { name: 'Categoria', value: CATEGORY_NAMES[recipe.category], inline: true },
    { name: 'Nivel Minimo', value: `${recipe.levelRequired}`, inline: true },
    { name: 'XP Recompensa', value: `${recipe.xpReward}`, inline: true },
    { name: 'Ingredientes', value: ingredientText, inline: false },
  );

  if (recipe.cooldownHours > 0) {
    embed.addFields({
      name: 'Cooldown',
      value: `${recipe.cooldownHours}h`,
      inline: true,
    });
  }

  // Check if user can craft
  const canCraft = await craftingService.canCraft(interaction.user.id, recipeId);
  embed.addFields({
    name: 'Status',
    value: canCraft.canCraft ? '✅ Pode craftar!' : `❌ ${canCraft.reason}`,
    inline: false,
  });

  await interaction.editReply({ embeds: [embed] });
}

async function handleStats(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const stats = await craftingService.getCraftingStats(interaction.user.id);
  const allRecipes = await craftingService.getAllRecipes();

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🔨 Estatisticas de Crafting')
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: 'Total Criado', value: `${stats.totalCrafted}`, inline: true },
      { name: 'Receitas Usadas', value: `${stats.recipesUnlocked}/${allRecipes.length}`, inline: true },
    );

  await interaction.editReply({ embeds: [embed] });
}
