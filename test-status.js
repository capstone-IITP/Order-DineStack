const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log('🚀 Starting Verification Test...');

    console.log('🔍 Finding Restaurant via Debug Endpoint...');
    // Use Access to debug endpoint
    const idRes = await fetch(`${BASE_URL}/debug/restaurant-id`);
    if (!idRes.ok) {
        console.error('❌ Failed to fetch debug ID. Is server running with debug endpoint?');
        process.exit(1);
    }
    const restaurant = await idRes.json();

    if (!restaurant || !restaurant.id) {
        console.error('❌ No restaurant found via debug endpoint.');
        process.exit(1);
    }

    const RESTAURANT_ID = restaurant.id;
    console.log(`✅ Found Restaurant: ${RESTAURANT_ID} (Current Status: ${restaurant.status})`);

    // Helper to toggle status
    async function setStatus(status) {
        console.log(`🔄 Setting Status to ${status}...`);
        const res = await fetch(`${BASE_URL}/debug/toggle-status/${RESTAURANT_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        console.log(`   Response: ${JSON.stringify(data)}`);
    }

    // Test 1: Active
    await setStatus('ACTIVE');

    console.log('🧪 Test 1: Fetch Menu (Should Succeed)');
    const menuRes = await fetch(`${BASE_URL}/customer/menu/${RESTAURANT_ID}`);
    if (menuRes.status === 200) console.log('   ✅ OK');
    else console.log(`   ❌ Failed: ${menuRes.status}`);

    // Test 2: Suspended
    await setStatus('SUSPENDED');

    console.log('🧪 Test 2: Fetch Menu (Should Fail 403)');
    const menuRes2 = await fetch(`${BASE_URL}/customer/menu/${RESTAURANT_ID}`);
    if (menuRes2.status === 403) console.log('   ✅ OK (Blocked)');
    else console.log(`   ❌ Failed: Got ${menuRes2.status} (Expected 403)`);

    // Cleanup
    await setStatus('ACTIVE');
    console.log('✅ Verification Completed.');
}

runTest().catch(e => console.error(e));
