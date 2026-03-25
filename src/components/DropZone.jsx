import { useState, useRef } from 'react';

const DropZone = ({ onFiles, multiple = true, accept = 'image/*', maxFiles = 99999, label }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFiles = (fileList) => {
    const files = Array.from(fileList).filter(f => {
      const name = f.name.toLowerCase();
      return f.type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif');
    }).slice(0, maxFiles);
    if (files.length) onFiles(files);
  };

  return (
    <div
      className={`drop-zone${dragOver ? ' drag-over' : ''}`}
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
    >
      <span className="icon-upload">📁</span>
      <p>{label || 'Drag & drop images here or click to browse'}</p>
      <p style={{ fontSize: '.8rem', marginTop: '.25rem', color: 'var(--text2)' }}>
        {multiple ? (maxFiles === 99999 ? 'Multiple files allowed' : `Up to ${maxFiles} files`) : 'Single file'}
      </p>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple}
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
};

export default DropZone;
