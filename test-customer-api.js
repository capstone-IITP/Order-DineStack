const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('🚀 Starting Customer API Tests...');

    try {
        // 0. Setup: Ensure restaurant is activated
        console.log('\n--- Step 0: Activation ---');
        const activationResponse = await fetch(`${BASE_URL}/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activationCode: 'TAP8-8842-SYSA-CT00' })
        });
        const activationData = await activationResponse.json();
        const restaurantId = activationData.restaurantId;
        console.log('✅ Restaurant ID:', restaurantId);

        // 1. Setup Table
        console.log('\n--- Step 1: Fetch Table ---');
        const tablesResponse = await fetch(`${BASE_URL}/tables`);
        const tablesData = await tablesResponse.json();
        let tableId = tablesData.tables[0]?.id;

        if (!tableId) {
            console.log('⚠️ No tables found. Creating a temporary table (this might fail if not admin)...');
            // Try to create table if it's open (usually not)
            // For test purposes, we'll just stop if no table exists
            console.log('Please ensure at least one table exists in the DB.');
            return;
        }
        console.log('✅ Using Table ID:', tableId);

        // 2. QR Session Init
        console.log('\n--- Step 2: session/init ---');
        const sessionResponse = await fetch(`${BASE_URL}/customer/session/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurantId, tableId })
        });
        const sessionData = await sessionResponse.json();
        const sessionToken = sessionData.token;
        console.log('✅ Session Token:', sessionToken.substring(0, 20) + '...');

        // 3. Fetch Menu
        console.log('\n--- Step 3: Fetch Menu ---');
        const menuResponse = await fetch(`${BASE_URL}/customer/menu/${restaurantId}`);
        const menuData = await menuResponse.json();
        console.log('✅ Categories Found:', menuData.categories?.length || 0);

        // 4. Create Order
        console.log('\n--- Step 4: Create Order ---');
        // We need a dummy menu item ID. Let's try to get one from menu if available
        let menuItemId = 'test-item-id';
        if (menuData.categories?.[0]?.items?.[0]) {
            menuItemId = menuData.categories[0].items[0].id;
        }

        const orderResponse = await fetch(`${BASE_URL}/customer/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                items: [
                    { menuItemId, quantity: 2, price: 10.5 }
                ],
                totalAmount: 21.0
            })
        });
        const orderData = await orderResponse.json();
        if (!orderData.success) {
            console.log('❌ Order Creation Failed:', orderData.error);
        } else {
            const orderId = orderData.order.id;
            console.log('✅ Order Created. ID:', orderId);

            // 5. Duplicate Submission Check
            console.log('\n--- Step 5: Duplicate Order Check ---');
            const dupResponse = await fetch(`${BASE_URL}/customer/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    items: [{ menuItemId, quantity: 2, price: 10.5 }],
                    totalAmount: 21.0
                })
            });
            if (dupResponse.status === 409) {
                console.log('✅ Properly rejected duplicate order (409)');
            } else {
                console.log('❌ Unexpected status for duplicate:', dupResponse.status);
            }

            // 6. Track Status
            console.log('\n--- Step 6: Order Status ---');
            const statusResponse = await fetch(`${BASE_URL}/customer/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
            const statusData = await statusResponse.json();
            console.log('✅ Order Status:', statusData.order.status);

            // 7. Add More Items
            console.log('\n--- Step 7: Add More Items ---');
            const addItemsResponse = await fetch(`${BASE_URL}/customer/orders/${orderId}/add-items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    items: [{ menuItemId, quantity: 1, price: 5.0 }],
                    additionalAmount: 5.0
                })
            });
            const addItemsData = await addItemsResponse.json();
            console.log('✅ Total price now:', addItemsData.order.totalAmount);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

runTests();
