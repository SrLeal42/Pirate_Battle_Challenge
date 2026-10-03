# Pirate Battle Challenge

A 2D top-down naval shooter game built with **React**, **TypeScript**, and **PixiJS**. Navigate between islands, face enemy ships, and survive to accumulate points.

## Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   No specific environment variables are required to run the game locally, as all network operations (Leaderboard and History) are mocked using **MSW** (Mock Service Worker).

## 🎮 Controls

The game supports keyboard controls and provides on-screen touch controls for mobile devices.
- **Move Forward:** `W` or `Arrow Up`
- **Rotate:** `A` / `D` or `Arrow Left` / `Arrow Right`
- **Frontal Shot:** `Space`
- **Lateral Shots:** `Q` (Left) / `E` (Right)
- **Pause/Resume:** `Esc`

*Note: You can move and shoot simultaneously. The game automatically pauses when the browser tab loses focus.*

## Gameplay Configuration

You can customize the gameplay experience via the **Options** menu on the Start Screen:
- **Game Session Time:** Configure how long the match lasts (60 to 180 seconds).
- **Enemy Spawn Time:** Adjust the interval between enemy spawns (must be > 0).

Your configurations and your last match results are persisted locally in your browser.

## Mocking & Network Scenarios

We use **MSW (Mock Service Worker)** to simulate network requests to the Leaderboard and History endpoints.
To test different network conditions or failures:
1. Click the **"⚙" (gear) icon** in the bottom-right corner of the Start Screen or Game Over screen to open the **Network Scenarios Dev Panel**.
2. Select a scenario (e.g., `Success`, `Timeout`, `HTTP 500`, `Connection Failure`, `Empty lists`, etc.).
3. The selected scenario applies instantly to upcoming network requests.

*To clear pending matches (e.g., if you simulated a network failure and a match is stuck "waiting to sync"), you can change the scenario back to `Success` and click `Retry`.*

## Scripts & Commands

The following commands are available for development and testing:

- **`npm run dev`**: Start the Vite development server.
- **`npm run build`**: Compile TypeScript and build the project for production.
- **`npm run preview`**: Preview the production build locally.
- **`npm run lint`**: Run Oxlint to catch errors.
- **`npm run typecheck`**: Run TypeScript type-checking without emitting files.
- **`npm run test:e2e`**: Run the Playwright End-to-End and visual regression tests.

## Reproducing Failures (Testing)

To reproduce a sync failure (Match Pending):
1. Open the Dev Panel (⚙ icon) and select **"Connection failure"** or **"HTTP 500"**.
2. Start a match and play until the end (time is up or you die).
3. The Game Over screen will display an error message and state that your score is saved locally.
4. Go back to the Main Menu. You will see a "waiting to sync" banner.
5. Open the Dev Panel and switch back to **"Success"**.
6. Click **Retry** on the banner. The match will sync, disappear from the queue, and appear in your Match History.