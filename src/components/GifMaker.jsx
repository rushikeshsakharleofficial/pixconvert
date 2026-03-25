/* GIF Maker — upload 2–10 frames, set delay, generate GIF using gif.js */
const GifMaker = () => {
  const [frames, setFrames] = React.useState([]);
  const [delay, setDelay] = React.useState(200);
  const [gifUrl, setGifUrl] = React.useState(null);
  const [gifSize, setGifSize] = React.useState(0);
  const [processing, setProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    return () => {
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
  }, [gifUrl]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  };

  const handleFiles = async (files) => {
    const loaded = [];
    for (const file of files.slice(0, 10)) {
      const url = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      loaded.push({ url, name: file.name, size: file.size });
    }
    setFrames(loaded);
    setGifUrl(null);
  };

  const removeFrame = (idx) => {
    setFrames(f => f.filter((_, i) => i !== idx));
    setGifUrl(null);
  };

  const generateGif = async () => {
    if (frames.length < 2) return;
    setProcessing(true);
    setProgress(0);

    try {
    /* Load all images to determine max dimensions */
    const images = await Promise.all(frames.map(f => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`Failed to load frame: ${f.name}`));
      img.src = f.url;
    })));
    const width = Math.max(...images.map(i => i.naturalWidth));
    const height = Math.max(...images.map(i => i.naturalHeight));

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js"
    });

    images.forEach((img) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      /* Center the image */
      const dx = (width - img.naturalWidth) / 2;
      const dy = (height - img.naturalHeight) / 2;
      ctx.drawImage(img, dx, dy);
      gif.addFrame(canvas, { delay: delay, copy: true });
    });

    gif.on("progress", (p) => setProgress(Math.round(p * 100)));
    gif.on("finished", (blob) => {
      const url = URL.createObjectURL(blob);
      setGifUrl(url);
      setGifSize(blob.size);
      setProcessing(false);
    });
    gif.render();
    } catch (err) {
      console.error("GIF generation failed:", err);
      setProcessing(false);
    }
  };

  const downloadGif = () => {
    if (!gifUrl) return;
    const a = document.createElement("a");
    a.href = gifUrl;
    a.download = "pixconvert-animation.gif";
    a.click();
  };

  return (
    <div>
      <DropZone onFiles={handleFiles} maxFiles={10} label="Drop 2–10 images as GIF frames" />
      {frames.length > 0 && (
        <>
          <div className="frame-list">
            {frames.map((f, i) => (
              <div key={i} style={{ position: "relative", display: "inline-block" }}>
                <img className="frame-thumb" src={f.url} alt={`Frame ${i + 1}`} />
                <button onClick={() => removeFrame(i)} style={{
                  position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                  background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: ".7rem",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>✕</button>
              </div>
            ))}
          </div>
          <div className="controls-row">
            <label>Frame delay: {delay}ms</label>
            <input type="range" min="50" max="2000" step="50" value={delay} onChange={e => setDelay(+e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={generateGif}
              disabled={processing || frames.length < 2}>
              {processing ? `Generating… ${progress}%` : "🎞️ Generate GIF"}
            </button>
          </div>
          {processing && (
            <div className="progress-bar"><div className="progress-fill" style={{ width: progress + "%" }} /></div>
          )}
          <p style={{ color: "var(--text2)", fontSize: ".85rem" }}>
            {frames.length} frame{frames.length !== 1 ? "s" : ""} • {delay}ms delay
            {frames.length < 2 && <span style={{ color: "#f87171" }}> — Need at least 2 frames</span>}
          </p>
        </>
      )}
      {gifUrl && (
        <div className="gif-preview-area fade-in visible">
          <img src={gifUrl} alt="Generated GIF" />
          <p style={{ marginTop: ".75rem", color: "var(--text2)" }}>GIF size: <strong style={{ color: "var(--teal)" }}>{formatSize(gifSize)}</strong></p>
          <button className="btn btn-primary" style={{ marginTop: ".75rem" }} onClick={downloadGif}>⬇ Download GIF</button>
        </div>
      )}
    </div>
  );
};
window.GifMaker = GifMaker;
