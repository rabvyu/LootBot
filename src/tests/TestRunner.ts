// Sistema de Testes Completo - Runner Principal
import { logger } from '../utils/logger';

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

export interface TestSuiteResult {
  suiteName: string;
  tests: TestResult[];
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  startedAt: Date;
  completedAt: Date;
}

export interface TestReport {
  title: string;
  suites: TestSuiteResult[];
  summary: {
    totalSuites: number;
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    passRate: number;
    totalDuration: number;
  };
  generatedAt: Date;
}

export type TestFunction = () => Promise<void>;

export class TestRunner {
  private suites: Map<string, Map<string, TestFunction>> = new Map();
  private results: TestSuiteResult[] = [];
  private currentSuite: string = '';

  // Registrar uma suite de testes
  suite(name: string, callback: () => void): void {
    this.currentSuite = name;
    this.suites.set(name, new Map());
    callback();
    this.currentSuite = '';
  }

  // Registrar um teste
  test(name: string, fn: TestFunction): void {
    if (!this.currentSuite) {
      throw new Error('Test must be inside a suite');
    }
    const suite = this.suites.get(this.currentSuite);
    if (suite) {
      suite.set(name, fn);
    }
  }

  // Executar todos os testes
  async runAll(): Promise<TestReport> {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 INICIANDO TESTES DO BOT DE GAMIFICAÇÃO');
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();
    this.results = [];

    for (const [suiteName, tests] of this.suites) {
      const suiteResult = await this.runSuite(suiteName, tests);
      this.results.push(suiteResult);
    }

    const totalDuration = Date.now() - startTime;
    const report = this.generateReport(totalDuration);

    this.printReport(report);

    return report;
  }

  // Executar uma suite específica
  private async runSuite(name: string, tests: Map<string, TestFunction>): Promise<TestSuiteResult> {
    console.log(`\n📦 Suite: ${name}`);
    console.log('-'.repeat(40));

    const suiteStart = Date.now();
    const testResults: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const [testName, testFn] of tests) {
      const testStart = Date.now();
      let result: TestResult;

      try {
        await testFn();
        result = {
          name: testName,
          passed: true,
          duration: Date.now() - testStart,
        };
        passed++;
        console.log(`  ✅ ${testName} (${result.duration}ms)`);
      } catch (error: any) {
        result = {
          name: testName,
          passed: false,
          duration: Date.now() - testStart,
          error: error.message || String(error),
        };
        failed++;
        console.log(`  ❌ ${testName} (${result.duration}ms)`);
        console.log(`     Error: ${result.error}`);
      }

      testResults.push(result);
    }

    const suiteDuration = Date.now() - suiteStart;
    console.log(`\n  Resultado: ${passed}/${tests.size} testes passaram (${suiteDuration}ms)`);

