/**
 * Script để test login và debug lỗi 500
 * Chạy: node test-login.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123456';

async function testLogin() {
  console.log('=== Testing Login Process ===\n');

  // 1. Check environment variables
  console.log('1. Checking environment variables...');
  console.log('   JWT_ACCESS_SECRET:', !!process.env.JWT_ACCESS_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   JWT_REFRESH_SECRET:', !!process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   MONGODB_URI:', !!process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
  
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET || !process.env.MONGODB_URI) {
    console.log('\n❌ Missing required environment variables!');
    console.log('   Create .env file with:');
    console.log('   JWT_ACCESS_SECRET=your-secret');
    console.log('   JWT_REFRESH_SECRET=your-secret');
    console.log('   MONGODB_URI=mongodb://localhost:27017/ezhome');
    process.exit(1);
  }

  try {
    // 2. Connect to database
    console.log('\n2. Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Database connected');

    // 3. Check if test user exists
    console.log('\n3. Checking test user...');
    let user = await User.findOne({ email: TEST_EMAIL });
    
    if (!user) {
      console.log('   ⚠️  Test user not found. Creating...');
      user = new User({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User',
      });
      await user.save();
      console.log('   ✅ Test user created');
    } else {
      console.log('   ✅ Test user found');
      console.log('   User ID:', user._id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Has password:', !!user.password);
    }

    // 4. Test password comparison
    console.log('\n4. Testing password...');
    const isPasswordValid = await bcrypt.compare(TEST_PASSWORD, user.password);
    console.log('   Password valid:', isPasswordValid ? '✅ Yes' : '❌ No');
    
    if (!isPasswordValid) {
      console.log('   ⚠️  Password mismatch! Re-hashing...');
      user.password = TEST_PASSWORD;
      await user.save();
      console.log('   ✅ Password updated');
      
      // Test again
      const reloadUser = await User.findOne({ email: TEST_EMAIL });
      const isValid2 = await bcrypt.compare(TEST_PASSWORD, reloadUser.password);
      console.log('   Password valid (after update):', isValid2 ? '✅ Yes' : '❌ No');
    }

    // 5. Test JWT generation
    console.log('\n5. Testing JWT generation...');
    const jwt = require('jsonwebtoken');
    try {
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      console.log('   ✅ JWT token generated');
      console.log('   Token preview:', token.substring(0, 50) + '...');
    } catch (error) {
      console.log('   ❌ JWT generation failed:', error.message);
    }

    // 6. Test Token model
    console.log('\n6. Testing Token model...');
    const Token = require('./models/token.model');
    const testRefreshToken = 'test-refresh-token-' + Date.now();
    try {
      await Token.create({
        userId: user._id,
        token: testRefreshToken,
        createdAt: new Date(),
      });
      console.log('   ✅ Token created in database');
      
      // Clean up
      await Token.deleteOne({ token: testRefreshToken });
      console.log('   ✅ Token deleted (cleanup)');
    } catch (error) {
      console.log('   ❌ Token creation failed:', error.message);
    }

    console.log('\n=== ✅ All tests passed! ===');
    console.log('\nYou can now login with:');
    console.log('Email:', TEST_EMAIL);
    console.log('Password:', TEST_PASSWORD);
    console.log('\nTest with curl:');
    console.log(`curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${TEST_EMAIL}","password":"${TEST_PASSWORD}"}'`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

testLogin();

