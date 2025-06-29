
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  amount: number;
}

interface MonthlyTrendChartProps {
  monthlyData: MonthlyData[];
}

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ monthlyData }) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white/90 backdrop-blur-sm border-slate-200/60 hover:border-slate-300/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-slate-900 flex items-center space-x-2">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full" />
          <span>Monthly Trend</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="w-full" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#94a3b8"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#94a3b8"
              />
              <Tooltip 
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(16px)'
                }}
              />
              <Bar 
                dataKey="amount" 
                fill="url(#barGradient)" 
                radius={[6, 6, 0, 0]}
                className="hover:opacity-80 transition-opacity duration-200"
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart;
