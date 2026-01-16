import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
} from 'discord.js';
import { advancedCraftingService } from '../../services/advancedCraftingService';
import {
  CraftingRecipe,
  getRarityColor,
  EQUIPMENT_RECIPES,
  CONSUMABLE_RECIPES,
  MATERIAL_RECIPES,
  ALL_RECIPES,
  getRecipeById,
} from '../../data/crafting';

export const data = new SlashCommandBuilder()
  .setName('craftar')
  .setDescription('Sistema de Crafting Avançado')
  .addSubcommand(sub =>
    sub
      .setName('receitas')
      .setDescription('Ver todas as receitas disponíveis')
      .addStringOption(opt =>
        opt
          .setName('categoria')
          .setDescription('Filtrar por categoria')
          .addChoices(
            { name: '⚔️ Equipamentos', value: 'equipment' },
            { name: '🧪 Consumíveis', value: 'consumable' },
            { name: '📦 Materiais', value: 'material' }
          )
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('criar')
      .setDescription('Craftar um item')
      .addStringOption(opt =>
        opt
          .setName('receita')
          .setDescription('ID da receita para craftar')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('materiais')
      .setDescription('Ver seus materiais de crafting')
  )
  .addSubcommand(sub =>
    sub
      .setName('info')
      .setDescription('Ver detalhes de uma receita')
      .addStringOption(opt =>
        opt
          .setName('receita')
          .setDescription('ID da receita')
          .setRequired(true)
          .setAutocomplete(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'receitas':
      return handleRecipes(interaction);
    case 'criar':
      return handleCraft(interaction);
    case 'materiais':
      return handleMaterials(interaction);
    case 'info':
      return handleInfo(interaction);
    default:
      return handleRecipes(interaction);
  }
}

// ==================== HANDLERS ====================

async function handleRecipes(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const categoria = interaction.options.getString('categoria');
  const { available, locked, playerLevel } = await advancedCraftingService.getPlayerRecipes(interaction.user.id);

  let recipes: CraftingRecipe[];
  let title: string;

  switch (categoria) {
    case 'equipment':
      recipes = EQUIPMENT_RECIPES;
      title = '⚔️ Receitas de Equipamentos';
      break;
    case 'consumable':
      recipes = CONSUMABLE_RECIPES;
      title = '🧪 Receitas de Consumíveis';
      break;
    case 'material':
      recipes = MATERIAL_RECIPES;
      title = '📦 Receitas de Materiais';
      break;
    default:
      recipes = ALL_RECIPES;
      title = '📜 Todas as Receitas';
  }

  const availableIds = new Set(available.map(r => r.recipeId));

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x3498DB)
    .setDescription(`Seu nível: **${playerLevel}**\nReceitas disponíveis: **${available.length}**/${ALL_RECIPES.length}`)
    .setFooter({ text: 'Use /craftar info <receita> para ver detalhes' });

  // Agrupar por tier
  const byTier: Record<number, CraftingRecipe[]> = {};
  for (const recipe of recipes) {
    const tier = recipe.result.tier || 0;
    if (!byTier[tier]) byTier[tier] = [];
    byTier[tier].push(recipe);
  }

  for (const [tier, tierRecipes] of Object.entries(byTier).sort((a, b) => Number(b[0]) - Number(a[0]))) {
    const tierNum = Number(tier);
    const tierName = tierNum === 0 ? 'Básico' : `Tier ${tierNum}`;

    const recipeList = tierRecipes.map(r => {
      const isAvailable = availableIds.has(r.recipeId);
      const statusEmoji = isAvailable ? '✅' : '🔒';
      const rarityEmoji = r.result.rarity ? getRarityEmoji(r.result.rarity) : '';
      return `${statusEmoji} ${r.emoji} ${r.name} ${rarityEmoji} (Nv.${r.requiredLevel})`;
    }).join('\n');

    if (recipeList) {
      embed.addFields({
        name: `📊 ${tierName}`,
        value: recipeList.substring(0, 1024),
        inline: false,
      });
    }
  }

  // Select menu para ver detalhes
  const options = recipes
    .filter(r => availableIds.has(r.recipeId))
    .slice(0, 25)
    .map(r => ({
      label: r.name,
      description: `Nível ${r.requiredLevel} | ${r.requiredCoins.toLocaleString()} coins`,
      value: r.recipeId,
      emoji: r.emoji,
    }));

  if (options.length > 0) {
    const select = new StringSelectMenuBuilder()
      .setCustomId('select_recipe')
      .setPlaceholder('Selecione uma receita para ver detalhes')
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    const response = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000,
    });

    collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
      if (selectInteraction.user.id !== interaction.user.id) {
        return selectInteraction.reply({ content: '❌ Este menu não é para você!', ephemeral: true });
      }

      const recipeId = selectInteraction.values[0];
      const detailEmbed = await createRecipeEmbed(interaction.user.id, recipeId);

      if (detailEmbed) {
        await selectInteraction.reply({ embeds: [detailEmbed], ephemeral: true });
      }
    });
  } else {
    await interaction.editReply({ embeds: [embed] });
  }
}

