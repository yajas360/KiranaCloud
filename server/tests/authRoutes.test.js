import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { seedStoreData } from '../scripts/seed.js';

describe('Store Staff Authentication & Demo Credentials', () => {
  let mongod;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await seedStoreData();
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  test('seeded demo owner can be retrieved by email owner@kiranacloud.com', async () => {
    const user = await User.findOne({ email: 'owner@kiranacloud.com' }).select('+password');
    assert.ok(user, 'Demo store owner should exist');
    assert.equal(user.email, 'owner@kiranacloud.com');
    assert.equal(user.storePhone, '9811234567');
    const isMatch = await user.comparePassword('password123');
    assert.equal(isMatch, true, 'Password must match password123');
  });

  test('seeded demo owner can be retrieved by mobile number 9811234567', async () => {
    const identifier = '9811234567';
    const isPhone = /^\d{10}$/.test(identifier);
    assert.equal(isPhone, true);

    const user = await User.findOne({
      $or: [{ storePhone: identifier }, { email: identifier.toLowerCase() }],
    }).select('+password');

    assert.ok(user, 'User should be found by 10-digit mobile number');
    assert.equal(user.storePhone, '9811234567');
    const isMatch = await user.comparePassword('password123');
    assert.equal(isMatch, true);
  });

  test('validates identifier acceptance for both email and 10-digit mobile format', () => {
    const validateId = (id) => {
      const trimmed = (id || '').toString().trim();
      if (!trimmed) return false;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const isPhone = /^\d{10}$/.test(trimmed);
      return isEmail || isPhone;
    };

    assert.equal(validateId('9811234567'), true, '10-digit mobile must be valid');
    assert.equal(validateId('owner@kiranacloud.com'), true, 'Valid email must be valid');
    assert.equal(validateId('invalid_user'), false, 'Non-email non-phone must fail');
    assert.equal(validateId('12345'), false, 'Short phone must fail');
    assert.equal(validateId(''), false, 'Empty identifier must fail');
  });
});
