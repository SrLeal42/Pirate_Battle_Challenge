/**
 * Mulberry32 é um gerador de números pseudo-aleatórios simples e rápido de 32 bits.
 * Perfeito para simulações determinísticas que precisam de uma seed.
 */
export function mulberry32(seed: number) {
  return function() {
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

  /** Retorna um número entre 0 (inclusivo) e 1 (exclusivo) */
  random(): number {
    return this.nextFloat();
  }

  /** Retorna um número entre min e max */
  range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /** Retorna um inteiro entre min e max (inclusivo) */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}
