import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from 'discord.js';
import { COLORS } from '../../utils/constants';

// Detailed guides for specific topics
const GUIDES = {
  iniciante: {
    title: '📚 Guia do Iniciante',
    description: `**Seu primeiro dia no LootBot**

**Passo 1: Configure seu perfil**
\`\`\`
/daily
\`\`\`
Colete sua primeira recompensa!

**Passo 2: Crie seu personagem**
\`\`\`
/rpg criar MeuHeroi
\`\`\`
Escolha sua classe preferida.

**Passo 3: Primeira batalha**
\`\`\`
/rpg batalhar slime
\`\`\`
Slimes são fáceis - perfeitos para começar!

**Passo 4: Explore recursos**
\`\`\`
/pescar
/expedicao iniciar floresta
\`\`\`

**Passo 5: Compre um pet**
\`\`\`
/pet loja
/pet comprar <id>
\`\`\`

**Rotina diária:**
1. \`/daily\` - Recompensa diária
2. \`/pet coletar\` - Coins do pet
3. \`/expedicao resgatar\` - Recursos
4. \`/rpg batalhar\` - XP e loot
5. \`/pescar\` - Peixes para vender

**Dica:** Não gaste todas as coins! Guarde para um bom pet.`,
  },
  classes: {
    title: '⚔️ Guia de Classes',
    description: `**Escolha sua classe com sabedoria!**

**⚔️ GUERREIRO**
• HP: ████████░░ Alto
• Dano: █████░░░░░ Médio
• Defesa: ███████░░░ Alta
• Papel: Tank
• Skill Ultimate: Fúria Berserker
*Melhor para: Iniciantes, tankar dungeons*

**🔮 MAGO**
• HP: ███░░░░░░░ Baixo
• Dano: █████████░ Muito Alto
• Defesa: ██░░░░░░░░ Baixa
• Papel: DPS Mágico
• Skill Ultimate: Meteoro
*Melhor para: DPS puro, raids*

**🏹 ARQUEIRO**
• HP: █████░░░░░ Médio
• Dano: ███████░░░ Alto
• Defesa: ████░░░░░░ Média
• Papel: DPS Crítico
• Skill Ultimate: Chuva de Flechas
*Melhor para: Balanceado, críticos*

**🛡️ PALADINO**
• HP: ███████░░░ Alto
• Dano: ████░░░░░░ Médio-Baixo
• Defesa: █████████░ Muito Alta
• Papel: Tank/Healer
• Skill Ultimate: Benção Divina
*Melhor para: Suporte, grupos*

**🗡️ ASSASSINO**
• HP: ████░░░░░░ Médio-Baixo
• Dano: ██████████ Extremo (crítico)
• Defesa: ███░░░░░░░ Baixa
• Papel: Burst DPS
• Skill Ultimate: Golpe Fatal
*Melhor para: Matar rápido, PvP*

**🧙 NECROMANTE**
• HP: ████░░░░░░ Médio-Baixo
• Dano: ██████░░░░ Médio (+ minions)
• Defesa: ████░░░░░░ Média
• Papel: Invocador
• Skill Ultimate: Exército dos Mortos
*Melhor para: Solo, farming*`,
  },
  farm_xp: {
    title: '📈 Guia de Farm de XP',
    description: `**Maximize seu ganho de XP!**

**Fontes de XP (por eficiência):**

1. **RPG Batalhas** ⭐⭐⭐⭐⭐
   • Maior XP por ação
   • \`/rpg batalhar <monstro>\`
   • Escolha monstros do seu nível

2. **Dungeons** ⭐⭐⭐⭐⭐
   • XP massivo por run
   • Bônus por dificuldade
   • \`/dungeon criar\`

3. **Daily + Streak** ⭐⭐⭐⭐
   • 50 XP base + bônus streak
   • Nunca perca um dia!

4. **Mensagens** ⭐⭐⭐
   • 1-5 XP por mensagem
   • Cooldown 60s
   • Converse naturalmente

5. **Voz** ⭐⭐
   • 1 XP/min por pessoa no canal
   • Precisa 2+ pessoas

**Multiplicadores:**
• 🕐 Horário de pico (19h-23h): +20%
• 📅 Fim de semana: +30%
• 🎉 Eventos: +100%
• 💜 Server Booster: +50%
• 🔥 Streak 7+ dias: +25%

**Dica máxima:**
Jogue durante eventos de fim de semana
com streak ativo = até 3x mais XP!`,
  },
  farm_coins: {
    title: '💰 Guia de Farm de Coins',
    description: `**Fique rico no LootBot!**

**Métodos (por eficiência):**

1. **Pets** ⭐⭐⭐⭐⭐
   • Geração passiva 24/7
   • Pet lendário = 50+ coins/hora
   • \`/pet coletar\` regularmente

2. **Dungeons/Raids** ⭐⭐⭐⭐⭐
   • Loot valioso
   • Venda equipamentos extras
   • Nightmare = 3x mais loot

3. **RPG Batalhas** ⭐⭐⭐⭐
   • Drop de coins e itens
   • Monstros mais fortes = mais loot

4. **Pesca** ⭐⭐⭐⭐
   • \`/pescar\` a cada 30min
   • Peixes lendários = 1000+ coins
   • \`/recursos vender-tudo\`

5. **Expedições** ⭐⭐⭐
   • Recursos passivos
   • Abismo = melhores drops
   • Venda tudo!

6. **Crafting + Mercado** ⭐⭐⭐
   • Crie itens valiosos
   • Venda no mercado
   • \`/mercado vender\`

**O que NÃO fazer:**
❌ Apostar tudo no cassino
❌ Comprar itens caros cedo
❌ Ignorar daily/expedições

**Rotina de farm:**
1. \`/daily\` ao acordar
2. \`/pet coletar\`
3. \`/expedicao resgatar\` + iniciar nova
4. \`/pescar\` a cada 30min
5. Fazer dungeons/batalhas
6. Vender tudo no final do dia`,
  },
  dungeon_guide: {
    title: '🏰 Guia de Dungeons',
    description: `**Domine as Dungeons!**

**Estrutura de uma Dungeon:**
• 5 Waves de monstros
• 1 Boss final
• Loot distribuído por contribuição

**Dificuldades:**
• **Normal** - Para aprender
• **Hard** - 1.5x loot, +30% HP mobs
• **Expert** - 2x loot, +60% HP mobs
• **Nightmare** - 3x loot, +100% HP mobs

**Requisitos de nível:**
• Floresta: 10+ (treino)
• Caverna: 20+ (média)
• Ruínas: 35+ (difícil)
• Vulcão: 50+ (hard)
• Abismo: 70+ (end-game)

**Composição ideal (4 jogadores):**
• 1 Tank (Guerreiro/Paladino)
• 2 DPS (Mago/Arqueiro/Assassino)
• 1 Suporte (Paladino/Necromante)

**Dicas importantes:**
1. Não vá sozinho em Nightmare
2. Tank deve usar \`/dungeon atacar\` primeiro
3. Cure entre waves
4. Guarde ultimate pro boss

**Comandos úteis:**
\`\`\`
/dungeon criar floresta hard
/dungeon entrar ABC123
/dungeon iniciar
/dungeon status
/dungeon atacar
\`\`\``,
  },
  raid_guide: {
    title: '🐉 Guia de Raids',
    description: `**Conquiste os Bosses Lendários!**

**O que são Raids?**
Batalhas épicas com 5-10 jogadores contra bosses com múltiplas fases!

**Raids disponíveis:**

**🐉 Covil do Dragão (Nv. 50+)**
• Boss: Ignarius, o Dragão Ancião
• Fases: 3
• Mecânica: Evitar bolas de fogo
• Recompensa: Equipamentos de fogo

**👹 Fortaleza Demoníaca (Nv. 70+)**
• Boss: Malachar, Lorde Demoníaco
• Fases: 4
• Mecânica: Interromper invocações
• Recompensa: Equipamentos sombrios

**🌌 Nexus Dimensional (Nv. 90+)**
• Boss: Entidade do Vazio
• Fases: 5
• Mecânica: Portais dimensionais
• Recompensa: Equipamentos míticos

**Lockout:**
• Reset toda segunda-feira
• 1 clear por boss por semana
• Mesmo que wipe, conta como tentativa

**Composição ideal (10 jogadores):**
• 2 Tanks
• 5-6 DPS
• 2-3 Healers/Suporte

**Dicas:**
1. Comunicação é essencial
2. Conheça as mecânicas antes
3. Não ignore adds
4. Guarde poções pro boss`,
  },
  pet_guide: {
    title: '🐾 Guia Completo de Pets',
    description: `**Seu companheiro perfeito!**

**Por que ter pets?**
• Geração passiva de coins
• Alguns ajudam em batalha
• Colecionáveis raros

**Raridades e geração:**
\`\`\`
Comum     🟢  2-5 coins/hora
Incomum   🔵  8-12 coins/hora
Raro      🟣  15-20 coins/hora
Épico     🟡  25-35 coins/hora
Lendário  🔴  50+ coins/hora
\`\`\`

**Como conseguir pets:**

1. **Loja** - \`/pet loja\`
   • Pets básicos disponíveis
   • Preços fixos

2. **Ovos** - \`/crafting criar ovo_pet\`
   • Chance de raridades maiores
   • Pets exclusivos de ovos

3. **Drops** - Dungeons/Raids
   • Pets raros de boss
   • Muito difícil, muito valioso

**Manutenção:**
• Alimente regularmente: \`/pet alimentar <id>\`
• Pet com fome = menos coins
• Comida na loja ou crafting

**Dica de investimento:**
1. Comece com pet comum (barato)
2. Junte coins dos pets
3. Compre pet melhor
4. Repita até ter lendário!`,
  },
  crafting_guide: {
    title: '🔨 Guia de Crafting',
    description: `**Crie itens poderosos!**

**Níveis de Crafting:**
\`\`\`
Iniciante    (1-10)   Receitas básicas
Aprendiz     (11-25)  Receitas médias
Artesão      (26-50)  Receitas avançadas
Mestre       (51-75)  Receitas raras
Grão-Mestre  (76-100) Receitas lendárias
\`\`\`

**Recursos básicos:**
• 🪵 Madeira - Floresta
• 🪨 Pedra - Caverna
• ⚙️ Ferro - Ruínas
• 🥇 Ouro - Pântano
• 💎 Diamante - Vulcão
• ✨ Essência - Abismo

**Receitas importantes:**

**Para iniciantes:**
• Barra de Ferro (5 ferro)
• Poção de HP Menor (3 ervas)

**Intermediário:**
• Ovo de Pet Comum (50 essência)
• Vara de Pesca Melhorada

**Avançado:**
• Ovo de Pet Raro (200 essência)
• Equipamentos épicos

**Lendário:**
• Ovo de Pet Lendário (1000 essência)
• Equipamentos míticos

**Dicas:**
1. Suba nível craftando itens baratos
2. Guarde essências para ovos
3. Venda itens craftados no mercado
4. Nível alto = qualidade melhor`,
  },
  prestige_guide: {
    title: '⭐ Guia de Prestígio',
    description: `**Vale a pena fazer Prestígio?**

**O que é Prestígio?**
Resetar seu progresso em troca de bônus permanentes!

**Requisitos:**
• Prestígio 1: Nível 100
• Prestígio 2: Nível 110
• Prestígio 3: Nível 125
• E assim por diante...

**Bônus por prestígio:**
\`\`\`
Prestígio 1:  +5% XP, +5% Coins
Prestígio 2:  +10% XP, +10% Coins
Prestígio 3:  +15% XP, +15% Coins
...
Prestígio 10: +50% XP, +50% Coins
\`\`\`

**Extras por prestígio:**
• Badge exclusiva
• Título especial
• +1 slot de pet
• Desconto na loja

**O que você PERDE:**
• Nível (volta pro 1)
• XP atual
• Alguns recursos

**O que você MANTÉM:**
• Todas as badges
• Todos os pets
• Todos os títulos
• Equipamentos lendários+
• Bônus anteriores

**Quando fazer?**
✅ Quando estiver no nível 100+
✅ Quando tiver equipamentos bons
✅ Quando quiser os bônus

❌ Não faça se precisar do nível
❌ Não faça antes de ter pet bom`,
  },
  pvp_guide: {
    title: '⚔️ Guia de PvP e Arena',
    description: `**Domine seus oponentes!**

**Modos PvP:**

**1. Duelo** (1v1)
• Desafie outro jogador
• Aposta opcional
• \`/pvp duelar @user <aposta>\`

**2. Arena** (Ranked)
• Ranking competitivo
• Recompensas semanais
• \`/arena entrar\`

**3. Guerra de Clãs**
• Clã vs Clã
• Pontos por vitória
• \`/clan guerra\`

**Melhores classes para PvP:**

1. **Assassino** ⭐⭐⭐⭐⭐
   • Burst damage insano
   • Mata antes de apanhar

2. **Mago** ⭐⭐⭐⭐
   • DPS alto
   • Vulnerável a burst

3. **Arqueiro** ⭐⭐⭐⭐
   • Críticos devastadores
   • Balanceado

4. **Paladino** ⭐⭐⭐
   • Tanky com cura
   • Dano baixo

5. **Guerreiro** ⭐⭐⭐
   • Muito tanky
   • Precisa de sustain

**Dicas de PvP:**
1. Conheça sua classe
2. Use skills no momento certo
3. Equipamentos fazem diferença
4. Pratique contra amigos`,
  },
  economy_tips: {
    title: '💎 Dicas Avançadas de Economia',
    description: `**Segredos dos jogadores ricos!**

**Investimentos inteligentes:**

1. **Pets primeiro!**
   • ROI garantido
   • Pet épico em 1 semana se paga

2. **Nunca aposte tudo**
   • Cassino é entretenimento
   • Máximo 10% do saldo

3. **Mercado é ouro**
   • Compre barato, venda caro
   • Monitore preços
   • Paciência = lucro

**Erros comuns:**
❌ Gastar tudo em itens cosméticos
❌ Não fazer daily
❌ Ignorar expedições
❌ Vender itens raros barato
❌ Comprar no impulso

**Estratégia de crescimento:**

**Semana 1-2:**
• Daily todo dia
• Pet comum
• Expedições básicas

**Semana 3-4:**
• Pet incomum/raro
• Dungeons regulares
• Crafting básico

**Mês 2+:**
• Pet épico+
• Raids
• Mercado ativo
• Casa upgradada

**Meta de coins:**
• 1K: Iniciante
• 10K: Jogador ativo
• 50K: Veterano
• 100K+: Rico`,
  },
};

