import type { Vector2 } from './types';

// --- Vector Math ---
export const vAdd = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y });
export const vSub = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y });
export const vScale = (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s });
export const vDot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;
export const vLenSq = (v: Vector2): number => v.x * v.x + v.y * v.y;
export const vLen = (v: Vector2): number => Math.sqrt(vLenSq(v));
export const vNorm = (v: Vector2): Vector2 => {
    const l = vLen(v);
    return l > 0 ? vScale(v, 1 / l) : { x: 0, y: 0 };
};
export const vPerp = (v: Vector2): Vector2 => ({ x: -v.y, y: v.x }); // 90deg rotation
export const vDist = (a: Vector2, b: Vector2): number => vLen(vSub(a, b));
export const vRot = (v: Vector2, angle: number): Vector2 => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
};

// --- Shapes ---
export interface Circle {
    pos: Vector2;
    radius: number;
}

export interface Polygon {
    pos: Vector2;
    vertices: Vector2[]; // Local coords relative to pos
}

export interface CollisionResult {
    collided: boolean;
    mtv?: Vector2; // Minimum Translation Vector
}

// --- SAT Helpers ---
type Projection = { min: number; max: number };

function projectPoly(poly: Polygon, axis: Vector2): Projection {
    let min = Infinity;
    let max = -Infinity;

    for (const v of poly.vertices) {
        const worldVertex = vAdd(poly.pos, v);
        const proj = vDot(worldVertex, axis);
        if (proj < min) min = proj;
        if (proj > max) max = proj;
    }

    return { min, max };
}

function projectCircle(circle: Circle, axis: Vector2): Projection {
    const proj = vDot(circle.pos, axis);
    return { min: proj - circle.radius, max: proj + circle.radius };
}

function getOverlap(p1: Projection, p2: Projection): number {
    if (p1.max < p2.min || p2.max < p1.min) return 0;
    return Math.min(p1.max, p2.max) - Math.max(p1.min, p2.min);
}

// --- Collision Detection ---

// Polygon vs Polygon SAT (Ships vs Islands)
export function polyVsPoly(p1: Polygon, p2: Polygon): CollisionResult {
    let overlap = Infinity;
    let smallestAxis: Vector2 | null = null;
    const polys = [p1, p2];

    for (const poly of polys) {
        for (let j = 0; j < poly.vertices.length; j++) {
            const v1 = poly.vertices[j];
            const v2 = poly.vertices[(j + 1) % poly.vertices.length];

            const edge = vSub(v2, v1);
            const axis = vNorm(vPerp(edge)); // Edge normal

            const proj1 = projectPoly(p1, axis);
            const proj2 = projectPoly(p2, axis);
            const o = getOverlap(proj1, proj2);

            if (o === 0) return { collided: false }; // Found separating axis

            if (o < overlap) {
                overlap = o;
                smallestAxis = axis;
            }
        }
    }

    // Ensure MTV points from p1 to p2
    if (smallestAxis) {

        const dir = vSub(p2.pos, p1.pos);
        if (vDot(dir, smallestAxis) < 0) {
            smallestAxis = vScale(smallestAxis, -1);
        }

        return { collided: true, mtv: vScale(smallestAxis, overlap) };
    }

    return { collided: false };
}

// Circle vs Polygon SAT (Projectiles vs Islands/Ships)
export function circleVsPoly(circle: Circle, poly: Polygon): CollisionResult {
    let overlap = Infinity;
    let smallestAxis: Vector2 | null = null;
    let closestVertex: Vector2 | null = null;
    let minDistanceSq = Infinity;

    // Test polygon edge normals
    for (let i = 0; i < poly.vertices.length; i++) {
        const vLocal = poly.vertices[i];
        const worldV = vAdd(poly.pos, vLocal);

        // Track closest vertex for step 2
        const distSq = vLenSq(vSub(circle.pos, worldV));
        if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestVertex = worldV;
        }

        const nextV = poly.vertices[(i + 1) % poly.vertices.length];
        const edge = vSub(nextV, vLocal);
        const axis = vNorm(vPerp(edge));

        const proj1 = projectCircle(circle, axis);
        const proj2 = projectPoly(poly, axis);
        const o = getOverlap(proj1, proj2);

        if (o === 0) return { collided: false };

        if (o < overlap) {
            overlap = o;
            smallestAxis = axis;
        }
    }

    // Test axis from circle center to closest vertex
    if (closestVertex) {
        const axis = vNorm(vSub(closestVertex, circle.pos));
        const proj1 = projectCircle(circle, axis);
        const proj2 = projectPoly(poly, axis);
        const o = getOverlap(proj1, proj2);

        if (o === 0) return { collided: false };

        if (o < overlap) {
            overlap = o;
            smallestAxis = axis;
        }
    }

    // Ensure MTV points from circle to polygon
    if (smallestAxis) {

        const dir = vSub(poly.pos, circle.pos);
        if (vDot(dir, smallestAxis) < 0) {
            smallestAxis = vScale(smallestAxis, -1);
        }

        return { collided: true, mtv: vScale(smallestAxis, overlap) };
    }

    return { collided: false };
}

// --- Utils ---

// Creates an Oriented Bounding Box (OBB) polygon
export function createOBB(pos: Vector2, width: number, height: number, angle: number): Polygon {
    const hw = width / 2;
    const hh = height / 2;
    // Local vertices before rotation
    let vertices = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
    ];

    if (angle !== 0) {
        vertices = vertices.map(v => vRot(v, angle));
    }

    return { pos, vertices };
}
