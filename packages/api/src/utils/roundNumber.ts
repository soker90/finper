/**
 * Rounds a number to 2 decimal places, handling IEEE 754 floating-point
 * representation issues (e.g. 1.005 * 100 = 100.49999... in JS).
 * Uses Number.EPSILON offset on the absolute value to ensure .5 always
 * rounds away from zero, then restores the original sign.
 */
export const roundNumber = (num: number): number =>
  Math.sign(num) * Math.round((Math.abs(num) + Number.EPSILON) * 100) / 100
