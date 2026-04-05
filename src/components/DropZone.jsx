import { useState, useRef } from 'react';

const DropZone = ({ onFiles, multiple = true, accept = 'image/*', maxFiles = 99999, label }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFiles = (fileList) => {
    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const files = Array.from(fileList).filter((f) => {
      const type = f.type;
      const name = f.name.toLowerCase();

      if (accept === 'image/*' && (type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif'))) return true;

      return acceptedTypes.some((at) => {
        if (at.startsWith('.')) return name.endsWith(at.toLowerCase());
        if (at.includes('*')) {
          const [prefix] = at.split('*');
          return type.startsWith(prefix);
        }
        return type === at;
      });
    }).slice(0, maxFiles);

    if (files.length) onFiles(files);
  };

  return (
    <div
      className={`drop-zone${dragOver ? ' drag-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="drop-zone-orb drop-zone-orb-top" aria-hidden="true" />
      <div className="drop-zone-orb drop-zone-orb-bottom" aria-hidden="true" />
      <div className="drop-zone-frame" aria-hidden="true" />

      <div className="drop-zone-inner">
        <div className="drop-zone-icon-stack">
          <div className="drop-zone-icon-main">
            <span className="icon-upload" aria-hidden="true">↑</span>
          </div>
          <div className="drop-zone-icon-badge" aria-hidden="true">+</div>
        </div>

        <div className="drop-zone-copy">
          <h3>{label || 'Drop your file here'}</h3>
          <p className="drop-zone-subtitle">or click to browse from your computer</p>
        </div>

        <div className="drop-zone-meta">
          {multiple ? (maxFiles === 99999 ? 'Multiple files allowed' : `Up to ${maxFiles} files`) : 'Single file'}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default DropZone;
