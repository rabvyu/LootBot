// Serviço do Banco do Reino
import { Bank, IBank, StoredItem, BankTransaction, TransactionType } from '../database/models';

// Configurações do banco
const BANK_CONFIG = {
  baseStorageSlots: 20,
  maxStorageSlots: 100,
  interestRate: 0.01, // 1% ao dia
  maxInterestDays: 30, // Máximo de 30 dias de juros
  minLoanAmount: 100,
  maxLoanMultiplier: 5, // Máximo de 5x o saldo depositado
  loanInterestRate: 0.05, // 5% de juros no empréstimo
  loanDueDays: 7, // 7 dias para pagar
  upgradeSlotsCost: 1000, // Custo por 5 slots extras
};

export interface DepositResult {
  success: boolean;
  newBalance?: number;
  message: string;
}

export interface WithdrawResult {
  success: boolean;
  amount?: number;
  newBalance?: number;
  message: string;
}

export interface LoanResult {
  success: boolean;
  loanAmount?: number;
  dueDate?: Date;
  message: string;
}

// Obter ou criar conta bancária
export async function getOrCreateBankAccount(discordId: string): Promise<IBank> {
  let bank = await Bank.findOne({ discordId });

  if (!bank) {
    bank = new Bank({
      discordId,
      balance: 0,
      currentLoan: 0,
      loanDueDate: null,
      loanInterestAccrued: 0,
      storedItems: [],
      maxStorageSlots: BANK_CONFIG.baseStorageSlots,
      transactions: [],
      lastInterestClaim: new Date(),
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalInterestEarned: 0,
      trustLevel: 1,
    });
    await bank.save();
  }

  return bank.toObject();
}

// Depositar moedas
export async function deposit(discordId: string, amount: number): Promise<DepositResult> {
  if (amount <= 0) {
    return { success: false, message: 'Valor de depósito inválido.' };
  }

  const bank = await Bank.findOne({ discordId });
  if (!bank) {
    await getOrCreateBankAccount(discordId);
    return await deposit(discordId, amount);
  }

  bank.balance += amount;
  bank.totalDeposited += amount;

  const transaction: BankTransaction = {
    type: 'deposit' as TransactionType,
    amount,
    balanceAfter: bank.balance,
    timestamp: new Date(),
    description: 'Depósito de moedas',
  };
  bank.transactions.push(transaction);

  // Limitar histórico de transações
  if (bank.transactions.length > 50) {
    bank.transactions = bank.transactions.slice(-50);
  }

  await bank.save();

  return {
    success: true,
    newBalance: bank.balance,
    message: `Depositado ${amount} moedas. Saldo atual: ${bank.balance}.`,
  };
}

// Sacar moedas
export async function withdraw(discordId: string, amount: number): Promise<WithdrawResult> {
  if (amount <= 0) {
    return { success: false, message: 'Valor de saque inválido.' };
  }

  const bank = await Bank.findOne({ discordId });
  if (!bank) {
    return { success: false, message: 'Você não tem conta no banco.' };
  }

  if (bank.balance < amount) {
    return { success: false, message: `Saldo insuficiente. Disponível: ${bank.balance} moedas.` };
  }

  bank.balance -= amount;
  bank.totalWithdrawn += amount;

  const transaction: BankTransaction = {
    type: 'withdrawal' as TransactionType,
    amount,
    balanceAfter: bank.balance,
    timestamp: new Date(),
    description: 'Saque de moedas',
  };
  bank.transactions.push(transaction);

  if (bank.transactions.length > 50) {
    bank.transactions = bank.transactions.slice(-50);
  }

  await bank.save();

  return {
    success: true,
    amount,
    newBalance: bank.balance,
    message: `Sacado ${amount} moedas. Saldo atual: ${bank.balance}.`,
  };
}

// Calcular juros acumulados
export function calculateInterest(balance: number, lastClaim: Date): number {
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - lastClaim.getTime()) / (24 * 60 * 60 * 1000));
  const effectiveDays = Math.min(daysPassed, BANK_CONFIG.maxInterestDays);

  if (effectiveDays <= 0) return 0;

  return Math.floor(balance * BANK_CONFIG.interestRate * effectiveDays);
}

