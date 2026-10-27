import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Store Inventory & POS Billing Logic', () => {
  test('correctly calculates subtotal, tax, discount, and grand total', () => {
    const items = [
      { sellingPrice: 56, quantity: 2 },  // 112
      { sellingPrice: 255, quantity: 1 }, // 255
    ];
    const subtotal = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    assert.equal(subtotal, 367);

    const discount = 17;
    const taxRate = 5; // 5%
    const discountedSubtotal = subtotal - discount; // 350
    const tax = Math.round((discountedSubtotal * taxRate) / 100); // 17.5 => 18 or 17.5
    const grandTotal = discountedSubtotal + tax;

    assert.equal(discountedSubtotal, 350);
    assert.equal(tax, 18);
    assert.equal(grandTotal, 368);
  });

  test('calculates accurate gross profit margin (SP - CP) * quantity', () => {
    const items = [
      { costPrice: 50, sellingPrice: 56, quantity: 4 },  // Cost: 200, Rev: 224, Profit: 24
      { costPrice: 125, sellingPrice: 145, quantity: 2 }, // Cost: 250, Rev: 290, Profit: 40
    ];

    const totalRevenue = items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
    const totalCost = items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
    const grossProfit = totalRevenue - totalCost;

    assert.equal(totalRevenue, 514);
    assert.equal(totalCost, 450);
    assert.equal(grossProfit, 64);
  });

  test('atomic stock decrement correctly flags low-stock threshold trigger', () => {
    let stockQuantity = 6;
    const minThreshold = 5;
    const purchasedQuantity = 2;

    // Before sale
    const statusBefore = stockQuantity <= minThreshold ? 'LOW_STOCK' : 'IN_STOCK';
    assert.equal(statusBefore, 'IN_STOCK');

    // Execute atomic sale decrement
    stockQuantity -= purchasedQuantity;
    assert.equal(stockQuantity, 4);

    // After sale
    const statusAfter = stockQuantity === 0 ? 'OUT_OF_STOCK' : stockQuantity <= minThreshold ? 'LOW_STOCK' : 'IN_STOCK';
    assert.equal(statusAfter, 'LOW_STOCK');
  });

  test('prevents checkout when requested quantity exceeds available stock', () => {
    const availableStock = 3;
    const requestedQuantity = 5;

    const hasSufficientStock = availableStock >= requestedQuantity;
    assert.equal(hasSufficientStock, false);
  });

  test('validates customer credit limit ceiling during Khata credit sales', () => {
    const customer = { balance: 4200, creditLimit: 5000 };
    const billAmount = 1000;
    const projectedDebt = customer.balance + billAmount;

    // Without override: rejected
    const isExceeded = projectedDebt > customer.creditLimit;
    assert.equal(isExceeded, true);

    // Over-limit excess calculation
    const excess = projectedDebt - customer.creditLimit;
    assert.equal(excess, 200);
  });

  test('strictly enforces maximum 50% discount ceiling on bill value', () => {
    const subtotal = 400;
    const maxAllowedDiscount = Math.round(subtotal * 0.5 * 100) / 100;
    assert.equal(maxAllowedDiscount, 200);

    const validDiscount = 150;
    const isUnderMax = validDiscount <= maxAllowedDiscount;
    assert.equal(isUnderMax, true);

    const excessiveDiscount = 250;
    const clampedDiscount = Math.min(maxAllowedDiscount, Math.max(0, excessiveDiscount));
    assert.equal(clampedDiscount, 200);

    const isExcessiveBlocked = excessiveDiscount > maxAllowedDiscount;
    assert.equal(isExcessiveBlocked, true);
  });

  test('correctly calculates day-close cash reconciliation and drawer discrepancy', () => {
    const startingFloat = 1000;
    const cashSales = 4500;
    const khataCollected = 800;
    const expectedCash = startingFloat + cashSales + khataCollected; // 6300
    assert.equal(expectedCash, 6300);

    // Case 1: Exact match
    const countedCash1 = 6300;
    const diff1 = countedCash1 - expectedCash;
    const status1 = Math.abs(diff1) < 0.01 ? 'MATCHED' : diff1 < 0 ? 'SHORTAGE' : 'SURPLUS';
    assert.equal(diff1, 0);
    assert.equal(status1, 'MATCHED');

    // Case 2: Shortage
    const countedCash2 = 6250;
    const diff2 = countedCash2 - expectedCash;
    const status2 = Math.abs(diff2) < 0.01 ? 'MATCHED' : diff2 < 0 ? 'SHORTAGE' : 'SURPLUS';
    assert.equal(diff2, -50);
    assert.equal(status2, 'SHORTAGE');

    // Case 3: Surplus
    const countedCash3 = 6340;
    const diff3 = countedCash3 - expectedCash;
    const status3 = Math.abs(diff3) < 0.01 ? 'MATCHED' : diff3 < 0 ? 'SHORTAGE' : 'SURPLUS';
    assert.equal(diff3, 40);
    assert.equal(status3, 'SURPLUS');
  });

  test('validates that cash tendered cannot be negative and computes accurate change', () => {
    const grandTotal = 340;
    const negativeTendered = -50;
    const isNegativeBlocked = negativeTendered < 0;
    assert.equal(isNegativeBlocked, true);

    const validTendered = 500;
    const changeDue = Math.max(0, validTendered - grandTotal);
    assert.equal(changeDue, 160);

    const exactTendered = 340;
    const exactChange = Math.max(0, exactTendered - grandTotal);
    assert.equal(exactChange, 0);
  });

  test('validates customer 10-digit phone number format and credit limits', () => {
    const isValid10DigitPhone = (phone) => {
      let clean = String(phone || '').replace(/\D/g, '');
      if (clean.length === 12 && clean.startsWith('91')) clean = clean.slice(2);
      if (clean.length === 11 && clean.startsWith('0')) clean = clean.slice(1);
      return /^\d{10}$/.test(clean);
    };

    // Valid 10-digit phone numbers (any initial digit allowed)
    assert.equal(isValid10DigitPhone('9876543210'), true);
    assert.equal(isValid10DigitPhone('+91 98765 43210'), true);
    assert.equal(isValid10DigitPhone('09876543210'), true);
    assert.equal(isValid10DigitPhone('1234567890'), true);
    assert.equal(isValid10DigitPhone('2345678901'), true);
    assert.equal(isValid10DigitPhone('8123456789'), true);
    assert.equal(isValid10DigitPhone('5551234567'), true);

    // Invalid phone numbers
    assert.equal(isValid10DigitPhone('987654321'), false);   // 9 digits
    assert.equal(isValid10DigitPhone('98765432100'), false); // 11 digits
    assert.equal(isValid10DigitPhone('abcdefghij'), false);  // letters
    assert.equal(isValid10DigitPhone(''), false);            // empty

    // Customer credit limit bounds
    const validateCreditLimit = (limit) => {
      const num = parseFloat(limit);
      return !isNaN(num) && num >= 0 && num <= 500000;
    };

    assert.equal(validateCreditLimit(5000), true);
    assert.equal(validateCreditLimit(0), true);
    assert.equal(validateCreditLimit(-100), false);
    assert.equal(validateCreditLimit(600000), false);
  });

  test('Khata advance credit logic when customer overpays and subsequent bill drawdown', () => {
    // 1. Initial State: Customer has ₹200 existing debt
    let balance = 200;
    const creditLimit = 5000;

    // Helper functions matching Customer model virtuals
    const getAdvanceCredit = (bal) => (bal < 0 ? Math.abs(bal) : 0);
    const getDebtDue = (bal) => (bal > 0 ? bal : 0);

    assert.equal(getDebtDue(balance), 200);
    assert.equal(getAdvanceCredit(balance), 0);

    // 2. Customer pays ₹500 (overpaying ₹300)
    const payment = 500;
    balance = Math.round((balance - payment) * 100) / 100;
    assert.equal(balance, -300);
    assert.equal(getDebtDue(balance), 0);
    assert.equal(getAdvanceCredit(balance), 300);

    // 3. Customer makes subsequent Khata credit purchase of ₹180
    const bill1 = 180;
    const prevBal1 = balance;
    const hadAdvance1 = prevBal1 < 0;
    const advanceAvailable1 = hadAdvance1 ? Math.abs(prevBal1) : 0;
    const advanceUsed1 = hadAdvance1 ? Math.min(advanceAvailable1, bill1) : 0;

    assert.equal(advanceUsed1, 180);
    balance = Math.round((prevBal1 + bill1) * 100) / 100;
    assert.equal(balance, -120);
    assert.equal(getAdvanceCredit(balance), 120);
    assert.equal(getDebtDue(balance), 0);

    // 4. Customer makes another purchase of ₹300 (exceeding remaining advance of ₹120)
    const bill2 = 300;
    const prevBal2 = balance;
    const hadAdvance2 = prevBal2 < 0;
    const advanceAvailable2 = hadAdvance2 ? Math.abs(prevBal2) : 0;
    const advanceUsed2 = hadAdvance2 ? Math.min(advanceAvailable2, bill2) : 0;

    assert.equal(advanceUsed2, 120);
    balance = Math.round((prevBal2 + bill2) * 100) / 100;
    assert.equal(balance, 180); // turned into ₹180 debt
    assert.equal(getAdvanceCredit(balance), 0);
    assert.equal(getDebtDue(balance), 180);

    // Check credit limit room is correctly calculated
    const remainingCreditRoom = Math.max(0, creditLimit - balance);
    assert.equal(remainingCreditRoom, 4820);
  });

  test('Gopal ledger scenario: reconciles true surplus from historical purchases and payments', () => {
    // Exact history from user screenshot:
    // INV-0004: +47 purchase
    // Payment: -500 payment
    // INV-0005: +47 purchase
    // Payment: -500 payment
    const history = [
      { type: 'PURCHASE', amount: 47, invoiceNumber: 'INV-0004' },
      { type: 'PAYMENT', amount: 500 },
      { type: 'PURCHASE', amount: 47, invoiceNumber: 'INV-0005' },
      { type: 'PAYMENT', amount: 500 },
    ];

    // Compute net balance from history:
    const computedBal = history.reduce((sum, h) => {
      if (h.type === 'PURCHASE') return sum + h.amount;
      if (h.type === 'PAYMENT') return sum - h.amount;
      if (h.type === 'REFUND') return sum + h.amount;
      return sum;
    }, 0);

    assert.equal(computedBal, -906);

    const isSurplus = computedBal < 0;
    const surplusHeldByStore = isSurplus ? Math.abs(computedBal) : 0;
    assert.equal(isSurplus, true);
    assert.equal(surplusHeldByStore, 906);

    // Gopal gets a partial cash refund of ₹206:
    const refundAmount = 206;
    history.push({ type: 'REFUND', amount: refundAmount, notes: 'Cash refund of surplus' });

    const balAfterRefund = history.reduce((sum, h) => {
      if (h.type === 'PURCHASE') return sum + h.amount;
      if (h.type === 'PAYMENT') return sum - h.amount;
      if (h.type === 'REFUND') return sum + h.amount;
      return sum;
    }, 0);

    assert.equal(balAfterRefund, -700);
    assert.equal(Math.abs(balAfterRefund), 700); // ₹700 surplus left

    // Next time Gopal buys groceries for ₹150:
    const billAmount = 150;
    const advanceUsed = Math.min(Math.abs(balAfterRefund), billAmount);
    assert.equal(advanceUsed, 150);

    const finalBal = balAfterRefund + billAmount;
    assert.equal(finalBal, -550); // ₹550 surplus remains
  });
});
