/* WhatsApp Sticker Generator — 512x512 WebP under 100KB with mobile share */
const StickerMaker = () => {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [stickerUrl, setStickerUrl] = React.useState(null);
  const [stickerSize, setStickerSize] = React.useState(0);
  const [origSize, setOrigSize] = React.useState(0);
  const [processing, setProcessing] = React.useState(false);
  const canvasRef = React.useRef();

  React.useEffect(() => {
    return () => {
      if (stickerUrl) URL.revokeObjectURL(stickerUrl);
    };
  }, [stickerUrl]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  };

  const handleFile = (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setOrigSize(f.size);
    setStickerUrl(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const generate = async () => {
    if (!preview) return;
    setProcessing(true);
    const img = await new Promise((res) => {
      const i = new Image(); i.onload = () => res(i); i.src = preview;
    });

    const canvas = canvasRef.current;
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);

    /* Cover-crop: fill 512x512 */
    const ratio = Math.max(512 / img.naturalWidth, 512 / img.naturalHeight);
    const sw = 512 / ratio, sh = 512 / ratio;
    const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512);

    /* Compress to WebP under 100KB */
    let quality = 0.9;
    let blob;
    for (let attempt = 0; attempt < 15; attempt++) {
      blob = await new Promise(res => canvas.toBlob(res, "image/webp", quality));
      if (blob && blob.size <= 102400) break;
      quality -= 0.05;
      if (quality < 0.05) quality = 0.05;
    }
    if (!blob) {
      blob = await new Promise(res => canvas.toBlob(res, "image/webp", 0.05));
    }

    const url = URL.createObjectURL(blob);
    setStickerUrl(url);
    setStickerSize(blob.size);
    setProcessing(false);
  };

  const download = () => {
    if (!stickerUrl) return;
    const a = document.createElement("a");
    a.href = stickerUrl;
    a.download = "sticker-512x512.webp";
    a.click();
  };

  const shareToWhatsApp = async () => {
    if (!stickerUrl) return;
    try {
      const res = await fetch(stickerUrl);
      const blob = await res.blob();
      const file = new File([blob], "sticker.webp", { type: "image/webp" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "WhatsApp Sticker", text: "Made with PixConvert" });
      } else {
        /* Fallback for non-share-capable browsers */
        download();
      }
    } catch (e) {
      download();
    }
  };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div>
      <DropZone onFiles={handleFile} multiple={false} maxFiles={1} label="Drop an image to make a WhatsApp sticker" />
      {preview && (
        <div className="sticker-area">
          <div className="sticker-canvas-wrap">
            <canvas ref={canvasRef} style={{ imageRendering: "auto" }} />
          </div>
          <div className="sticker-info">
            <p style={{ color: "var(--text2)", marginBottom: ".75rem" }}>
              Image will be center-cropped and resized to <strong style={{ color: "var(--white)" }}>512×512</strong> and compressed to <strong style={{ color: "var(--teal)" }}>WebP under 100KB</strong>.
            </p>
            <button className="btn btn-primary btn-sm" onClick={generate} disabled={processing} style={{ marginRight: ".5rem" }}>
              {processing ? "Generating…" : "✨ Generate Sticker"}
            </button>
            {stickerUrl && (
              <>
                <div style={{ marginTop: "1rem", color: "var(--text2)", fontSize: ".9rem" }}>
                  <p>Original: <strong>{formatSize(origSize)}</strong></p>
                  <p>Sticker: <strong style={{ color: stickerSize <= 102400 ? "var(--teal)" : "#f87171" }}>{formatSize(stickerSize)}</strong>
                    {stickerSize <= 102400 ? " ✅" : " ⚠️ Over 100KB"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                  <button className="btn btn-primary btn-sm" onClick={download}>⬇ Download</button>
                  {isMobile && (
                    <button className="btn btn-outline btn-sm" onClick={shareToWhatsApp}>💬 Share to WhatsApp</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
window.StickerMaker = StickerMaker;
