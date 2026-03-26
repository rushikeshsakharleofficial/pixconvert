import { useState, useEffect } from 'react';
import GIF from 'gif.js';
import heic2any from 'heic2any';
import DropZone from './DropZone';
import FolderUpload from './FolderUpload';
import formatSize from '../utils/formatSize';
import isHeic from '../utils/isHeic';

const GIF_WORKER_URL = new URL('gif.js/dist/gif.worker.js', import.meta.url).href;

const GifMaker = () => {
  const [frames, setFrames] = useState([]);
  const [delay, setDelay] = useState(200);
  const [gifUrl, setGifUrl] = useState(null);
  const [gifSize, setGifSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [loadingFrames, setLoadingFrames] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => { if (gifUrl) URL.revokeObjectURL(gifUrl); };
  }, [gifUrl]);

  const handleFiles = async (files) => {
    setLoadingFrames(true);
    setError(null);
    const loaded = [];
    try {
      for (const file of files) {
        let blob = file;
        if (isHeic(file)) {
          const converted = await heic2any({ blob: file, toType: 'image/png', quality: 1 });
          blob = Array.isArray(converted) ? converted[0] : converted;
        }

        const url = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
        loaded.push({ url, name: file.name, size: file.size });
      }
      setFrames(loaded);
      setGifUrl(null);
    } catch (err) {
      setError("Failed to load frames: " + err.message);
    } finally {
      setLoadingFrames(false);
    }
  };

  const removeFrame = (idx) => {
    setFrames(f => f.filter((_, i) => i !== idx));
    setGifUrl(null);
  };

  const handleDragStart = (e, idx) => {
    e.dataTransfer.setData('text/plain', idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    const dragIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIdx === dropIdx || isNaN(dragIdx)) return;
    
    setFrames(prev => {
      const newFrames = [...prev];
      const [dragged] = newFrames.splice(dragIdx, 1);
      newFrames.splice(dropIdx, 0, dragged);
      return newFrames;
    });
    setGifUrl(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const generateGif = async () => {
    if (frames.length < 2) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const images = await Promise.all(frames.map(f => new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = () => rej(new Error(`Failed to load frame: ${f.name}`));
        img.src = f.url;
      })));

      const width = Math.max(...images.map(i => i.naturalWidth));
      const height = Math.max(...images.map(i => i.naturalHeight));

      const workerCount = Math.min(navigator.hardwareConcurrency || 2, 4);
      const gif = new GIF({ workers: workerCount, quality: 10, width, height, workerScript: GIF_WORKER_URL });

      images.forEach(img => {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        const dx = (width - img.naturalWidth) / 2;
        const dy = (height - img.naturalHeight) / 2;
        ctx.drawImage(img, dx, dy);
        gif.addFrame(canvas, { delay, copy: true });
      });

      gif.on('progress', p => setProgress(Math.round(p * 100)));
      gif.on('finished', blob => {
        setGifUrl(URL.createObjectURL(blob));
        setGifSize(blob.size);
        setProcessing(false);
      });
      gif.render();
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const downloadGif = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl; a.download = 'pixconvert-animation.gif'; a.click();
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <DropZone onFiles={handleFiles} maxFiles={99999} label="Drop images to use as GIF frames" accept="image/*,.heic,.heif" />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ marginBottom: '0.5rem', color: 'var(--text2)', fontSize: '0.85rem' }}>— OR —</p>
          <FolderUpload onFiles={handleFiles} />
        </div>
      </div>
      
      {loadingFrames && <p style={{ textAlign: 'center', color: 'var(--teal)' }}>Loading and converting frames... please wait.</p>}
      
      {frames.length > 0 && (
        <>
          <div className="frame-list">
            {frames.map((f, i) => (
              <div 
                key={i} 
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                style={{ position: 'relative', display: 'inline-block', cursor: 'grab' }}
                title="Drag to reorder"
              >
                <img className="frame-thumb" src={f.url} alt={`Frame ${i + 1}`} style={{ pointerEvents: 'none' }} />
                <button onClick={() => removeFrame(i)} style={{
                  position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                  borderRadius: '50%', background: '#ef4444', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: '.7rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>✕</button>
              </div>
            ))}
          </div>
          <div className="controls-row">
            <label>Frame delay: {delay}ms</label>
            <input type="range" min="50" max="2000" step="50" value={delay}
              onChange={e => setDelay(+e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={generateGif}
              disabled={processing || frames.length < 2}>
              {processing ? `Generating… ${progress}%` : '🎞️ Generate GIF'}
            </button>
          </div>
          {processing && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: progress + '%' }} />
            </div>
          )}
          {error && <p style={{ color: '#f87171', marginTop: '.5rem' }}>Error: {error}</p>}
          <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>
            {frames.length} frame{frames.length !== 1 ? 's' : ''} • {delay}ms delay
            {frames.length < 2 && <span style={{ color: '#f87171' }}> — Need at least 2 frames</span>}
          </p>
        </>
      )}
      {gifUrl && (
        <div className="gif-preview-area fade-in visible">
          <img src={gifUrl} alt="Generated GIF" />
          <p style={{ marginTop: '.75rem', color: 'var(--text2)' }}>
            GIF size: <strong style={{ color: 'var(--teal)' }}>{formatSize(gifSize)}</strong>
          </p>
          <button className="btn btn-primary" style={{ marginTop: '.75rem' }} onClick={downloadGif}>
            ⬇ Download GIF
          </button>
        </div>
      )}
    </div>
  );
};

export default GifMaker;
