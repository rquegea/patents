import { useState } from 'react';
import { downloadExport } from '../utils/api';

export default function ExportPanel({ patents = [] }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    if (patents.length === 0) return;
    setExporting(format);
    try {
      await downloadExport(format, patents);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(null);
    }
  };

  if (patents.length === 0) {
    return <div className="py-12 text-center text-sm text-text-secondary">No results to export.</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Export <span className="text-text-primary font-medium">{patents.length}</span> patents
      </p>

      <div className="space-y-2">
        <button
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="w-full text-left px-3 py-2.5 border border-border rounded-md hover:bg-bg-hover transition-colors disabled:opacity-50"
        >
          <div className="text-sm text-text-primary">Download CSV</div>
          <div className="text-xs text-text-secondary mt-0.5">Spreadsheet format</div>
        </button>

        <button
          onClick={() => handleExport('json')}
          disabled={exporting}
          className="w-full text-left px-3 py-2.5 border border-border rounded-md hover:bg-bg-hover transition-colors disabled:opacity-50"
        >
          <div className="text-sm text-text-primary">Download JSON</div>
          <div className="text-xs text-text-secondary mt-0.5">Structured data</div>
        </button>
      </div>
    </div>
  );
}
