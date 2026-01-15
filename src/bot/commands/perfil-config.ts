import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { userRepository } from '../../database/repositories/userRepository';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';

// Valid color options
const COLOR_OPTIONS = [
  { name: 'Padrao (Blurple)', value: 'default' },
  { name: 'Vermelho', value: '#ED4245' },
  { name: 'Verde', value: '#57F287' },
  { name: 'Azul', value: '#3498DB' },
  { name: 'Roxo', value: '#9B59B6' },
  { name: 'Rosa', value: '#E91E63' },
  { name: 'Laranja', value: '#E67E22' },
  { name: 'Amarelo', value: '#F1C40F' },
  { name: 'Turquesa', value: '#1ABC9C' },
  { name: 'Dourado', value: '#FFD700' },
];

export const data = new SlashCommandBuilder()
  .setName('perfil-config')
  .setDescription('Personalizar seu perfil')
  .addSubcommand((sub) =>
    sub
      .setName('cor')
      .setDescription('Mudar a cor do seu perfil')
      .addStringOption((opt) =>
        opt
          .setName('cor')
          .setDescription('Cor do perfil')
          .setRequired(true)
          .addChoices(...COLOR_OPTIONS.map(c => ({ name: c.name, value: c.value })))
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('bio')
      .setDescription('Definir sua bio')
      .addStringOption((opt) =>
        opt
          .setName('texto')
          .setDescription('Sua bio (max 200 caracteres)')
          .setRequired(true)
          .setMaxLength(200)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('limpar-bio')
      .setDescription('Remover sua bio')
  )
  .addSubcommand((sub) =>
    sub
      .setName('privacidade')
      .setDescription('Configurar privacidade do perfil')
      .addStringOption((opt) =>
        opt
          .setName('opcao')
          .setDescription('O que configurar')
          .setRequired(true)
          .addChoices(
            { name: 'Mostrar/Ocultar Estatisticas', value: 'stats' },
            { name: 'Mostrar/Ocultar Badges', value: 'badges' },
            { name: 'Mostrar/Ocultar Streak', value: 'streak' },
            { name: 'Mostrar/Ocultar Moedas', value: 'coins' },
            { name: 'Mostrar/Ocultar Rank', value: 'rank' },
            { name: 'Perfil Privado (so voce ve)', value: 'private' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('ver')
      .setDescription('Ver suas configuracoes atuais')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();
  const user = await userRepository.findOrCreate(
    interaction.user.id,
    interaction.user.username,
    interaction.user.globalName,
    interaction.user.avatar
  );

  switch (subcommand) {
    case 'cor': {
      const color = interaction.options.getString('cor', true);
      const colorValue = color === 'default' ? null : color;

      await userRepository.updateProfile(interaction.user.id, { profileColor: colorValue });

      const colorName = COLOR_OPTIONS.find(c => c.value === color)?.name || color;
      await interaction.editReply({
        embeds: [createSuccessEmbed('Cor Atualizada', `A cor do seu perfil foi alterada para **${colorName}**.`)],
      });
      break;
    }

    case 'bio': {
      const bio = interaction.options.getString('texto', true);

      await userRepository.updateProfile(interaction.user.id, { profileBio: bio });

      await interaction.editReply({
        embeds: [createSuccessEmbed('Bio Atualizada', `Sua bio foi atualizada:\n\n"${bio}"`)],
      });
      break;
    }

    case 'limpar-bio': {
      await userRepository.updateProfile(interaction.user.id, { profileBio: null });

      await interaction.editReply({
        embeds: [createSuccessEmbed('Bio Removida', 'Sua bio foi removida do perfil.')],
      });
      break;
    }

    case 'privacidade': {
      const option = interaction.options.getString('opcao', true);

      const settingsMap: Record<string, keyof typeof user.profileSettings> = {
        stats: 'showStats',
        badges: 'showBadges',
        streak: 'showStreak',
        coins: 'showCoins',
        rank: 'showRank',
        private: 'privateProfile',
      };

      const settingKey = settingsMap[option];
      const currentValue = user.profileSettings[settingKey];
      const newValue = !currentValue;

      const newSettings = { ...user.profileSettings, [settingKey]: newValue };
      await userRepository.updateProfile(interaction.user.id, { profileSettings: newSettings });

      const optionNames: Record<string, string> = {
        stats: 'Estatisticas',
        badges: 'Badges',
        streak: 'Streak',
        coins: 'Moedas',
        rank: 'Rank',
        private: 'Perfil Privado',
      };

      const statusText = option === 'private'
        ? (newValue ? 'Seu perfil agora e **privado**' : 'Seu perfil agora e **publico**')
        : (newValue ? `**${optionNames[option]}** agora estao **visiveis**` : `**${optionNames[option]}** agora estao **ocultos**`);

      await interaction.editReply({
        embeds: [createSuccessEmbed('Privacidade Atualizada', statusText)],
      });
      break;
    }

    case 'ver': {
      const settings = user.profileSettings;
      const colorName = user.profileColor
        ? COLOR_OPTIONS.find(c => c.value === user.profileColor)?.name || user.profileColor
        : 'Padrao';

      const embed = new EmbedBuilder()
        .setColor(user.profileColor ? parseInt(user.profileColor.replace('#', ''), 16) : COLORS.PRIMARY)
        .setTitle('⚙️ Configuracoes do Perfil')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '🎨 Cor', value: colorName, inline: true },
          { name: '📝 Bio', value: user.profileBio || 'Nenhuma', inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          {
            name: '🔒 Privacidade',
            value: [
              `${settings.showStats ? '✅' : '❌'} Estatisticas`,
              `${settings.showBadges ? '✅' : '❌'} Badges`,
              `${settings.showStreak ? '✅' : '❌'} Streak`,
              `${settings.showCoins ? '✅' : '❌'} Moedas`,
              `${settings.showRank ? '✅' : '❌'} Rank`,
              `${settings.privateProfile ? '🔒' : '🌐'} Perfil ${settings.privateProfile ? 'Privado' : 'Publico'}`,
            ].join('\n'),
            inline: false,
          },
        )
        .setFooter({ text: 'Use /perfil-config para alterar' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }
  }
}
