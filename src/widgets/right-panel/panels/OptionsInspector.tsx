import { Row, Section, SegmentedControl, TextInput } from '../../../shared/ui';
import { useEditor } from '../../../app/store';
import { newOptionId } from '../../../core/ids';
import type { OptionsNode } from '../../../core/model';

export function OptionsInspector({ node }: { node: OptionsNode }) {
  const updateProps = useEditor((s) => s.updateProps);
  const options = node.props.options;

  const setLabel = (idx: number, label: string): void => {
    const next = options.map((o, i) => (i === idx ? { ...o, label } : o));
    updateProps(node.id, 'options', { options: next }, `opt:${node.id}:${options[idx]?.id ?? idx}`);
  };

  const addOption = (): void => {
    updateProps(node.id, 'options', {
      options: [...options, { id: newOptionId(), label: `Option ${options.length + 1}` }],
    });
  };

  const removeOption = (idx: number): void => {
    updateProps(node.id, 'options', { options: options.filter((_, i) => i !== idx) });
  };

  const move = (from: number, dir: -1 | 1): void => {
    const to = from + dir;
    if (to < 0 || to >= options.length) return;
    const next = [...options];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    updateProps(node.id, 'options', { options: next });
  };

  return (
    <>
      <Section title="Mode">
        <Row label="Selection">
          <SegmentedControl
            value={node.props.selectionMode}
            options={[
              { value: 'single' as const, label: 'Single' },
              { value: 'multi' as const, label: 'Multi' },
            ]}
            onChange={(v) => updateProps(node.id, 'options', { selectionMode: v })}
            full
          />
        </Row>
      </Section>
      <Section title="Options">
        {options.map((opt, idx) => (
          <div key={opt.id} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <TextInput value={opt.label} onChange={(e) => setLabel(idx, e.target.value)} />
            <button onClick={() => move(idx, -1)} title="Move up" style={ctl}>
              ↑
            </button>
            <button onClick={() => move(idx, +1)} title="Move down" style={ctl}>
              ↓
            </button>
            <button onClick={() => removeOption(idx)} title="Remove" style={ctl}>
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={addOption}
          style={{
            marginTop: 6,
            padding: '4px 8px',
            fontSize: 12,
            border: '1px dashed var(--mfb-border-strong)',
            background: 'transparent',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          + Add option
        </button>
      </Section>
    </>
  );
}

const ctl: React.CSSProperties = {
  padding: '0 6px',
  background: 'transparent',
  border: '1px solid var(--mfb-border)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
};