// Coletar juros
export async function claimInterest(discordId: string): Promise<{ success: boolean; amount: number; message: string }> {
  const bank = await Bank.findOne({ discordId });
  if (!bank) {
    return { success: false, amount: 0, message: 'Você não tem conta no banco.' };
  }

  const interest = calculateInterest(bank.balance, bank.lastInterestClaim);

  if (interest <= 0) {
    return { success: false, amount: 0, message: 'Sem juros disponíveis para coletar.' };
  }

  bank.balance += interest;
  bank.totalInterestEarned += interest;
  bank.lastInterestClaim = new Date();

  const transaction: BankTransaction = {
    type: 'interest' as TransactionType,
    amount: interest,
    balanceAfter: bank.balance,
    timestamp: new Date(),
    description: 'Juros coletados',
  };
  bank.transactions.push(transaction);

  await bank.save();

  return {
    success: true,
    amount: interest,
    message: `Coletado ${interest} moedas de juros! Saldo: ${bank.balance}.`,
  };
}

// Solicitar empréstimo
export async function requestLoan(discordId: string, amount: number): Promise<LoanResult> {
  if (amount < BANK_CONFIG.minLoanAmount) {
    return { success: false, message: `Empréstimo mínimo é ${BANK_CONFIG.minLoanAmount} moedas.` };
  }

  const bank = await Bank.findOne({ discordId });
  if (!bank) {
    return { success: false, message: 'Você não tem conta no banco.' };
  }

  if (bank.currentLoan > 0) {
    return { success: false, message: 'Você já tem um empréstimo ativo. Pague-o primeiro.' };
  }

  const maxLoan = bank.totalDeposited * BANK_CONFIG.maxLoanMultiplier;
  if (amount > maxLoan) {
    return { success: false, message: `Seu limite de empréstimo é ${maxLoan} moedas.` };
  }

  const totalWithInterest = Math.floor(amount * (1 + BANK_CONFIG.loanInterestRate));
  const dueDate = new Date(Date.now() + BANK_CONFIG.loanDueDays * 24 * 60 * 60 * 1000);

  bank.currentLoan = totalWithInterest;
  bank.loanDueDate = dueDate;
  bank.balance += amount;

  const transaction: BankTransaction = {
    type: 'loan' as TransactionType,
    amount,
    balanceAfter: bank.balance,
    timestamp: new Date(),
    description: `Empréstimo de ${amount} (total a pagar: ${totalWithInterest})`,
  };
  bank.transactions.push(transaction);

  await bank.save();

  return {
    success: true,
    loanAmount: amount,
    dueDate,
    message: `Empréstimo de ${amount} aprovado! Pague ${totalWithInterest} até ${dueDate.toLocaleDateString('pt-BR')}.`,
  };
}

// Pagar empréstimo
export async function repayLoan(discordId: string): Promise<{ success: boolean; amountPaid: number; message: string }> {
  const bank = await Bank.findOne({ discordId });
  if (!bank) {
    return { success: false, amountPaid: 0, message: 'Você não tem conta no banco.' };
  }

  if (bank.currentLoan <= 0) {
    return { success: false, amountPaid: 0, message: 'Você não tem empréstimo ativo.' };
  }

  if (bank.balance < bank.currentLoan) {
    return { success: false, amountPaid: 0, message: `Saldo insuficiente. Você deve ${bank.currentLoan} moedas.` };
  }

  const amountPaid = bank.currentLoan;
  bank.balance -= amountPaid;
  bank.currentLoan = 0;
  bank.loanDueDate = undefined;
  bank.trustLevel = Math.min(bank.trustLevel + 1, 10);

  const transaction: BankTransaction = {
    type: 'loan_payment' as TransactionType,
    amount: amountPaid,
    balanceAfter: bank.balance,
    timestamp: new Date(),
    description: 'Pagamento de empréstimo',
  };
  bank.transactions.push(transaction);

  await bank.save();

  return {
    success: true,
    amountPaid,
    message: `Empréstimo de ${amountPaid} moedas pago! Confiança aumentada.`,
  };
}

// Depositar item no cofre
export async function storeItem(
  discordId: string,
  item: StoredItem
): Promise<{ success: boolean; message: string }> {
  const bank = await Bank.findOne({ discordId });
  if (!bank) {
    return { success: false, message: 'Você não tem conta no banco.' };
  }

  const usedSlots = bank.storedItems.reduce((sum, i) => sum + i.quantity, 0);
  if (usedSlots + item.quantity > bank.maxStorageSlots) {
    return { success: false, message: `Espaço insuficiente. Disponível: ${bank.maxStorageSlots - usedSlots} slots.` };
  }

  // Verificar se item já existe
  const existingItem = bank.storedItems.find(i => i.itemId === item.itemId);
  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    bank.storedItems.push(item);
  }

  await bank.save();

  return { success: true, message: `${item.itemName} x${item.quantity} guardado no cofre.` };
}

