
const https = require('https');

const url = 'https://software.dinestack.in/api/customer/table/539df6fb-4cb9-45c3-873e-1550ebfdd3f6';

console.log(`Fetching ${url}...`);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        try {
            const json = JSON.parse(data);
            // console.log('Response:', JSON.stringify(json, null, 2));

            if (json.categories) {
                console.log('\n--- Analysis ---');
                console.log(`Categories count: ${json.categories.length}`);
                json.categories.forEach(cat => {
                    // Backend returns isActive, which frontend maps to isAvailable.
                    // NOTE: Backend endpoint /customer/table/:id returns items where isActive=true already?
                    // Let's check the output.
                    const items = cat.items || [];
                    console.log(`Category: ${cat.name} (Items: ${items.length})`);
                    items.forEach(item => {
                        console.log(`  - ${item.name}: isActive=${item.isActive}`);
                    });
                });
            } else {
                console.log('No categories property in response.');
                console.log(JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log('Raw Data:', data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
