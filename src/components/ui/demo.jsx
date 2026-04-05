import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

import { FileUpload } from '@/components/ui/pdf-preview-page';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

const DemoOne = () => {
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPdfLibLoaded(true);
  }, []);

  const convertPageToScreenshot = async (page, pageNumber) => {
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not create a canvas for PDF preview.');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return {
      id: `page-${pageNumber}`,
      dataUrl: canvas.toDataURL('image/png'),
      pageNumber,
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !pdfLibLoaded) return;

    setIsProcessing(true);
    setError(null);
    setScreenshots([]);
    setUploadedFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const nextScreenshots = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        nextScreenshots.push(await convertPageToScreenshot(page, pageNum));
      }

      setScreenshots(nextScreenshots);
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError('Failed to process PDF file');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearScreenshots = () => {
    setScreenshots([]);
    setError(null);
    setUploadedFile(null);
  };

  return (
    <div className="mt-5 min-h-screen w-full bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="space-y-8">
          <FileUpload
            onFileUpload={handleFileUpload}
            onClear={clearScreenshots}
            isProcessing={isProcessing}
            pdfLibLoaded={pdfLibLoaded}
            error={error}
            file={uploadedFile}
            screenshots={screenshots}
          />
        </div>
      </div>
    </div>
  );
};

export default DemoOne;
