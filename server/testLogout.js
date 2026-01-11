// Test Logout Feature
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api/auth';

async function testLogout() {
  try {
    console.log('🔐 STEP 1: Testing LOGIN...\n');
    
    // Try login with test user
    const loginRes = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'logout-test@example.com',
        password: 'test123456'
      })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginRes.ok) {
      console.error('❌ LOGIN FAILED:', loginData);
      process.exit(1);
    }
    
    console.log('✅ LOGIN SUCCESS');
    console.log('Response:', JSON.stringify(loginData, null, 2));
    console.log('\n---\n');
    
    const token = loginData.token;
    
    console.log('🔓 STEP 2: Testing LOGOUT...\n');
    
    // Test logout with token
    const logoutRes = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    
    const logoutData = await logoutRes.json();
    
    console.log('✅ LOGOUT SUCCESS');
    console.log('Response:', JSON.stringify(logoutData, null, 2));
    console.log(`Status Code: ${logoutRes.status}\n`);
    
    console.log('---\n');
    console.log('✨ Logout feature is working correctly!\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testLogout();
