
import { GoogleGenerativeAI } from "@google/generative-ai";

(async () => {
    try {
        const apiKey = "AIzaSyDE85E7w8po2ohKmofmAMfJfyvWEb9yao4";
        console.log('Testing with model: gemini-flash-latest');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const result = await model.generateContent("Hola!");
        console.log('Response:', result.response.text());
        console.log('✅ TEST SUCCESS');
    } catch (e: any) {
        console.error('❌ TEST FAILED:', e.message);
    }
})();
