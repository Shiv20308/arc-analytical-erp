import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-100">{children}</table>
    </div>
  );
}

export function Thead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function Tbody({ children }) {
  return <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>;
}

export function Th({ children, className = '' }) {
  return <th className={`table-header ${className}`}>{children}</th>;
}

export function Td({ children, className = '' }) {
  return <td className={`table-cell ${className}`}>{children}</td>;
}

export function Tr({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-gray-50/50'} ${className}`}
    >
      {children}
    </tr>
  );
}
