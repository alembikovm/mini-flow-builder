import { ColorInput, PaddingBox, Section } from '../../../shared/ui';
import { useEditor } from '../../../app/store';
import { useScrub } from '../../../features/edit-style';
import { DEFAULT_PADDING } from './common';

export function ScreenSettings() {
  const updateStyle = useEditor((s) => s.updateStyle);
  const screen = useEditor((s) => s.history.doc.screens[s.currentScreenId]);
  const root = useEditor((s) =>
    s.history.doc.screens[s.currentScreenId]
      ? s.history.doc.nodes[s.history.doc.screens[s.currentScreenId]!.rootId]
      : null,
  );
  const scrub = useScrub('screen');
  if (!screen || !root) return <div style={{ color: '#9B9BA0' }}>No screen</div>;

  return (
    <>
      <Section title="Screen">
        <div style={{ color: 'var(--mfb-text-muted)', fontSize: 12 }}>{screen.name}</div>
      </Section>
      <Section title="Background">
        <ColorInput value={root.style.fill} onChange={(c) => updateStyle(root.id, { fill: c })} />
      </Section>
      <Section title="Padding">
        <PaddingBox
          value={root.style.padding ?? DEFAULT_PADDING}
          onChange={(p) => updateStyle(root.id, { padding: p })}
          onBeginScrub={scrub.begin}
          onEndScrub={scrub.end}
        />
      </Section>
    </>
  );
}
