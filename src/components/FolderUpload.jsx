import { useRef, useState } from 'react';

const FolderUpload = ({ onFiles }) => {
  const inputRef = useRef();
  const [folderName, setFolderName] = useState(null);
  const [count, setCount] = useState(0);

  const handleChange = (e) => {
    const all = Array.from(e.target.files).filter(f => {
      const name = f.name.toLowerCase();
      return f.type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif');
    });
    if (!all.length) return;

    // Derive folder name from the first file's path
    const pathParts = all[0].webkitRelativePath?.split('/');
    setFolderName(pathParts?.[0] || 'Selected folder');
    setCount(all.length);
    onFiles(all);
    e.target.value = '';
  };

  return (
    <div className="folder-upload-row">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        aria-label="Select folder to upload images"
        style={{ minHeight: '44px' }}
        onClick={() => inputRef.current.click()}
      >
        📂 Select Folder
      </button>
      {folderName && (
        <span className="folder-upload-info">
          <strong>{folderName}/</strong> — {count} image{count !== 1 ? 's' : ''} loaded
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        webkitdirectory="true"
        accept="image/*,.heic,.heif"
        multiple
        onChange={handleChange}
      />
    </div>
  );
};

export default FolderUpload;
