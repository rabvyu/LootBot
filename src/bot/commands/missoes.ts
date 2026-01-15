import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
} from 'discord.js';
import { missionService, MissionProgress } from '../../services/missionService';
import { createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { createProgressBar } from '../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('missoes')
  .setDescription('Ver suas missoes ativas');

function createMissionEmbed(
  missions: MissionProgress[],
  type: 'daily' | 'weekly' | 'achievements',
  username: string
): EmbedBuilder {
  const typeNames = {
    daily: 'Diarias',
    weekly: 'Semanais',
    achievements: 'Conquistas',
  };

  const typeEmojis = {
    daily: '📅',
    weekly: '📆',
    achievements: '🏆',
  };

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${typeEmojis[type]} Missoes ${typeNames[type]}`)
    .setFooter({ text: `Missoes de ${username}` })
    .setTimestamp();

  if (missions.length === 0) {
    embed.setDescription('Nenhuma missao disponivel nesta categoria.');
    return embed;
  }

  const missionLines = missions.map((mp) => {
    const status = mp.userMission.completed ? '✅' : '⬜';
    const progress = `${mp.userMission.progress}/${mp.mission.target}`;
    const progressBar = createProgressBar(mp.percentComplete, 8);
    const rewards = [];
    if (mp.mission.xpReward > 0) rewards.push(`${mp.mission.xpReward} XP`);
    if (mp.mission.coinsReward > 0) rewards.push(`${mp.mission.coinsReward} 🪙`);

    return [
      `${status} **${mp.mission.name}**`,
      `┗ ${mp.mission.description}`,
      `  ${progressBar} ${progress}`,
      `  Recompensa: ${rewards.join(' + ')}`,
    ].join('\n');
  });

  embed.setDescription(missionLines.join('\n\n'));

  // Add completion stats
  const completed = missions.filter(m => m.userMission.completed).length;
  embed.addFields({
    name: 'Progresso',
    value: `${completed}/${missions.length} concluidas`,
    inline: true,
  });

  return embed;
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  try {
    const allMissions = await missionService.getAllMissions(interaction.user.id);

    // Track command usage for missions
    await missionService.trackCommandUsed(interaction.user.id);

    // Create select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('mission_type_select')
      .setPlaceholder('Selecione o tipo de missao')
      .addOptions([
        {
          label: 'Missoes Diarias',
          description: 'Missoes que resetam todo dia',
          value: 'daily',
          emoji: '📅',
        },
        {
          label: 'Missoes Semanais',
          description: 'Missoes que resetam toda semana',
          value: 'weekly',
          emoji: '📆',
        },
        {
          label: 'Conquistas',
          description: 'Missoes unicas que dao recompensas especiais',
          value: 'achievements',
          emoji: '🏆',
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    // Send initial embed with daily missions
    const initialEmbed = createMissionEmbed(allMissions.daily, 'daily', interaction.user.username);

    const response = await interaction.editReply({
      embeds: [initialEmbed],
      components: [row],
    });

    // Create collector for select menu
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000, // 1 minute
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: 'Apenas quem usou o comando pode interagir!',
          ephemeral: true,
        });
        return;
      }

      const selected = i.values[0] as 'daily' | 'weekly' | 'achievements';
      const missions = allMissions[selected];
      const embed = createMissionEmbed(missions, selected, interaction.user.username);

      await i.update({ embeds: [embed], components: [row] });
    });

    collector.on('end', async () => {
      // Disable select menu after timeout
      selectMenu.setDisabled(true);
      const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      try {
        await interaction.editReply({ components: [disabledRow] });
      } catch {
        // Ignore if message was deleted
      }
    });
  } catch (error) {
    console.error('Error in missoes command:', error);
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao carregar suas missoes.')],
    });
  }
}
