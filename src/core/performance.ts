export class PerformanceTracker {
    private isTracking = false;
    private frameDeltas: number[] = [];
    private maxEntities = 0;
    private lastTime = 0;

    start() {
        this.isTracking = true;
        this.frameDeltas = [];
        this.maxEntities = 0;
        this.lastTime = performance.now();
        console.log('Performance tracking started.');
    }

    recordFrame(entityCount: number) {
        if (!this.isTracking) return;
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        // Ignore huge deltas (like tab switching) so they don't skew the P95 artificially
        if (delta > 0 && delta < 1000) {
            this.frameDeltas.push(delta);
        }

        if (entityCount > this.maxEntities) {
            this.maxEntities = entityCount;
        }
    }

    stop() {
        if (!this.isTracking) return;
        this.isTracking = false;

        if (this.frameDeltas.length === 0) {
            console.log('No performance data collected.');
            return;
        }

        // Sort deltas to find P95
        this.frameDeltas.sort((a, b) => a - b);
        const p95Index = Math.floor(this.frameDeltas.length * 0.95);
        const p95 = this.frameDeltas[p95Index];

        const totalDuration = this.frameDeltas.reduce((a, b) => a + b, 0);
        const averageDelta = totalDuration / this.frameDeltas.length;
        const averageFps = 1000 / averageDelta;
        const p95Fps = 1000 / p95;

        console.log('====================================');
        console.log('PERFORMANCE REPORT');
        console.log('====================================');
        console.log(`Total Frames:    ${this.frameDeltas.length}`);
        console.log(`Max Entities:    ${this.maxEntities}`);
        console.log(`Average FPS:     ${averageFps.toFixed(2)}`);
        console.log(`Avg Frame Time:  ${averageDelta.toFixed(2)} ms`);
        console.log(`P95 Frame Time:  ${p95.toFixed(2)} ms (equiv to ${p95Fps.toFixed(2)} FPS)`);
        console.log('====================================');
    }
}

export const perfTracker = new PerformanceTracker();
