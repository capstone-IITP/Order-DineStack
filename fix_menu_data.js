
const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_5Qxef1FyLmcq@ep-green-snow-a181yqe7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const client = new Client({
    connectionString: connectionString,
});

async function run() {
    await client.connect();
    const tableId = '539df6fb-4cb9-45c3-873e-1550ebfdd3f6';

    try {
        console.log('--- Fixing Menu Data ---');

        // 1. Get the correct restaurant from the active table
        const resTable = await client.query(`SELECT * FROM "Table" WHERE id = $1`, [tableId]);
        if (resTable.rows.length === 0) { console.log('Table not found'); return; }

        const targetRestaurantId = resTable.rows[0].restaurantId;
        console.log(`Target Active Restaurant ID: ${targetRestaurantId}`);

        // 2. Update Categories
        console.log('Updating Categories...');
        const resCatUpdate = await client.query(
            `UPDATE "Category" SET "restaurantId" = $1 WHERE "restaurantId" != $1`,
            [targetRestaurantId]
        );
        console.log(`Updated ${resCatUpdate.rowCount} categories.`);

        // 3. Update Menu Items
        console.log('Updating Menu Items...');
        const resItemUpdate = await client.query(
            `UPDATE "MenuItem" SET "restaurantId" = $1 WHERE "restaurantId" != $1`,
            [targetRestaurantId]
        );
        console.log(`Updated ${resItemUpdate.rowCount} menu items.`);

        // 4. Verify
        console.log('\n--- Verification ---');
        const resCats = await client.query(`SELECT COUNT(*) FROM "Category" WHERE "restaurantId" = $1`, [targetRestaurantId]);
        console.log(`Categories now belonging to ${targetRestaurantId}: ${resCats.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
