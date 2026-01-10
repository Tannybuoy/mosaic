/**
 * Easing functions for smooth animations
 */

export type EasingFunction = (t: number) => number;

/**
 * Linear easing (no easing)
 */
export const linear: EasingFunction = (t: number) => t;

/**
 * Ease out cubic - fast start, slow end
 */
export const easeOutCubic: EasingFunction = (t: number) => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Ease in cubic - slow start, fast end
 */
export const easeInCubic: EasingFunction = (t: number) => {
  return t * t * t;
};

/**
 * Ease in-out cubic - slow start and end
 */
export const easeInOutCubic: EasingFunction = (t: number) => {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Available easing options
 */
export const EASING_OPTIONS = {
  linear,
  easeOutCubic,
  easeInCubic,
  easeInOutCubic
} as const;

export type EasingType = keyof typeof EASING_OPTIONS;
