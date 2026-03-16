/**
 * Calculates base amount and gst amount from a total inclusive amount.
 * @param {number} totalAmount - The total amount including GST
 * @param {number} gstRate - The GST rate percentage (e.g. 18 for 18%)
 * @returns {{baseAmount: number, gstAmount: number}}
 */
export function calcFromTotal(totalAmount, gstRate) {
  const rateObj = 1 + (gstRate / 100);
  const baseAmount = totalAmount / rateObj;
  const gstAmount = totalAmount - baseAmount;
  
  return {
    baseAmount: Math.round(baseAmount * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100
  };
}

/**
 * Calculates gst amount and total amount from a base amount.
 * @param {number} baseAmount - The base amount excluding GST
 * @param {number} gstRate - The GST rate percentage (e.g. 18 for 18%)
 * @returns {{gstAmount: number, total: number}}
 */
export function calcFromBase(baseAmount, gstRate) {
  const gstAmount = baseAmount * (gstRate / 100);
  const total = baseAmount + gstAmount;

  return {
    gstAmount: Math.round(gstAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

/**
 * Validates if the total amount equals baseAmount + gstAmount.
 * Can be used to check sanity of user-provided line items or totals.
 * @param {number} total 
 * @param {number} base 
 * @param {number} gst 
 * @returns {boolean}
 */
export function validateGST(total, base, gst) {
  // Add a small epsilon for floating point issues when checking
  return Math.abs(total - (base + gst)) < 0.01;
}
