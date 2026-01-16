// Sistema de Testes - Entry Point
import TestRunner from './TestRunner';
import { registerCoreTests } from './suites/coreTests';
import { registerEconomyTests } from './suites/economyTests';
import { registerDungeonTests } from './suites/dungeonTests';
import { registerPvPTests } from './suites/pvpTests';
import { registerQuestTests } from './suites/questTests';
import { registerAchievementTests } from './suites/achievementTests';
import { registerMinigameTests } from './suites/minigameTests';
import { registerGuildTests } from './suites/guildTests';
import { registerPrestigeTests } from './suites/prestigeTests';
import { registerHousingTests } from './suites/housingTests';
import { registerNotificationTests } from './suites/notificationTests';
import { registerAutoBattleTests } from './suites/autoBattleTests';
import { registerFavoritesTests } from './suites/favoritesTests';
import { registerStatsTests } from './suites/statsTests';
import * as fs from 'fs';
import * as path from 'path';

async function runAllTests(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('       BOT DE GAMIFICAÇÃO DISCORD - SISTEMA DE TESTES');
  console.log('═'.repeat(60));
  console.log();
  console.log('Inicializando runner de testes...\n');

  const runner = new TestRunner();

  // Registrar todas as suites de teste
  console.log('Registrando suites de teste...');

  registerCoreTests(runner);
  console.log('  ✓ Core Tests');

  registerEconomyTests(runner);
  console.log('  ✓ Economy Tests');

  registerDungeonTests(runner);
  console.log('  ✓ Dungeon Tests');

  registerPvPTests(runner);
  console.log('  ✓ PvP Tests');

  registerQuestTests(runner);
  console.log('  ✓ Quest Tests');

  registerAchievementTests(runner);
  console.log('  ✓ Achievement Tests');

  registerMinigameTests(runner);
  console.log('  ✓ Minigame Tests');

  registerGuildTests(runner);
  console.log('  ✓ Guild Tests');

  registerPrestigeTests(runner);
  console.log('  ✓ Prestige Tests');

  registerHousingTests(runner);
  console.log('  ✓ Housing Tests');

  registerNotificationTests(runner);
  console.log('  ✓ Notification Tests');

  registerAutoBattleTests(runner);
  console.log('  ✓ Auto-Battle Tests');

  registerFavoritesTests(runner);
  console.log('  ✓ Favorites Tests');

  registerStatsTests(runner);
  console.log('  ✓ Stats Tests');

  console.log('\nTodas as suites registradas!\n');

  // Executar todos os testes
  const report = await runner.runAll();

  // Salvar relatórios
  const reportsDir = path.join(process.cwd(), 'test-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Salvar JSON
  const jsonReport = runner.exportReportJSON(report);
  const jsonPath = path.join(reportsDir, `report-${timestamp}.json`);
  fs.writeFileSync(jsonPath, jsonReport);
  console.log(`\n📄 Relatório JSON salvo em: ${jsonPath}`);

  // Salvar Markdown
  const mdReport = runner.exportReportMarkdown(report);
  const mdPath = path.join(reportsDir, `report-${timestamp}.md`);
  fs.writeFileSync(mdPath, mdReport);
  console.log(`📄 Relatório Markdown salvo em: ${mdPath}`);

  // Salvar relatório mais recente
  const latestJsonPath = path.join(reportsDir, 'latest.json');
  const latestMdPath = path.join(reportsDir, 'latest.md');
  fs.writeFileSync(latestJsonPath, jsonReport);
  fs.writeFileSync(latestMdPath, mdReport);
  console.log(`📄 Relatório latest atualizado`);

  // Retornar código de erro se houver falhas
  if (report.summary.totalFailed > 0) {
    console.log('\n⚠️  Alguns testes falharam. Verifique o relatório acima.\n');
    process.exit(1);
  } else {
    console.log('\n✅ Todos os testes passaram com sucesso!\n');
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Erro fatal ao executar testes:', error);
    process.exit(1);
  });
}

export { runAllTests };
export default runAllTests;
