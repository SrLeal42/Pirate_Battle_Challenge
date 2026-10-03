# Architecture & Technical Decisions

This document outlines the architectural decisions, patterns, and structure of the Pirate Battle game.

## 1. React & PixiJS Integration

The architecture clearly separates the **UI layer (React)** from the **Game Rendering layer (PixiJS)** and the **Game Logic (Simulation)**.

- **UI & Menus:** React handles all forms, menus, leaderboards, and the HUD (Heads-Up Display). We use `Zustand` for state management to avoid unnecessary prop drilling.
- **PixiJS Canvas:** PixiJS is strictly used for rendering the game arena, ships, projectiles, and visual effects (e.g., muzzle flashes, explosions).
- **Integration:** The PixiJS application is mounted inside a React component (`GameView`). We avoid React re-renders on every frame. Instead, the game simulation syncs specific UI data (like player health, score, and time) to the Zustand store at a throttled rate (e.g., 100ms) to ensure smooth React performance without layout thrashing.
- **Resize Handling:** The game canvas listens to window resize events and automatically scales (`transform: scale`) while preserving the aspect ratio and input coordinate accuracy.

## 2. Simulation Lifecycle

The game logic runs completely independent of the render framerate, utilizing a deterministic, time-based simulation approach.

- **Fixed Timestep:** The `Simulation` class updates game state (movement, combat, spawns) using a delta time approach.
- **Ticker & Cleanup:** When the match ends or is abandoned, the PixiJS Ticker is stopped, and a comprehensive cleanup routine destroys all entities, removes event listeners, and stops timers to prevent memory leaks.
- **Strict Mode Support:** The React `useEffect` for mounting PixiJS properly handles React 18's Strict Mode (double invocation) by ensuring the previous instance is completely destroyed before initializing a new one.

## 3. Collisions & Physics

Collisions are implemented using **OBB (Oriented Bounding Boxes)** and the **SAT (Separating Axis Theorem)**.
- **Collision Detection:** Ships and islands are represented as convex polygons (rectangles with rotation). SAT checks for overlapping projections on the axes of the polygons.
- **Collision Resolution:** When a collision with an island is detected, we calculate the **MTV (Minimum Translation Vector)** and push the ship back to prevent clipping.
- **Projectiles:** Bullets use simpler Point/Circle-to-OBB collision checks to determine if they hit a ship or an island. Projectiles are removed upon impact.

## 4. Resource Management

- **Asset Loading:** Textures and spritesheets are preloaded using PixiJS `Assets.load`. A visual loading screen displays progress.
- **Texture Reusability:** Once loaded, textures are cached and reused. We handle load failures by allowing the player to retry before entering the match.

## 5. Ranking, History & Local Persistence

The integration with the remote ranking and history APIs is built robustly using **Axios** and **TanStack Query (React Query)**.

- **Contracts:** `MatchRecord` represents a finished match containing ID, player name, score, duration, end reason, and config keys.
- **TanStack Query:** We use `useQuery` for fetching Leaderboards and History with pagination. Cache (`staleTime`) prevents redundant network requests.
- **Pending Sync & Retry:** We implemented an offline-first approach. When a match ends, we attempt a `useMutation`. If it fails (due to network or 5xx error), the match is saved to a `pendingQueue` in `localStorage`.
- **Auto-Recovery:** The `usePendingSync` hook automatically attempts to flush the queue when the application reloads, when the browser triggers an `online` event, or manually via the "Retry" button.
- **Idempotency:** A match has a generated UUID (`id`). Retries send the same ID, and our MSW mock handler gracefully prevents duplication by checking for existing IDs.
- **Local Persistence:** Options (session time, spawn interval) and the player's username are saved in `localStorage`. The result of the last match is also saved in the Zustand store (and persisted) to be displayed on the Start Screen.

## 6. Limitations & Balancing Decisions

- **Enemy Spawning:** To avoid "spawn-killing," enemies spawn outside a safe radius around the player.
- **Visual Damage:** Instead of swapping sprites for damaged ships, we use PixiJS `tint` (turning the ship reddish) and a smoke particle effect when health is low.
- **Performance:** While the game handles dozens of entities smoothly, extreme configurations (e.g., spawn interval of 0.1s) could drop the framerate on low-end devices due to the heavy OBB collision math. 
- **Zustand vs Redux:** Zustand was chosen for its minimal boilerplate and direct integration with React without needing a Provider, which perfectly fits the isolated nature of the UI HUD.
