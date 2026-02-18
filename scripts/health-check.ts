
const target = 'https://labelbabel.com/api/cron/vegas-scrape';

async function check() {
    console.log(`📡 Ping: ${target} ...`);
    try {
        const res = await fetch(target);
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            console.log('✅ Endpoint ALIVE!');
            const json = await res.json();
            console.log(json);
        } else {
            console.log('⏳ Waiting for Vercel...');
        }
    } catch (e) {
        console.log('❌ Error fetching:', e.message);
    }
}

check();
