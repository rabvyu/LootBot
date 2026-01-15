import { partyRepository } from '../database/repositories/partyRepository';
import { rpgRepository } from '../database/repositories/rpgRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { equipmentService } from './equipmentService';
import { PartyDocument, PartyMember } from '../database/models/Party';
import { getRandomMonsterFromLocation, getLocationById, MonsterData } from '../data/monsters';
import { logger } from '../utils/logger';

const MAX_PARTY_SIZE = 8;
const PARTY_MONSTER_HP_MULT = 1.5;
const PARTY_MONSTER_ATK_MULT = 1.2;
const CONTRIBUTION_BONUS = 0.3; // 30% bonus based on contribution

export interface PartyBattleResult {
  victory: boolean;
  rounds: string[];
  totalDamage: number;
  memberResults: {
    discordId: string;
    username: string;
    damageDealt: number;
    xpEarned: number;
    coinsEarned: number;
    contributionPercent: number;
  }[];
  monsterName: string;
  monsterEmoji: string;
}

class PartyService {
  async createParty(discordId: string, username: string): Promise<{ success: boolean; message: string }> {
    const existing = await partyRepository.getPartyByMember(discordId);
    if (existing) {
      return { success: false, message: 'Voce ja esta em um grupo.' };
    }

    await partyRepository.createParty(discordId, username);
    logger.info(`Party created by ${username} (${discordId})`);

    return { success: true, message: `Grupo criado! Use \`/grupo convidar @usuario\` para adicionar membros.` };
  }

  async inviteMember(leaderId: string, targetId: string, targetName: string): Promise<{ success: boolean; message: string }> {
    const party = await partyRepository.getPartyByLeader(leaderId);
    if (!party) {
      return { success: false, message: 'Voce nao e lider de um grupo.' };
    }

    if (party.members.length >= MAX_PARTY_SIZE) {
      return { success: false, message: `O grupo ja esta cheio (${MAX_PARTY_SIZE} membros).` };
    }

    const targetParty = await partyRepository.getPartyByMember(targetId);
    if (targetParty) {
      return { success: false, message: 'Este usuario ja esta em um grupo.' };
    }

    if (party.inBattle) {
      return { success: false, message: 'Nao pode convidar durante uma batalha.' };
    }

    const newMember: PartyMember = {
      odiscordId: targetId,
      username: targetName,
      joinedAt: new Date(),
      contribution: 0,
      damageDealt: 0,
    };

    await partyRepository.addMember(party._id.toString(), newMember);

    return { success: true, message: `**${targetName}** entrou no grupo!` };
  }

  async leaveParty(discordId: string): Promise<{ success: boolean; message: string }> {
    const party = await partyRepository.getPartyByMember(discordId);
    if (!party) {
      return { success: false, message: 'Voce nao esta em um grupo.' };
    }

    if (party.inBattle) {
      return { success: false, message: 'Nao pode sair durante uma batalha.' };
    }

    if (party.leaderId === discordId) {
      // If leader leaves, disband or transfer
      if (party.members.length === 1) {
        await partyRepository.disbandParty(party._id.toString());
        return { success: true, message: 'Grupo dissolvido.' };
      } else {
        // Transfer to next member
        const nextLeader = party.members.find(m => m.odiscordId !== discordId);
        if (nextLeader) {
          await partyRepository.transferLeadership(party._id.toString(), nextLeader.odiscordId, nextLeader.username);
          await partyRepository.removeMember(party._id.toString(), discordId);
          return { success: true, message: `Voce saiu do grupo. **${nextLeader.username}** e o novo lider.` };
        }
      }
    }

    await partyRepository.removeMember(party._id.toString(), discordId);
    return { success: true, message: 'Voce saiu do grupo.' };
  }

  async disbandParty(leaderId: string): Promise<{ success: boolean; message: string }> {
    const party = await partyRepository.getPartyByLeader(leaderId);
    if (!party) {
      return { success: false, message: 'Voce nao e lider de um grupo.' };
    }

    if (party.inBattle) {
      return { success: false, message: 'Nao pode dissolver durante uma batalha.' };
    }

    await partyRepository.disbandParty(party._id.toString());
    return { success: true, message: 'Grupo dissolvido.' };
  }

  async getPartyInfo(discordId: string): Promise<PartyDocument | null> {
    return partyRepository.getPartyByMember(discordId);
  }

  async partyBattle(leaderId: string, locationId: string): Promise<PartyBattleResult | { error: string }> {
    const party = await partyRepository.getPartyByLeader(leaderId);
    if (!party) {
      return { error: 'Voce nao e lider de um grupo.' };
    }

    if (party.inBattle) {
      return { error: 'O grupo ja esta em batalha.' };
    }

    const location = getLocationById(locationId);
    if (!location) {
      return { error: 'Localizacao nao encontrada.' };
    }

    // Get average party level
    let totalLevel = 0;
    const memberChars = [];
    for (const member of party.members) {
      const char = await rpgRepository.getCharacter(member.odiscordId);
      if (char) {
        totalLevel += char.level;
        memberChars.push({ member, char });
      }
    }

    if (memberChars.length === 0) {
      return { error: 'Nenhum membro do grupo tem personagem.' };
    }

    const avgLevel = Math.floor(totalLevel / memberChars.length);
    const monsterData = getRandomMonsterFromLocation(locationId, avgLevel);

    if (!monsterData) {
      return { error: 'Nenhum monstro encontrado.' };
    }

    // Scale monster for party
    const partySize = memberChars.length;
    const scaledHp = Math.floor(monsterData.hp * PARTY_MONSTER_HP_MULT * (1 + partySize * 0.3));
    const scaledAtk = Math.floor(monsterData.attack * PARTY_MONSTER_ATK_MULT * (1 + partySize * 0.1));

    await partyRepository.startBattle(party._id.toString(), `${Date.now()}`);

    // Simulate party battle
    const result = await this.simulatePartyBattle(
      party,
      memberChars,
      { ...monsterData, hp: scaledHp, attack: scaledAtk }
    );

    await partyRepository.endBattle(party._id.toString(), result.victory);
    await partyRepository.resetContributions(party._id.toString());

    return result;
  }

