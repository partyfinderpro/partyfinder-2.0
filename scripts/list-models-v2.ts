
const { GoogleGenerativeAI } = require("@google/generative-ai");

(async () => {
    try {
        const apiKey = "AIzaSyDE85E7w8po2ohKmofmAMfJfyvWEb9yao4";
        console.log('Listing models with key:', apiKey.substring(0, 10));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`❌ ListModels FAILED: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        console.log(`✅ ListModels SUCCESS. Total models: ${data.models?.length || 0}`);

        const targetModels = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        const available = data.models?.map((m: any) => m.name.replace('models/', '')) || [];

        console.log('--- Checking for standard models ---');
        let found = false;
        for (const target of targetModels) {
            if (available.includes(target)) {
                console.log(`Found: ${target}`);
                found = true;
            } else {
                // Check if any available model contains the target string
                const match = available.find(m => m.includes(target));
                if (match) console.log(`Compatible match for ${target}: ${match}`);
            }
        }

        if (!found) {
            console.log('--- ALL AVAILABLE MODELS ---');
            available.forEach(m => console.log(m));
        }

    } catch (e: any) {
        console.error('❌ Script Error:', e.message);
    }
})();
