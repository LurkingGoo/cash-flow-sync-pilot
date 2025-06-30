
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  color: string;
  count: number;
}

interface InteractivePieChartProps {
  categoryData: CategoryData[];
  totalExpenses: number;
}

const InteractivePieChart: React.FC<InteractivePieChartProps> = ({ categoryData, totalExpenses }) => {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryData | null>(null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-4 shadow-xl">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <p className="font-semibold text-slate-900">{data.name}</p>
          </div>
          <p className="text-slate-600">Amount: <span className="font-semibold text-slate-900">${data.value.toFixed(2)}</span></p>
          <p className="text-slate-600">Transactions: <span className="font-semibold text-slate-900">{data.count}</span></p>
          <p className="text-slate-600">
            Percentage: <span className="font-semibold text-slate-900">
              {((data.value / totalExpenses) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const dynamicSize = Math.min(400, Math.max(300, categoryData.length * 30));

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white/90 backdrop-blur-sm border-slate-200/60 hover:border-slate-300/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-slate-900 flex items-center space-x-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
          <span>Expenses by Category</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="w-full flex items-center justify-center" style={{ minHeight: `${dynamicSize}px` }}>
          <ResponsiveContainer width="100%" height={dynamicSize}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={Math.min(120, dynamicSize / 3)}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                onMouseEnter={(data) => setHoveredCategory(data)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || '#64748b'} 
                    className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105"
                    stroke={hoveredCategory?.name === entry.name ? '#1e293b' : 'none'}
                    strokeWidth={hoveredCategory?.name === entry.name ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          {categoryData.map((category, index) => (
            <HoverCard key={index}>
              <HoverCardTrigger asChild>
                <div className="flex items-center space-x-2 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-sm">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-slate-700 truncate">{category.name}</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 bg-white/95 backdrop-blur-xl border-slate-200">
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">{category.name}</h4>
                  <p className="text-sm text-slate-600">Amount: ${category.value.toFixed(2)}</p>
                  <p className="text-sm text-slate-600">Transactions: {category.count}</p>
                  <p className="text-sm text-slate-600">
                    Percentage: {((category.value / totalExpenses) * 100).toFixed(1)}%
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractivePieChart;
