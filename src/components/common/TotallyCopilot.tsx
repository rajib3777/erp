import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  X,
  Send,
  AlertTriangle,
  TrendingUp,
  Package,
  Landmark,
  ArrowRight,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { formatCurrency } from '@/utils/currency';

interface TotallyCopilotProps {
  onNavigate: (tab: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionTab?: string;
  actionLabel?: string;
}

export const TotallyCopilot: React.FC<TotallyCopilotProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am Totally Copilot, your real-time ERP intelligence assistant. You can ask me about stock shortages, customer receivables, cash ledger balances, or quick business insights.',
    },
  ]);

  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dataService.getDashboardMetrics(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => dataService.getProducts(),
  });

  const handleSend = (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');

    // Generate intelligent response based on live data
    setTimeout(() => {
      let botResponse: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: "I analyzed the Totally ERP ledger. Let me know if you need specific breakdowns by product or customer.",
      };

      const lower = text.toLowerCase();

      if (lower.includes('stock') || lower.includes('shortage') || lower.includes('inventory')) {
        const lowStock = products.filter((p) => p.current_stock <= p.min_stock_level);
        if (lowStock.length > 0) {
          botResponse = {
            id: String(Date.now() + 1),
            sender: 'assistant',
            text: `Attention required: There are currently ${lowStock.length} items below minimum safety threshold (e.g. ${lowStock.map(p => p.name).slice(0, 2).join(', ')}). Total catalog valuation is ${formatCurrency(metrics?.currentStockValue)}.`,
            actionTab: 'inventory',
            actionLabel: 'Inspect Stock in Inventory',
          };
        } else {
          botResponse = {
            id: String(Date.now() + 1),
            sender: 'assistant',
            text: `Great news! All ${products.length} registered SKUs are currently stocked above their minimum safety thresholds. Total stock value: ${formatCurrency(metrics?.currentStockValue)}.`,
            actionTab: 'inventory',
            actionLabel: 'View Product Catalog',
          };
        }
      } else if (lower.includes('receivable') || lower.includes('due') || lower.includes('customer')) {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `Current Customer Receivables stand at ${formatCurrency(metrics?.totalReceivables)}. Total paid collections to date are ${formatCurrency(metrics?.totalSales ? metrics.totalSales - (metrics.totalReceivables || 0) : 0)}.`,
          actionTab: 'accounts',
          actionLabel: 'Open Customer Receivables',
        };
      } else if (lower.includes('cash') || lower.includes('bank') || lower.includes('balance') || lower.includes('money')) {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `Live Cash & Bank liquidity: ${formatCurrency(metrics?.cashBankBalance)} across Cash Register, Dutch-Bangla Bank, and bKash Merchant accounts.`,
          actionTab: 'accounts',
          actionLabel: 'View Chart of Accounts',
        };
      } else if (lower.includes('purchase') || lower.includes('payable') || lower.includes('supplier')) {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `Supplier Payables due: ${formatCurrency(metrics?.totalPayables)}. Total procurement expenditure to date is ${formatCurrency(metrics?.totalPurchases)}.`,
          actionTab: 'purchases',
          actionLabel: 'View Purchase Orders',
        };
      } else if (lower.includes('sale') || lower.includes('revenue') || lower.includes('performance')) {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `Total Gross Sales Revenue is ${formatCurrency(metrics?.totalSales)} across ${metrics?.salesCount || 0} confirmed commercial invoices.`,
          actionTab: 'sales',
          actionLabel: 'View Sales Invoices',
        };
      }

      setMessages((prev) => [...prev, botResponse]);
    }, 300);
  };

  const quickPrompts = [
    'Check low stock alerts',
    'What is our cash balance?',
    'Show pending receivables',
    'Review sales performance',
  ];

  return (
    <>
      {/* Floating Copilot Trigger Button matching Screenshot 1 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full shadow-lg shadow-emerald-950/20 border border-emerald-700/60 transition-all hover:scale-105 active:scale-95 group font-medium text-xs"
          title="Open Totally Copilot Assistant"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-600/60 flex items-center justify-center text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="tracking-tight font-semibold">Copilot</span>
        </button>
      </div>

      {/* Slide-over Assistant Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-92 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[540px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight">Totally Copilot</h4>
                <p className="text-[10px] text-emerald-400 font-mono">Real-Time Ledger Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60 text-xs max-h-72">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white font-medium shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-2xs'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.actionTab && (
                    <button
                      onClick={() => {
                        onNavigate(m.actionTab!);
                        setIsOpen(false);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold transition-colors border border-emerald-200/60"
                    >
                      <span>{m.actionLabel || 'Navigate'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Chips */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[10px] font-semibold text-slate-700 transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about ERP metrics..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
              title="Send to Copilot"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
