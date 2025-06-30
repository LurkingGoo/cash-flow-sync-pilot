
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircle, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HelpModalProps {
  userEmail?: string;
}

const HelpModal = ({ userEmail }: HelpModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <span>Telegram Bot Integration</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Quick Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white/80 rounded-lg p-3">
                <p className="text-blue-800 mb-2 font-medium">1. Link your account:</p>
                <div className="bg-blue-100 rounded-lg p-2 font-mono text-sm text-blue-900">
                  /link {userEmail || 'your@email.com'}
                </div>
              </div>
              
              <div className="bg-white/80 rounded-lg p-3">
                <p className="text-blue-800 mb-2 font-medium">2. Start using commands:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs">/add_expense 25.50 "Coffee" "Food & Dining" "Main Card"</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs">/add_stock AAPL 10 150.25 buy</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs">/set_budget "Food & Dining" 500 2024-06</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs">/balance</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">📱 Available Commands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">💰 Expenses</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <code>/add_expense</code> - Add new expense</li>
                    <li>• <code>/expenses</code> - View recent expenses</li>
                    <li>• <code>/set_budget</code> - Set monthly budget</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📈 Stocks</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <code>/add_stock</code> - Add stock transaction</li>
                    <li>• <code>/portfolio</code> - View portfolio</li>
                    <li>• <code>/balance</code> - Account summary</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
