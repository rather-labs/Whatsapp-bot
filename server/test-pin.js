const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function testPinFunctionality() {
  console.log('🧪 Testing PIN functionality...\n');

  try {
    // Test 1: Register with PIN
    console.log('1. Testing user registration with PIN...');
    const registerResponse = await axios.post(`${BASE_URL}/users/register`, {
      whatsapp_number: '+1234567890',
      username: 'testuser',
      pin: 1234
    });
    console.log('✅ Registration successful:', registerResponse.data);

    // Test 2: Login with correct PIN
    console.log('\n2. Testing login with correct PIN...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      whatsapp_number: '+1234567890',
      pin: 1234
    });
    console.log('✅ Login successful:', {
      message: loginResponse.data.message,
      userId: loginResponse.data.user.id,
      token: loginResponse.data.token ? 'Token received' : 'No token'
    });

    const token = loginResponse.data.token;

    // Test 3: Get user profile with token
    console.log('\n3. Testing profile retrieval...');
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved:', {
      id: profileResponse.data.id,
      whatsapp_number: profileResponse.data.whatsapp_number,
      username: profileResponse.data.username,
      wallet_address: profileResponse.data.wallet_address
    });

    // Test 4: Test invalid PIN
    console.log('\n4. Testing login with invalid PIN...');
    try {
      await axios.post(`${BASE_URL}/users/login`, {
        whatsapp_number: '+1234567890',
        pin: 9999
      });
      console.log('❌ Should have failed with invalid PIN');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected invalid PIN');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 5: Test invalid PIN format
    console.log('\n5. Testing invalid PIN format...');
    try {
      await axios.post(`${BASE_URL}/users/register`, {
        whatsapp_number: '+9876543210',
        username: 'testuser2',
        pin: 'abc'
      });
      console.log('❌ Should have failed with invalid PIN format');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected invalid PIN format');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 6: Test PIN too short
    console.log('\n6. Testing PIN too short...');
    try {
      await axios.post(`${BASE_URL}/users/register`, {
        whatsapp_number: '+1111111111',
        username: 'testuser3',
        pin: 123
      });
      console.log('❌ Should have failed with PIN too short');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected PIN too short');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 7: Test PIN too long
    console.log('\n7. Testing PIN too long...');
    try {
      await axios.post(`${BASE_URL}/users/register`, {
        whatsapp_number: '+2222222222',
        username: 'testuser4',
        pin: 1234567
      });
      console.log('❌ Should have failed with PIN too long');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected PIN too long');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 All PIN functionality tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPinFunctionality(); 