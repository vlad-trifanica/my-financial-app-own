import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { assetService } from '@/lib/services/assetService';
import { debtService } from '@/lib/services/debtService';
import { netWorthService } from '@/lib/services/netWorthService';
import { Asset, Debt } from '@/types/financial';
import { useCurrency } from '@/components/ui/currency-selector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  month: string;
  netWorth: number;
  baseCurrency: string;
}

const NetWorth: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [totalDebts, setTotalDebts] = useState<number>(0);
  const [netWorth, setNetWorth] = useState<number>(0);
  const [historicalData, setHistoricalData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { formatAmount, convertAmount, currency } = useCurrency();

  // Fetch assets, debts, and historical data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch assets and debts
        const assetsData = await assetService.getAssets();
        const debtsData = await debtService.getDebts();
        setAssets(assetsData);
        setDebts(debtsData);
        
        // Fetch historical net worth data
        const netWorthHistory = await netWorthService.getNetWorthHistory();
        
        // Convert to chart data format
        const chartData = netWorthHistory.map(record => ({
          month: new Date(record.date).toLocaleDateString('en-US', { month: 'short' }),
          netWorth: record.net_worth,
          baseCurrency: record.base_currency
        }));
        
        setHistoricalData(chartData);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate current net worth whenever assets, debts, or currency changes
  useEffect(() => {
    // Calculate totals with currency conversion
    let assetTotal = 0;
    let debtTotal = 0;
    
    // Convert each asset to the selected currency
    assets.forEach(asset => {
      assetTotal += convertAmount(asset.value, asset.currency);
    });
    
    // Convert each debt to the selected currency
    debts.forEach(debt => {
      debtTotal += convertAmount(debt.value, debt.currency);
    });
    
    setTotalAssets(assetTotal);
    setTotalDebts(debtTotal);
    setNetWorth(assetTotal - debtTotal);
    
    // We could save net worth records here if needed in the future
  }, [assets, debts, convertAmount, currency]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Net Worth</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading financial data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current Net Worth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-4xl font-bold ${netWorth >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                {formatAmount(netWorth, currency.code)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {netWorth >= 0 
                  ? "Your assets exceed your debts. Great job managing your finances!" 
                  : "Your debts exceed your assets. Consider strategies to reduce debt or increase assets."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Worth Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData.map(item => ({
                      ...item,
                      // Convert historical net worth values to the selected currency
                      netWorth: convertAmount(item.netWorth, item.baseCurrency || 'USD')
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => {
                        return formatAmount(value, currency.code).split('.')[0];
                      }} 
                    />
                    <Tooltip 
                      formatter={(value: number) => {
                        return [formatAmount(value, currency.code), 'Net Worth'];
                      }}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="netWorth"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No historical data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default NetWorth;