import { Assets, type Texture } from 'pixi.js';

// Asset paths (Vite resolves these imports)
const TILE_PATH = '/assets/png/default/tiles/';
const SHIP_PATH = '/assets/png/default/ships/';
const EFFECT_PATH = '/assets/png/default/effects/';
const PARTS_PATH = '/assets/png/default/ship_parts/';
const HUD_PATH = '/assets/png/default/ui/hud/';

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

export const HUD_ASSETS = [
    'health_frame',
    'health_fill_green',
    'health_fill_amber',
    'health_fill_red',
    'enemy_health_frame',
    'enemy_health_fill_green',
    'enemy_health_fill_red',
] as const;


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

    // HUD bars (used by in-world health bars)
    for (const file of HUD_ASSETS) {
        entries[`hud_${file}`] = `${HUD_PATH}${file}.png`;
    }

    return entries;
}

const manifest = buildManifest();
let registered = false;
let loadPromise: Promise<void> | null = null;

// ?assetFail (or =once) fails the first attempt; ?assetFail=always fails every attempt
type FailMode = 'none' | 'once' | 'always';
let failMode: FailMode = readFailMode();

function readFailMode(): FailMode {
    const value = new URLSearchParams(window.location.search).get('assetFail');
    if (value === null) return 'none';
    return value === 'always' ? 'always' : 'once';
}

function consumeSimulatedFailure(): boolean {
    if (failMode === 'none') return false;
    if (failMode === 'once') failMode = 'none';
    return true;
}

// Registering aliases twice makes Pixi warn, so do it once per page
function registerManifest(): void {
    if (registered) return;
    for (const [alias, src] of Object.entries(manifest)) Assets.add({ alias, src });
    registered = true;
}

export function loadGameAssets(onProgress?: (progress: number) => void): Promise<void> {
    if (loadPromise) return loadPromise;

    const attempt = (async () => {
        registerManifest();
        if (consumeSimulatedFailure()) throw new Error('Simulated asset failure (assetFail)');

        const aliases = Object.keys(manifest);
        await Assets.load(aliases, (progress) => onProgress?.(progress));

        for (const alias of aliases) {
            if (!Assets.get(alias)) throw new Error(`Asset "${alias}" failed to load`);
        }
    })();

    loadPromise = attempt;
    // Clear only after assignment, so sync throws can't leave a stale rejected promise
    attempt.catch(() => {
        if (loadPromise === attempt) loadPromise = null;
    });

    return attempt;
}

export function getTexture(alias: string): Texture {
    return Assets.get<Texture>(alias);
}

export function resetLoadPromise(): void {
    loadPromise = null;
}
