import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { Character } from '../../database/models';
import { skillTreeService } from '../../services/skillTreeService';
import { getSkillById, getAllSkillsByClass, Skill } from '../../data/skills';

export const data = new SlashCommandBuilder()
  .setName('skills')
  .setDescription('Sistema de Skills e Skill Tree')
  .addSubcommand(sub =>
    sub
      .setName('ver')
      .setDescription('Ver sua skill tree completa')
  )
  .addSubcommand(sub =>
    sub
      .setName('aprender')
      .setDescription('Aprender ou melhorar uma skill')
      .addStringOption(opt =>
        opt
          .setName('skill')
          .setDescription('ID da skill para aprender')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('info')
      .setDescription('Ver detalhes de uma skill')
      .addStringOption(opt =>
        opt
          .setName('skill')
          .setDescription('ID da skill')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('aprendidas')
      .setDescription('Ver suas skills aprendidas')
  );

export async function autocomplete(interaction: any) {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'skill') {
    const character = await Character.findOne({ discordId: interaction.user.id });
    if (!character) {
      return interaction.respond([]);
    }

    const baseClass = character.baseClass || character.class;
    const skills = getAllSkillsByClass(baseClass as string);
    const filtered = skills
      .filter(s => s.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
                   s.id.toLowerCase().includes(focusedOption.value.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      filtered.map(s => ({
        name: `${s.emoji} ${s.name} (${s.branch})`,
        value: s.id,
      }))
    );
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.data[0]?.name;

  switch (subcommand) {
    case 'ver':
      return handleViewSkillTree(interaction);
    case 'aprender':
      return handleLearnSkill(interaction);
    case 'info':
      return handleSkillInfo(interaction);
    case 'aprendidas':
      return handleLearnedSkills(interaction);
    default:
      return handleViewSkillTree(interaction);
  }
}

async function handleViewSkillTree(interaction: ChatInputCommandInteraction) {
  const view = await skillTreeService.getSkillTreeView(interaction.user.id);

  if (!view) {
    return interaction.reply({
      content: '❌ Você precisa ter um personagem! Use `/rpg criar` primeiro.',
      ephemeral: true,
    });
  }

  const branchEmojis: Record<string, string> = {
    offensive: '⚔️',
    defensive: '🛡️',
    utility: '🔧',
    ultimate: '🌟',
  };

  const embed = new EmbedBuilder()
    .setTitle(`📚 Skill Tree - ${view.className}`)
    .setColor(0x9B59B6)
    .setDescription(
      `**Pontos Totais:** ${view.totalPoints}\n` +
      `**Pontos Disponíveis:** ${view.pointsAvailable}\n` +
      `**Pontos Gastos:** ${view.pointsSpent}`
    );

  for (const [branchKey, branch] of Object.entries(view.branches)) {
    const branchEmoji = branchEmojis[branchKey] || '📖';
    const learnedCount = branch.skills.filter(s => s.learned).length;
    const totalCount = branch.skills.length;

    let fieldValue = `Pontos: ${branch.pointsSpent} | Skills: ${learnedCount}/${totalCount}\n\n`;

    // Agrupar por tier
    const tiers: Record<number, typeof branch.skills> = {};
    for (const skillData of branch.skills) {
      if (!tiers[skillData.skill.tier]) {
        tiers[skillData.skill.tier] = [];
      }
      tiers[skillData.skill.tier].push(skillData);
    }

    for (const [tier, skills] of Object.entries(tiers)) {
      const tierName = tier === '4' ? 'Ultimate' : `Tier ${tier}`;
      fieldValue += `**${tierName}:**\n`;

      for (const skillData of skills) {
        const status = skillData.learned
          ? `✅ Nv.${skillData.level}/${skillData.skill.maxLevel}`
          : skillData.canLearn
            ? '🔓'
            : '🔒';
        fieldValue += `${skillData.skill.emoji} ${skillData.skill.name} ${status}\n`;
      }
      fieldValue += '\n';
    }

    if (fieldValue.length > 1024) {
      fieldValue = fieldValue.substring(0, 1020) + '...';
    }

    embed.addFields({
      name: `${branchEmoji} ${branch.name}`,
      value: fieldValue,
      inline: true,
    });
  }

  embed.setFooter({ text: 'Use /skills aprender <skill> para aprender skills' });

  await interaction.reply({ embeds: [embed] });
}

async function handleLearnSkill(interaction: ChatInputCommandInteraction) {
  const skillId = interaction.options.get('skill')?.value as string;

  if (!skillId) {
    return interaction.reply({
      content: '❌ Especifique uma skill para aprender.',
      ephemeral: true,
    });
  }

  const result = await skillTreeService.learnSkill(interaction.user.id, skillId);

  if (!result.success) {
    return interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('✨ Skill Aprendida!')
    .setColor(0x2ECC71)
    .setDescription(result.message);

  if (result.skill) {
    embed.addFields(
      { name: 'Descrição', value: result.skill.description, inline: false },
      { name: 'Tipo', value: result.skill.isPassive ? '🔵 Passiva' : '🔴 Ativa', inline: true },
      { name: 'Custo', value: `${result.skill.pointsCost} pontos`, inline: true },
      { name: 'Pontos Restantes', value: `${result.pointsRemaining}`, inline: true }
    );

    // Mostrar efeitos
    const effectsText = result.skill.effects
      .map(e => `• ${e.description}`)
      .join('\n');
    embed.addFields({ name: 'Efeitos', value: effectsText || 'Nenhum', inline: false });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleSkillInfo(interaction: ChatInputCommandInteraction) {
  const skillId = interaction.options.get('skill')?.value as string;

  const skill = getSkillById(skillId);
  if (!skill) {
    return interaction.reply({
      content: '❌ Skill não encontrada.',
      ephemeral: true,
    });
  }

  const tierNames: Record<number, string> = {
    1: 'Tier 1 (Básico)',
    2: 'Tier 2 (Intermediário)',
    3: 'Tier 3 (Avançado)',
    4: 'Ultimate',
  };

  const branchNames: Record<string, string> = {
    offensive: '⚔️ Ofensiva',
    defensive: '🛡️ Defensiva',
    utility: '🔧 Utilidade',
    ultimate: '🌟 Ultimate',
  };

  const embed = new EmbedBuilder()
    .setTitle(`${skill.emoji} ${skill.name}`)
    .setColor(skill.tier === 4 ? 0xF1C40F : 0x3498DB)
    .setDescription(skill.description)
    .addFields(
      { name: 'Árvore', value: branchNames[skill.branch] || skill.branch, inline: true },
      { name: 'Tier', value: tierNames[skill.tier] || `Tier ${skill.tier}`, inline: true },
      { name: 'Tipo', value: skill.isPassive ? '🔵 Passiva' : '🔴 Ativa', inline: true },
      { name: 'Custo', value: `${skill.pointsCost} pontos`, inline: true },
      { name: 'Nível Máximo', value: `${skill.maxLevel}`, inline: true },
      { name: 'Req. Pontos na Árvore', value: `${skill.requiredPoints}`, inline: true }
    );

  // Efeitos
  const effectsText = skill.effects
    .map(e => {
      let text = `• ${e.description}`;
      if (e.duration) text += ` (${e.duration} turnos)`;
      if (e.condition) text += ` [${e.condition}]`;
      return text;
    })
    .join('\n');

  embed.addFields({ name: 'Efeitos (por nível)', value: effectsText || 'Nenhum', inline: false });

  if (!skill.isPassive) {
    if (skill.cooldown) {
      embed.addFields({ name: 'Cooldown', value: `${skill.cooldown} turnos`, inline: true });
    }
    if (skill.manaCost) {
      embed.addFields({ name: 'Custo de Mana', value: `${skill.manaCost}`, inline: true });
    }
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleLearnedSkills(interaction: ChatInputCommandInteraction) {
  const learnedSkills = await skillTreeService.getLearnedSkills(interaction.user.id);

  if (learnedSkills.length === 0) {
    return interaction.reply({
      content: '📚 Você ainda não aprendeu nenhuma skill! Use `/skills ver` para ver as opções.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📚 Suas Skills Aprendidas')
    .setColor(0x9B59B6);

  // Agrupar por branch
  const byBranch: Record<string, typeof learnedSkills> = {};
  for (const ls of learnedSkills) {
    if (!byBranch[ls.skill.branch]) {
      byBranch[ls.skill.branch] = [];
    }
    byBranch[ls.skill.branch].push(ls);
  }

  const branchNames: Record<string, string> = {
    offensive: '⚔️ Ofensivas',
    defensive: '🛡️ Defensivas',
    utility: '🔧 Utilidade',
    ultimate: '🌟 Ultimates',
  };

  for (const [branch, skills] of Object.entries(byBranch)) {
    const skillList = skills
      .map(ls => {
        const type = ls.skill.isPassive ? '🔵' : '🔴';
        return `${ls.skill.emoji} **${ls.skill.name}** Nv.${ls.level}/${ls.skill.maxLevel} ${type}`;
      })
      .join('\n');

    embed.addFields({
      name: branchNames[branch] || branch,
      value: skillList,
      inline: false,
    });
  }

  // Calcular bônus totais
  const bonuses = await skillTreeService.calculateSkillBonuses(interaction.user.id);
  let bonusText = '';
  if (bonuses.damageBonus) bonusText += `⚔️ Dano: +${bonuses.damageBonus}%\n`;
  if (bonuses.defenseBonus) bonusText += `🛡️ Defesa: +${bonuses.defenseBonus}%\n`;
  if (bonuses.hpBonus) bonusText += `❤️ HP: +${bonuses.hpBonus}\n`;
  if (bonuses.critBonus) bonusText += `🎯 Crítico: +${bonuses.critBonus}%\n`;
  if (bonuses.lifesteal) bonusText += `🩸 Lifesteal: +${bonuses.lifesteal}%\n`;
  if (bonuses.evasion) bonusText += `💨 Evasão: +${bonuses.evasion}%\n`;
  if (bonuses.xpBonus) bonusText += `📚 XP: +${bonuses.xpBonus}%\n`;
  if (bonuses.dropBonus) bonusText += `🎁 Drop: +${bonuses.dropBonus}%\n`;

  if (bonusText) {
    embed.addFields({ name: '📊 Bônus Passivos Totais', value: bonusText, inline: false });
  }

  await interaction.reply({ embeds: [embed] });
}
