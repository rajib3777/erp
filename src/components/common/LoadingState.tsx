import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading records...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Loader2 className="w-6 h-6 text-slate-400 animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{message}</p>
    </div>
  );
};
