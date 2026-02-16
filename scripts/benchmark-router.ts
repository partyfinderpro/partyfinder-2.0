// scripts/benchmark-router.ts
import dotenv from 'dotenv';
import path from 'path';

// Force load env vars from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

console.log(`Loading env from: ${envLocalPath}`);
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath }); // Fallback

import { smartRouter } from '@/lib/agent/router';
import { logger } from '@/lib/logger';

// Mock logger
logger.info = console.log;
logger.error = console.error;

const tests = [
    { prompt: "Explica cuántos planetas hay en el sistema solar.", task: "simple", context: {} },
    { prompt: "Debug este código React: function App() { return <div>Error</div> }", task: "code", context: { requiresReasoning: true } },
    { prompt: "Analiza esta imagen y dime qué ves.", task: "vision", context: { image: true } }
];

async function runBenchmark() {
    console.log("🚀 Starting Router Benchmark...\n");
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log("Checking API Keys:");
    // Simple check to mask keys
    console.log("- GROQ_API_KEY:", process.env.GROQ_API_KEY ? `✅ Set (${process.env.GROQ_API_KEY.substring(0, 4)}...)` : "❌ Missing");
    console.log("- GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ Set" : "❌ Missing");
    console.log("- ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✅ Set" : "❌ Missing");
    console.log("\n--------------------------------------------------\n");

    for (const test of tests) {
        const start = Date.now();
        console.log(`Test: [${test.task.toUpperCase()}] "${test.prompt.substring(0, 30)}..."`);

        try {
            const decision = await smartRouter(test.prompt, test.context);
            const latency = Date.now() - start;
            console.log(`   -> Decision: ${decision.provider}/${decision.model}`);
            console.log(`   -> Reason:   ${decision.reason}`);
            console.log(`   -> Latency:  ${latency}ms`);
        } catch (error) {
            console.error(`   -> FAILED:`, error);
        }
        console.log("\n");
    }
}

runBenchmark();