export const data = new SlashCommandBuilder()
  .setName('guia')
  .setDescription('Guias detalhados sobre sistemas específicos')
  .addStringOption(opt =>
    opt
      .setName('tema')
      .setDescription('Tema do guia')
      .setRequired(false)
      .addChoices(
        { name: '📚 Guia do Iniciante', value: 'iniciante' },
        { name: '⚔️ Classes do RPG', value: 'classes' },
        { name: '📈 Farm de XP', value: 'farm_xp' },
        { name: '💰 Farm de Coins', value: 'farm_coins' },
        { name: '🏰 Dungeons', value: 'dungeon_guide' },
        { name: '🐉 Raids', value: 'raid_guide' },
        { name: '🐾 Pets', value: 'pet_guide' },
        { name: '🔨 Crafting', value: 'crafting_guide' },
        { name: '⭐ Prestígio', value: 'prestige_guide' },
        { name: '⚔️ PvP e Arena', value: 'pvp_guide' },
        { name: '💎 Dicas de Economia', value: 'economy_tips' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const tema = interaction.options.getString('tema');

  if (tema) {
    await showGuide(interaction, tema);
    return;
  }

  await showGuideMenu(interaction);
}

async function showGuideMenu(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('📖 Guias Detalhados')
    .setDescription(
      '**Escolha um guia para aprender mais!**\n\n' +
      'Estes guias contêm informações detalhadas sobre cada sistema do bot.\n\n' +
      '**Guias disponíveis:**\n' +
      '• 📚 **Iniciante** - Primeiros passos\n' +
      '• ⚔️ **Classes** - Escolha sua classe\n' +
      '• 📈 **Farm XP** - Maximize seu XP\n' +
      '• 💰 **Farm Coins** - Fique rico\n' +
      '• 🏰 **Dungeons** - Conteúdo em grupo\n' +
      '• 🐉 **Raids** - Desafio máximo\n' +
      '• 🐾 **Pets** - Companheiros\n' +
      '• 🔨 **Crafting** - Criar itens\n' +
      '• ⭐ **Prestígio** - Reset com bônus\n' +
      '• ⚔️ **PvP** - Combate contra jogadores\n' +
      '• 💎 **Economia** - Dicas avançadas\n\n' +
      '**Selecione um guia no menu abaixo:**'
    )
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: 'Use /guia <tema> para ir direto ao guia' });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('guia_select')
    .setPlaceholder('📖 Escolha um guia...')
    .addOptions(
      Object.entries(GUIDES).map(([key, guide]) => ({
        label: guide.title,
        value: key,
        emoji: guide.title.split(' ')[0],
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 300000,
  });

  collector.on('collect', async (selectInteraction) => {
    if (selectInteraction.user.id !== interaction.user.id) {
      await selectInteraction.reply({
        content: '❌ Este menu não é seu! Use `/guia` para abrir o seu.',
        ephemeral: true,
      });
      return;
    }

    const selectedGuide = selectInteraction.values[0];
    const guide = GUIDES[selectedGuide as keyof typeof GUIDES];

    if (!guide) return;

    const guideEmbed = new EmbedBuilder()
      .setTitle(guide.title)
      .setDescription(guide.description)
      .setColor(COLORS.PRIMARY)
      .setFooter({ text: 'Use o menu para ver outros guias' });

    await selectInteraction.update({
      embeds: [guideEmbed],
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
}

async function showGuide(interaction: ChatInputCommandInteraction, guideKey: string) {
  const guide = GUIDES[guideKey as keyof typeof GUIDES];

  if (!guide) {
    await interaction.reply({
      content: '❌ Guia não encontrado. Use `/guia` para ver todos os guias.',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(guide.title)
    .setDescription(guide.description)
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: 'Use /guia para ver todos os guias disponíveis' });

  await interaction.reply({ embeds: [embed] });
}