async function handleCraft(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const recipeId = interaction.options.getString('receita', true);

  // Verificar requisitos primeiro
  const requirements = await advancedCraftingService.checkRequirements(interaction.user.id, recipeId);

  if (!requirements) {
    return interaction.editReply({ content: '❌ Receita não encontrada.' });
  }

  // Mostrar confirmação
  const recipe = requirements.recipe;
  const confirmEmbed = new EmbedBuilder()
    .setTitle(`${recipe.emoji} Craftar ${recipe.name}?`)
    .setColor(requirements.canCraft ? 0x00FF00 : 0xFF0000)
    .setDescription(recipe.description);

  // Materiais
  const materialList = requirements.missingMaterials.length > 0
    ? requirements.missingMaterials.map(m =>
      `${m.sufficient ? '✅' : '❌'} ${m.materialName}: ${m.have}/${m.required}`
    ).join('\n')
    : recipe.ingredients.map(i => `✅ ${i.materialName}: ${i.quantity}`).join('\n');

  confirmEmbed.addFields(
    { name: '📦 Materiais', value: materialList, inline: false },
    { name: '💰 Custo', value: `${requirements.guildBonus.finalCost.toLocaleString()} coins`, inline: true },
    { name: '🎯 Chance', value: `${requirements.guildBonus.finalSuccessRate}%`, inline: true }
  );

  if (requirements.guildBonus.hasGuild) {
    confirmEmbed.addFields({
      name: '🛡️ Bônus de Guilda',
      value: `+${requirements.guildBonus.successRateBonus}% chance\n-${requirements.guildBonus.costReduction}% custo`,
      inline: true,
    });
  }

  if (!requirements.canCraft) {
    if (requirements.missingLevel) {
      confirmEmbed.addFields({
        name: '❌ Nível Insuficiente',
        value: `Necessário: ${recipe.requiredLevel} | Atual: ${requirements.playerLevel}`,
        inline: false,
      });
    }
    if (requirements.missingCoins) {
      confirmEmbed.addFields({
        name: '❌ Coins Insuficientes',
        value: `Necessário: ${requirements.guildBonus.finalCost.toLocaleString()} | Atual: ${requirements.playerCoins.toLocaleString()}`,
        inline: false,
      });
    }
    return interaction.editReply({ embeds: [confirmEmbed] });
  }

  // Botões de confirmação
  const confirmBtn = new ButtonBuilder()
    .setCustomId('confirm_craft')
    .setLabel('Craftar!')
    .setStyle(ButtonStyle.Success)
    .setEmoji('⚒️');

  const cancelBtn = new ButtonBuilder()
    .setCustomId('cancel_craft')
    .setLabel('Cancelar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);

  const response = await interaction.editReply({
    embeds: [confirmEmbed],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  collector.on('collect', async (btnInteraction: ButtonInteraction) => {
    if (btnInteraction.user.id !== interaction.user.id) {
      return btnInteraction.reply({ content: '❌ Este botão não é para você!', ephemeral: true });
    }

    if (btnInteraction.customId === 'cancel_craft') {
      return btnInteraction.update({ content: '❌ Crafting cancelado.', embeds: [], components: [] });
    }

    // Craftar
    const result = await advancedCraftingService.craft(interaction.user.id, recipeId);

    const resultEmbed = new EmbedBuilder()
      .setTitle(result.success ? '✅ Crafting Concluído!' : '❌ Crafting Falhou!')
      .setColor(result.success ? 0x00FF00 : 0xFF0000)
      .setDescription(result.message);

    if (result.recipe && result.success) {
      const r = result.recipe.result;
      if (r.type === 'equipment' && r.stats) {
        const statsText = Object.entries(r.stats)
          .filter(([, v]) => v && v > 0)
          .map(([k, v]) => `${getStatName(k)}: +${v}`)
          .join('\n');

        resultEmbed.addFields({
          name: '📊 Stats',
          value: statsText || 'Nenhum',
          inline: true,
        });
      }
    }

    await btnInteraction.update({ embeds: [resultEmbed], components: [] });
  });

  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      await interaction.editReply({ content: '⏰ Tempo esgotado.', components: [] });
    }
  });
}

