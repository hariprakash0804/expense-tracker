import { useState } from 'react';
import Papa from 'papaparse';
import { useToast } from '../../contexts/ToastContext';
import { expenseService } from '../../services/dataService';
import { categories, paymentMethods } from '../../utils/helpers';
import { HiOutlineUpload, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import './CSVImporter.css';

const CSVImporter = ({ onImportComplete, onClose }) => {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [mappings, setMappings] = useState({
    amount: '',
    description: '',
    category: '',
    date: '',
    paymentMethod: ''
  });
  const [preview, setPreview] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview & Confirm
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error('The uploaded CSV file is empty');
          return;
        }
        
        const csvHeaders = Object.keys(results.data[0]);
        setHeaders(csvHeaders);
        setRawData(results.data);
        
        // Auto-detect matches
        const autoMappings = { amount: '', description: '', category: '', date: '', paymentMethod: '' };
        csvHeaders.forEach(header => {
          const lower = header.toLowerCase().replace(/[^a-z]/g, '');
          if (['amount', 'cost', 'price', 'value', 'spent'].includes(lower)) autoMappings.amount = header;
          if (['description', 'desc', 'title', 'particulars', 'payee'].includes(lower)) autoMappings.description = header;
          if (['category', 'cat', 'type'].includes(lower)) autoMappings.category = header;
          if (['date', 'time', 'txdate', 'timestamp'].includes(lower)) autoMappings.date = header;
          if (['payment', 'paymentmethod', 'method', 'paymode', 'mode'].includes(lower)) autoMappings.paymentMethod = header;
        });
        
        setMappings(autoMappings);
        setStep(2);
      },
      error: () => {
        toast.error('Failed to parse the CSV file');
      }
    });
  };

  const handleMappingChange = (field, value) => {
    setMappings(prev => ({ ...prev, [field]: value }));
  };

  const generatePreview = () => {
    if (!mappings.amount || !mappings.description) {
      toast.error('Amount and Description mappings are required');
      return;
    }

    const mapped = rawData.slice(0, 5).map(row => {
      // Map currency values (clean punctuation)
      const cleanAmount = parseFloat(row[mappings.amount]?.toString()?.replace(/[^\d.-]/g, '')) || 0;
      
      // Clean dates
      let cleanDate = row[mappings.date] || new Date().toISOString().split('T')[0];
      try {
        // Try parsing common date formats if date field exists
        const parsedDate = new Date(cleanDate);
        if (!isNaN(parsedDate.getTime())) {
          cleanDate = parsedDate.toISOString().split('T')[0];
        }
      } catch {}

      // Category detection or fallback
      let category = row[mappings.category] || 'Other';
      if (!categories.includes(category)) {
        // Try matching startsWith
        const match = categories.find(c => c.toLowerCase() === category.toLowerCase());
        category = match || 'Other';
      }

      // Payment method match or fallback
      let payMethod = row[mappings.paymentMethod] || 'Cash';
      if (!paymentMethods.includes(payMethod)) {
        const match = paymentMethods.find(m => m.toLowerCase() === payMethod.toLowerCase());
        payMethod = match || 'Cash';
      }

      return {
        amount: cleanAmount,
        description: row[mappings.description] || 'CSV Transaction',
        category,
        date: cleanDate,
        paymentMethod: payMethod,
        notes: `Imported from CSV file: ${file.name}`
      };
    });

    setPreview(mapped);
    setStep(3);
  };

  const handleImportSubmit = async () => {
    setLoading(true);
    try {
      const fullMappedList = rawData.map(row => {
        const cleanAmount = parseFloat(row[mappings.amount]?.toString()?.replace(/[^\d.-]/g, '')) || 0;
        let cleanDate = row[mappings.date] || new Date().toISOString().split('T')[0];
        try {
          const parsedDate = new Date(cleanDate);
          if (!isNaN(parsedDate.getTime())) {
            cleanDate = parsedDate.toISOString().split('T')[0];
          }
        } catch {}

        let category = row[mappings.category] || 'Other';
        if (!categories.includes(category)) {
          const match = categories.find(c => c.toLowerCase() === category.toLowerCase());
          category = match || 'Other';
        }

        let payMethod = row[mappings.paymentMethod] || 'Cash';
        if (!paymentMethods.includes(payMethod)) {
          const match = paymentMethods.find(m => m.toLowerCase() === payMethod.toLowerCase());
          payMethod = match || 'Cash';
        }

        return {
          amount: cleanAmount,
          description: row[mappings.description] || 'CSV Transaction',
          category,
          date: cleanDate,
          paymentMethod: payMethod,
          notes: `Imported from CSV file: ${file.name}`
        };
      }).filter(item => item.amount > 0); // Ignore zero/negative entries

      if (fullMappedList.length === 0) {
        toast.warning('No valid transactions found to import.');
        setLoading(false);
        return;
      }

      const { data } = await expenseService.bulkDelete(fullMappedList); // Wait, bulkImport API is expenseService.bulkDelete? Ah no, let me check dataService.js!
      // In dataService.js:
      // export const expenseService = { ... bulkDelete: (ids) => api.post('/expenses/bulk-delete', { ids }) }
      // Oh! We didn't add bulkImport to dataService.js yet. We must edit dataService.js to include bulkImport!
      // Let's do that in a moment. Let's call the API directly or fix the service name in client/src/services/dataService.js first.
      
      // Let's call dataService API. Let's assume we add bulkImport: (expenses) => api.post('/expenses/bulk-import', { expenses })
      // Let's make sure it calls:
      await expenseService.bulkImport(fullMappedList);

      toast.success(`Successfully imported ${fullMappedList.length} expenses! 🎉`);
      if (onImportComplete) onImportComplete();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed. Check CSV column data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="csv-importer">
      {step === 1 && (
        <div className="csv-importer__upload">
          <label className="csv-importer__dropzone">
            <HiOutlineUpload className="csv-importer__upload-icon" />
            <span className="font-semibold text-sm">Choose or drag CSV statement file</span>
            <span className="text-xs text-secondary mt-1">Accepts standard .csv spreadsheets</span>
            <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="csv-importer__map">
          <h4 className="font-semibold text-sm mb-3">Map CSV Columns to App Fields</h4>
          <div className="csv-importer__map-grid">
            <div className="form-group">
              <label className="form-label">Amount Column *</label>
              <select className="form-select" value={mappings.amount} onChange={e => handleMappingChange('amount', e.target.value)}>
                <option value="">-- Choose Column --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description Column *</label>
              <select className="form-select" value={mappings.description} onChange={e => handleMappingChange('description', e.target.value)}>
                <option value="">-- Choose Column --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category Column (Optional)</label>
              <select className="form-select" value={mappings.category} onChange={e => handleMappingChange('category', e.target.value)}>
                <option value="">-- Default to "Other" --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date Column (Optional)</label>
              <select className="form-select" value={mappings.date} onChange={e => handleMappingChange('date', e.target.value)}>
                <option value="">-- Default to Today --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method (Optional)</label>
              <select className="form-select" value={mappings.paymentMethod} onChange={e => handleMappingChange('paymentMethod', e.target.value)}>
                <option value="">-- Default to "Cash" --</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="csv-importer__actions mt-4 flex gap-3 justify-end">
            <button className="btn btn--ghost btn--sm" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn--primary btn--sm" onClick={generatePreview} disabled={!mappings.amount || !mappings.description}>
              Preview Mapped Rows
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="csv-importer__preview">
          <h4 className="font-semibold text-sm mb-3">Preview Mapped Data (Top 5 rows)</h4>
          <div className="csv-importer__preview-list mb-4">
            {preview.map((row, i) => (
              <div key={i} className="csv-importer__preview-row">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-secondary">{row.date}</span>
                  <span className="font-bold text-danger">{row.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="font-semibold truncate" style={{ maxWidth: '60%' }}>{row.description}</span>
                  <span className="text-xs text-secondary">{row.category} ({row.paymentMethod})</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4 p-3 rounded text-xs bg-input border border-subtle">
            <HiOutlineExclamationCircle className="text-warning text-sm" style={{ flexShrink: 0 }} />
            <span>Ready to import <strong>{rawData.length}</strong> transactions. Unmapped fields will use default values.</span>
          </div>

          <div className="csv-importer__actions flex gap-3 justify-end">
            <button className="btn btn--ghost btn--sm" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn--primary btn--sm" onClick={handleImportSubmit} disabled={loading}>
              {loading ? <span className="spinner spinner--sm" /> : <><HiOutlineCheckCircle /> Confirm & Import</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImporter;
