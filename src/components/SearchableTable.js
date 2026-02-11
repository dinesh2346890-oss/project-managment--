import React, { useState, useMemo } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

const SearchableTable = ({ 
  data, 
  columns, 
  searchable = true, 
  sortable = true,
  className = '',
  maxHeight = '400px'
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const filteredAndSortedData = useMemo(() => {
    let filteredData = data;

    // Apply sorting
    if (sortConfig.key && sortable) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, sortConfig, sortable, columns]);

  const handleSort = (columnKey) => {
    if (!sortable) return;
    
    let direction = 'ascending';
    if (sortConfig.key === columnKey && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: columnKey, direction });
  };

  const formatCellValue = (value, column, row) => {
    // Handle actions column specially since it doesn't have a corresponding data field
    if (column.key === 'actions') {
      return column.formatter ? column.formatter(null, row) : 'N/A';
    }
    
    if (value === null || value === undefined) return 'N/A';
    
    if (column.formatter) {
      return column.formatter(value, row);
    }
    
    if (column.type === 'currency') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(value);
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString('en-IN');
    }
    
    if (column.type === 'datetime') {
      return new Date(value).toLocaleString('en-IN');
    }
    
    return value.toString();
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && (
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCellValue(item[column.key], column, item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SearchableTable;
