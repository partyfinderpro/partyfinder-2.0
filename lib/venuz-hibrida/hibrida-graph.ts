
// lib/venuz-hibrida/hibrida-graph.ts
// Disabled LangChain agent for now to fix build

export async function getHibridaAgent() {
    return null;
}

export async function runHibridaTour(city: string): Promise<any> {
    console.log(`[Hibrida] Tour disabled for ${city} due to missing LangChain dependencies.`);
    return [];
}