  private async simulatePartyBattle(
    party: PartyDocument,
    memberChars: { member: PartyMember; char: any }[],
    monster: MonsterData & { hp: number; attack: number }
  ): Promise<PartyBattleResult> {
    const rounds: string[] = [];
    let monsterHp = monster.hp;
    const memberDamage: Record<string, number> = {};
    const memberHp: Record<string, number> = {};

    // Initialize
    for (const { member, char } of memberChars) {
      memberDamage[member.odiscordId] = 0;
      memberHp[member.odiscordId] = char.stats.hp;
    }

    let round = 0;
    const maxRounds = 30;
    let totalDamage = 0;

    while (monsterHp > 0 && round < maxRounds) {
      round++;
      let anyAlive = false;

      // Each member attacks
      for (const { member, char } of memberChars) {
        if (memberHp[member.odiscordId] <= 0) continue;
        anyAlive = true;

        const isCrit = Math.random() * 100 < char.stats.critChance;
        let damage = Math.max(1, char.stats.attack - monster.defense / 2);
        if (isCrit) {
          damage = Math.floor(damage * (char.stats.critDamage / 100));
        }

        monsterHp -= damage;
        memberDamage[member.odiscordId] += damage;
        totalDamage += damage;

        if (round <= 5 || round % 5 === 0) {
          const critText = isCrit ? ' CRIT!' : '';
          rounds.push(`R${round}: **${member.username}** causou ${damage} dano${critText}`);
        }

        if (monsterHp <= 0) break;
      }

      if (!anyAlive || monsterHp <= 0) break;

      // Monster attacks random alive member
      const aliveMembers = memberChars.filter(m => memberHp[m.member.odiscordId] > 0);
      if (aliveMembers.length > 0) {
        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        const monsterDmg = Math.max(1, monster.attack - target.char.stats.defense / 2);
        memberHp[target.member.odiscordId] -= monsterDmg;

        if (round <= 5 || round % 5 === 0) {
          rounds.push(`R${round}: ${monster.emoji} atacou **${target.member.username}** (-${monsterDmg} HP)`);
        }
      }
    }

    const victory = monsterHp <= 0;

    // Calculate rewards based on contribution
    const memberResults: PartyBattleResult['memberResults'] = [];

    for (const { member, char } of memberChars) {
      const damage = memberDamage[member.odiscordId];
      const contributionPercent = totalDamage > 0 ? (damage / totalDamage) * 100 : 0;
      const contributionBonus = 1 + (contributionPercent / 100) * CONTRIBUTION_BONUS;

      let xpEarned = 0;
      let coinsEarned = 0;

      if (victory) {
        xpEarned = Math.floor(monster.xpReward * contributionBonus * 0.7);
        coinsEarned = Math.floor(
          ((monster.coinsReward.min + monster.coinsReward.max) / 2) * contributionBonus * 0.7
        );

        // Give rewards
        await rpgRepository.addExperience(member.odiscordId, xpEarned);
        await economyRepository.addCoins(member.odiscordId, coinsEarned, 'party_battle', `Batalha em grupo: ${monster.name}`);

        // Update contribution
        await partyRepository.updateMemberContribution(party._id.toString(), member.odiscordId, damage);
      }

      memberResults.push({
        discordId: member.odiscordId,
        username: member.username,
        damageDealt: damage,
        xpEarned,
        coinsEarned,
        contributionPercent: Math.floor(contributionPercent),
      });
    }

    if (victory) {
      rounds.push(`\n**VITORIA!** ${monster.emoji} ${monster.name} foi derrotado!`);
    } else {
      rounds.push(`\n**DERROTA!** O grupo foi derrotado por ${monster.emoji} ${monster.name}...`);
    }

    return {
      victory,
      rounds,
      totalDamage,
      memberResults: memberResults.sort((a, b) => b.damageDealt - a.damageDealt),
      monsterName: monster.name,
      monsterEmoji: monster.emoji,
    };
  }

  async kickMember(leaderId: string, targetId: string): Promise<{ success: boolean; message: string }> {
    const party = await partyRepository.getPartyByLeader(leaderId);
    if (!party) {
      return { success: false, message: 'Voce nao e lider de um grupo.' };
    }

    if (targetId === leaderId) {
      return { success: false, message: 'Voce nao pode expulsar a si mesmo.' };
    }

    const member = party.members.find(m => m.odiscordId === targetId);
    if (!member) {
      return { success: false, message: 'Este usuario nao esta no grupo.' };
    }

    await partyRepository.removeMember(party._id.toString(), targetId);
    return { success: true, message: `**${member.username}** foi expulso do grupo.` };
  }
}

export const partyService = new PartyService();
export default partyService;
