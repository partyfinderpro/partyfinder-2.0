
const { GoogleGenerativeAI } = require("@google/generative-ai");

(async () => {
    try {
        const apiKey = "AIzaSyDE85E7w8po2ohKmofmAMfJfyvWEb9yao4";
        console.log('Listing models with key:', apiKey.substring(0, 10) + '...');

        // This is a bit of a hack to access listModels via raw fetch since the high-level SDK doesn't expose it easily on the instance in 0.24.1 without model manager specifics which are complex to setup here.
        // Actually, let's use fetch directly to the REST API to be sure.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`❌ ListModels FAILED: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const data = await response.json();
        console.log('✅ ListModels SUCCESS. Available models:');
        if (data.models) {
            data.models.forEach((m: any) => console.log(` - ${m.name}`));
        } else {
            console.log('No models returned in list.');
        }

    } catch (e: any) {
        console.error('❌ Script Error:', e.message);
    }
})();
