import { useState, useEffect, useRef, useCallback } from 'react';
import heic2any from 'heic2any';
import JSZip from 'jszip';
import DropZone from './DropZone';
import FolderUpload from './FolderUpload';
import formatSize from '../utils/formatSize';
import isHeic from '../utils/isHeic';
import { readFile, loadImg } from '../utils/fileHelpers';

const formats = [
  { value: 'image/png',    label: 'PNG',  ext: 'png'  },
  { value: 'image/jpeg',   label: 'JPEG', ext: 'jpg'  },
  { value: 'image/webp',   label: 'WebP', ext: 'webp' },
  { value: 'image/bmp',    label: 'BMP',  ext: 'bmp'  },
  { value: 'image/avif',   label: 'AVIF', ext: 'avif' },
  { value: 'image/x-icon', label: 'ICO',  ext: 'ico'  },
  { value: 'image/tiff',   label: 'TIFF', ext: 'tiff' },
];

const noQualityFormats = ['image/png', 'image/bmp', 'image/x-icon', 'image/tiff'];

const drawToCanvas = (img, fmt, resizeW, resizeH) => {
  const w = resizeW || img.naturalWidth;
  const h = resizeH || img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (fmt === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
};

const FilePreviewRow = ({ file, config, onChangeConfig }) => {
  const [preview, setPreview] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const imgCache = useRef(null);
  const debounceRef = useRef(null);

  const { outputFormat, quality, resizeEnabled, resizeW, resizeH } = config;
  const showsQuality = !noQualityFormats.includes(outputFormat);

  const renderPreview = useCallback(async () => {
    setIsRendering(true);
    try {
      if (!imgCache.current) {
        let src;
        if (isHeic(file)) {
          const pngBlob = await heic2any({ blob: file, toType: 'image/png', quality: 1 });
          src = URL.createObjectURL(Array.isArray(pngBlob) ? pngBlob[0] : pngBlob);
        } else {
          src = await readFile(file);
        }
        imgCache.current = await loadImg(src);
      }
      const rw = resizeEnabled ? resizeW : null;
      const rh = resizeEnabled ? resizeH : null;
      const canvas = drawToCanvas(imgCache.current, outputFormat, rw, rh);
      const q = noQualityFormats.includes(outputFormat) ? undefined : quality / 100;
      let blob = await new Promise(res => canvas.toBlob(res, outputFormat, q));
      if (!blob) blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      
      setPreview(prev => {
        if (prev?.src?.startsWith('blob:')) URL.revokeObjectURL(prev.src);
        return { src: URL.createObjectURL(blob), size: blob.size, origSize: file.size };
      });
    } catch (err) {
      console.warn('Preview render failed:', err.message);
    } finally {
      setIsRendering(false);
    }
  }, [file, outputFormat, quality, resizeEnabled, resizeW, resizeH]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      renderPreview();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [renderPreview]);

  useEffect(() => {
    return () => { if (preview?.src?.startsWith('blob:')) URL.revokeObjectURL(preview.src); };
  }, [preview]);

  return (
    <div className="preview-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', marginBottom: '1rem', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h4 style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '30%', minWidth: '150px' }} title={file.name}>{file.name}</h4>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.85rem' }}>
          <select value={outputFormat} onChange={e => onChangeConfig({ outputFormat: e.target.value })} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
            {formats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          {showsQuality && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="range" min="1" max="100" value={quality}
                onChange={e => onChangeConfig({ quality: +e.target.value })}
                style={{ width: '80px', accentColor: 'var(--teal)' }} title="Quality" />
              <span style={{ minWidth: '32px' }}>{quality}%</span>
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <input type="checkbox" checked={resizeEnabled} onChange={e => onChangeConfig({ resizeEnabled: e.target.checked })} style={{ accentColor: 'var(--teal)' }} />
            Resize
          </label>
          {resizeEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="number" min="1" max="8000" value={resizeW} onChange={e => onChangeConfig({ resizeW: +e.target.value })} style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} title="Width" />
              <span>×</span>
              <input type="number" min="1" max="8000" value={resizeH} onChange={e => onChangeConfig({ resizeH: +e.target.value })} style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} title="Height" />
            </div>
          )}
        </div>
      </div>
      
      <div className="live-preview-images" style={{ marginTop: '0', background: 'transparent', padding: '0', border: 'none' }}>
        <div className="live-preview-img-wrap">
          <span className="live-preview-tag">Original</span>
          {imgCache.current && <img src={imgCache.current.src} alt="Original" style={{ maxHeight: '120px', borderRadius: '8px' }} />}
          <span className="live-preview-size">{formatSize(file.size)}</span>
        </div>
        <div className="live-preview-arrow">→</div>
        <div className="live-preview-img-wrap">
          <span className="live-preview-tag output">
            {formats.find(f => f.value === outputFormat)?.label}
          </span>
          {preview ? (
            <>
              <img src={preview.src} alt="Preview" style={{ maxHeight: '120px', borderRadius: '8px' }} />
              <span className="live-preview-size" style={{ color: preview.size < preview.origSize ? 'var(--teal)' : '#f87171' }}>
                {formatSize(preview.size)} ({preview.size < preview.origSize
                  ? `-${Math.round((1 - preview.size / preview.origSize) * 100)}%`
                  : `+${Math.round((preview.size / preview.origSize - 1) * 100)}%`})
              </span>
            </>
          ) : (
            <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', borderRadius: '8px', border: '1px dashed var(--border)', padding: '1rem' }}>
              {isRendering ? 'Rendering…' : 'Waiting…'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UniversalConverter = ({ defaultOutputFormat = null }) => {
  const [files, setFiles] = useState([]);
  
  // Global baseline controls
  const [outputFormat, setOutputFormat] = useState(defaultOutputFormat || 'image/jpeg');
  const [quality, setQuality] = useState(92);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [resizeW, setResizeW] = useState(512);
  const [resizeH, setResizeH] = useState(512);

  // Per-file configurations
  const [fileConfigs, setFileConfigs] = useState([]);

  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressValue, setProgressValue] = useState(0);

  // Sync outputFormat if defaultOutputFormat changes
  useEffect(() => {
    if (defaultOutputFormat) {
      setOutputFormat(defaultOutputFormat);
    }
  }, [defaultOutputFormat]);

  useEffect(() => {
    return () => {
      results.forEach(r => {
        if (r.url) URL.revokeObjectURL(r.url);
        if (r.previewUrl && r.previewUrl.startsWith('blob:')) URL.revokeObjectURL(r.previewUrl);
      });
    };
  }, [results]);

  const handleFiles = (newFiles) => {
    setFiles(newFiles);
    setResults([]);
    // Setup initial per-file configs using global settings
    setFileConfigs(newFiles.map(() => ({
      outputFormat, quality, resizeEnabled, resizeW, resizeH
    })));
  };

  const applyToAll = () => {
    setFileConfigs(files.map(() => ({
      outputFormat, quality, resizeEnabled, resizeW, resizeH
    })));
  };

  const convertAll = async () => {
    setProcessing(true);
    setProgressStage('Converting…');
    setProgressValue(0);
    const out = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cfg = fileConfigs[i] || { outputFormat, quality, resizeEnabled, resizeW, resizeH };
      const rw = cfg.resizeEnabled ? cfg.resizeW : null;
      const rh = cfg.resizeEnabled ? cfg.resizeH : null;

      try {
        let url;
        if (isHeic(file)) {
          const pngBlob = await heic2any({ blob: file, toType: 'image/png', quality: 1 });
          url = URL.createObjectURL(Array.isArray(pngBlob) ? pngBlob[0] : pngBlob);
        } else {
          url = await readFile(file);
        }
        const img = await loadImg(url);
        const canvas = drawToCanvas(img, cfg.outputFormat, rw, rh);
        const q = noQualityFormats.includes(cfg.outputFormat) ? undefined : cfg.quality / 100;
        let blob = await new Promise(res => canvas.toBlob(res, cfg.outputFormat, q));
        if (!blob) blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        
        const ext = (formats.find(f => f.value === cfg.outputFormat) || { ext: 'png' }).ext;
        const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
        out.push({ blob, name, originalSize: file.size, newSize: blob.size, url: URL.createObjectURL(blob), previewUrl: url });
      } catch (err) {
        out.push({ name: file.name, error: err.message });
      }
      setProgressValue(Math.round(((i + 1) / files.length) * 100));
    }

    setResults(out);
    setProcessing(false);
    setProgressStage('');
    setProgressValue(0);
  };

  const downloadFile = (url, name) => { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); };
  const downloadAll = async () => {
    const validResults = results.filter(r => r.url);
    if (!validResults.length) return;

    if (validResults.length === 1) {
      downloadFile(validResults[0].url, validResults[0].name);
      return;
    }

    setZipping(true);
    setProgressStage('Preparing ZIP…');
    setProgressValue(0);
    try {
      const zip = new JSZip();
      for (let i = 0; i < validResults.length; i++) {
        const r = validResults[i];
        const response = await fetch(r.url);
        const blob = await response.blob();
        zip.file(r.name, blob);
        setProgressValue(Math.round(((i + 1) / validResults.length) * 50));
      }
      setProgressStage('Archiving ZIP…');
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
        setProgressValue(50 + Math.round(meta.percent / 2));
      });
      const zipUrl = URL.createObjectURL(zipBlob);
      const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
      downloadFile(zipUrl, `converted_files_${ts}.zip`);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      alert('Failed to create ZIP archive.');
    } finally {
      setZipping(false);
      setProgressStage('');
      setProgressValue(0);
    }
  };

  const showsQuality = !noQualityFormats.includes(outputFormat);

  return (
    <div>
      <DropZone onFiles={handleFiles} maxFiles={99999} accept="image/*,.heic,.heif"
        label={`Drop images to convert ${defaultOutputFormat ? 'to ' + formats.find(f => f.value === defaultOutputFormat)?.label : ''} — supports PNG, JPG, WebP, HEIC, HEIF & more`} />
      <FolderUpload onFiles={handleFiles} />

      {files.length > 0 && (
        <>
          <div className="controls-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'var(--glass)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Global Settings:</div>
            
            {!defaultOutputFormat && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                Format:
                <select value={outputFormat} onChange={e => { setOutputFormat(e.target.value); setResults([]); }} style={{ padding: '0.25rem' }}>
                  {formats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </label>
            )}
            
            {showsQuality && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                Quality:
                <div className="quality-control" style={{ margin: 0 }}>
                  <input
                    type="range" min="1" max="100" value={quality}
                    onChange={e => setQuality(+e.target.value)}
                    style={{ background: `linear-gradient(to right, var(--teal) 0%, var(--teal) ${quality}%, var(--border) ${quality}%, var(--border) 100%)`, width: '100px', accentColor: 'var(--teal)' }}
                  />
                  <input
                    type="number" min="1" max="100" value={quality}
                    onChange={e => setQuality(Math.max(1, Math.min(100, +e.target.value)))}
                    style={{ width: '50px', marginLeft: '0.5rem', padding: '0.25rem' }}
                  />
                  <span style={{ fontSize: '.85rem', color: 'var(--text2)' }}>%</span>
                </div>
              </label>
            )}
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input type="checkbox" checked={resizeEnabled} onChange={e => setResizeEnabled(e.target.checked)} style={{ accentColor: 'var(--teal)' }} />
              Resize
            </label>
            
            {resizeEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input type="number" min="1" max="8000" placeholder="W" value={resizeW} onChange={e => setResizeW(Math.max(1, Math.min(8000, +e.target.value)))} style={{ width: '60px', padding: '0.25rem' }} title="Width (px)" />
                <span style={{ fontSize: '.9rem', color: 'var(--text2)', fontWeight: 600 }}>×</span>
                <input type="number" min="1" max="8000" placeholder="H" value={resizeH} onChange={e => setResizeH(Math.max(1, Math.min(8000, +e.target.value)))} style={{ width: '60px', padding: '0.25rem' }} title="Height (px)" />
                <span style={{ fontSize: '.8rem', color: 'var(--text2)' }}>px</span>
              </div>
            )}
            
            <div style={{ borderLeft: '1px solid var(--border)', height: '24px', margin: '0 0.5rem' }}></div>
            
            <button className="btn btn-outline btn-sm" onClick={applyToAll} style={{ padding: '0.5rem 1rem' }} title="Apply these settings to all listed images">
              🔄 Apply to All
            </button>
            <button className="btn btn-primary btn-sm" onClick={convertAll} disabled={processing} style={{ marginLeft: 'auto', padding: '0.5rem 1rem' }}>
              {processing ? 'Converting…' : `Convert ${files.length} file${files.length > 1 ? 's' : ''}`}
            </button>
          </div>

          {progressStage && (
            <div className="progress-container fade-in visible" style={{ margin: '1rem 0', padding: '1rem', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: 600 }}>
                <span>{progressStage}</span>
                <span>{progressValue}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressValue}%`, height: '100%', background: 'var(--teal)', transition: 'width 0.2s ease', borderRadius: '4px' }} />
              </div>
            </div>
          )}

          {/* Individual Image Previews */}
          {results.length === 0 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {files.map((file, i) => (
                <FilePreviewRow 
                  key={`${file.name}-${i}`}
                  file={file}
                  config={fileConfigs[i] || { outputFormat, quality, resizeEnabled, resizeW, resizeH }}
                  onChangeConfig={(newCfg) => {
                    const next = [...fileConfigs];
                    next[i] = { ...next[i], ...newCfg };
                    setFileConfigs(next);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '1rem 0 0' }}>
            <button className="btn btn-outline btn-sm" onClick={downloadAll} disabled={zipping}>
              {zipping ? '⏳ Zipping...' : '⬇ Download All as ZIP'}
            </button>
          </div>
          <div className="preview-grid">
            {results.map((r, i) => (
              <div className="preview-card" key={i}>
                {r.url ? (
                  <>
                    <img src={r.url} alt={r.name} />
                    <div className="preview-info">
                      <div className="name" title={r.name}>{r.name}</div>
                      <div className="sizes">
                        <span>{formatSize(r.originalSize)}</span>
                        <span>→</span>
                        <span className="new-size">{formatSize(r.newSize)}</span>
                      </div>
                    </div>
                    <div className="preview-actions">
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                        onClick={() => downloadFile(r.url, r.name)}>⬇ Download</button>
                    </div>
                  </>
                ) : (
                  <div className="preview-info">
                    <div className="name">{r.name}</div>
                    <p style={{ color: '#f87171' }}>Error: {r.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UniversalConverter;