// Retirar item do cofre
export async function retrieveItem(
  discordId: string,
  itemId: string,
  quantity: number
): Promise<{ success: boolean; item?: StoredItem; message: string }> {
  const bank = await Bank.findOne({ discordId });
  if (!bank) {
    return { success: false, message: 'Você não tem conta no banco.' };
  }

  const itemIndex = bank.storedItems.findIndex(i => i.itemId === itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'Item não encontrado no cofre.' };
  }

  const storedItem = bank.storedItems[itemIndex];
  if (storedItem.quantity < quantity) {
    return { success: false, message: `Quantidade insuficiente. Disponível: ${storedItem.quantity}.` };
  }

  const retrievedItem: StoredItem = {
    itemId: storedItem.itemId,
    itemName: storedItem.itemName,
    itemType: storedItem.itemType,
    quantity,
    storedAt: storedItem.storedAt,
  };

  storedItem.quantity -= quantity;
  if (storedItem.quantity <= 0) {
    bank.storedItems.splice(itemIndex, 1);
  }

  await bank.save();

  return { success: true, item: retrievedItem, message: `${retrievedItem.itemName} x${quantity} retirado do cofre.` };
}

// Expandir slots de armazenamento
export async function upgradeStorage(discordId: string): Promise<{ success: boolean; newSlots: number; message: string }> {
  const bank = await Bank.findOne({ discordId });
  if (!bank) {
    return { success: false, newSlots: 0, message: 'Você não tem conta no banco.' };
  }

  if (bank.maxStorageSlots >= BANK_CONFIG.maxStorageSlots) {
    return { success: false, newSlots: bank.maxStorageSlots, message: 'Armazenamento já está no máximo.' };
  }

  if (bank.balance < BANK_CONFIG.upgradeSlotsCost) {
    return { success: false, newSlots: bank.maxStorageSlots, message: `Custo do upgrade: ${BANK_CONFIG.upgradeSlotsCost} moedas.` };
  }

  bank.balance -= BANK_CONFIG.upgradeSlotsCost;
  bank.maxStorageSlots += 5;

  await bank.save();

  return {
    success: true,
    newSlots: bank.maxStorageSlots,
    message: `Armazenamento expandido para ${bank.maxStorageSlots} slots!`,
  };
}

// Obter extrato bancário
export async function getBankStatement(discordId: string): Promise<IBank | null> {
  return await Bank.findOne({ discordId }).lean();
}

// Processar empréstimos vencidos
export async function processOverdueLoans(): Promise<{ processed: number; penalized: string[] }> {
  const now = new Date();
  const overdueAccounts = await Bank.find({
    currentLoan: { $gt: 0 },
    loanDueDate: { $lt: now },
  });

  const penalized: string[] = [];

  for (const bank of overdueAccounts) {
    // Aplicar penalidade de 10% por dia de atraso
    const daysOverdue = Math.floor((now.getTime() - bank.loanDueDate!.getTime()) / (24 * 60 * 60 * 1000));
    const penalty = Math.floor(bank.currentLoan * 0.1 * daysOverdue);

    bank.currentLoan += penalty;
    bank.loanInterestAccrued += penalty;
    bank.trustLevel = Math.max(bank.trustLevel - 1, 0);

    await bank.save();
    penalized.push(bank.discordId);
  }

  return { processed: overdueAccounts.length, penalized };
}

// Transferir entre contas
export async function transfer(
  fromId: string,
  toId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  if (amount <= 0) {
    return { success: false, message: 'Valor de transferência inválido.' };
  }

  const fromBank = await Bank.findOne({ discordId: fromId });
  if (!fromBank || fromBank.balance < amount) {
    return { success: false, message: 'Saldo insuficiente para transferência.' };
  }

  let toBank = await Bank.findOne({ discordId: toId });
  if (!toBank) {
    await getOrCreateBankAccount(toId);
    toBank = await Bank.findOne({ discordId: toId });
  }

  if (!toBank) {
    return { success: false, message: 'Erro ao criar conta do destinatário.' };
  }

  fromBank.balance -= amount;
  toBank.balance += amount;

  const fromTransaction: BankTransaction = {
    type: 'transfer_out' as TransactionType,
    amount,
    balanceAfter: fromBank.balance,
    timestamp: new Date(),
    description: `Transferência para ${toId}`,
  };
  fromBank.transactions.push(fromTransaction);

  const toTransaction: BankTransaction = {
    type: 'transfer_in' as TransactionType,
    amount,
    balanceAfter: toBank.balance,
    timestamp: new Date(),
    description: `Transferência de ${fromId}`,
  };
  toBank.transactions.push(toTransaction);

  await fromBank.save();
  await toBank.save();

  return { success: true, message: `Transferido ${amount} moedas com sucesso!` };
}