    return {
      suiteName: name,
      tests: testResults,
      totalTests: tests.size,
      passed,
      failed,
      duration: suiteDuration,
      startedAt: new Date(suiteStart),
      completedAt: new Date(),
    };
  }

  // Gerar relatório
  private generateReport(totalDuration: number): TestReport {
    const totalTests = this.results.reduce((sum, s) => sum + s.totalTests, 0);
    const totalPassed = this.results.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = this.results.reduce((sum, s) => sum + s.failed, 0);

    return {
      title: 'Relatório de Testes - Bot de Gamificação Discord',
      suites: this.results,
      summary: {
        totalSuites: this.results.length,
        totalTests,
        totalPassed,
        totalFailed,
        passRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
        totalDuration,
      },
      generatedAt: new Date(),
    };
  }

  // Imprimir relatório
  private printReport(report: TestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DE TESTES');
    console.log('='.repeat(60));

    console.log(`\n📅 Gerado em: ${report.generatedAt.toLocaleString('pt-BR')}`);
    console.log(`⏱️  Duração total: ${report.summary.totalDuration}ms`);

    console.log('\n📈 RESUMO:');
    console.log('-'.repeat(40));
    console.log(`  Suites executadas: ${report.summary.totalSuites}`);
    console.log(`  Total de testes:   ${report.summary.totalTests}`);
    console.log(`  ✅ Passaram:       ${report.summary.totalPassed}`);
    console.log(`  ❌ Falharam:       ${report.summary.totalFailed}`);
    console.log(`  📊 Taxa de sucesso: ${report.summary.passRate}%`);

    if (report.summary.totalFailed > 0) {
      console.log('\n⚠️  TESTES QUE FALHARAM:');
      console.log('-'.repeat(40));
      for (const suite of report.suites) {
        const failedTests = suite.tests.filter(t => !t.passed);
        if (failedTests.length > 0) {
          console.log(`\n  📦 ${suite.suiteName}:`);
          for (const test of failedTests) {
            console.log(`    ❌ ${test.name}`);
            console.log(`       ${test.error}`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    if (report.summary.passRate === 100) {
      console.log('🎉 TODOS OS TESTES PASSARAM! 🎉');
    } else if (report.summary.passRate >= 80) {
      console.log('⚠️  Maioria dos testes passou, mas há falhas a corrigir.');
    } else {
      console.log('❌ Muitos testes falharam. Revisão necessária.');
    }
    console.log('='.repeat(60) + '\n');
  }

  // Exportar relatório como JSON
  exportReportJSON(report: TestReport): string {
    return JSON.stringify(report, null, 2);
  }

  // Exportar relatório como Markdown
  exportReportMarkdown(report: TestReport): string {
    let md = `# ${report.title}\n\n`;
    md += `**Gerado em:** ${report.generatedAt.toLocaleString('pt-BR')}\n\n`;
    md += `## Resumo\n\n`;
    md += `| Métrica | Valor |\n`;
    md += `|---------|-------|\n`;
    md += `| Suites | ${report.summary.totalSuites} |\n`;
    md += `| Total de Testes | ${report.summary.totalTests} |\n`;
    md += `| Passaram | ${report.summary.totalPassed} |\n`;
    md += `| Falharam | ${report.summary.totalFailed} |\n`;
    md += `| Taxa de Sucesso | ${report.summary.passRate}% |\n`;
    md += `| Duração | ${report.summary.totalDuration}ms |\n\n`;

    md += `## Detalhes por Suite\n\n`;
    for (const suite of report.suites) {
      const status = suite.failed === 0 ? '✅' : '❌';
      md += `### ${status} ${suite.suiteName}\n\n`;
      md += `- Testes: ${suite.totalTests}\n`;
      md += `- Passaram: ${suite.passed}\n`;
      md += `- Falharam: ${suite.failed}\n`;
      md += `- Duração: ${suite.duration}ms\n\n`;

      if (suite.failed > 0) {
        md += `**Falhas:**\n\n`;
        for (const test of suite.tests.filter(t => !t.passed)) {
          md += `- ❌ ${test.name}: ${test.error}\n`;
        }
        md += '\n';
      }
    }

    return md;
  }
}

// Funções auxiliares de asserção
export const assert = {
  isTrue(value: boolean, message?: string): void {
    if (!value) {
      throw new Error(message || 'Expected true but got false');
    }
  },

  isFalse(value: boolean, message?: string): void {
    if (value) {
      throw new Error(message || 'Expected false but got true');
    }
  },

  equals<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  },

  deepEquals(actual: any, expected: any, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Deep equality failed`);
    }
  },

  notNull(value: any, message?: string): void {
    if (value === null || value === undefined) {
      throw new Error(message || 'Expected non-null value');
    }
  },

  isNull(value: any, message?: string): void {
    if (value !== null && value !== undefined) {
      throw new Error(message || 'Expected null or undefined');
    }
  },

  greaterThan(actual: number, expected: number, message?: string): void {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} > ${expected}`);
    }
  },

  lessThan(actual: number, expected: number, message?: string): void {
    if (actual >= expected) {
      throw new Error(message || `Expected ${actual} < ${expected}`);
    }
  },

  includes<T>(array: T[], item: T, message?: string): void {
    if (!array.includes(item)) {
      throw new Error(message || `Array does not include expected item`);
    }
  },

  hasProperty(obj: any, prop: string, message?: string): void {
    if (!(prop in obj)) {
      throw new Error(message || `Object does not have property ${prop}`);
    }
  },

  throws(fn: () => void, message?: string): void {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) {
      throw new Error(message || 'Expected function to throw');
    }
  },

  async throwsAsync(fn: () => Promise<void>, message?: string): Promise<void> {
    let threw = false;
    try {
      await fn();
    } catch {
      threw = true;
    }
    if (!threw) {
      throw new Error(message || 'Expected async function to throw');
    }
  },

  lengthOf(arrayOrString: any[] | string, length: number, message?: string): void {
    if (arrayOrString.length !== length) {
      throw new Error(message || `Expected length ${length} but got ${arrayOrString.length}`);
    }
  },

  isArray(value: any, message?: string): void {
    if (!Array.isArray(value)) {
      throw new Error(message || 'Expected an array');
    }
  },

  isObject(value: any, message?: string): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(message || 'Expected an object');
    }
  },

  isString(value: any, message?: string): void {
    if (typeof value !== 'string') {
      throw new Error(message || 'Expected a string');
    }
  },

  isNumber(value: any, message?: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(message || 'Expected a number');
    }
  },
};

export default TestRunner;
