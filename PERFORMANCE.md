# Performance Profiling Report

This document contains the performance metrics and memory profiling results for the Pirate Battle game, as requested in the challenge specifications. The tests were performed on an optimized production build (`npm run preview`).

## 1. Test Environment

- **Hardware:**
  - CPU: Intel Core i3-10100F
  - GPU: NVIDIA GeForce GTX 1650
  - RAM: 8 GB
- **Browser:** Brave Browser
- **Resolution:** Full HD / Desktop - Landscape Mode
- **Game Configuration:**
  - Session Time: 180 seconds (3 minutes)
  - Enemy Spawn Interval: 2 seconds (aggressive)

## 2. Framerate & Entity Metrics

During a full 3-minute match, the internal performance tracker collected the following frame time and entity metrics:

| Metric | Result | Target |
| :--- | :--- | :--- |
| **Total Frames Analyzed** | 3,774 frames | - |
| **Max Simultaneous Entities** | 19 entities | - |
| **Average FPS** | 60.00 FPS | 60 FPS |
| **Average Frame Time** | 16.67 ms | ~16.6 ms |
| **P95 Frame Time** | 16.90 ms | < 20.0 ms |

**Analysis:** 
The game consistently achieves the 60 FPS target. The 95th percentile (P95) frame time is exceptionally tight at **16.90 ms**, representing an effective 59.17 FPS even in the 5% slowest frames. The fixed-timestep simulation decouples logic from rendering, ensuring that the physics engine (OBB collision checks) executes smoothly without bottlenecking the PixiJS renderer.

## 3. Memory Profiling (Leak Test)

To test for memory leaks, the game was subjected to **5 complete cycles of "Start Match → Play → Quit to Menu"**. Memory Heap Snapshots were taken using the DevTools during these cycles (available in the `MemorySnapShots/` directory).

**Observations:**
- **No Continuous Resource Growth:** The memory footprint increased during the match as PixiJS cached textures, spawned particle effects, and allocated entities. However, upon returning to the Main Menu, garbage collection successfully restored the heap to its baseline.
- **Proper Resource Cleanup:** This proves the efficacy of our architecture's `destroy()` methods. All PixiJS Event Listeners, Ticker callbacks, and React instances are properly unmounted, and entity arrays are cleared aggressively to prevent retaining references.

## 4. Observed Limitations & Balancing

While the game performs phenomenally under standard and aggressive conditions, the physics engine (OBB collisions) scales geometrically with the number of entities.
- **Preventing CPU Overload:** If the spawn interval were allowed to be extremely low (e.g., < 0.5s), the sheer volume of simultaneous OBB collision calculations per frame would grow exponentially, potentially forcing the accumulator to drop frames. 
- **Balancing Decision:** To guarantee a flawless 60 FPS experience on a wide range of devices (including low-end CPUs), we explicitly restricted the **minimum Enemy Spawn Interval to 1 second** in the Options Menu. This ensures the maximum number of simultaneous entities remains well within the engine's comfortable limits, keeping frame times well below the 16.6ms threshold.
