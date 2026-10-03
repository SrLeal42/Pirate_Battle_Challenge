import { Assets } from 'pixi.js';

// Asset paths (Vite resolves these imports)
const TILE_PATH = '/assets/png/default/tiles/';
const SHIP_PATH = '/assets/png/default/ships/';
const EFFECT_PATH = '/assets/png/default/effects/';
const PARTS_PATH = '/assets/png/default/ship_parts/';

// Tile mapping: TileType → tile PNG filename
export const TILE_ASSETS: Record<string, string> = {
    //    water: 'tile_73',
    island_nw: 'tile_1',
    island_n: 'tile_2',
    island_ne: 'tile_3',
    island_center: 'tile_18',
    island_w: 'tile_17',
    island_e: 'tile_19',
    island_sw: 'tile_33',
    island_s: 'tile_34',
    island_se: 'tile_35',
};

// Ship assets
export const SHIP_ASSETS = {
    player: 'ship_1',
    chaser: 'ship_5',
    shooter: 'ship_2',
};

// Effect assets
export const EFFECT_ASSETS = {
    explosion1: 'explosion_1',
    explosion2: 'explosion_2',
    explosion3: 'explosion_3',
    fire1: 'fire_1',
    fire2: 'fire_2',
};

// Build full alias → path map for Pixi Assets
function buildManifest(): Record<string, string> {
    const entries: Record<string, string> = {};

    // Tiles
    for (const [alias, file] of Object.entries(TILE_ASSETS)) {
        entries[`tile_${alias}`] = `${TILE_PATH}${file}.png`;
    }

    // Ships
    for (const [alias, file] of Object.entries(SHIP_ASSETS)) {
        entries[`ship_${alias}`] = `${SHIP_PATH}${file}.png`;
    }

    // Effects
    for (const [alias, file] of Object.entries(EFFECT_ASSETS)) {
        entries[`effect_${alias}`] = `${EFFECT_PATH}${file}.png`;
    }

    // Projectile
    entries['cannon_ball'] = `${PARTS_PATH}cannon_ball.png`;

    return entries;
}

const manifest = buildManifest();
let loadPromise: Promise<void> | null = null;

export async function loadGameAssets(
    onProgress?: (progress: number) => void,
): Promise<void> {
    // Deduplicate: reuse existing load if in progress
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        try {
            // Register all aliases
            for (const [alias, path] of Object.entries(manifest)) {
                Assets.add({ alias, src: path });
            }

            const aliases = Object.keys(manifest);
            await Assets.load(aliases, (progress) => {
                onProgress?.(progress);
            });

            // Validate all loaded
            for (const alias of aliases) {
                const tex = Assets.get(alias);
                if (!tex) throw new Error(`Asset "${alias}" failed to load`);
            }
        } catch (err) {
            // Reset promise so retry is possible
            loadPromise = null;
            throw err;
        }
    })();

    return loadPromise;
}

export function getTexture(alias: string) {
    return Assets.get(alias);
}

export function resetLoadPromise(): void {
    loadPromise = null;
}
