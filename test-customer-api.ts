import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('🚀 Starting Customer API Tests...');

    try {
        // 0. Setup: Ensure restaurant is activated
        console.log('\n--- Step 0: Activation ---');
        const activationResponse = await axios.post(`${BASE_URL}/activate`, {
            activationCode: 'TAP8-8842-SYSA-CT00'
        });
        const restaurantId = activationResponse.data.restaurantId;
        console.log('✅ Restaurant ID:', restaurantId);

        // 1. Setup Table: Create a table if none exist
        console.log('\n--- Step 1: Create Table ---');
        // We'll just fetch existing tables first
        const tablesResponse = await axios.get(`${BASE_URL}/tables`);
        let tableId = tablesResponse.data.tables[0]?.id;

        if (!tableId) {
            console.log('No tables found. This test requires at least one table. Please create a table in the Admin panel or via API first.');
            // Since we need 'authenticate' for POST /api/tables, we'll skip creating it here 
            // and assume one exists from previous development steps.
            // return;
        }
        console.log('✅ Using Table ID:', tableId);

        // 2. QR Session Init
        console.log('\n--- Step 2: session/init ---');
        const sessionResponse = await axios.post(`${BASE_URL}/customer/session/init`, {
            restaurantId,
            tableId
        });
        const sessionToken = sessionResponse.data.token;
        console.log('✅ Session Token:', sessionToken.substring(0, 20) + '...');

        // 3. Fetch Menu
        console.log('\n--- Step 3: Fetch Menu ---');
        const menuResponse = await axios.get(`${BASE_URL}/customer/menu/${restaurantId}`);
        console.log('✅ Categories Found:', menuResponse.data.categories.length);

        // 4. Create Order
        console.log('\n--- Step 4: Create Order ---');
        const orderResponse = await axios.post(`${BASE_URL}/customer/orders`, {
            items: [
                { menuItemId: 'test-item-id', quantity: 2, price: 10.5 }
            ],
            totalAmount: 21.0
        }, {
            headers: { Authorization: `Bearer ${sessionToken}` }
        });
        const orderId = orderResponse.data.order.id;
        console.log('✅ Order Created. ID:', orderId);

        // 5. Duplicate Submission Check
        console.log('\n--- Step 5: Duplicate Order Check ---');
        try {
            await axios.post(`${BASE_URL}/customer/orders`, {
                items: [{ menuItemId: 'test-item-id', quantity: 2, price: 10.5 }],
                totalAmount: 21.0
            }, {
                headers: { Authorization: `Bearer ${sessionToken}` }
            });
            console.log('❌ Error: Duplicate order was NOT rejected');
        } catch (err: any) {
            if (err.response?.status === 409) {
                console.log('✅ Properly rejected duplicate order (409)');
            } else {
                console.log('❌ Unexpected error for duplicate:', err.message);
            }
        }

        // 6. Track Status
        console.log('\n--- Step 6: Order Status ---');
        const statusResponse = await axios.get(`${BASE_URL}/customer/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${sessionToken}` }
        });
        console.log('✅ Order Status:', statusResponse.data.order.status);

        // 7. Add More Items
        console.log('\n--- Step 7: Add More Items ---');
        const addItemsResponse = await axios.post(`${BASE_URL}/customer/orders/${orderId}/add-items`, {
            items: [{ menuItemId: 'extra-item-id', quantity: 1, price: 5.0 }],
            additionalAmount: 5.0
        }, {
            headers: { Authorization: `Bearer ${sessionToken}` }
        });
        console.log('✅ Total price now:', addItemsResponse.data.order.totalAmount);

    } catch (error: any) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

runTests();
