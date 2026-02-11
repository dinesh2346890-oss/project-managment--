import React from 'react';
import { 
  DocumentArrowDownIcon, 
  XMarkIcon, 
  PrinterIcon
} from '@heroicons/react/24/outline';

const BillPreview = ({ 
  isOpen, 
  onClose, 
  type, // 'sale' or 'purchase'
  data, 
  fabric, 
  companyInfo = {
    name: "Ramesh Exporters",
    address: "123 Textile Main Road, Coimbatore, Tamil Nadu",
    phone: "+91 98765 43210",
    email: "info@evaitech.com",
    gst: "33AAAPL1234C1ZV"
  }
}) => {
  
  // Determine list of items to display
  const billItems = data?.items && data.items.length > 0 
    ? data.items 
    : [data]; 

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-IN');
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateBillNumber = () => {
    if (data?.invoice_number) return data.invoice_number;
    const prefix = type === 'sale' ? 'SAL' : 'PUR';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${prefix}${date}-${data?.id || '001'}`;
  };

  // Calculations
  // Ensure we are summing numbers, not strings
  const subtotal = billItems.reduce((sum, item) => {
    const val = parseFloat(item?.total_amount) || parseFloat(item?.total_value) || 0;
    return sum + val;
  }, 0);

  // Assuming price includes tax (based on your 'Inclusive' label)
  // If Inclusive: GST Amount = Total * (Rate / (100 + Rate))
  // If Exclusive: GST Amount = Total * (Rate / 100)
  // Current logic assumes Exclusive calculation for display, or just showing 0 if inclusive.
  const gstAmount = 0; 
  const grandTotal = subtotal; 

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printContent = document.getElementById('bill-content');
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${type === 'sale' ? 'Sale' : 'Purchase'}</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .mb-8 { margin-bottom: 2rem; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-[60]">
      <div className="relative top-4 mx-auto p-6 border-2 border-gray-300 w-[90%] max-w-4xl shadow-2xl rounded-2xl bg-white mb-10">
        
        {/* Modal Controls */}
        <div className="flex justify-between items-center mb-6 no-print">
          <h3 className="text-2xl font-bold text-gray-900">
            {type === 'sale' ? 'Sale Bill' : 'Purchase Bill'} Preview
          </h3>
          <div className="flex space-x-2">
            <button onClick={handlePrint} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Print">
              <PrinterIcon className="h-5 w-5" />
            </button>
            <button onClick={handleDownload} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Download">
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="Close">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="bill-content" className="bg-white p-8 border-2 border-gray-200 rounded-lg">
          
          {/* 1. Company Header */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase">{companyInfo.name}</h1>
            <p className="text-gray-600">{companyInfo.address}</p>
            <p className="text-gray-600">Phone: {companyInfo.phone} | Email: {companyInfo.email}</p>
            <p className="text-gray-600 font-semibold">GSTIN: {companyInfo.gst}</p>
          </div>

          {/* 2. Bill Meta Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">Invoice Details</h3>
              <p className="text-gray-700"><strong>Bill No:</strong> {generateBillNumber()}</p>
              <p className="text-gray-700"><strong>Date:</strong> {formatDate(data?.sale_date || data?.order_date || data?.created_at)}</p>
              <p className="text-gray-700"><strong>Type:</strong> {type === 'sale' ? 'Tax Invoice' : 'Purchase Order'}</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1">
                {type === 'sale' ? 'Bill To' : 'Supplier Details'}
              </h3>
              <p className="text-gray-800 font-bold text-xl">
                {type === 'sale' ? data?.customer_name : data?.supplier_name}
              </p>
              {data?.customer_phone && <p className="text-gray-700">Ph: {data.customer_phone}</p>}
              {data?.delivery_address && <p className="text-gray-700">{data.delivery_address}</p>}
            </div>
          </div>

          {/* 3. Items Table (NO EXTRA BOXES) */}
          <div className="mb-8">
            <table className="w-full border-collapse border-2 border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-2 border-gray-300 px-3 py-2 text-center w-12">#</th>
                  <th className="border-2 border-gray-300 px-3 py-2 text-left">Item Description</th>
                  <th className="border-2 border-gray-300 px-3 py-2 text-left">Type</th>
                  <th className="border-2 border-gray-300 px-3 py-2 text-center">Qty</th>
                  <th className="border-2 border-gray-300 px-3 py-2 text-right">Rate</th>
                  <th className="border-2 border-gray-300 px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {billItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border-2 border-gray-300 px-3 py-2 text-center">{index + 1}</td>
                    <td className="border-2 border-gray-300 px-3 py-2 font-medium">
                      {item.fabric_name || (fabric && fabric.id === item.fabric_id ? fabric.name : 'Fabric Item')}
                    </td>
                    <td className="border-2 border-gray-300 px-3 py-2">
                      {item.fabric_type || (fabric && fabric.id === item.fabric_id ? fabric.type : '-')}
                    </td>
                    <td className="border-2 border-gray-300 px-3 py-2 text-center">
                      {item.quantity} {item.unit || 'mtr'}
                    </td>
                    <td className="border-2 border-gray-300 px-3 py-2 text-right">
                      {formatCurrency(item.unit_price || item.rate)}
                    </td>
                    <td className="border-2 border-gray-300 px-3 py-2 text-right font-semibold">
                      {formatCurrency(item.total_amount || item.total_value)}
                    </td>
                  </tr>
                ))}
                {/* REMOVED: The empty rows generator block */}
              </tbody>
            </table>
          </div>

          {/* 4. Totals & Footer */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left: Bank/Notes */}
            <div>
              <div className="mb-4">
                <h4 className="font-bold text-sm mb-1">Amount in Words:</h4>
                <p className="text-gray-600 text-sm italic border-b border-gray-300 pb-1">
                  Rupees {Math.round(grandTotal)} Only
                </p>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Terms & Conditions:</h4>
                <ul className="text-xs text-gray-500 list-disc list-inside">
                  <li>Goods once sold cannot be returned.</li>
                  <li>Interest @24% will be charged if not paid within due date.</li>
                  <li>Subject to Coimbatore Jurisdiction.</li>
                </ul>
              </div>
            </div>

            {/* Right: Calculations */}
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-gray-600">GST Output:</span>
                <span className="font-medium">{formatCurrency(gstAmount)} (Inclusive)</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-gray-600">Round Off:</span>
                <span className="font-medium">{formatCurrency(grandTotal - Math.floor(grandTotal))}</span>
              </div>
              <div className="flex justify-between border-t-2 border-black mt-2 pt-2">
                <span className="font-bold text-xl">Grand Total:</span>
                <span className="font-bold text-xl text-blue-900">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8">
            <div className="text-center">
              <p className="text-sm text-gray-600">Receiver's Signature</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-sm mb-8">For {companyInfo.name}</p>
              <p className="text-sm text-gray-600">Authorized Signatory</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BillPreview;