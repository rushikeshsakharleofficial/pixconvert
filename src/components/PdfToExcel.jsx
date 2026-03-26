import { useState } from 'react';
import DropZone from './DropZone';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfToExcel = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFiles = (files) => {
    if (files[0] && files[0].type === 'application/pdf') {
      setFile(files[0]);
      setDownloadUrl(null);
      setError(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const processPdf = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      let allRows = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group items by Y coordinate to form rows
        const linesMap = new Map();
        textContent.items.forEach(item => {
          // snap to nearest 5 points
          const y = Math.round(item.transform[5] / 5) * 5;
          if (!linesMap.has(y)) linesMap.set(y, []);
          linesMap.get(y).push(item);
        });

        // Top to bottom
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        
        for (const y of sortedY) {
          const lineItems = linesMap.get(y);
          // Left to right
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
          
          // Naive column separating: if items are far apart in X, put in next column
          const row = [];
          let currentCell = '';
          let lastX = null;

          lineItems.forEach(item => {
            const x = item.transform[4];
            // If more than 20 points gap, treat as new column
            if (lastX !== null && (x - lastX > 20)) {
              row.push(currentCell.trim());
              currentCell = item.str;
            } else {
              currentCell += (lastX !== null && x - lastX > 5 ? ' ' : '') + item.str;
            }
            lastX = x + item.width;
          });
          
          if (currentCell) {
            row.push(currentCell.trim());
          }
          
          // Avoid pushing totally empty rows unless necessary for spacing
          if (row.length > 0 && row.some(cell => cell.length > 0)) {
            allRows.push(row);
          }
        }
        
        // Add a blank row between pages
        if (i < numPages) {
          allRows.push([]);
        }

        setProgress(Math.round((i / numPages) * 100));
      }

      if (allRows.length === 0) {
        allRows.push(['No table data or text found in PDF.']);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(allRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');

      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      setDownloadUrl(URL.createObjectURL(blob));

    } catch (err) {
      console.error(err);
      if (err.name === 'PasswordException') {
        setError('This PDF is password protected. Please unlock it first using our Unlock PDF tool.');
      } else {
        setError('An error occurred. PDF may not contain recognizable text tables.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="tool-container">
      {!file ? (
        <DropZone onFiles={handleFiles} multiple={false} accept=".pdf" label="Drop PDF here to extract to Excel" />
      ) : (
        <div className="processing-box text-center">
          <h3 className="mb-3">📄 {file.name}</h3>
          
          {error && <p className="text-danger">{error}</p>}
          
          {processing ? (
            <div className="mt-4">
              <p>Extracting tables to Excel... {progress}%</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : !downloadUrl ? (
            <div className="mt-3">
              <p className="text-muted text-sm mb-3">Note: We attempt to automatically detect columns and rows based on text spacing.</p>
              <button className="btn btn-primary" onClick={processPdf}>Extract to Excel</button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-success mb-3">✅ Extraction complete!</p>
              <div className="cs-actions">
                <a href={downloadUrl} download={`${file.name.replace('.pdf', '')}.xlsx`} className="btn btn-primary">
                  ⬇ Download XLSX
                </a>
                <button className="btn btn-outline" onClick={reset}>Extract Another</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToExcel;
