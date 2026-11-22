import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumb,
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        {breadcrumb && (
          <p className="text-xs font-medium text-slate-400 mb-1 tracking-wide">{breadcrumb}</p>
        )}
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
};
