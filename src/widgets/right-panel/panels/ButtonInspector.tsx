import { ColorInput, NumberInput, Row, Section, SegmentedControl, TextInput } from '../../../shared/ui';
import { useEditor } from '../../../app/store';
import { useScrub } from '../../../features/edit-style';
import type { ButtonNode, ScreenId } from '../../../core/model';

const WEIGHTS = [
  { value: '400' as const, label: '400' },
  { value: '500' as const, label: '500' },
  { value: '600' as const, label: '600' },
  { value: '700' as const, label: '700' },
];

type ActionKind = 'none' | 'close' | 'navigate';

export function ButtonInspector({ node }: { node: ButtonNode }) {
  const updateProps = useEditor((s) => s.updateProps);
  const updateStyle = useEditor((s) => s.updateStyle);
  const scrub = useScrub('button');
  const screens = useEditor((s) => s.history.doc.screens);
  const screenOrder = useEditor((s) => s.history.doc.screenOrder);
  const s = node.style;
  const action = node.props.action;
  const actionKind: ActionKind = action.type;

  const setActionKind = (kind: ActionKind): void => {
    if (kind === 'none') updateProps(node.id, 'button', { action: { type: 'none' } });
    else if (kind === 'close') updateProps(node.id, 'button', { action: { type: 'close' } });
    else {
      const first = screenOrder[0];
      if (first) updateProps(node.id, 'button', { action: { type: 'navigate', screenId: first } });
    }
  };

  const setNavigateTarget = (screenId: ScreenId): void => {
    updateProps(node.id, 'button', { action: { type: 'navigate', screenId } });
  };

  return (
    <>
      <Section title="Label">
        <TextInput
          value={node.props.label}
          onChange={(e) =>
            updateProps(node.id, 'button', { label: e.target.value }, `btn:${node.id}:label`)
          }
        />
      </Section>

      <Section title="Action">
        <SegmentedControl
          value={actionKind}
          options={[
            { value: 'none', label: 'None' },
            { value: 'navigate', label: 'Navigate' },
            { value: 'close', label: 'Close' },
          ]}
          onChange={setActionKind}
          full
        />
        {actionKind === 'navigate' && (
          <div style={{ marginTop: 8 }}>
            <Row label="Target">
              <select
                value={action.type === 'navigate' ? action.screenId : ''}
                onChange={(e) => setNavigateTarget(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: 12 }}
              >
                {screenOrder.map((id) => (
                  <option key={id} value={id}>
                    {screens[id]?.name ?? id}
                  </option>
                ))}
              </select>
            </Row>
          </div>
        )}
      </Section>

      <Section title="Fill & text">
        <ColorInput value={s.fill} onChange={(c) => updateStyle(node.id, { fill: c })} />
        <div style={{ height: 8 }} />
        <ColorInput value={s.textColor} onChange={(c) => updateStyle(node.id, { textColor: c })} />
        <div style={{ height: 8 }} />
        <Row label="Size">
          <NumberInput
            value={s.fontSize ?? 16}
            min={6}
            onBeginScrub={scrub.begin}
            onEndScrub={scrub.end}
            onChange={(v) => updateStyle(node.id, { fontSize: v })}
          />
        </Row>
        <Row label="Weight">
          <SegmentedControl
            value={String(s.fontWeight ?? 600) as '400' | '500' | '600' | '700'}
            options={WEIGHTS}
            onChange={(v) =>
              updateStyle(node.id, { fontWeight: Number(v) as 400 | 500 | 600 | 700 })
            }
          />
        </Row>
      </Section>

      <Section title="Shape">
        <Row label="Radius">
          <NumberInput
            value={s.cornerRadius ?? 0}
            min={0}
            onBeginScrub={scrub.begin}
            onEndScrub={scrub.end}
            onChange={(v) => updateStyle(node.id, { cornerRadius: v })}
          />
        </Row>
      </Section>
    </>
  );
}
