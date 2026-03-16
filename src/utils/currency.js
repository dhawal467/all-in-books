export function formatINR(amount) {
  if (amount == null) return '';
  // Force numeric type if it's a string
  const num = Number(amount);
  if (isNaN(num)) return amount.toString();
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatINRShort(amount) {
  if (amount == null) return '';
  const num = Number(amount);
  if (isNaN(num)) return amount.toString();

  // Handle standard short format (Lakhs and Crores)
  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (Math.abs(num) >= 1000) {
    return `₹${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return formatINR(num);
}
