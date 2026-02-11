import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, PrinterIcon, DevicePhoneMobileIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const SalesForm = ({ sale, onSubmit, onClose }) => {
  // --- State Management ---
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    address: '',
    street: '',
    place: '',
    billDate: new Date().toISOString().split('T')[0],
    salesMan: 'Admin',
    doorDelivery: 'No',
    remarks: ''
  });

  const [items, setItems] = useState([
    { id: 1, fabric_id: '', fabric_name: '', rate: 0, quantity: 0, amount: 0, discount_percent: 0, discount_amt: 0, tax_percent: 5, tax_amt: 0 }
  ]);

  const [activeSearchRow, setActiveSearchRow] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const searchContainerRef = useRef(null);
  const firstInputRefs = useRef([]); // Refs for Search Inputs
  const quantityInputRefs = useRef([]); // NEW: Refs for Quantity Inputs to move focus

  const [loading, setLoading] = useState(false);
  
  const [billSummary, setBillSummary] = useState({
    grossAmt: 0,
    cashDiscountPercent: 0,
    cashDiscountAmt: 0,
    freightAmt: 0,
    packingCharge: 0,
    otherCharge: 0,
    roundOff: 0,
    netAmount: 0
  });

  const [fabrics, setFabrics] = useState([]);

  // --- Effects ---

  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/fabrics');
        const raw = response.data || [];
raw.sort((a,b)=>a.id-b.id);

const withSimple = raw.map((f, idx) => ({
  ...f,
  simple_id: (idx + 1).toString()
}));

