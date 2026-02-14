
import { GoogleGenerativeAI } from "@google/generative-ai";

(async () => {
    try {
        const apiKey = "AIzaSyDE85E7w8po2ohKmofmAMfJfyvWEb9yao4";
        console.log('Testing ListModels with key:', apiKey.substring(0, 10) + '...');

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using the generativeModel manager usually requires an instance, 
        // but let's try a direct fetch if the SDK doesn't expose listModels easily on the main class in this version.
        // Actually the SDK doesn't expose listModels directly on GoogleGenerativeAI instance easily in all versions.

        // Let's try to just fetch via fetch if SDK is tricky, or use a known model like 'gemini-pro' as fallback.

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log('Trying fallback model: gemini-pro');
        const result = await model.generateContent("Test.");
        console.log('Response:', result.response.text());
        console.log('✅ TEST SUCCESS - gemini-pro WORKS');

    } catch (e: any) {
        console.error('❌ TEST FAILED:', e.message);
    }
})();
