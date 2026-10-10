import { memo } from 'react';
import type { ImageNode } from '../../core/model';
import { fillChildStyle, nodeContainerStyle } from './styleToCss';
import type { NodeRendererProps } from './NodeRenderer';

export const ImageRenderer = memo(function ImageRenderer({
  node,
  theme,
  parentDirection,
}: NodeRendererProps & { node: ImageNode }) {
  const container = nodeContainerStyle(node, theme);
  const childFill = fillChildStyle(node, parentDirection ?? 'vertical');
  const hasSrc = Boolean(node.props.src);
  return (
    <div
      data-node-id={node.id}
      style={{
        ...container,
        ...childFill,
        overflow: 'hidden',
        background: hasSrc ? undefined : 'repeating-linear-gradient(45deg,#eee,#eee 6px,#f6f6f8 6px,#f6f6f8 12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9B9BA0',
        fontSize: 12,
      }}
    >
      {hasSrc ? (
        <img
          src={node.props.src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: node.props.fit === 'cover' ? 'cover' : 'contain',
            display: 'block',
          }}
        />
      ) : (
        'image'
      )}
    </div>
  );
});
