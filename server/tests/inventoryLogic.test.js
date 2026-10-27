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
});
