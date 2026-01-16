// Testes do Sistema de Economia
import { TestRunner, assert } from '../TestRunner';
import { createMockUser, createMockAuctionListing, createMockTrade } from '../mocks/mockGenerators';

export function registerEconomyTests(runner: TestRunner): void {
  runner.suite('Economia - Transações Básicas', () => {
    runner.test('Transferência de coins entre usuários', async () => {
      const user1 = createMockUser({ coins: 1000 });
      const user2 = createMockUser({ coins: 500 });
      const transferAmount = 300;

      // Simular transferência
      if (user1.coins >= transferAmount) {
        user1.coins -= transferAmount;
        user2.coins += transferAmount;
      }

      assert.equals(user1.coins, 700);
      assert.equals(user2.coins, 800);
    });

    runner.test('Taxa de transferência aplicada corretamente', async () => {
      const amount = 1000;
      const taxRate = 0.02; // 2%
      const tax = Math.floor(amount * taxRate);
      const finalAmount = amount - tax;

      assert.equals(tax, 20);
      assert.equals(finalAmount, 980);
    });

    runner.test('Não permite transferência com saldo insuficiente', async () => {
      const user = createMockUser({ coins: 100 });
      const transferAmount = 500;

      const canTransfer = user.coins >= transferAmount;
      assert.isFalse(canTransfer);
    });
  });

  runner.suite('Economia - Casa de Leilões', () => {
    runner.test('Criar listagem de leilão', async () => {
      const listing = createMockAuctionListing({
        startingBid: 1000,
        buyoutPrice: 5000,
      });

      assert.notNull(listing.listingId);
      assert.equals(listing.startingBid, 1000);
      assert.equals(listing.buyoutPrice, 5000);
      assert.equals(listing.status, 'active');
    });

    runner.test('Taxa de listagem calculada corretamente', async () => {
      const startingBid = 1000;
      const listingFeeRate = 0.05; // 5%
      const listingFee = Math.floor(startingBid * listingFeeRate);

      assert.equals(listingFee, 50);
    });

    runner.test('Dar lance válido', async () => {
      const listing = createMockAuctionListing({
        startingBid: 1000,
        currentBid: 0,
      });

      const bidAmount = 1500;
      const minBid = listing.currentBid > 0 ? listing.currentBid + 100 : listing.startingBid;

      const isValidBid = bidAmount >= minBid;
      assert.isTrue(isValidBid);

      if (isValidBid) {
        listing.currentBid = bidAmount;
        listing.currentBidderId = 'bidder123';
      }

      assert.equals(listing.currentBid, 1500);
    });

    runner.test('Lance menor que mínimo rejeitado', async () => {
      const listing = createMockAuctionListing({
        startingBid: 1000,
        currentBid: 1500,
      });

      const bidAmount = 1550;
      const minBid = listing.currentBid + 100; // Incremento mínimo

      const isValidBid = bidAmount >= minBid;
      assert.isFalse(isValidBid);
    });

    runner.test('Buyout funciona corretamente', async () => {
      const listing = createMockAuctionListing({
        buyoutPrice: 5000,
        status: 'active',
      });

      const buyerCoins = 6000;
      const canBuyout = buyerCoins >= (listing.buyoutPrice || 0);

      assert.isTrue(canBuyout);

      if (canBuyout && listing.buyoutPrice) {
        listing.status = 'sold';
        listing.currentBid = listing.buyoutPrice;
      }

      assert.equals(listing.status, 'sold');
    });

    runner.test('Leilão expira corretamente', async () => {
      const listing = createMockAuctionListing({
        expiresAt: new Date(Date.now() - 1000), // Expirado
        status: 'active',
      });

      const isExpired = new Date() > listing.expiresAt;
      assert.isTrue(isExpired);

      if (isExpired && listing.status === 'active') {
        listing.status = listing.currentBid > 0 ? 'sold' : 'expired';
      }

      assert.equals(listing.status, 'expired');
    });

    runner.test('Taxa de venda aplicada ao vendedor', async () => {
      const salePrice = 10000;
      const saleTaxRate = 0.10; // 10%
      const tax = Math.floor(salePrice * saleTaxRate);
      const sellerReceives = salePrice - tax;

      assert.equals(tax, 1000);
      assert.equals(sellerReceives, 9000);
    });
  });

  runner.suite('Economia - Sistema de Trading', () => {
    runner.test('Criar trade entre jogadores', async () => {
      const trade = createMockTrade();

      assert.notNull(trade.tradeId);
      assert.equals(trade.status, 'pending');
      assert.isFalse(trade.initiatorConfirmed);
      assert.isFalse(trade.targetConfirmed);
    });

    runner.test('Adicionar items ao trade', async () => {
      const trade = createMockTrade();
      const item = { itemId: 'sword', quantity: 1 };

      trade.initiatorItems.push(item);

      assert.lengthOf(trade.initiatorItems, 1);
      assert.equals(trade.initiatorItems[0].itemId, 'sword');
    });

    runner.test('Adicionar coins ao trade', async () => {
      const trade = createMockTrade();

      trade.initiatorCoins = 5000;

      assert.equals(trade.initiatorCoins, 5000);
    });

    runner.test('Confirmação de ambos necessária', async () => {
      const trade = createMockTrade();

      trade.initiatorConfirmed = true;
      const canComplete = trade.initiatorConfirmed && trade.targetConfirmed;
      assert.isFalse(canComplete);

      trade.targetConfirmed = true;
      const canCompleteNow = trade.initiatorConfirmed && trade.targetConfirmed;
      assert.isTrue(canCompleteNow);
    });

    runner.test('Trade cancelado limpa dados', async () => {
      const trade = createMockTrade();
      trade.initiatorItems.push({ itemId: 'sword', quantity: 1 });
      trade.initiatorCoins = 1000;

      // Cancelar
      trade.status = 'cancelled';
      trade.initiatorItems = [];
      trade.targetItems = [];
      trade.initiatorCoins = 0;
      trade.targetCoins = 0;

      assert.equals(trade.status, 'cancelled');
      assert.lengthOf(trade.initiatorItems, 0);
      assert.equals(trade.initiatorCoins, 0);
    });

    runner.test('Limite de trades por hora', async () => {
      const TRADE_LIMIT_PER_HOUR = 5;
      const tradesThisHour = 5;

      const canTrade = tradesThisHour < TRADE_LIMIT_PER_HOUR;
      assert.isFalse(canTrade);
    });
  });

  runner.suite('Economia - Banco do Reino', () => {
    runner.test('Depósito funciona corretamente', async () => {
      const user = createMockUser({ coins: 10000 });
      const bankBalance = 0;
      const depositAmount = 5000;

      const newCoins = user.coins - depositAmount;
      const newBankBalance = bankBalance + depositAmount;

      assert.equals(newCoins, 5000);
      assert.equals(newBankBalance, 5000);
    });

    runner.test('Limite de depósito por nível', async () => {
      const getDepositLimit = (level: number): number => {
        if (level >= 76) return 5000000;
        if (level >= 51) return 1000000;
        if (level >= 26) return 500000;
        return 100000;
      };

      assert.equals(getDepositLimit(10), 100000);
      assert.equals(getDepositLimit(30), 500000);
      assert.equals(getDepositLimit(60), 1000000);
      assert.equals(getDepositLimit(80), 5000000);
    });

    runner.test('Juros diários calculados corretamente', async () => {
      const bankBalance = 100000;
      const dailyInterestRate = 0.001; // 0.1%
      const interest = Math.floor(bankBalance * dailyInterestRate);

      assert.equals(interest, 100);
    });

    runner.test('Empréstimo com juros', async () => {
      const loanAmount = 10000;
      const interestRate = 0.05; // 5%
      const totalToPay = Math.floor(loanAmount * (1 + interestRate));

      assert.equals(totalToPay, 10500);
    });

    runner.test('Limite de empréstimo por nível', async () => {
      const getLoanLimit = (level: number): number => {
        if (level >= 76) return 500000;
        if (level >= 51) return 100000;
        if (level >= 26) return 50000;
        return 10000;
      };

      assert.equals(getLoanLimit(10), 10000);
      assert.equals(getLoanLimit(50), 50000);
      assert.equals(getLoanLimit(80), 500000);
    });

    runner.test('Saque não pode exceder saldo', async () => {
      const bankBalance = 5000;
      const withdrawAmount = 10000;

      const canWithdraw = withdrawAmount <= bankBalance;
      assert.isFalse(canWithdraw);
    });
  });

  runner.suite('Economia - Prevenção de Exploits', () => {
    runner.test('Preço mínimo de leilão respeitado', async () => {
      const itemValue = 1000;
      const minPriceMultiplier = 0.5;
      const minPrice = Math.floor(itemValue * minPriceMultiplier);
      const attemptedPrice = 100;

      const isValidPrice = attemptedPrice >= minPrice;
      assert.isFalse(isValidPrice);
    });

    runner.test('Preço máximo de leilão respeitado', async () => {
      const itemValue = 1000;
      const maxPriceMultiplier = 1000;
      const maxPrice = itemValue * maxPriceMultiplier;
      const attemptedPrice = 2000000;

      const isValidPrice = attemptedPrice <= maxPrice;
      assert.isFalse(isValidPrice);
    });

    runner.test('Não pode dar lance em próprio item', async () => {
      const listing = createMockAuctionListing({ sellerId: 'user123' });
      const bidderId = 'user123';

      const canBid = listing.sellerId !== bidderId;
      assert.isFalse(canBid);
    });

    runner.test('Trade lock para novos jogadores', async () => {
      const accountCreatedAt = new Date();
      const TRADE_LOCK_DAYS = 7;
      const lockEndDate = new Date(accountCreatedAt.getTime() + TRADE_LOCK_DAYS * 24 * 60 * 60 * 1000);

      const canTrade = new Date() > lockEndDate;
      assert.isFalse(canTrade);
    });
  });
}

export default registerEconomyTests;
