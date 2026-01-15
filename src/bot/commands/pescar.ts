import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { fishingService } from '../../services/fishingService';
import { resourceService } from '../../services/resourceService';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

const RARITY_COLORS: Record<string, number> = {
  trash: 0x9E9E9E,
  common: 0x4CAF50,
  uncommon: 0x2196F3,
  rare: 0x9C27B0,
  epic: 0xFFC107,
  legendary: 0xFF5722,
};

export const data = new SlashCommandBuilder()
  .setName('pescar')
  .setDescription('Va pescar e tente pegar peixes valiosos!');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  // Check cooldown first
  const cooldown = fishingService.getCooldownRemaining(interaction.user.id);
  if (cooldown > 0) {
    const minutes = Math.ceil(cooldown / 60000);
    const seconds = Math.ceil((cooldown % 60000) / 1000);

    await interaction.editReply({
      embeds: [createErrorEmbed(
        '🎣 Aguarde...',
        `Voce precisa esperar **${minutes > 0 ? `${minutes}m ` : ''}${seconds}s** antes de pescar novamente.`
      )],
    });
    return;
  }

  // Check for bait
  const baitAmount = await resourceService.getUserResourceAmount(interaction.user.id, 'bait');

  const result = await fishingService.fish(interaction.user.id);

  if (!result.success) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
    return;
  }

  const fish = result.caught!;

  const embed = new EmbedBuilder()
    .setColor(RARITY_COLORS[fish.rarity] || COLORS.PRIMARY)
    .setTitle('🎣 Pesca!')
    .setDescription(`Voce jogou a linha e pescou...\n\n${fish.emoji} **${fish.name}**!`)
    .addFields(
      { name: 'Raridade', value: capitalizeFirst(fish.rarity), inline: true },
      { name: 'Valor', value: `${formatNumber(fish.value)} 🪙`, inline: true },
      { name: 'XP Ganho', value: `+${result.xpGained}`, inline: true },
    )
    .setFooter({ text: baitAmount > 0 ? `Isca usada! Restam: ${baitAmount - 1}` : 'Dica: Use iscas para melhorar suas chances!' })
    .setTimestamp();

  if (fish.rarity === 'legendary') {
    embed.setDescription(`🎉 **LENDARIO!** 🎉\n\nVoce jogou a linha e pescou...\n\n${fish.emoji} **${fish.name}**!`);
  }

  await interaction.editReply({ embeds: [embed] });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
