
import { GoogleGenerativeAI } from "@google/generative-ai";

(async () => {
    try {
        // HARDCODED NEW KEY for verification
        const apiKey = "AIzaSyDE85E7w8po2ohKmofmAMfJfyvWEb9yao4";
        console.log('Testing with NEW key:', apiKey.substring(0, 10) + '...');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log('Generating content...');
        const result = await model.generateContent("Hola VENUZ Core, ¿estás vivo? Responde con un emoji.");
        console.log('Response:', result.response.text());
        console.log('✅ TEST SUCCESS - KEY WORKS');
    } catch (e: any) {
        console.error('❌ TEST FAILED:', e.message);
        if (e.message.includes('403')) {
            console.log('⚠️  POSSIBLE CAUSE: API not enabled in Google Console or Billing issue.');
        }
    }
})();
