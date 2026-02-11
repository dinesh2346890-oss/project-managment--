import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ searchTerm, setSearchTerm, filters, setFilters, fabrics }) => {
  const getUniqueValues = (field) => {
    const values = [...new Set(fabrics.map(fabric => fabric[field]).filter(Boolean))];
    return values.sort();
  };

  const uniqueTypes = getUniqueValues('type');
  const uniqueColors = getUniqueValues('color');
  const uniqueSuppliers = getUniqueValues('supplier');

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      color: '',
      supplier: ''
    });
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm || filters.type || filters.color || filters.supplier;

  return (
    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-orange-100 space-y-6">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-12 pr-4 py-4 border-2 border-orange-200 rounded-xl leading-6 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-800 font-medium"
          placeholder="Search fabrics by name or description..."
        />
      </div>

      {/* Additional Search Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Type Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="block w-full pl-12 pr-4 py-4 border-2 border-orange-200 rounded-xl leading-6 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-800 font-medium"
            placeholder="Search fabric types..."
          />
          {filters.type && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => handleFilterChange('type', '')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Color Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.color}
            onChange={(e) => handleFilterChange('color', e.target.value)}
            className="block w-full pl-12 pr-4 py-4 border-2 border-orange-200 rounded-xl leading-6 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-800 font-medium"
            placeholder="Search colors..."
          />
          {filters.color && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => handleFilterChange('color', '')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Supplier Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.supplier}
            onChange={(e) => handleFilterChange('supplier', e.target.value)}
            className="block w-full pl-12 pr-4 py-4 border-2 border-orange-200 rounded-xl leading-6 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-800 font-medium"
            placeholder="Search suppliers..."
          />
          {filters.supplier && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => handleFilterChange('supplier', '')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Dropdowns and Clear Button */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Quick Filter Dropdowns */}
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-4 py-3 border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50 backdrop-blur-sm text-gray-800 font-medium transition-all duration-300"
        >
          <option value="">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={filters.color}
          onChange={(e) => handleFilterChange('color', e.target.value)}
          className="px-4 py-3 border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50 backdrop-blur-sm text-gray-800 font-medium transition-all duration-300"
        >
          <option value="">All Colors</option>
          {uniqueColors.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>

        <select
          value={filters.supplier}
          onChange={(e) => handleFilterChange('supplier', e.target.value)}
          className="px-4 py-3 border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50 backdrop-blur-sm text-gray-800 font-medium transition-all duration-300"
        >
          <option value="">All Suppliers</option>
          {uniqueSuppliers.map(supplier => (
            <option key={supplier} value={supplier}>{supplier}</option>
          ))}
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-gradient-to-r from-orange-100 to-orange-200 text-black rounded-xl text-sm hover:from-orange-200 hover:to-orange-300 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-black shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              {searchTerm}
              <button
                onClick={() => setSearchTerm('')}
                className="ml-3 text-orange-600 hover:text-orange-800 font-bold text-lg"
              >
                ×
              </button>
            </span>
          )}
          {filters.type && (
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-black shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              {filters.type}
              <button
                onClick={() => handleFilterChange('type', '')}
                className="ml-3 text-orange-600 hover:text-orange-800 font-bold text-lg"
              >
                ×
              </button>
            </span>
          )}
          {filters.color && (
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-black shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              {filters.color}
              <button
                onClick={() => handleFilterChange('color', '')}
                className="ml-3 text-orange-600 hover:text-orange-800 font-bold text-lg"
              >
                ×
              </button>
            </span>
          )}
          {filters.supplier && (
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-black shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              {filters.supplier}
              <button
                onClick={() => handleFilterChange('supplier', '')}
                className="ml-3 text-orange-600 hover:text-orange-800 font-bold text-lg"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
