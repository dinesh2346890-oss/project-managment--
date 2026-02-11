import React, { useMemo, useState } from 'react';
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const InventoryList = ({ fabrics = [], onEdit, onDelete, onAddTransaction }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [colorFilter, setColorFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');

  /* 🔽 SORT STATE */
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc

  /* ---------- FILTER OPTIONS ---------- */
  const types = useMemo(
    () => ['All', ...new Set(fabrics.map(f => f.type).filter(Boolean))],
    [fabrics]
  );
  const colors = useMemo(
    () => ['All', ...new Set(fabrics.map(f => f.color).filter(Boolean))],
    [fabrics]
  );
  const suppliers = useMemo(
    () => ['All', ...new Set(fabrics.map(f => f.supplier).filter(Boolean))],
    [fabrics]
  );
  

  /* ---------- FILTER + SORT ---------- */
  const filteredFabrics = useMemo(() => {
    const filtered = fabrics.filter(f => {
      const matchesSearch =
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.description?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'All' || f.type === typeFilter;
      const matchesColor = colorFilter === 'All' || f.color === colorFilter;
      const matchesSupplier =
        supplierFilter === 'All' || f.supplier === supplierFilter;

      return matchesSearch && matchesType && matchesColor && matchesSupplier;
    });

    return filtered.sort((a, b) => {
      const aId = a.fabric_number || a.id;
      const bId = b.fabric_number || b.id;

      return sortOrder === 'asc' ? aId - bId : bId - aId;
    });
  }, [fabrics, search, typeFilter, colorFilter, supplierFilter, sortOrder]);

  /* ---------- TOTAL VALUE ---------- */
  const totalValue = filteredFabrics.reduce(
    (sum, f) =>
      sum + (f.current_quantity || f.quantity || 0) * (f.price_per_unit || 0),
    0
  );

  const toggleSort = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="space-y-6">
    

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600 text-left">
              {/* SORTABLE ID */}
              <th
                onClick={toggleSort}
                className="px-4 py-3 cursor-pointer select-none flex items-center gap-1"
              >
                ID
                {sortOrder === 'asc' ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </th>

              <th className="px-4 py-3">Fabric</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Color / Pattern</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Total Value</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredFabrics.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-10 text-gray-500">
                  No fabrics found
                </td>
              </tr>
            )}

            {filteredFabrics.map((fabric, index) => {
              const qty = fabric.current_quantity || fabric.quantity || 0;
              const price = fabric.price_per_unit || 0;
              const total = qty * price;

              return (
                <tr
                  key={fabric.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-gray-500">
                    #{index + 1}
                  </td>

                  <td className="px-4 py-3 font-medium text-gray-900">
                    {fabric.name}
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                      {fabric.type || 'General'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {fabric.color || 'N/A'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {qty} {fabric.unit || 'meters'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          qty < 10
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {qty < 10 ? 'Low' : 'Good'}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">₹{price.toFixed(2)}</td>

                  <td className="px-4 py-3 font-semibold">
                    ₹{total.toFixed(2)}
                  </td>

                  <td className="px-4 py-3">
                    {fabric.supplier || '—'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => onEdit(fabric)}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => onAddTransaction(fabric)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => onDelete(fabric.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="flex justify-end text-sm font-semibold text-gray-700">
        Total Value: ₹{totalValue.toFixed(2)}
      </div>
    </div>
  );
};

export default InventoryList;
