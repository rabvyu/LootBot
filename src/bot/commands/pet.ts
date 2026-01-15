import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { petService } from '../../services/petService';
import { petRepository } from '../../database/repositories/petRepository';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

const RARITY_COLORS: Record<string, number> = {
  common: 0x9E9E9E,
  uncommon: 0x4CAF50,
  rare: 0x2196F3,
  epic: 0x9C27B0,
  legendary: 0xFFC107,
};

const RARITY_NAMES: Record<string, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Epico',
  legendary: 'Lendario',
};

export const data = new SlashCommandBuilder()
  .setName('pet')
  .setDescription('Sistema de pets')
  .addSubcommand((sub) =>
    sub.setName('loja').setDescription('Ver pets disponiveis para compra')
  )
  .addSubcommand((sub) =>
    sub.setName('meus').setDescription('Ver seus pets')
  )
  .addSubcommand((sub) =>
    sub
      .setName('comprar')
      .setDescription('Comprar um pet')
      .addStringOption((opt) =>
        opt.setName('pet').setDescription('ID do pet').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('nome').setDescription('Nome customizado para o pet')
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('ativar')
      .setDescription('Ativar um pet')
      .addStringOption((opt) =>
        opt.setName('pet').setDescription('ID do pet').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName('desativar').setDescription('Desativar pet atual')
  )
  .addSubcommand((sub) =>
    sub
      .setName('alimentar')
      .setDescription('Alimentar um pet')
      .addStringOption((opt) =>
        opt.setName('pet').setDescription('ID do pet').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName('coletar').setDescription('Coletar recompensas do pet ativo')
  )
  .addSubcommand((sub) =>
    sub
      .setName('renomear')
      .setDescription('Renomear um pet')
      .addStringOption((opt) =>
        opt.setName('pet').setDescription('ID do pet').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('nome').setDescription('Novo nome').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('liberar')
      .setDescription('Liberar um pet (recebe 25% do valor de volta)')
      .addStringOption((opt) =>
        opt.setName('pet').setDescription('ID do pet').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('info')
      .setDescription('Ver informacoes de um pet')
      .addStringOption((opt) =>
        opt.setName('pet').setDescription('ID do pet').setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'loja':
      await handleShop(interaction);
      break;
    case 'meus':
      await handleMyPets(interaction);
      break;
    case 'comprar':
      await handleBuy(interaction);
      break;
    case 'ativar':
      await handleActivate(interaction);
      break;
    case 'desativar':
      await handleDeactivate(interaction);
      break;
    case 'alimentar':
      await handleFeed(interaction);
      break;
    case 'coletar':
      await handleCollect(interaction);
      break;
    case 'renomear':
      await handleRename(interaction);
      break;
    case 'liberar':
      await handleRelease(interaction);
      break;
    case 'info':
      await handleInfo(interaction);
      break;
  }
}

async function handleShop(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const pets = await petService.getAvailablePets();
  const userPets = await petService.getUserPets(interaction.user.id);
  const ownedIds = userPets.map((p) => p.petId);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🐾 Loja de Pets')
    .setDescription('Adote um pet para gerar moedas e XP passivamente!')
    .setFooter({ text: 'Use /pet comprar <id> para adotar' });

  const grouped: Record<string, string[]> = {};

  for (const pet of pets) {
    const owned = ownedIds.includes(pet.id);
    const status = owned ? ' ✅' : '';
    const line = `${pet.emoji} **${pet.name}** (\`${pet.id}\`)${status}\n` +
      `┗ ${formatNumber(pet.price)} 🪙 | +${pet.baseCoinsPerHour}/h | +${pet.baseXpPerHour} XP/h`;

    if (!grouped[pet.rarity]) grouped[pet.rarity] = [];
    grouped[pet.rarity].push(line);
  }

  const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  for (const rarity of order) {
    if (grouped[rarity] && grouped[rarity].length > 0) {
      embed.addFields({
        name: `${RARITY_NAMES[rarity]}`,
        value: grouped[rarity].join('\n\n'),
        inline: false,
      });
    }
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleMyPets(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const userPets = await petService.getUserPets(interaction.user.id);

  if (userPets.length === 0) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sem Pets', 'Voce nao possui nenhum pet. Use `/pet loja` para ver os disponiveis!')],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🐾 Seus Pets')
    .setThumbnail(interaction.user.displayAvatarURL());

  for (const userPet of userPets) {
    const petDef = await petService.getPetDefinition(userPet.petId);
    if (!petDef) continue;

    const status = userPet.isActive ? '✅ ATIVO' : '💤';
    const hungerBar = createProgressBar(userPet.hunger, 100, 10);
    const xpNeeded = petService.getPetXpForLevel(userPet.level);
    const xpBar = createProgressBar(userPet.experience, xpNeeded, 10);

    embed.addFields({
      name: `${petDef.emoji} ${userPet.name} (Lv.${userPet.level}) ${status}`,
      value: `ID: \`${userPet.petId}\`\n` +
        `Fome: ${hungerBar} ${userPet.hunger}%\n` +
        `XP: ${xpBar} ${userPet.experience}/${xpNeeded}\n` +
        `Total gerado: ${formatNumber(userPet.totalCoinsGenerated)} 🪙 | ${formatNumber(userPet.totalXpGenerated)} XP`,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleBuy(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const petId = interaction.options.getString('pet', true);
  const customName = interaction.options.getString('nome') || undefined;

  const result = await petService.purchasePet(interaction.user.id, petId, customName);

  if (result.success) {
    await interaction.editReply({
      embeds: [createSuccessEmbed('Pet Adotado!', `${result.message}\n\nSaldo atual: ${formatNumber(result.newBalance!)} 🪙`)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleActivate(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const petId = interaction.options.getString('pet', true);
  const result = await petService.activatePet(interaction.user.id, petId);

  if (result.success) {
    await interaction.editReply({
      embeds: [createSuccessEmbed('Pet Ativado', result.message)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleDeactivate(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const result = await petService.deactivatePet(interaction.user.id);
  await interaction.editReply({
    embeds: [createSuccessEmbed('Pet Desativado', result.message)],
  });
}

async function handleFeed(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const petId = interaction.options.getString('pet', true);
  const result = await petService.feedPet(interaction.user.id, petId);

  if (result.success) {
    await interaction.editReply({
      embeds: [createSuccessEmbed('Pet Alimentado', `${result.message}\n\nSaldo: ${formatNumber(result.newBalance!)} 🪙`)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleCollect(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const result = await petService.collectPetRewards(interaction.user.id);

  if (result.success) {
    let description = `${result.message}\n\n`;
    description += `🪙 **+${formatNumber(result.coins)} coins**\n`;
    description += `✨ **+${formatNumber(result.xp)} XP**\n`;
    description += `🐾 **+${result.petXp} Pet XP**`;

    if (result.leveledUp) {
      description += `\n\n🎉 **Seu pet subiu para o nivel ${result.newLevel}!**`;
    }

    await interaction.editReply({
      embeds: [createSuccessEmbed('Recompensas Coletadas!', description)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleRename(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const petId = interaction.options.getString('pet', true);
  const newName = interaction.options.getString('nome', true);

  const result = await petService.renamePet(interaction.user.id, petId, newName);

  if (result.success) {
    await interaction.editReply({
      embeds: [createSuccessEmbed('Pet Renomeado', result.message)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleRelease(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const petId = interaction.options.getString('pet', true);
  const result = await petService.releasePet(interaction.user.id, petId);

  if (result.success) {
    await interaction.editReply({
      embeds: [createSuccessEmbed('Pet Liberado', result.message)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleInfo(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const petId = interaction.options.getString('pet', true);
  const petDef = await petService.getPetDefinition(petId);

  if (!petDef) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Pet nao encontrado.')],
    });
    return;
  }

  const userPet = await petRepository.getUserPetById(interaction.user.id, petId);

  const embed = new EmbedBuilder()
    .setColor(RARITY_COLORS[petDef.rarity])
    .setTitle(`${petDef.emoji} ${petDef.name}`)
    .setDescription(petDef.description)
    .addFields(
      { name: 'Raridade', value: RARITY_NAMES[petDef.rarity], inline: true },
      { name: 'Preco', value: `${formatNumber(petDef.price)} 🪙`, inline: true },
      { name: 'Nivel Max', value: `${petDef.maxLevel}`, inline: true },
      { name: 'Coins/Hora', value: `+${petDef.baseCoinsPerHour}`, inline: true },
      { name: 'XP/Hora', value: `+${petDef.baseXpPerHour}`, inline: true },
      { name: 'Custo Alimentar', value: `${petDef.feedCost} 🪙`, inline: true },
    );

  if (petDef.specialAbility) {
    embed.addFields({ name: 'Habilidade Especial', value: petDef.specialAbility, inline: false });
  }

  if (userPet) {
    embed.addFields({
      name: '📊 Seu Status',
      value: `Nome: **${userPet.name}**\n` +
        `Nivel: **${userPet.level}**\n` +
        `Ativo: ${userPet.isActive ? 'Sim' : 'Nao'}\n` +
        `Total Gerado: ${formatNumber(userPet.totalCoinsGenerated)} 🪙`,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

function createProgressBar(current: number, max: number, length: number): string {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
