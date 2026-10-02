import type { ArenaDef, IslandDef } from './simulation';
import type { Polygon } from './geometry';
import { GAME_CONFIG } from './config';
import type { TileType } from './types';

export interface TileDef {
    col: number;
    row: number;
    type: TileType;
}

export interface ArenaMap {
    cols: number;
    rows: number;
    tiles: TileDef[];
    arenaDef: ArenaDef;
}

// Normalized corner polygons (0..1, clockwise, y-down)
// Derived from asset alpha channel measurements (see README §7)
const CORNER_POLYS: Record<string, [number, number][]> = {
    nw: [[0.016, 1], [0.047, 0.5], [0.219, 0.266], [0.641, 0.094], [1, 0.016], [1, 1]],
    ne: [[0, 0.016], [0.344, 0.016], [0.625, 0.109], [0.797, 0.344], [0.984, 1], [0, 1]],
    sw: [[0.016, 0], [1, 0], [1, 0.984], [0.641, 0.984], [0.375, 0.891], [0.266, 0.781], [0.094, 0.359]],
    // SE not measured yet — mirror SW horizontally as fallback
    se: [[0.984, 0], [0, 0], [0, 0.984], [0.359, 0.984], [0.625, 0.891], [0.734, 0.781], [0.906, 0.359]],
};

// Island definition: rectangular group of tiles with one convex collision polygon
interface IslandSpec {
    col: number;   // top-left tile column
    row: number;   // top-left tile row
    widthTiles: number;
    heightTiles: number;
}

function buildIslandPolygon(spec: IslandSpec): Polygon {
    const { col, row, widthTiles, heightTiles } = spec;
    const x = col * GAME_CONFIG.tileSize;
    const y = row * GAME_CONFIG.tileSize;
    const w = widthTiles * GAME_CONFIG.tileSize;
    const h = heightTiles * GAME_CONFIG.tileSize;

    // Corner arc offsets in pixels (derived from normalized polys)
    const inset = GAME_CONFIG.tileSize; // corners occupy 1 tile each

    // Build convex polygon: start top-left, go clockwise
    // Top-left corner arc (from NW polygon)
    const nw = CORNER_POLYS.nw.map(([px, py]) => ({
        x: px * inset,
        y: py * inset,
    }));

    // Top-right corner arc (from NE polygon)
    const ne = CORNER_POLYS.ne.map(([px, py]) => ({
        x: (w - inset) + px * inset,
        y: py * inset,
    }));

    // Bottom-right corner arc (from SE polygon)
    const se = CORNER_POLYS.se.map(([px, py]) => ({
        x: (w - inset) + px * inset,
        y: (h - inset) + py * inset,
    }));

    // Bottom-left corner arc (from SW polygon)
    const sw = CORNER_POLYS.sw.map(([px, py]) => ({
        x: px * inset,
        y: (h - inset) + py * inset,
    }));

    // Merge all corners into one convex polygon
    // These are already in local coords relative to island top-left
    const allVertices = [...nw, ...ne, ...se, ...sw];

    return {
        pos: { x: x + w / 2, y: y + h / 2 }, // center
        vertices: allVertices.map(v => ({
            x: v.x - w / 2,
            y: v.y - h / 2,
        })),
    };
}

function buildIslandTiles(spec: IslandSpec): TileDef[] {
    const tiles: TileDef[] = [];
    const { col, row, widthTiles, heightTiles } = spec;

    for (let r = 0; r < heightTiles; r++) {
        for (let c = 0; c < widthTiles; c++) {
            let type: TileType = 'island_center';

            const isTop = r === 0;
            const isBottom = r === heightTiles - 1;
            const isLeft = c === 0;
            const isRight = c === widthTiles - 1;

            if (isTop && isLeft) type = 'island_nw';
            else if (isTop && isRight) type = 'island_ne';
            else if (isBottom && isLeft) type = 'island_sw';
            else if (isBottom && isRight) type = 'island_se';
            else if (isTop) type = 'island_n';
            else if (isBottom) type = 'island_s';
            else if (isLeft) type = 'island_w';
            else if (isRight) type = 'island_e';

            tiles.push({ col: col + c, row: row + r, type });
        }
    }
    return tiles;
}

// --- Default Arena Layout ---
// 20x11 tiles (1280x704), islands away from borders for valid spawns
const DEFAULT_ISLANDS: IslandSpec[] = [
    { col: 3, row: 2, widthTiles: 3, heightTiles: 3 },
    { col: 14, row: 6, widthTiles: 3, heightTiles: 3 },
];

export function createDefaultArena(): ArenaMap {
    const cols = GAME_CONFIG.arenaWidth / GAME_CONFIG.tileSize;
    const rows = GAME_CONFIG.arenaHeight / GAME_CONFIG.tileSize;

    // Water tiles everywhere
    const tiles: TileDef[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            tiles.push({ col: c, row: r, type: 'water' });
        }
    }

    // Overlay island tiles
    const islandDefs: IslandDef[] = [];
    for (const spec of DEFAULT_ISLANDS) {
        const islandTiles = buildIslandTiles(spec);
        for (const it of islandTiles) {
            const idx = tiles.findIndex(t => t.col === it.col && t.row === it.row);
            if (idx >= 0) tiles[idx] = it;
        }
        islandDefs.push({ polygon: buildIslandPolygon(spec) });
    }

    return {
        cols,
        rows,
        tiles,
        arenaDef: {
            width: GAME_CONFIG.arenaWidth,
            height: GAME_CONFIG.arenaHeight,
            islands: islandDefs,
        },
    };

}
