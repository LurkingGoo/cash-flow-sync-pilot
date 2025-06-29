
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExpenseFiltersProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categories: Category[];
}

const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  selectedMonth,
  setSelectedMonth,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  categories
}) => {
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '2024-01', label: 'January 2024' },
    { value: '2024-02', label: 'February 2024' },
    { value: '2024-03', label: 'March 2024' },
    { value: '2024-04', label: 'April 2024' },
    { value: '2024-05', label: 'May 2024' },
    { value: '2024-06', label: 'June 2024' },
    { value: '2024-07', label: 'July 2024' },
    { value: '2024-08', label: 'August 2024' },
    { value: '2024-09', label: 'September 2024' },
    { value: '2024-10', label: 'October 2024' },
    { value: '2024-11', label: 'November 2024' },
    { value: '2024-12', label: 'December 2024' }
  ];

  return (
    <Card className="shadow-sm border-slate-200/60 bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-44 bg-white border-slate-200 hover:border-slate-300 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value} className="hover:bg-slate-50">
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-44 bg-white border-slate-200 hover:border-slate-300 transition-colors">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                <SelectItem value="all" className="hover:bg-slate-50">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.name} className="hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-white border-slate-200 hover:border-slate-300 focus:border-slate-400 transition-colors"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseFilters;
