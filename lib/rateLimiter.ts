export class RateLimiter {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;

    constructor(private requestsPerMinute: number) { }

    async add<T>(fn: () => Promise<T>): Promise<T> {
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

    private async process() {
        this.processing = true;
        const interval = 60000 / this.requestsPerMinute;
        while (this.queue.length) {
            const task = this.queue.shift();
            if (task) {
                await task();
                await new Promise(r => setTimeout(r, interval));
            }
        }
        this.processing = false;
    }
}
