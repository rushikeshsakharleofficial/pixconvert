/* Universal Image Converter — any format to any format, including HEIC/HEIF */
const UniversalConverter = () => {
  const [files, setFiles] = React.useState([]);
  const [outputFormat, setOutputFormat] = React.useState("image/png");
  const [quality, setQuality] = React.useState(92);
  const [results, setResults] = React.useState([]);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    return () => {
      results.forEach(r => {
        if (r.url) URL.revokeObjectURL(r.url);
        if (r.previewUrl && r.previewUrl.startsWith("blob:")) URL.revokeObjectURL(r.previewUrl);
      });
    };
  }, [results]);

  const formats = [
    { value: "image/png", label: "PNG", ext: "png" },
    { value: "image/jpeg", label: "JPEG", ext: "jpg" },
    { value: "image/webp", label: "WebP", ext: "webp" },
    { value: "image/bmp", label: "BMP", ext: "bmp" },
    { value: "image/avif", label: "AVIF", ext: "avif" },
    { value: "image/x-icon", label: "ICO", ext: "ico" },
    { value: "image/tiff", label: "TIFF", ext: "tiff" },
  ];

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  };

  const getExt = () => (formats.find(f => f.value === outputFormat) || { ext: "png" }).ext;

  const isHeic = (file) => {
    const name = file.name.toLowerCase();
    return name.endsWith(".heic") || name.endsWith(".heif") ||
           file.type === "image/heic" || file.type === "image/heif";
  };

  const handleFiles = (newFiles) => {
    setFiles(newFiles);
    setResults([]);
  };

  const convertAll = async () => {
    setProcessing(true);
    const out = [];
    for (const file of files) {
      try {
        let url;
        /* Decode HEIC/HEIF via heic2any first */
        if (isHeic(file)) {
          const pngBlob = await heic2any({ blob: file, toType: "image/png", quality: 1 });
          const resultBlob = Array.isArray(pngBlob) ? pngBlob[0] : pngBlob;
          url = URL.createObjectURL(resultBlob);
        } else {
          url = await readFile(file);
        }
        const img = await loadImg(url);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        /* For JPEG, fill white background (no alpha) */
        if (outputFormat === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        let blob;
        const q = ["image/png", "image/bmp", "image/x-icon", "image/tiff"].includes(outputFormat) ? undefined : quality / 100;
        blob = await new Promise(res => canvas.toBlob(res, outputFormat, q));
        if (!blob) blob = await new Promise(res => canvas.toBlob(res, "image/png"));

        const blobUrl = URL.createObjectURL(blob);
        out.push({
          name: file.name.replace(/\.[^.]+$/, "") + "." + getExt(),
          originalSize: file.size,
          newSize: blob.size,
          url: blobUrl,
          previewUrl: url,
        });
      } catch (err) {
        out.push({ name: file.name, error: err.message });
      }
    }
    setResults(out);
    setProcessing(false);
  };

  const readFile = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const loadImg = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

  const downloadFile = (url, name) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  const downloadAll = () => results.filter(r => r.url).forEach(r => downloadFile(r.url, r.name));

  const showsQuality = outputFormat === "image/jpeg" || outputFormat === "image/webp" || outputFormat === "image/avif";

  return (
    <div>
      <DropZone onFiles={handleFiles} maxFiles={10} accept="image/*,.heic,.heif" label="Drop images to convert — supports PNG, JPG, WebP, HEIC, HEIF & more (up to 10)" />
      {files.length > 0 && (
        <>
          <div className="controls-row">
            <label>Convert to:</label>
            <select value={outputFormat} onChange={e => { setOutputFormat(e.target.value); setResults([]); }}>
              {formats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {showsQuality && (
              <>
                <label>Quality: {quality}%</label>
                <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(+e.target.value)} />
              </>
            )}
            <button className="btn btn-primary btn-sm" onClick={convertAll} disabled={processing}>
              {processing ? "Converting…" : `Convert ${files.length} file${files.length > 1 ? "s" : ""}`}
            </button>
          </div>
          <p style={{ color: "var(--text2)", fontSize: ".85rem" }}>
            {files.length} file{files.length > 1 ? "s" : ""} selected: {files.map(f => f.name).join(", ")}
          </p>
        </>
      )}
      {results.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", margin: "1rem 0 0" }}>
            <button className="btn btn-outline btn-sm" onClick={downloadAll}>⬇ Download All</button>
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
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => downloadFile(r.url, r.name)}>⬇ Download</button>
                    </div>
                  </>
                ) : (
                  <div className="preview-info"><div className="name">{r.name}</div><p style={{ color: "#f87171" }}>Error: {r.error}</p></div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
window.UniversalConverter = UniversalConverter;
