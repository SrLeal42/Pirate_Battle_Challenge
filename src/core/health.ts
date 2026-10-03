export type HealthTier = 'high' | 'medium' | 'low';

/** Ratios of max health. */
export const HEALTH_TIER_THRESHOLDS = { medium: 0.6, low: 0.3 } as const;

export function getHealthTier(ratio: number): HealthTier {
    if (ratio <= HEALTH_TIER_THRESHOLDS.low) return 'low';
    if (ratio <= HEALTH_TIER_THRESHOLDS.medium) return 'medium';
    return 'high';
}
