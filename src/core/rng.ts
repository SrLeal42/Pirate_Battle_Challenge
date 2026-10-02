/** Mulberry32: fast 32-bit PRNG suitable for seeded deterministic simulations. */
export function mulberry32(seed: number) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export class RNG {
  private nextFloat: () => number;

  constructor(seed: number) {
    this.nextFloat = mulberry32(seed);
  }

  /** Returns a float in [0, 1) */
  random(): number {
    return this.nextFloat();
  }

  /** Returns a float in [min, max) */
  range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /** Returns an integer in [min, max] (inclusive) */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}
