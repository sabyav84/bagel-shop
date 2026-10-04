import fs from 'fs';

// Simple native .env parser
if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valParts] = trimmed.split('=');
      process.env[key.trim()] = valParts.join('=').trim();
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const pubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('--- Testing POST /orders with Publishable Key vs Anon Key ---');

async function testPost(keyName, keyVal) {
  console.log(`\nTesting POST /orders using ${keyName}...`);
  try {
    const response = await fetch(`${url}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': keyVal,
        'Authorization': `Bearer ${keyVal}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        order_number: 'TEST-123',
        customer_name: 'Test User',
        email: 'test@example.com',
        phone: '555-0199',
        pickup_time: 'ASAP',
        notes: 'Test',
        items: [],
        total_amount: 10.00,
        status: 'pending',
      }),
    });

    const body = await response.json().catch(() => null);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response body:', body);
  } catch (err) {
    console.error(`Error with ${keyName}:`, err.message);
  }
}

async function run() {
  await testPost('PUBLISHABLE_KEY', pubKey);
  await testPost('ANON_KEY', anonKey);
}

run();
