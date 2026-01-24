const { ApifyClient } = require('apify-client');

const client = new ApifyClient({
    token: 'apify_api_IsgP0A4xI98EfaqtKnnn7z0m11iuE1SiqOs',
});

async function listActors() {
    try {
        console.log("🔍 Buscando tus bots en Apify...");
        const actors = await client.actors().list();
        if (actors.items.length === 0) {
            console.log("No encontré bots creados por ti. Buscando en tus runs recientes...");
            const runs = await client.runs().list({ limit: 5 });
            runs.items.forEach(run => {
                console.log(`- Bot detectado: ${run.actId} (Última vez usado: ${run.startedAt})`);
            });
        } else {
            actors.items.forEach(actor => {
                console.log(`- Bot encontrado: ${actor.username}/${actor.name} (ID: ${actor.id})`);
            });
        }
    } catch (error) {
        console.error("Error al conectar con Apify:", error.message);
    }
}

listActors();
