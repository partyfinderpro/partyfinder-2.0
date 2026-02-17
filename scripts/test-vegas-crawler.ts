import { CrawlerService } from '@/lib/vegas-strip/crawler-service';

const crawler = new CrawlerService();

async function testVegasCrawler() {
    console.log('🎰 Starting Test: Vegas Strip Crawler');

    const targetUrl = process.argv[2] || 'https://candy.ai';
    console.log(`📡 Crawling Target: ${targetUrl}`);

    const results = await crawler.crawl(targetUrl);

    console.log('✅ Crawl Complete!');
    console.log(`Found ${results.length} items.`);

    if (results.length > 0) {
        console.log('--- Sample Item ---');
        console.log(JSON.stringify(results[0], null, 2));

        if (results.length > 1) {
            console.log('--- Another Item ---');
            console.log(JSON.stringify(results[1], null, 2));
        }
    } else {
        console.log('⚠️ No items found. Check selector or Anti-Bot protection.');
    }
}

testVegasCrawler();
