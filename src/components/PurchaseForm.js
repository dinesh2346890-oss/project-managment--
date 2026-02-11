import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { XMarkIcon, PlusIcon, TrashIcon, PrinterIcon, ArchiveBoxArrowDownIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AddFabricForm from './AddFabricForm'; 

const PurchaseForm = ({ purchase, onSubmit, onClose }) => {
  // --- State Management ---
  
  // Header / Master Data
  const [formData, setFormData] = useState({
    supplier_name: '',
    mobile: '',
    invoice_no: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_type: 'Credit', // Credit or Cash
    company: 'Main Branch',
    remarks: ''
  });

  // Grid / Detail Data
  const [items, setItems] = useState([
    { 
      id: Date.now(), 
      fabric_id: '', 
      product_code: '', 
      description: '', 
      quantity: 0, 
      cost: 0, 
      mrp: 0, 
      selling_price: 0, 
      tax_percent: 0, 
      tax_amt: 0, 
      discount_percent: 0, 
      amount: 0, 
      net_amt: 0 
    }
  ]);

  // Dropdown Data
  const [fabrics, setFabrics] = useState([]);

  // Search & Focus State
  const [activeSearchRow, setActiveSearchRow] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  // --- NEW STATES FOR "NOT FOUND" LOGIC ---
  const [missingCode, setMissingCode] = useState(null); // Stores the invalid code (e.g. "9")
  const [showAddFabricModal, setShowAddFabricModal] = useState(false); // Controls the Add Form visibility
  // ----------------------------------------

  const searchContainerRef = useRef(null);
  const firstInputRefs = useRef([]); 
  const quantityInputRefs = useRef([]); 

  // Totals
  const [totals, setTotals] = useState({
    gross: 0,
    totalTax: 0,
    netAmount: 0
  });

  // --- Effects ---

  const fetchFabrics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fabrics');
      let rawFabrics = response.data || [];
      
      // *** FIX: Sort by ID to ensure '1' is always the same fabric across all screens ***
      rawFabrics.sort((a, b) => a.id - b.id); 

      // Map fabrics to include a 'simple_id' based on index (1, 2, 3...)
      const fabricsWithSimpleIds = rawFabrics.map((f, index) => ({
          ...f,
          simple_id: (index + 1).toString() 
      }));
      
      setFabrics(fabricsWithSimpleIds);
    } catch (error) {
      console.error("Error loading fabrics", error);
    }
  };

  useEffect(() => {
    fetchFabrics();

    // Populate Form if Editing
    if (purchase) {
      setFormData({
        supplier_name: purchase.supplier || purchase.supplier_name || '',
        mobile: purchase.mobile || purchase.supplier_phone || '',
        invoice_no: purchase.orderNumber || purchase.order_number || '', 
        invoice_date: purchase.orderDate ? new Date(purchase.orderDate).toISOString().split('T')[0] : purchase.order_date ? new Date(purchase.order_date).toISOString().split('T')[0] : '',
        due_date: purchase.expectedDate ? new Date(purchase.expectedDate).toISOString().split('T')[0] : purchase.expected_delivery_date ? new Date(purchase.expected_delivery_date).toISOString().split('T')[0] : '',
        payment_type: purchase.payment_terms || 'Credit',
        company: 'Main Branch',
        remarks: purchase.notes || purchase.remarks || ''
      });

      const sourceItems = purchase.items || [purchase]; 
      
      if (sourceItems && sourceItems.length > 0) {
        const mappedItems = sourceItems.map((item, idx) => ({
            id: item.id || Date.now() + idx,
            fabric_id: item.fabric_id,
            product_code: item.product_code || '', 
            description: item.fabric_name || (item.description) || '', 
            quantity: item.quantity,
            cost: item.unit_price,
            mrp: item.mrp || 0,
            selling_price: item.selling_price || 0,
            tax_percent: 0, 
            tax_amt: 0, 
            discount_percent: 0, 
            amount: (item.quantity * item.unit_price),
            net_amt: item.total_amount
        }));
        setItems(mappedItems);
      }
    }

    // Click outside listener
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setActiveSearchRow(null);
        setHighlightedIndex(0);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [purchase]);

  // Sync descriptions
  useEffect(() => {
    if (fabrics.length > 0 && items.length > 0) {
        const updatedItems = items.map(item => {
            if (item.fabric_id) {
                const found = fabrics.find(f => f.id === item.fabric_id);
                if (found) {
                     if (item.product_code !== found.simple_id || !item.description) {
                         return { 
                            ...item, 
                            description: found.name,
                            product_code: found.simple_id, 
                            mrp: item.mrp || found.mrp || 0,
                            selling_price: item.selling_price || found.selling_price || 0
                        };
                     }
                }
            }
            return item;
        });
        const hasChanged = updatedItems.some((item, i) => 
            item.product_code !== items[i].product_code || item.description !== items[i].description
        );
        if (hasChanged) setItems(updatedItems);
    }
    // eslint-disable-next-line
  }, [fabrics, items.length]); 

  // Auto-calculate totals
  useEffect(() => {
    const gross = items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const tax = items.reduce((acc, item) => acc + (parseFloat(item.tax_amt) || 0), 0);
    const net = items.reduce((acc, item) => acc + (parseFloat(item.net_amt) || 0), 0);

    setTotals({ gross, totalTax: tax, netAmount: net });
  }, [items]);

  // Focus
  useEffect(() => {
    if (items.length > 0) {
      const lastIndex = items.length - 1;
      if (firstInputRefs.current[lastIndex]) {
        firstInputRefs.current[lastIndex].focus();
      }
    }
  }, [items.length]);


  // --- Helper Functions ---

  const getCost = (fabric) => {
    if (!fabric) return 0;
    return parseFloat(fabric.price_per_unit || fabric.cost_price || fabric.rate || 0);
  };

  const getFilteredFabrics = (searchText) => {
    if (!searchText) return [];
    return fabrics.filter(f => f.name.toLowerCase().includes(searchText.toLowerCase()));
  };

  const calculateRow = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.cost) || 0;
    const discPct = parseFloat(item.discount_percent) || 0;
    const taxPct = parseFloat(item.tax_percent) || 0;

    const baseAmount = qty * cost;
    const discountAmt = baseAmount * (discPct / 100);
    const taxableAmount = baseAmount - discountAmt;
    const taxAmt = taxableAmount * (taxPct / 100);
    const net = taxableAmount + taxAmt;

    return {
      ...item,
      amount: taxableAmount, 
      tax_amt: taxAmt,
      net_amt: net
    };
  };

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGridChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-Map if Code is typed manually
    if (field === 'product_code') {
        const match = fabrics.find(f => f.simple_id === value);
        if (match) {
            newItems[index].fabric_id = match.id;
            newItems[index].description = match.name;
            newItems[index].cost = getCost(match);
            newItems[index].mrp = match.mrp || 0;
            newItems[index].selling_price = match.selling_price || 0;
        } else {
            // Reset if not a match (yet)
            newItems[index].fabric_id = ''; 
        }
    }

    newItems[index] = calculateRow(newItems[index]);
    setItems(newItems);
  };

  // *** UPDATED KEY HANDLER FOR "NOT FOUND" LOGIC ***
  const handleCodeKeyDown = (e, index, codeValue) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const foundFabric = fabrics.find(f => 
          (f.simple_id === codeValue.toString()) || 
          (f.product_code && f.product_code.toString() === codeValue.toString())
      );
      
      if (foundFabric) {
        // MATCH FOUND
        const newItems = [...items];
        newItems[index].fabric_id = foundFabric.id;
        newItems[index].product_code = foundFabric.simple_id; 
        newItems[index].description = foundFabric.name;
        newItems[index].cost = getCost(foundFabric);
        newItems[index].mrp = foundFabric.mrp || 0;
        newItems[index].selling_price = foundFabric.selling_price || 0;
        newItems[index].quantity = 1; 
        newItems[index] = calculateRow(newItems[index]);
        setItems(newItems);

        if (quantityInputRefs.current[index]) {
            quantityInputRefs.current[index].focus();
            quantityInputRefs.current[index].select();
        }
      } else {
        // NO MATCH FOUND - Trigger "Not Found" Modal
        if (codeValue.trim() !== '') {
            setMissingCode(codeValue);
        }
      }
    }
  };

  const handleCreateFabric = async (fabricData) => {
    try {
        const formData = new FormData();
        Object.keys(fabricData).forEach(key => {
            if (key === 'image' && fabricData[key]) {
                formData.append(key, fabricData[key]);
            } else {
                formData.append(key, fabricData[key]);
            }
        });

        await axios.post('http://localhost:5000/api/fabrics', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // 1. Refresh list
        await fetchFabrics();
        
        // 2. Close modals
        setShowAddFabricModal(false);
        setMissingCode(null);

    } catch (error) {
        console.error('Error adding fabric:', error);
        alert("Failed to add fabric");
    }
  };

  const handleSearchInput = (index, value) => {
    const newItems = [...items];
    newItems[index].description = value; 
    newItems[index].fabric_id = ''; 
    setActiveSearchRow(index);
    setItems(newItems);
    setHighlightedIndex(0);
  };

  const handleSearchKeyDown = (e, index, searchText) => {
    const filteredList = getFilteredFabrics(searchText);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredList.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredList.length > 0 && filteredList[highlightedIndex]) {
        handleFabricSelect(index, filteredList[highlightedIndex]);
      }
    }
  };

  const handleFabricSelect = (index, fabric) => {
    const newItems = [...items];
    newItems[index].fabric_id = fabric.id;
    newItems[index].product_code = fabric.simple_id;
    newItems[index].description = fabric.name;
    newItems[index].cost = getCost(fabric);
    newItems[index].mrp = fabric.mrp || 0;
    newItems[index].selling_price = fabric.selling_price || 0;
    newItems[index] = calculateRow(newItems[index]);
    setItems(newItems);
    setActiveSearchRow(null); 
    setHighlightedIndex(0);
    if (quantityInputRefs.current[index]) {
        quantityInputRefs.current[index].focus();
    }
  };

  const addRow = () => {
    setItems([...items, { 
        id: Date.now(), fabric_id: '', product_code: '', description: '', quantity: 0, cost: 0, 
        mrp: 0, selling_price: 0, tax_percent: 0, tax_amt: 0, discount_percent: 0, amount: 0, net_amt: 0 
    }]);
  };

  const handleLastFieldKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === items.length - 1) addRow();
    }
  };

  const removeRow = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if(!formData.supplier_name) {
        alert("Please enter Supplier Name");
        return;
    }
    const formattedItems = items.map(item => ({
      fabric_id: item.fabric_id,          
      product_code: item.product_code,    
      fabric_name: item.description,
      description: item.description,      
      quantity: parseFloat(item.quantity) || 0,
      unit_price: parseFloat(item.cost) || 0, 
      mrp: parseFloat(item.mrp) || 0,
      selling_price: parseFloat(item.selling_price) || 0,
      unit: 'mtr'
    }));
    const payload = {
      supplier_name: formData.supplier_name,
      mobile: formData.mobile,
      order_number: formData.invoice_no,
      order_date: formData.invoice_date,
      expected_delivery_date: formData.due_date,
      total_amount: totals.netAmount,
      status: 'received',
      payment_terms: formData.payment_type,
      items: formattedItems 
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 font-sans">
      
      {/* 1. MAIN WINDOW */}
      <div className="bg-white w-full max-w-[98%] h-[95vh] flex flex-col shadow-2xl rounded-sm overflow-hidden border border-orange-600 text-sm">
        
        {/* Header */}
        <div className="bg-orange-600 text-white px-4 py-2 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center space-x-2">
            <ArchiveBoxArrowDownIcon className="h-6 w-6" />
            <h2 className="font-bold text-base uppercase tracking-wide">Purchase Entry (Register)</h2>
          </div>
          <button onClick={onClose} className="hover:bg-orange-700 p-1.5 rounded transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Info Area */}
        <div className="bg-orange-50 border-b border-orange-200 p-3 text-sm shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 pr-4 border-r border-orange-200">
               <div className="flex items-center">
                 <label className="w-28 text-right pr-3 text-gray-700 font-semibold">Supplier Name*</label>
                 <input type="text" name="supplier_name" className="flex-1 border border-gray-300 h-8 px-2 focus:outline-none focus:border-orange-500 rounded-sm" value={formData.supplier_name} onChange={handleInputChange} />
               </div>
               <div className="flex items-center">
                 <label className="w-28 text-right pr-3 text-gray-700">Mobile</label>
                 <input type="text" name="mobile" className="flex-1 border border-gray-300 h-8 px-2 focus:outline-none focus:border-orange-500 rounded-sm" value={formData.mobile} onChange={handleInputChange} />
               </div>
            </div>
            <div className="space-y-2 px-4 border-r border-orange-200">
              <div className="flex items-center">
                 <label className="w-28 text-right pr-3 text-gray-700">Payment Type</label>
                 <select name="payment_type" className="flex-1 border border-gray-300 h-8 px-2 focus:outline-none focus:border-orange-500 rounded-sm" value={formData.payment_type} onChange={handleInputChange} >
                   <option>Credit</option>
                   <option>Cash</option>
                 </select>
               </div>
               <div className="flex items-center">
                 <label className="w-28 text-right pr-3 text-gray-700">Due Date</label>
                 <input type="date" name="due_date" className="flex-1 border border-gray-300 h-8 px-2 focus:outline-none focus:border-orange-500 rounded-sm" value={formData.due_date} onChange={handleInputChange} />
               </div>
            </div>
            <div className="space-y-2 pl-4">
              <div className="flex items-center">
                 <label className="w-28 text-right pr-3 text-gray-700 font-semibold">Invoice No</label>
                 <input type="text" name="invoice_no" className="flex-1 border border-gray-300 h-8 px-2 focus:outline-none focus:border-orange-500 font-bold text-orange-800 rounded-sm" value={formData.invoice_no} onChange={handleInputChange} />
               </div>
               <div className="flex items-center">
                 <label className="w-28 text-right pr-3 text-gray-700">Invoice Date</label>
                 <input type="date" name="invoice_date" className="flex-1 border border-gray-300 h-8 px-2 focus:outline-none focus:border-orange-500 rounded-sm" value={formData.invoice_date} onChange={handleInputChange} />
               </div>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto bg-white relative">
          <div className="h-full flex flex-col" ref={searchContainerRef}>
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-orange-600 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 border-r border-orange-400 w-10">Sno</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-28">Code</th>
                  <th className="px-2 py-2 border-r border-orange-400">Description (Fabric Search)</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-20">Qty</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-20">Cost</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-20">MRP</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-20">S.Price</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-16">Tax%</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-20">Tax Amt</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-16">Dis%</th>
                  <th className="px-2 py-2 border-r border-orange-400 w-28">Net Amt</th>
                  <th className="px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => {
                  const filteredFabrics = getFilteredFabrics(item.description || '');
                  return (
                    <tr key={item.id} className="hover:bg-orange-50 relative h-10">
                      <td className="border-r border-gray-200 px-2 py-1 text-center bg-gray-50">{index + 1}</td>
                      <td className="border-r border-gray-200 px-0 py-0">
                        <input 
                          ref={el => firstInputRefs.current[index] = el}
                          type="text" 
                          className="w-full h-full px-2 border-none bg-white text-gray-900 focus:ring-1 focus:ring-orange-500 outline-none font-bold text-blue-800"
                          value={item.product_code}
                          placeholder="Code"
                          onChange={(e) => handleGridChange(index, 'product_code', e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(e, index, item.product_code)}
                        />
                      </td>
                      <td className="border-r border-gray-200 px-1 py-1 relative">
                        <div className="relative flex items-center h-full">
                          <input 
                            type="text"
                            className="w-full h-full px-2 border-none focus:ring-0 outline-none bg-transparent"
                            placeholder="Search or Type New Fabric..."
                            value={item.description}
                            onChange={(e) => handleSearchInput(index, e.target.value)}
                            onKeyDown={(e) => handleSearchKeyDown(e, index, item.description)}
                            onFocus={() => setActiveSearchRow(index)}
                          />
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-2 pointer-events-none" />
                        </div>
                        {activeSearchRow === index && (
                          <div className="absolute top-full left-0 w-full bg-white border border-orange-300 shadow-lg z-50 max-h-60 overflow-y-auto">
                            {filteredFabrics.length > 0 ? (
                                filteredFabrics.map((fabric, fIdx) => (
                                    <div key={fabric.id} className={`px-4 py-3 cursor-pointer border-b border-gray-100 text-sm ${fIdx === highlightedIndex ? 'bg-orange-200 text-orange-900 font-bold' : 'hover:bg-orange-100 text-gray-700'}`} onClick={() => handleFabricSelect(index, fabric)}>
                                      <div className="font-medium"><span className="bg-gray-100 text-xs px-1 mr-1 rounded border font-bold">#{fabric.simple_id}</span>{fabric.name}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">Stock: {fabric.current_quantity || 0} | Cost: {getCost(fabric)}</div>
                                    </div>
                                ))
                            ) : (
                              <div className="p-3 text-green-700 bg-green-50 text-sm font-semibold cursor-pointer border-l-4 border-green-500" onClick={() => setActiveSearchRow(null)}>+ Create "{item.description}" as new Item</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="border-r border-gray-200 px-0 py-0"><input ref={el => quantityInputRefs.current[index] = el} type="number" className="w-full h-full px-2 text-right border-none focus:ring-1 focus:ring-orange-500 bg-yellow-50" value={item.quantity} onChange={(e) => handleGridChange(index, 'quantity', e.target.value)} /></td>
                      <td className="border-r border-gray-200 px-0 py-0"><input type="number" className="w-full h-full px-2 text-right border-none focus:ring-1 focus:ring-orange-500" value={item.cost} onChange={(e) => handleGridChange(index, 'cost', e.target.value)} /></td>
                      <td className="border-r border-gray-200 px-0 py-0"><input type="number" className="w-full h-full px-2 text-right border-none focus:ring-1 focus:ring-orange-500 bg-blue-50" value={item.mrp} onChange={(e) => handleGridChange(index, 'mrp', e.target.value)} /></td>
                      <td className="border-r border-gray-200 px-0 py-0"><input type="number" className="w-full h-full px-2 text-right border-none focus:ring-1 focus:ring-orange-500 bg-green-50" value={item.selling_price} onChange={(e) => handleGridChange(index, 'selling_price', e.target.value)} /></td>
                      <td className="border-r border-gray-200 px-0 py-0"><input type="number" className="w-full h-full px-2 text-right border-none focus:ring-1 focus:ring-orange-500" value={item.tax_percent} onChange={(e) => handleGridChange(index, 'tax_percent', e.target.value)} /></td>
                      <td className="border-r border-gray-200 px-2 py-1 text-right bg-gray-50 text-gray-600">{item.tax_amt.toFixed(2)}</td>
                      <td className="border-r border-gray-200 px-0 py-0"><input type="number" className="w-full h-full px-2 text-right border-none focus:ring-1 focus:ring-orange-500" value={item.discount_percent} onChange={(e) => handleGridChange(index, 'discount_percent', e.target.value)} onKeyDown={(e) => handleLastFieldKeyDown(e, index)} /></td>
                      <td className="border-r border-gray-200 px-2 py-1 text-right bg-orange-50 font-semibold text-orange-900">{item.net_amt.toFixed(2)}</td>
                      <td className="px-1 py-0 text-center"><button onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button></td>
                    </tr>
                  );
                })}
                <tr onClick={addRow} className="cursor-pointer hover:bg-green-50 border-t border-dashed border-gray-300 h-10">
                  <td colSpan="12" className="px-4 py-2 text-left text-gray-500 text-sm uppercase tracking-wider"><div className="flex items-center"><PlusIcon className="h-5 w-5 mr-2" />Add New Item (Click or Press Insert)</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-orange-50 border-t border-orange-300 p-4 shrink-0 z-20">
          <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-2">Remarks</label>
              <textarea className="flex-1 w-full border border-gray-300 p-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none rounded-sm" rows="3" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})}></textarea>
            </div>
            <div className="w-full md:w-1/3 flex flex-col justify-end">
              <div className="bg-white border border-gray-300 rounded-sm p-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-600"><span>Gross Amount:</span><span>{totals.gross.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Total Tax:</span><span>{totals.totalTax.toFixed(2)}</span></div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between items-end"><span className="text-xl font-bold text-orange-900">Net Amount:</span><span className="text-4xl font-bold text-orange-600 leading-none">{totals.netAmount.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                 <button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded shadow-sm font-semibold flex items-center text-base"><span>Save</span></button>
                 <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded hover:bg-gray-50 flex items-center text-base"><PrinterIcon className="h-6 w-6 mr-2" /> Print</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. ITEM NOT FOUND POPUP */}
      {missingCode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full text-center border-2 border-orange-300">
                <div className="bg-orange-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Item Not Found</h3>
                <p className="text-gray-600 mb-6">
                    Fabric Code <span className="font-bold text-orange-600">"{missingCode}"</span> does not exist in your inventory.
                </p>
                <div className="flex space-x-3 justify-center">
                    <button 
                        onClick={() => setMissingCode(null)}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            setShowAddFabricModal(true);
                        }}
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium flex items-center"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add New Fabric
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 3. ADD FABRIC MODAL (Reused from Inventory) */}
      {showAddFabricModal && (
        <div className="fixed inset-0 z-[70]">
             <AddFabricForm 
                nextId={fabrics.length + 1}
                onSubmit={handleCreateFabric}
                onClose={() => {
                    setShowAddFabricModal(false);
                    setMissingCode(null);
                }}
             />
        </div>
      )}

    </div>
  );
};

export default PurchaseForm;