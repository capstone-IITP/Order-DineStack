
const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_5Qxef1FyLmcq@ep-green-snow-a181yqe7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const client = new Client({
    connectionString: connectionString,
});

async function run() {
    await client.connect();

    try {
        const tableId = '539df6fb-4cb9-45c3-873e-1550ebfdd3f6';

        // Get table's restaurant
        const resTable = await client.query(`SELECT * FROM "Table" WHERE id = $1`, [tableId]);
        if (resTable.rows.length === 0) { console.log('Table not found'); return; }
        const table = resTable.rows[0];
        const targetRestaurantId = table.restaurantId;
        console.log(`Table ${tableId} is linked to Restaurant ${targetRestaurantId}`);

        // Get that restaurant's name
        const resRest = await client.query(`SELECT * FROM "Restaurant" WHERE id = $1`, [targetRestaurantId]);
        if (resRest.rows.length > 0) {
            console.log(`Target Restaurant Name: ${resRest.rows[0].name}, Status: ${resRest.rows[0].status}`);
        } else {
            console.log('Target Restaurant NOT FOUND in DB!');
        }

        console.log('\n--- All Categories in DB ---');
        const resCats = await client.query(`SELECT id, name, "restaurantId", "isActive" FROM "Category"`);
        resCats.rows.forEach(c => {
            const isMatch = c.restaurantId === targetRestaurantId;
            console.log(`Category: "${c.name}" - RestaurantID: ${c.restaurantId} [${isMatch ? 'MATCH' : 'MISMATCH'}]`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
