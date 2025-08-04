// Indian currency formatting utilities

export const formatCurrency = (amount: number): string => {
  // Format for Indian number system with ₹ symbol
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatCurrencyCompact = (amount: number): string => {
  // For large numbers, show in lakhs/crores
  if (amount >= 10000000) { // 1 crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`
  } else if (amount >= 100000) { // 1 lakh
    return `₹${(amount / 100000).toFixed(1)}L`
  } else if (amount >= 1000) { // 1 thousand
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount)
}

export const parseCurrency = (value: string): number => {
  // Remove currency symbols and convert to number
  return parseFloat(value.replace(/[₹,\s]/g, '')) || 0
}