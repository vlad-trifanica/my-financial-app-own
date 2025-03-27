import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCurrency } from '@/components/ui/currency-selector';
import { assetService } from '@/lib/services/assetService';
import { debtService } from '@/lib/services/debtService';
import { useAuth } from '@/contexts/AuthContext';

// Define some nice colors for our chart segments
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#A4DE6C', '#D0ED57', '#FFC658', '#FF7300'
];

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [totalDebts, setTotalDebts] = useState<number>(0);
  const [netWorth, setNetWorth] = useState<number>(0);
  const [assetAllocation, setAssetAllocation] = useState<{ [category: string]: number }>({});
  const [debtAllocation, setDebtAllocation] = useState<{ [category: string]: number }>({});
  const [assetChartData, setAssetChartData] = useState<Array<{name: string, value: number, originalCurrency: string}>>([]);
  const [debtChartData, setDebtChartData] = useState<Array<{name: string, value: number, originalCurrency: string}>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currency, convertAmount, formatAmount } = useCurrency();
  const { user } = useAuth();
  
  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const assetsData = await assetService.getAssets();
        const debtsData = await debtService.getDebts();
        
        setAssets(assetsData);
        setDebts(debtsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (assets.length === 0 && debts.length === 0 && isLoading) {
      return; // Skip calculations if data is still loading
    }
    
    // Calculate asset allocation with currency data
    const assetCategorySums: { [category: string]: { value: number, currency: string } } = {};
    assets.forEach(asset => {
      const category = asset.category;
      if (!assetCategorySums[category]) {
        assetCategorySums[category] = { value: 0, currency: asset.currency };
      }
      // Convert each asset to the selected currency before adding to the total
      const convertedValue = convertAmount(asset.value, asset.currency);
      assetCategorySums[category].value += convertedValue;
    });
    
    // Calculate total assets in selected currency
    const assetTotal = Object.values(assetCategorySums).reduce((sum, { value }) => sum + value, 0);
    setTotalAssets(assetTotal);
    
    // Format asset data for pie chart
    const assetData = Object.entries(assetCategorySums).map(([category, { value, currency }]) => ({
      name: formatCategoryName(category),
      value: value,
      originalCurrency: currency
    }));
    
    // Sort asset data by value in descending order
    assetData.sort((a, b) => b.value - a.value);
    setAssetChartData(assetData);
    
    // Set asset allocation for display
    const assetAlloc = Object.fromEntries(
      Object.entries(assetCategorySums).map(([category, { value }]) => [category, value])
    );
    setAssetAllocation(assetAlloc);

    // Calculate debt allocation with currency data
    const debtCategorySums: { [category: string]: { value: number, currency: string } } = {};
    debts.forEach(debt => {
      const category = debt.category;
      if (!debtCategorySums[category]) {
        debtCategorySums[category] = { value: 0, currency: debt.currency };
      }
      // Convert each debt to the selected currency before adding to the total
      const convertedValue = convertAmount(debt.value, debt.currency);
      debtCategorySums[category].value += convertedValue;
    });
    
    // Calculate total debts in selected currency
    const debtTotal = Object.values(debtCategorySums).reduce((sum, { value }) => sum + value, 0);
    setTotalDebts(debtTotal);
    
    // Format debt data for pie chart
    const debtData = Object.entries(debtCategorySums).map(([category, { value, currency }]) => ({
      name: formatCategoryName(category),
      value: value,
      originalCurrency: currency
    }));
    
    // Sort debt data by value in descending order
    debtData.sort((a, b) => b.value - a.value);
    setDebtChartData(debtData);
    
    // Set debt allocation for display
    const debtAlloc = Object.fromEntries(
      Object.entries(debtCategorySums).map(([category, { value }]) => [category, value])
    );
    setDebtAllocation(debtAlloc);

    // Calculate net worth in selected currency
    setNetWorth(assetTotal - debtTotal);
  }, [assets, debts, currency, convertAmount, isLoading]); // Recalculate when data or currency changes

  // Format category names for display
  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Custom tooltip for pie charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatAmount(payload[0].value, currency.code)}</p>
          <p className="text-xs text-muted-foreground">
            {((payload[0].value / (payload[0].payload.isAsset ? totalAssets : totalDebts)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatAmount(totalAssets, currency.code)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">{assets.length} assets tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Debts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatAmount(totalDebts, currency.code)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">{debts.length} debts tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netWorth > 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
              {formatAmount(netWorth, currency.code)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {netWorth > 0 ? "Positive net worth" : "Negative net worth"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset and Debt Allocation with Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-full">
              {/* Top section: Pie Chart and Legend */}
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                {/* Pie Chart for Assets */}
                <div className="w-full md:w-1/2 h-52 flex items-center justify-center mb-4 md:mb-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetChartData.map(item => ({ ...item, isAsset: true }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Compact Legend */}
                <div className="w-full md:w-1/2 flex flex-col gap-y-3 md:pl-6 md:max-w-[45%]">
                  {Object.entries(assetAllocation)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, value], index) => (
                    <div key={category} className="flex justify-between items-center w-full">
                      <div className="flex items-center min-w-0 max-w-[70%]">
                        <div 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm truncate">{formatCategoryName(category)}</span>
                      </div>
                      <span className="text-sm font-medium ml-2 text-right whitespace-nowrap">
                        {((value / totalAssets) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom section: Top 3 Assets */}
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-3">Top Assets</h4>
                <div className="space-y-3">
                  {assets
                    .sort((a, b) => convertAmount(b.value, b.currency) - convertAmount(a.value, a.currency))
                    .slice(0, 3)
                    .map((asset) => (
                      <div key={asset.id} className="flex flex-col p-3 bg-muted/50 rounded-md">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{asset.name}</span>
                          <span className="font-medium">{formatAmount(convertAmount(asset.value, asset.currency), currency.code)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCategoryName(asset.category)}</span>
                          <span>Last updated: {new Date(asset.last_updated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Debt Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-full">
              {/* Top section: Pie Chart and Legend */}
              <div className="flex flex-col md:flex-row items-start mb-6">
                {/* Pie Chart for Debts */}
                <div className="w-full md:w-2/3 h-48 flex items-start justify-start mb-4 md:mb-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={debtChartData.map(item => ({ ...item, isAsset: false }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#FF8042"
                        dataKey="value"
                      >
                        {debtChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Compact Legend */}
                <div className="w-full md:w-1/3 flex flex-col gap-y-3 md:pl-6">
                  {Object.entries(debtAllocation)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, value], index) => (
                    <div key={category} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm truncate">{formatCategoryName(category)}</span>
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {((value / totalDebts) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom section: Top 3 Debts */}
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-3">Top Debts</h4>
                <div className="space-y-3">
                  {debts
                    .sort((a, b) => convertAmount(b.value, b.currency) - convertAmount(a.value, a.currency))
                    .slice(0, 3)
                    .map((debt) => (
                      <div key={debt.id} className="flex flex-col p-3 bg-muted/50 rounded-md">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{debt.name}</span>
                          <span className="font-medium">{formatAmount(convertAmount(debt.value, debt.currency), currency.code)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCategoryName(debt.category)}</span>
                          <span>Last updated: {new Date(debt.last_updated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;