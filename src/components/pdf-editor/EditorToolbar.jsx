import { Type, Highlighter, Underline, Strikethrough, StickyNote, MousePointer, Save, Download, RotateCcw } from 'lucide-react';

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
}) {
  const showColorPicker = ['highlight', 'underline', 'strikethrough', 'sticky', 'text'].includes(activeTool);
  const showFontSize = activeTool === 'text';

  return (
    <div className="pdf-editor-toolbar">
      <div className="toolbar-group">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`toolbar-btn${activeTool === id ? ' active' : ''}`}
            onClick={() => onToolChange(id)}
            title={label}
          >
            <Icon size={18} />
            <span className="toolbar-label">{label}</span>
          </button>
        ))}
      </div>

      {showColorPicker && (
        <div className="toolbar-group toolbar-colors">
          {COLORS.map(({ id, value }) => (
            <button
              key={id}
              className={`color-swatch${activeColor === value ? ' active' : ''}`}
              style={{ background: value }}
              onClick={() => onColorChange(value)}
              title={id}
            />
          ))}
        </div>
      )}

      {showFontSize && (
        <div className="toolbar-group">
          <select
            className="toolbar-select"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
        </div>
      )}

      <div className="toolbar-group toolbar-actions">
        <button className="toolbar-btn" onClick={onUndo} disabled={!canUndo} title="Undo">
          <RotateCcw size={18} />
        </button>
        <button className="toolbar-btn save-btn" onClick={onSave} disabled={saving} title="Save PDF">
          <Save size={18} />
          <span className="toolbar-label">{saving ? 'Saving...' : 'Save'}</span>
        </button>
        <button className="toolbar-btn download-btn" onClick={onDownload} title="Download PDF">
          <Download size={18} />
          <span className="toolbar-label">Download</span>
        </button>
      </div>
    </div>
  );
}
