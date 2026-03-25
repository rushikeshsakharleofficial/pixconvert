/* Tools section — tab switcher between all tools */
const { useLocation: useLocationTools } = ReactRouterDOM;

const Tools = () => {
  const location = useLocationTools();
  const [tab, setTab] = React.useState(location.state?.tab || "converter");

  return (
    <section>
      <div className="container">
        <h2 className="section-title fade-in">Image Tools</h2>
        <p className="section-subtitle fade-in">All processing happens right here in your browser — nothing is uploaded</p>
        <div className="tabs fade-in">
          {[
            { id: "converter", label: "🔄 Universal Converter" },
            { id: "gif", label: "🎞️ GIF Maker" },
            { id: "sticker", label: "💬 WhatsApp Sticker" }
          ].map(t => (
            <button key={t.id} className={`tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="glass fade-in" style={{ marginTop: "1rem" }}>
          {tab === "converter" && <UniversalConverter />}
          {tab === "gif" && <GifMaker />}
          {tab === "sticker" && <StickerMaker />}
        </div>
      </div>
    </section>
  );
};
window.Tools = Tools;
