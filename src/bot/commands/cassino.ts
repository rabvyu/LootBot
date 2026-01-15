import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { casinoService } from '../../services/casinoService';

export const data = new SlashCommandBuilder()
  .setName('cassino')
  .setDescription('Jogos de cassino')
  .addSubcommand(sub =>
    sub
      .setName('coinflip')
      .setDescription('Aposte em cara ou coroa')
      .addIntegerOption(opt =>
        opt
          .setName('aposta')
          .setDescription('Quantidade para apostar')
          .setRequired(true)
          .setMinValue(10)
      )
      .addStringOption(opt =>
        opt
          .setName('escolha')
          .setDescription('Cara ou Coroa')
          .setRequired(true)
          .addChoices(
            { name: 'Cara', value: 'cara' },
            { name: 'Coroa', value: 'coroa' }
          )
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('dados')
      .setDescription('Role dados contra a casa')
      .addIntegerOption(opt =>
        opt
          .setName('aposta')
          .setDescription('Quantidade para apostar')
          .setRequired(true)
          .setMinValue(10)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('slots')
      .setDescription('Jogue na máquina de slots')
      .addIntegerOption(opt =>
        opt
          .setName('aposta')
          .setDescription('Quantidade para apostar')
          .setRequired(true)
          .setMinValue(10)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('roleta')
      .setDescription('Jogue na roleta')
      .addIntegerOption(opt =>
        opt
          .setName('aposta')
          .setDescription('Quantidade para apostar')
          .setRequired(true)
          .setMinValue(10)
      )
      .addStringOption(opt =>
        opt
          .setName('tipo')
          .setDescription('Tipo de aposta')
          .setRequired(true)
          .addChoices(
            { name: 'Vermelho', value: 'vermelho' },
            { name: 'Preto', value: 'preto' },
            { name: 'Par', value: 'par' },
            { name: 'Ímpar', value: 'impar' },
            { name: 'Número Específico', value: 'numero' }
          )
      )
      .addIntegerOption(opt =>
        opt
          .setName('numero')
          .setDescription('Número específico (0-36)')
          .setMinValue(0)
          .setMaxValue(36)
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('crash')
      .setDescription('Aposte e saia antes do crash!')
      .addIntegerOption(opt =>
        opt
          .setName('aposta')
          .setDescription('Quantidade para apostar')
          .setRequired(true)
          .setMinValue(10)
      )
      .addNumberOption(opt =>
        opt
          .setName('multiplicador')
          .setDescription('Multiplicador para sair (1.1 - 10)')
          .setRequired(true)
          .setMinValue(1.1)
          .setMaxValue(10)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('maiormenor')
      .setDescription('Adivinhe se o próximo número será maior ou menor')
      .addIntegerOption(opt =>
        opt
          .setName('aposta')
          .setDescription('Quantidade para apostar')
          .setRequired(true)
          .setMinValue(10)
      )
      .addStringOption(opt =>
        opt
          .setName('escolha')
          .setDescription('Maior ou Menor')
          .setRequired(true)
          .addChoices(
            { name: 'Maior', value: 'maior' },
            { name: 'Menor', value: 'menor' }
          )
      )
  )
  .addSubcommand(sub =>
    sub.setName('ajuda').setDescription('Ver informações sobre os jogos')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'coinflip':
      await handleCoinflip(interaction);
      break;
    case 'dados':
      await handleDados(interaction);
      break;
    case 'slots':
      await handleSlots(interaction);
      break;
    case 'roleta':
      await handleRoleta(interaction);
      break;
    case 'crash':
      await handleCrash(interaction);
      break;
    case 'maiormenor':
      await handleMaiorMenor(interaction);
      break;
    case 'ajuda':
      await handleAjuda(interaction);
      break;
  }
}

async function handleCoinflip(interaction: ChatInputCommandInteraction) {
  const aposta = interaction.options.getInteger('aposta', true);
  const escolha = interaction.options.getString('escolha', true) as 'cara' | 'coroa';

  const result = await casinoService.coinflip(interaction.user.id, aposta, escolha);

  if (!result.success) {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🪙 Coinflip')
    .setDescription(result.details || '')
    .addFields(
      { name: 'Sua Escolha', value: escolha.charAt(0).toUpperCase() + escolha.slice(1), inline: true },
      { name: 'Aposta', value: `${aposta} coins`, inline: true },
      { name: result.won ? '💰 Ganho' : '💸 Perdido', value: `${Math.abs(result.netGain)} coins`, inline: true }
    )
    .setColor(result.won ? '#00FF00' : '#FF0000')
    .setFooter({ text: result.message });

  await interaction.reply({ embeds: [embed] });
}

async function handleDados(interaction: ChatInputCommandInteraction) {
  const aposta = interaction.options.getInteger('aposta', true);

  const result = await casinoService.dice(interaction.user.id, aposta);

  if (!result.success) {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎲 Dados')
    .setDescription(result.details || '')
    .addFields(
      { name: 'Aposta', value: `${aposta} coins`, inline: true },
      { name: result.netGain >= 0 ? '💰 Ganho' : '💸 Perdido', value: `${Math.abs(result.netGain)} coins`, inline: true }
    )
    .setColor(result.won ? '#00FF00' : result.netGain === 0 ? '#FFFF00' : '#FF0000')
    .setFooter({ text: result.message });

  await interaction.reply({ embeds: [embed] });
}

async function handleSlots(interaction: ChatInputCommandInteraction) {
  const aposta = interaction.options.getInteger('aposta', true);

  const result = await casinoService.slots(interaction.user.id, aposta);

  if (!result.success) {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎰 Slots')
    .setDescription(result.details || '')
    .addFields(
      { name: 'Aposta', value: `${aposta} coins`, inline: true },
      { name: result.won ? '💰 Ganho' : '💸 Perdido', value: `${result.won ? result.winAmount : aposta} coins`, inline: true }
    )
    .setColor(result.won ? '#00FF00' : '#FF0000')
    .setFooter({ text: result.message });

  await interaction.reply({ embeds: [embed] });
}

async function handleRoleta(interaction: ChatInputCommandInteraction) {
  const aposta = interaction.options.getInteger('aposta', true);
  const tipo = interaction.options.getString('tipo', true) as 'vermelho' | 'preto' | 'par' | 'impar' | 'numero';
  const numero = interaction.options.getInteger('numero');

  if (tipo === 'numero' && numero === null) {
    await interaction.reply({
      content: '❌ Você precisa especificar um número (0-36) para apostar em número específico!',
      ephemeral: true,
    });
    return;
  }

  const result = await casinoService.roulette(
    interaction.user.id,
    aposta,
    tipo,
    numero !== null ? numero : undefined
  );

  if (!result.success) {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    return;
  }

  const tipoDisplay: Record<string, string> = {
    vermelho: '🔴 Vermelho',
    preto: '⚫ Preto',
    par: '2️⃣ Par',
    impar: '1️⃣ Ímpar',
    numero: `#️⃣ Número ${numero}`,
  };

  const embed = new EmbedBuilder()
    .setTitle('🎡 Roleta')
    .setDescription(result.details || '')
    .addFields(
      { name: 'Aposta', value: tipoDisplay[tipo], inline: true },
      { name: 'Valor', value: `${aposta} coins`, inline: true },
      { name: result.won ? '💰 Ganho' : '💸 Perdido', value: `${result.won ? result.winAmount : aposta} coins`, inline: true }
    )
    .setColor(result.won ? '#00FF00' : '#FF0000')
    .setFooter({ text: result.message });

  await interaction.reply({ embeds: [embed] });
}

async function handleCrash(interaction: ChatInputCommandInteraction) {
  const aposta = interaction.options.getInteger('aposta', true);
  const multiplicador = interaction.options.getNumber('multiplicador', true);

  const result = await casinoService.crash(interaction.user.id, aposta, multiplicador);

  if (!result.success) {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📈 Crash')
    .setDescription(result.details || '')
    .addFields(
      { name: 'Aposta', value: `${aposta} coins`, inline: true },
      { name: result.won ? '💰 Ganho' : '💸 Perdido', value: `${result.won ? result.winAmount : aposta} coins`, inline: true }
    )
    .setColor(result.won ? '#00FF00' : '#FF0000')
    .setFooter({ text: result.message });

  await interaction.reply({ embeds: [embed] });
}

async function handleMaiorMenor(interaction: ChatInputCommandInteraction) {
  const aposta = interaction.options.getInteger('aposta', true);
  const escolha = interaction.options.getString('escolha', true) as 'maior' | 'menor';

  const result = await casinoService.higherLower(interaction.user.id, aposta, escolha);

  if (!result.success) {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    return;
  }

  const escolhaEmoji = escolha === 'maior' ? '⬆️' : '⬇️';

  const embed = new EmbedBuilder()
    .setTitle(`${escolhaEmoji} Maior ou Menor`)
    .setDescription(result.details || '')
    .addFields(
      { name: 'Sua Escolha', value: escolha.charAt(0).toUpperCase() + escolha.slice(1), inline: true },
      { name: 'Aposta', value: `${aposta} coins`, inline: true },
      { name: result.won ? '💰 Ganho' : '💸 Perdido', value: `${result.won ? result.winAmount : aposta} coins`, inline: true }
    )
    .setColor(result.won ? '#00FF00' : '#FF0000')
    .setFooter({ text: result.message });

  await interaction.reply({ embeds: [embed] });
}

async function handleAjuda(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('🎰 Cassino - Guia de Jogos')
    .setDescription('Aposte seus coins e tente a sorte!')
    .addFields(
      {
        name: '🪙 Coinflip',
        value: 'Cara ou Coroa. 50/50 chance.\nPagamento: **1.9x**',
        inline: true,
      },
      {
        name: '🎲 Dados',
        value: 'Role maior que a casa.\nPagamento: **1.9x**',
        inline: true,
      },
      {
        name: '🎰 Slots',
        value: 'Combine 3 símbolos.\nPagamento: **1.5x - 10x**',
        inline: true,
      },
      {
        name: '🎡 Roleta',
        value: 'Cor/Par/Ímpar: **2x**\nNúmero: **35x**',
        inline: true,
      },
      {
        name: '📈 Crash',
        value: 'Saia antes do crash!\nPagamento: **1.1x - 10x**',
        inline: true,
      },
      {
        name: '⬆️ Maior/Menor',
        value: 'Adivinhe a direção.\nPagamento: **1.9x - 5x**',
        inline: true,
      }
    )
    .addFields({
      name: '⚠️ Limites',
      value: `Aposta mínima: **${casinoService.getMinBet()}** coins\nAposta máxima: **${casinoService.getMaxBet()}** coins`,
      inline: false,
    })
    .setColor('#FFD700')
    .setFooter({ text: 'Jogue com responsabilidade!' });

  await interaction.reply({ embeds: [embed] });
}
