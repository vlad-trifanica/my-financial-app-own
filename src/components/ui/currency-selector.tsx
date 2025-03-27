import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { 
  cn, 
  AVAILABLE_CURRENCIES, 
  Currency, 
  exchangeRates, 
  convertCurrency,
  fetchExchangeRates
} from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Use the centralized currency definition
export const CurrencyContext = React.createContext<{
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertAmount: (amount: number, fromCurrency: string) => number;
  formatAmount: (amount: number, fromCurrency: string) => string;
  isLoading: boolean;
}>({
  currency: AVAILABLE_CURRENCIES[0],
  setCurrency: () => {},
  convertAmount: () => 0,
  formatAmount: () => "",
  isLoading: false,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = React.useState<Currency>(AVAILABLE_CURRENCIES[0]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  
  // Fetch exchange rates when the component mounts
  React.useEffect(() => {
    const loadExchangeRates = async () => {
      setIsLoading(true);
      try {
        await fetchExchangeRates();
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExchangeRates();
    
    // Optional: Set up periodic refresh (e.g., every hour)
    const intervalId = setInterval(loadExchangeRates, 3600000); // 1 hour
    
    return () => clearInterval(intervalId);
  }, []);
  
  const convertAmount = React.useCallback((amount: number, fromCurrency: string): number => {
    if (fromCurrency === currency.code) return amount;
    
    // Use the exchangeRates from utils.ts
    return convertCurrency(amount, fromCurrency, currency.code);
  }, [currency.code]);
  
  const formatAmount = React.useCallback((amount: number, fromCurrency: string): string => {
    // If fromCurrency is not provided or is the same as the target currency,
    // no conversion is needed, just format the amount
    if (!fromCurrency || fromCurrency === currency.code) {
      return `${currency.symbol}${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    
    // Otherwise, convert the amount first, then format it
    const convertedAmount = convertAmount(amount, fromCurrency);
    return `${currency.symbol}${convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [currency, convertAmount]);
  
  const contextValue = React.useMemo(() => ({
    currency,
    setCurrency,
    convertAmount,
    formatAmount,
    isLoading
  }), [currency, convertAmount, formatAmount, isLoading]);
  
  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = React.useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export function CurrencySelector() {
  const { currency, setCurrency, isLoading } = useCurrency();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[120px] justify-between"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : `${currency.code} (${currency.symbol})`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[120px]">
        {AVAILABLE_CURRENCIES.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => {
              setCurrency(curr);
              setOpen(false);
            }}
          >
            <Check
              className={cn("mr-2 h-4 w-4", currency.code === curr.code ? "opacity-100" : "opacity-0")}
            />
            {curr.code} ({curr.symbol})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CurrencySelector