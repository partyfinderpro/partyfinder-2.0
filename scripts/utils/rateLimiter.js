class RateLimiter {
    constructor(requestsPerMinute = 60) {
        this.requestsPerMinute = requestsPerMinute;
        this.queue = [];
        this.processing = false;
    }

    add(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    resolve(await fn());
                } catch (e) {
                    reject(e);
                }
            });
            if (!this.processing) this.process();
        });
    }

    async process() {
        this.processing = true;
        const interval = 60000 / this.requestsPerMinute;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                // Ejecutar tarea (sin await blocking para no detener el timer)
                task();
                // Esperar intervalo
                await new Promise(r => setTimeout(r, interval));
            }
        }
        this.processing = false;
    }
}

module.exports = { RateLimiter };
