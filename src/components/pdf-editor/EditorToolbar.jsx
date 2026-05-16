import { Type, Highlighter, Underline, Strikethrough, StickyNote, MousePointer, Save, Download, RotateCcw, PanelLeft } from 'lucide-react';

const TOOLS = [
  { id: 'select', label: 'Select', icon: MousePointer },
  { id: 'text', label: 'Add Text', icon: Type },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'underline', label: 'Underline', icon: Underline },
  { id: 'strikethrough', label: 'Strikethrough', icon: Strikethrough },
  { id: 'sticky', label: 'Sticky Note', icon: StickyNote },
];

const COLORS = [
  { id: 'yellow', value: '#fde047' },
  { id: 'green', value: '#4ade80' },
  { id: 'blue', value: '#60a5fa' },
  { id: 'pink', value: '#f472b6' },
  { id: 'red', value: '#f87171' },
  { id: 'orange', value: '#fb923c' },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];

export default function EditorToolbar({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  fontSize,
  onFontSizeChange,
  onSave,
  onUndo,
  onDownload,
  saving,
  canUndo,
  sidebarOpen,
  onToggleSidebar,
}) {
  const showColorPicker = ['highlight', 'underline', 'strikethrough', 'sticky', 'text'].includes(activeTool);
  const showFontSize = activeTool === 'text';

  return (
    <div
      className="pdf-editor-toolbar"
      style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Mobile-only sidebar toggle */}
      <div className="toolbar-group toolbar-sidebar-toggle">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close thumbnail panel' : 'Open thumbnail panel'}
          aria-expanded={sidebarOpen}
          title={sidebarOpen ? 'Close Pages' : 'Pages'}
        >
          <PanelLeft size={18} />
          <span className="toolbar-label">{sidebarOpen ? 'Close' : 'Pages'}</span>
        </button>
      </div>

      <div className="toolbar-group">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`toolbar-btn${activeTool === id ? ' active' : ''}`}
            onClick={() => onToolChange(id)}
            aria-label={label}
            aria-pressed={activeTool === id}
            title={label}
          >
            <Icon size={18} />
            <span className="toolbar-label">{label}</span>
          </button>
        ))}
      </div>

      {showColorPicker && (
        <div className="toolbar-group toolbar-colors" role="group" aria-label="Annotation color">
          {COLORS.map(({ id, value }) => (
            <button
              key={id}
              type="button"
              className={`color-swatch${activeColor === value ? ' active' : ''}`}
              style={{ background: value }}
              onClick={() => onColorChange(value)}
              aria-label={`Color: ${id}`}
              aria-pressed={activeColor === value}
              title={id}
            />
          ))}
        </div>
      )}

      {showFontSize && (
        <div className="toolbar-group">
          <label
            htmlFor="editor-font-size"
            style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
          >
            Font size
          </label>
          <select
            id="editor-font-size"
            className="toolbar-select"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            aria-label="Font size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
        </div>
      )}

      <div className="toolbar-group toolbar-actions">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last action"
          title="Undo"
        >
          <RotateCcw size={18} />
        </button>
        <button
          type="button"
          className="toolbar-btn save-btn"
          onClick={onSave}
          disabled={saving}
          aria-label={saving ? 'Saving PDF…' : 'Save PDF'}
          title="Save PDF"
        >
          <Save size={18} />
          <span className="toolbar-label">{saving ? 'Saving...' : 'Save'}</span>
        </button>
        <button
          type="button"
          className="toolbar-btn download-btn"
          onClick={onDownload}
          aria-label="Download PDF"
          title="Download PDF"
        >
          <Download size={18} />
          <span className="toolbar-label">Download</span>
        </button>
      </div>
    </div>
  );
}