setFabrics(withSimple);

      } catch (error) {
        console.error("Error loading fabrics", error);
      }
    };
    fetchFabrics();

    if (sale) {
      setFormData(prev => ({ 
          ...prev, 
          customer_name: sale.customer_name || '',
          phone: sale.customer_phone || '',
          address: sale.delivery_address || '',
          billDate: sale.sale_date ? new Date(sale.sale_date).toISOString().split('T')[0] : prev.billDate
      }));

      if (sale.items && sale.items.length > 0) {
        const mappedItems = sale.items.map((item, idx) => ({
            id: item.id || Date.now() + idx,
            fabric_id: item.fabric_id,
            fabric_name: item.fabric_name || '',
            rate: item.unit_price,
            quantity: item.quantity,
            amount: (item.quantity * item.unit_price),
            discount_percent: 0, 
            discount_amt: 0,
            tax_percent: 5,
            tax_amt: 0
        }));
        setItems(mappedItems);
      }
    }

    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setActiveSearchRow(null);
        setHighlightedIndex(0);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [sale]);

  useEffect(() => {
    calculateTotals();
  }, [items, billSummary.cashDiscountPercent, billSummary.freightAmt, billSummary.packingCharge, billSummary.otherCharge]);

  // --- Helpers ---
  
  const getPrice = (fabric) => {
    if (!fabric) return 0;
    const price = fabric.price_per_unit || fabric.rate || fabric.selling_price || fabric.price || 0;
    return parseFloat(price);
  };

  const getFilteredFabrics = (searchText) => {
    if (!searchText) return [];
    return fabrics.filter(f => f.name.toLowerCase().includes(searchText.toLowerCase()));
  };

  // --- Calculations ---

  const calculateRow = (item) => {
    const baseAmount = parseFloat(item.rate || 0) * parseFloat(item.quantity || 0);
    const disAmt = (baseAmount * (parseFloat(item.discount_percent || 0) / 100));
    const taxableAmount = baseAmount - disAmt;
    const taxAmt = (taxableAmount * (parseFloat(item.tax_percent || 0) / 100));
    
    return {
      ...item,
      amount: baseAmount,
      discount_amt: disAmt,
      tax_amt: taxAmt
    };
  };

  const calculateTotals = () => {
    const totalGross = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalItemDiscount = items.reduce((sum, item) => sum + (item.discount_amt || 0), 0);
    const totalTax = items.reduce((sum, item) => sum + (item.tax_amt || 0), 0);
    
    const grossAfterItemDisc = totalGross - totalItemDiscount;
    
    let billDisc = billSummary.cashDiscountAmt;
    if (billSummary.cashDiscountPercent > 0) {
      billDisc = grossAfterItemDisc * (billSummary.cashDiscountPercent / 100);
    }

    const net = grossAfterItemDisc 
      - billDisc 
      + totalTax 
      + parseFloat(billSummary.freightAmt || 0) 
      + parseFloat(billSummary.packingCharge || 0) 
      + parseFloat(billSummary.otherCharge || 0);

    const roundedNet = Math.round(net);
    const roundOffVal = roundedNet - net;

    setBillSummary(prev => ({
      ...prev,
      grossAmt: totalGross,
      cashDiscountAmt: billDisc,
      roundOff: roundOffVal.toFixed(2),
      netAmount: roundedNet
    }));
  };

  // --- Handlers ---

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index] = calculateRow(newItems[index]);
    setItems(newItems);
  };

  const handleSearchInput = (index, value) => {
    const newItems = [...items];
    newItems[index].fabric_name = value; 
    newItems[index].fabric_id = ''; // Reset ID if typing name manually
    setActiveSearchRow(index); 
    setItems(newItems);
    setHighlightedIndex(0); 
  };

  // *** NEW: Handle Code Entry Logic ***
  const handleCodeKeyDown = (e, index, codeValue) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Find fabric by ID (convert both to string to be safe)
      const foundFabric = fabrics.find(
  f => f.simple_id === codeValue.toString()
);

      
      if (foundFabric) {
        const newItems = [...items];
        
        // 1. Map Values
        newItems[index].fabric_id = foundFabric.id;
        newItems[index].fabric_name = foundFabric.name;
        newItems[index].fabric_code = foundFabric.simple_id;
        newItems[index].rate = getPrice(foundFabric);
        newItems[index].quantity = 1; // Default to 1 qty when scanning/entering code
        
        // 2. Recalculate
        newItems[index] = calculateRow(newItems[index]);
        setItems(newItems);

        // 3. Move focus to Quantity field
        if (quantityInputRefs.current[index]) {
            quantityInputRefs.current[index].focus();
            quantityInputRefs.current[index].select(); // Select text for easy overwrite
        }
      } else {
        alert('Invalid Code: Fabric not found');
      }
    }
  };

  const handleSearchKeyDown = (e, index, searchText) => {
    const filteredList = getFilteredFabrics(searchText);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault(); 
      setHighlightedIndex(prev => (prev < filteredList.length - 1 ? prev + 1 : prev));
    } 
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } 
    else if (e.key === 'Enter') {
      e.preventDefault(); 
      if (filteredList.length > 0 && filteredList[highlightedIndex]) {
        handleFabricSelect(index, filteredList[highlightedIndex]);
      }
    }
  };

  const handleFabricSelect = (index, fabric) => {
    const newItems = [...items];
    newItems[index].fabric_id = fabric.id;
    newItems[index].fabric_name = fabric.name;
    const autoRate = getPrice(fabric);
    newItems[index].rate = autoRate;
    newItems[index] = calculateRow(newItems[index]);
    setItems(newItems);
    
    setActiveSearchRow(null); 
    setHighlightedIndex(0);

    // Focus Quantity after selection
    if (quantityInputRefs.current[index]) {
        quantityInputRefs.current[index].focus();
    }
  };

  const addItemRow = () => {
    setItems([...items, { id: Date.now(), fabric_id: '', fabric_name: '', rate: 0, quantity: 0, amount: 0, discount_percent: 0, discount_amt: 0, tax_percent: 5, tax_amt: 0 }]);
  };

  const handleLastFieldKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === items.length - 1) {
        addItemRow();
        // Timeout to allow render before focusing new row (optional but safer)
        setTimeout(() => {
            // Logic to focus next row's code input could go here if refs were set up for it
        }, 50);
      }
    }
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      customer_name: formData.customer_name,
      customer_phone: formData.phone,
      delivery_address: formData.address,
      sale_date: formData.billDate,
      total_amount: billSummary.netAmount,
      items: items.filter(i => i.fabric_id), 
      status: 'completed'
    };

    try {
      const response = await axios.post('http://localhost:5000/api/sales', payload);
      
      if (response.data) {
        alert('Sale Saved Successfully!');
        if (onSubmit) onSubmit(response.data); 
        onClose(); 
      }
    } catch (error) {
      console.error("Error saving sale:", error);
      alert("Failed to save sale. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[95%] h-[90vh] flex flex-col shadow-2xl rounded-sm overflow-hidden border border-orange-600">
        
        {/* Header */}
        <div className="bg-orange-600 text-white px-4 py-2 flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-2">
            <DevicePhoneMobileIcon className="h-5 w-5" />
            <h2 className="font-bold text-lg tracking-wide uppercase">New Sales Entry</h2>
          </div>
          <button onClick={onClose} className="hover:bg-orange-700 p-1 rounded transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Top Controls */}
        <div className="bg-orange-50 border-b border-orange-200 p-3 text-sm">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 space-y-2 border-r border-orange-200 pr-4">
               <div className="grid grid-cols-3 gap-2 items-center">
                 <label className="text-gray-700 font-semibold text-right">Customer Name*</label>
                 <input 
                   type="text" 
                   className="col-span-2 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                   value={formData.customer_name}
                   onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                 />
               </div>
               <div className="grid grid-cols-3 gap-2 items-center">
                 <label className="text-gray-700 text-right">Phone / Mobile</label>
                 <input 
                   type="text" 
                   className="col-span-2 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-orange-500"
                   value={formData.phone}
                   onChange={(e) => setFormData({...formData, phone: e.target.value})}
                 />
               </div>
               <div className="grid grid-cols-3 gap-2 items-center">
                 <label className="text-gray-700 text-right">Address</label>
                 <input 
                   type="text" 
                   className="col-span-2 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-orange-500"
                   value={formData.address}
                   onChange={(e) => setFormData({...formData, address: e.target.value})}
                 />
               </div>
            </div>
            
            <div className="col-span-3 space-y-2 border-r border-orange-200 px-4">
               <div className="flex justify-between items-center bg-white border border-gray-300 p-1 rounded">
                  <label className="text-gray-600 px-2">Sales Man</label>
                  <select className="bg-transparent font-medium text-orange-800 outline-none">
                    <option>Admin</option>
                  </select>
               </div>
               <div className="flex justify-between items-center bg-white border border-gray-300 p-1 rounded">
                  <label className="text-gray-600 px-2">Delivery?</label>
                  <select 
                    className="bg-transparent font-medium outline-none"
                    value={formData.doorDelivery}
                    onChange={(e) => setFormData({...formData, doorDelivery: e.target.value})}
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
               </div>
            </div>

            <div className="col-span-4 pl-4 space-y-2">
               <div className="bg-orange-100 border border-orange-300 p-2 rounded flex justify-between">
                 <span className="font-bold text-orange-900">Bill Date</span>
                 <input type="date" value={formData.billDate} className="bg-transparent font-bold text-right outline-none text-orange-900" onChange={(e)=>setFormData({...formData, billDate: e.target.value})} />
               </div>
               <div className="flex justify-between items-center pt-2">
                 <span className="text-gray-600">Tax Type:</span>
                 <span className="font-bold text-gray-800">GST (Inclusive)</span>
               </div>
            </div>
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col border-r border-gray-300 bg-white" ref={searchContainerRef}>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-orange-500 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 border-r border-orange-400 w-8">#</th>
                    <th className="px-2 py-2 border-r border-orange-400 w-20">Code</th> {/* Code Column */}
                    <th className="px-2 py-2 border-r border-orange-400 w-64">Item Name (Search)</th>
                    <th className="px-2 py-2 border-r border-orange-400 w-24">Rate</th>
                    <th className="px-2 py-2 border-r border-orange-400 w-20">Qty</th>
                    <th className="px-2 py-2 border-r border-orange-400 w-24">Amount</th>
                    <th className="px-2 py-2 border-r border-orange-400 w-16">Disc%</th>
                    <th className="px-2 py-2 border-r border-orange-400 w-16">Tax%</th>
                    <th className="px-2 py-2 w-10 text-center">Act</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const filteredFabrics = getFilteredFabrics(item.fabric_name || '');
                    
                    return (
                      <tr key={item.id} className="hover:bg-orange-50 relative">
                        <td className="border-r px-2 py-1 text-center text-gray-500">{index + 1}</td>
                        
                        {/* Code Column (Editable + Auto Map on Enter) */}
                        <td className="border-r px-1 py-1">
  <input 
    type="text" 
    className="w-full h-full px-1 border-none bg-transparent text-gray-900 focus:bg-orange-100 outline-none font-medium" 
    value={item.fabric_code || ''}
    placeholder="Code"
    onChange={(e) => handleItemChange(index, 'fabric_code', e.target.value)}
    onKeyDown={(e) => handleCodeKeyDown(e, index, item.fabric_code)}
  />
</td>

                        {/* Searchable Input */}
                        <td className="border-r px-1 py-1 relative">
                          <div className="relative flex items-center">
                            <input 
                              ref={el => firstInputRefs.current[index] = el}
                              type="text"
                              className="w-full p-1 border-b border-transparent focus:border-orange-500 focus:bg-orange-50 outline-none"
                              placeholder="Search fabric..."
                              value={item.fabric_name}
                              onChange={(e) => handleSearchInput(index, e.target.value)}
                              onKeyDown={(e) => handleSearchKeyDown(e, index, item.fabric_name)}
                              onFocus={() => setActiveSearchRow(index)}
                            />
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute right-2" />
                          </div>
                          {activeSearchRow === index && (
                            <div className="absolute top-full left-0 w-full bg-white border border-orange-300 shadow-lg z-50 max-h-48 overflow-y-auto">
                              {filteredFabrics.length > 0 ? (
                                  filteredFabrics.map((fabric, fIdx) => (
                                      <div 
                                        key={fabric.id} 
                                        className={`px-3 py-2 cursor-pointer border-b border-gray-100 text-sm ${fIdx === highlightedIndex ? 'bg-orange-200 text-orange-900 font-bold' : 'hover:bg-orange-100 text-gray-700'}`}
                                        onClick={() => handleFabricSelect(index, fabric)}
                                      >
                                        <div className="font-medium">{fabric.name}</div>
                                        <div className="text-xs text-gray-500">Stock: {fabric.current_quantity || 0} | Rate: {getPrice(fabric)}</div>
                                      </div>
                                    ))
                                ) : <div className="p-2 text-gray-500 text-xs italic text-center">No fabrics found</div>}
                            </div>
                          )}
                        </td>

                        <td className="border-r px-1 py-1">
                          <input type="number" className="w-full text-right p-1 focus:bg-orange-100 outline-none" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} />
                        </td>
                        <td className="border-r px-1 py-1">
                          {/* Added Ref to Quantity for auto-focus */}
                          <input 
                            ref={el => quantityInputRefs.current[index] = el}
                            type="number" 
                            className="w-full text-right p-1 focus:bg-orange-100 outline-none font-bold" 
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                          />
                        </td>
                        <td className="border-r px-2 py-1 text-right bg-gray-50 font-medium">{item.amount.toFixed(2)}</td>
                        <td className="border-r px-1 py-1">
                            <input type="number" className="w-full text-right p-1 focus:bg-orange-100 outline-none" value={item.discount_percent} onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)} />
                        </td>
                        <td className="border-r px-1 py-1">
                            <input 
                              type="number" 
                              className="w-full text-right p-1 focus:bg-orange-100 outline-none" 
                              value={item.tax_percent} 
                              onChange={(e) => handleItemChange(index, 'tax_percent', e.target.value)}
                              onKeyDown={(e) => handleLastFieldKeyDown(e, index)}
                            />
                        </td>
                        <td className="px-1 py-1 text-center">
                          <button onClick={() => removeItemRow(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr onClick={addItemRow} className="cursor-pointer hover:bg-green-50 border-t border-dashed border-gray-300">
                    <td colSpan="9" className="px-4 py-2 text-center text-gray-400 text-xs uppercase tracking-wider">
                      <div className="flex items-center justify-center"><PlusIcon className="h-4 w-4 mr-1" /> Click to Add Item (or press Enter on last field)</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="border-t border-gray-300 p-2 bg-gray-50 flex justify-between text-xs text-gray-600">
              <div>Items: {items.length}</div>
              <div>Qty Total: {items.reduce((acc, i) => acc + parseFloat(i.quantity||0), 0)}</div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-72 bg-orange-50 p-3 flex flex-col space-y-1 overflow-auto border-l border-orange-200">
             {[
               { label: 'Gross Amt', key: 'grossAmt', readonly: true },
               { label: 'Cash Disc %', key: 'cashDiscountPercent', readonly: false },
               { label: 'Cash Disc Amt', key: 'cashDiscountAmt', readonly: true },
               { label: 'Tax Amt', key: 'taxAmt', value: items.reduce((s,i)=>s+i.tax_amt, 0).toFixed(2), readonly: true },
               { label: 'Freight Amt', key: 'freightAmt', readonly: false },
               { label: 'Packing Chg', key: 'packingCharge', readonly: false },
               { label: 'Other Chg', key: 'otherCharge', readonly: false },
               { label: 'Round Off', key: 'roundOff', readonly: true },
             ].map((field) => (
               <div key={field.label} className="bg-white p-1 rounded border border-orange-200 mb-1">
                 <label className="block text-xs font-bold text-orange-900 mb-1">{field.label}</label>
                 <input 
                   type="number"
                   readOnly={field.readonly}
                   className={`w-full text-right p-1 text-sm outline-none ${field.readonly ? 'bg-gray-100 text-gray-600' : 'bg-white font-semibold text-black'}`}
                   value={field.value !== undefined ? field.value : billSummary[field.key]}
                   onChange={(e) => !field.readonly && setBillSummary({...billSummary, [field.key]: parseFloat(e.target.value) || 0})}
                 />
               </div>
             ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-300 p-4 shadow-inner z-20">
           <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                 <button disabled={loading} onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm flex items-center disabled:opacity-50">
                   <span>{loading ? 'Saving...' : 'F10 - Save'}</span>
                 </button>
                 <button className="border border-orange-300 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-50 flex items-center">
                   <PrinterIcon className="h-5 w-5 mr-1" /> Print
                 </button>
              </div>
              <div className="flex items-center">
                <span className="text-xl font-bold text-gray-600 mr-4">Net Amount:</span>
                <div className="text-4xl font-bold text-orange-600 tracking-tight">{billSummary.netAmount.toFixed(2)}</div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SalesForm;