async function handleMaterials(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const materials = await advancedCraftingService.getMaterialInventory(interaction.user.id);

  if (materials.length === 0) {
    return interaction.editReply({
      content: '📦 Você não tem materiais de crafting.\nObtenha materiais completando dungeons e caçadas!',
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📦 Seus Materiais de Crafting')
    .setColor(0x3498DB);

  // Agrupar por tier
  const byTier: Record<number, typeof materials> = {};
  for (const mat of materials) {
    if (!byTier[mat.tier]) byTier[mat.tier] = [];
    byTier[mat.tier].push(mat);
  }

  for (const [tier, tierMats] of Object.entries(byTier).sort((a, b) => Number(b[0]) - Number(a[0]))) {
    const matList = tierMats
      .map(m => `${m.emoji} ${m.name}: **${m.quantity}**`)
      .join('\n');

    embed.addFields({
      name: `Tier ${tier}`,
      value: matList,
      inline: true,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleInfo(interaction: ChatInputCommandInteraction) {
  const recipeId = interaction.options.getString('receita', true);

  const embed = await createRecipeEmbed(interaction.user.id, recipeId);

  if (!embed) {
    return interaction.reply({ content: '❌ Receita não encontrada.', ephemeral: true });
  }

  return interaction.reply({ embeds: [embed] });
}

// ==================== HELPERS ====================

async function createRecipeEmbed(discordId: string, recipeId: string): Promise<EmbedBuilder | null> {
  const requirements = await advancedCraftingService.checkRequirements(discordId, recipeId);

  if (!requirements) return null;

  const recipe = requirements.recipe;
  const result = recipe.result;

  const embed = new EmbedBuilder()
    .setTitle(`${recipe.emoji} ${recipe.name}`)
    .setDescription(recipe.description)
    .setColor(result.rarity ? getRarityColor(result.rarity) : 0x3498DB);

  // Materiais necessários
  const materialList = recipe.ingredients.map(i => {
    const check = requirements.missingMaterials.find(m => m.materialId === i.materialId);
    const have = check ? check.have : i.quantity;
    const emoji = have >= i.quantity ? '✅' : '❌';
    return `${emoji} ${i.materialName}: ${have}/${i.quantity}`;
  }).join('\n');

  embed.addFields(
    { name: '📦 Materiais', value: materialList, inline: false },
    { name: '💰 Custo', value: `${requirements.guildBonus.finalCost.toLocaleString()} coins`, inline: true },
    { name: '⭐ Nível', value: `${recipe.requiredLevel}`, inline: true },
    { name: '🎯 Chance', value: `${requirements.guildBonus.finalSuccessRate}%`, inline: true }
  );

  // Stats do equipamento
  if (result.type === 'equipment' && result.stats) {
    const statsText = Object.entries(result.stats)
      .filter(([, v]) => v && v > 0)
      .map(([k, v]) => `${getStatName(k)}: +${v}`)
      .join('\n');

    embed.addFields({
      name: '📊 Stats do Item',
      value: statsText || 'Nenhum',
      inline: false,
    });

    if (result.tier) {
      embed.addFields({ name: 'Tier', value: `${result.tier}`, inline: true });
    }
    if (result.rarity) {
      embed.addFields({ name: 'Raridade', value: getRarityName(result.rarity), inline: true });
    }
  }

  // Status de crafting
  const statusText = requirements.canCraft
    ? '✅ Pode craftar!'
    : '❌ Não pode craftar';

  embed.setFooter({ text: statusText });

  return embed;
}

function getRarityEmoji(rarity: string): string {
  const emojis: Record<string, string> = {
    common: '⬜',
    uncommon: '🟢',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟡',
    mythic: '🔴',
  };
  return emojis[rarity] || '';
}

function getRarityName(rarity: string): string {
  const names: Record<string, string> = {
    common: 'Comum',
    uncommon: 'Incomum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
    mythic: 'Mítico',
  };
  return names[rarity] || rarity;
}

function getStatName(stat: string): string {
  const names: Record<string, string> = {
    attack: 'ATK',
    defense: 'DEF',
    hp: 'HP',
    critChance: 'Crítico%',
    critDamage: 'Dano Crit%',
    evasion: 'Evasão%',
    lifesteal: 'Lifesteal%',
  };
  return names[stat] || stat;
}

// Autocomplete handler
export async function autocomplete(interaction: any) {
  const focusedValue = interaction.options.getFocused().toLowerCase();

  const recipes = ALL_RECIPES.filter(r =>
    r.name.toLowerCase().includes(focusedValue) ||
    r.recipeId.toLowerCase().includes(focusedValue)
  ).slice(0, 25);

  await interaction.respond(
    recipes.map(r => ({
      name: `${r.emoji} ${r.name} (Nv.${r.requiredLevel})`,
      value: r.recipeId,
    }))
  );
}
