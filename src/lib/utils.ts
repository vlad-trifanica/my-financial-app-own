import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Currency = {
  code: string;
  symbol: string;
}

// Centralized currency definition with the specified order: RON, EUR, USD
export const AVAILABLE_CURRENCIES: Currency[] = [
  { code: "RON", symbol: "lei" },
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" }
];

// Default exchange rates (fallback if API fails)
export const defaultExchangeRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  RON: 4.56,
};

// Exchange rates object that will be updated from the API
export let exchangeRates: Record<string, number> = { ...defaultExchangeRates };

/**
 * Fetches current exchange rates from an API
 * Uses USD as the base currency
 * @returns A promise that resolves to the exchange rates object
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    // Using Exchange Rate API (free tier)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    
    if (data && data.rates) {
      // Update the exchangeRates object with the fetched rates
      exchangeRates = {
        USD: 1, // Base currency is always 1
        ...data.rates
      };
      console.log('Exchange rates updated from API:', exchangeRates);
      return exchangeRates;
    } else {
      console.warn('Failed to parse exchange rates from API, using defaults');
      return defaultExchangeRates;
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return defaultExchangeRates;
  }
}

/**
 * Converts an amount from one currency to another using exchange rates
 * @param amount The amount to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns The converted amount
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  
  // Convert to USD first (as base), then to target currency
  const amountInUSD = amount / fromRate;
  const amountInTargetCurrency = amountInUSD * toRate;
  
  return Number(amountInTargetCurrency.toFixed(2));
}

/**
 * Formats a currency value to display with the appropriate symbol
 * @param amount The amount to format
 * @param currencyCode The currency code (USD, EUR, etc.)
 * @returns Formatted currency string with symbol
 */
export function formatCurrencyWithSymbol(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Gets the currency symbol for a given currency code
 * @param currencyCode The currency code
 * @returns The currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    RON: 'lei',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹'
  };
  
  return symbols[currencyCode] || currencyCode;
}
