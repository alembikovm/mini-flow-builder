// Framework-agnostic document model for the Mini Flow Builder.
// No React, no store, no browser APIs. Everything in this file is data types
// plus a couple of pure type-guards; all mutation lives in `ops.ts`.

export type NodeId = string;
export type ScreenId = string;

// Dark mode lives in the model so exported configs round-trip losslessly to
// a native SDK that renders both themes from the same document.
export type Color = { light: string; dark: string };

export type Action =
  | { type: 'navigate'; screenId: ScreenId }
  | { type: 'close' }
  | { type: 'none' };

// Discriminated size value: `fixed` is the only variant that carries a number.
// Makes impossible states (fill with a value, fixed without a value) unrepresentable.
export type SizeValue =
  | { mode: 'fill' }
  | { mode: 'hug' }
  | { mode: 'fixed'; value: number };

export type Padding = { top: number; right: number; bottom: number; left: number };

export type NodeStyle = {
  direction?: 'vertical' | 'horizontal';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: number;
  padding?: Padding;

  width?: SizeValue;
  height?: SizeValue;
  fill?: Color;
  cornerRadius?: number;
  border?: { width: number; color: Color };

  fontSize?: number;
  fontWeight?: 400 | 500 | 600 | 700;
  textColor?: Color;
  textAlign?: 'left' | 'center' | 'right';
};

export type ImageFit = 'cover' | 'contain';
export type OptionsSelectionMode = 'single' | 'multi';
export type OptionItem = { id: string; label: string };

export type StackProps = Record<string, never>;
export type TextProps = { content: string };
export type ImageProps = { src: string; fit: ImageFit };
export type ButtonProps = { label: string; action: Action };
export type OptionsProps = { options: OptionItem[]; selectionMode: OptionsSelectionMode };
export type SpacerProps = Record<string, never>;

type NodeBase = {
  id: NodeId;
  name: string;
  parentId: NodeId | null;
  style: NodeStyle;
};

export type StackNode = NodeBase & { type: 'stack'; props: StackProps; children: NodeId[] };
export type TextNode = NodeBase & { type: 'text'; props: TextProps };
export type ImageNode = NodeBase & { type: 'image'; props: ImageProps };
export type ButtonNode = NodeBase & { type: 'button'; props: ButtonProps };
export type OptionsNode = NodeBase & { type: 'options'; props: OptionsProps };
export type SpacerNode = NodeBase & { type: 'spacer'; props: SpacerProps };

export type Node =
  | StackNode
  | TextNode
  | ImageNode
  | ButtonNode
  | OptionsNode
  | SpacerNode;

export type NodeType = Node['type'];
export type NodeOfType<T extends NodeType> = Extract<Node, { type: T }>;
export type PropsOfType<T extends NodeType> = NodeOfType<T>['props'];

export type Screen = {
  id: ScreenId;
  name: string;
  rootId: NodeId;
};

export type Doc = {
  schemaVersion: 1;
  screens: Record<ScreenId, Screen>;
  screenOrder: ScreenId[];
  nodes: Record<NodeId, Node>;
};

export const CURRENT_SCHEMA_VERSION = 1 as const;

export const isStack = (n: Node): n is StackNode => n.type === 'stack';

const EMPTY: readonly NodeId[] = Object.freeze([]);
export const childrenOf = (n: Node): readonly NodeId[] => (isStack(n) ? n.children : EMPTY);
