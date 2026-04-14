import { useState, useCallback, useEffect, useMemo } from 'react';

export const useFileTool = () => {
  const [file, setFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPdfBytes(null);
    setResultUrl(null);
    setIsProcessing(false);
    setError('');
  }, [resultUrl]);

  const setFileWithBytes = useCallback(async (newFile) => {
    setFile(newFile);
    setError('');
    try {
      const bytes = new Uint8Array(await newFile.arrayBuffer());
      setPdfBytes(bytes);
    } catch (err) {
      console.error(err);
      setError('Failed to read file bytes.');
    }
  }, []);

  useEffect(() => () => { 
    if (resultUrl) URL.revokeObjectURL(resultUrl); 
  }, [resultUrl]);

  return useMemo(() => ({ 
    file, setFile, 
    pdfBytes, setPdfBytes, 
    resultUrl, setResultUrl, 
    isProcessing, setIsProcessing, 
    error, setError, 
    reset,
    setFileWithBytes
  }), [file, pdfBytes, resultUrl, isProcessing, error, reset, setFileWithBytes]);
};
