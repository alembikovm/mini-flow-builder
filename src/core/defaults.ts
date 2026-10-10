import type {
  ButtonNode,
  ImageNode,
  Node,
  NodeStyle,
  NodeType,
  OptionsNode,
  SpacerNode,
  StackNode,
  TextNode,
} from './model';
import { newNodeId, newOptionId } from './ids';

export const DEFAULT_PADDING = { top: 0, right: 0, bottom: 0, left: 0 } as const;

const BLACK = { light: '#111111', dark: '#F5F5F5' } as const;
const WHITE = { light: '#FFFFFF', dark: '#1C1C1E' } as const;
const BLUE = { light: '#007AFF', dark: '#0A84FF' } as const;

const stackDefaults: NodeStyle = {
  direction: 'vertical',
  align: 'stretch',
  justify: 'start',
  gap: 8,
  padding: { ...DEFAULT_PADDING },
  width: { mode: 'fill' },
  height: { mode: 'hug' },
};

export type CreateNodeOptions = {
  name?: string;
  style?: Partial<NodeStyle>;
};

export function createNode(type: NodeType, options: CreateNodeOptions = {}): Node {
  const id = newNodeId();

  switch (type) {
    case 'stack': {
      const n: StackNode = {
        id,
        type: 'stack',
        name: options.name ?? 'Stack',
        parentId: null,
        props: {},
        children: [],
        style: { ...stackDefaults, ...(options.style ?? {}) },
      };
      return n;
    }
    case 'text': {
      const n: TextNode = {
        id,
        type: 'text',
        name: options.name ?? 'Text',
        parentId: null,
        props: { content: 'Text' },
        style: {
          fontSize: 16,
          fontWeight: 400,
          textColor: { ...BLACK },
          textAlign: 'left',
          width: { mode: 'fill' },
          height: { mode: 'hug' },
          ...(options.style ?? {}),
        },
      };
      return n;
    }
    case 'image': {
      const n: ImageNode = {
        id,
        type: 'image',
        name: options.name ?? 'Image',
        parentId: null,
        props: { src: '', fit: 'cover' },
        style: {
          width: { mode: 'fill' },
          height: { mode: 'fixed', value: 180 },
          cornerRadius: 8,
          ...(options.style ?? {}),
        },
      };
      return n;
    }
    case 'button': {
      const n: ButtonNode = {
        id,
        type: 'button',
        name: options.name ?? 'Button',
        parentId: null,
        props: { label: 'Button', action: { type: 'none' } },
        style: {
          fill: { ...BLUE },
          textColor: { ...WHITE },
          fontSize: 16,
          fontWeight: 600,
          textAlign: 'center',
          cornerRadius: 12,
          padding: { top: 14, right: 20, bottom: 14, left: 20 },
          width: { mode: 'fill' },
          height: { mode: 'hug' },
          ...(options.style ?? {}),
        },
      };
      return n;
    }
    case 'options': {
      const n: OptionsNode = {
        id,
        type: 'options',
        name: options.name ?? 'Options',
        parentId: null,
        props: {
          selectionMode: 'single',
          options: [
            { id: newOptionId(), label: 'Option A' },
            { id: newOptionId(), label: 'Option B' },
            { id: newOptionId(), label: 'Option C' },
          ],
        },
        style: {
          gap: 8,
          width: { mode: 'fill' },
          height: { mode: 'hug' },
          ...(options.style ?? {}),
        },
      };
      return n;
    }
    case 'spacer': {
      const n: SpacerNode = {
        id,
        type: 'spacer',
        name: options.name ?? 'Spacer',
        parentId: null,
        props: {},
        style: {
          width: { mode: 'fill' },
          height: { mode: 'fixed', value: 16 },
          ...(options.style ?? {}),
        },
      };
      return n;
    }
  }
}
