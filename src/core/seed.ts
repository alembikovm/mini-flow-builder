import type { Doc, Node, Screen, StackNode } from './model';
import { CURRENT_SCHEMA_VERSION } from './model';
import { newNodeId, newOptionId, newScreenId } from './ids';

export function createSeedDoc(): Doc {
  const doc: Doc = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    screens: {},
    screenOrder: [],
    nodes: {},
  };

  const welcomeScreen = newScreenId();
  const quizScreen = newScreenId();
  const paywallScreen = newScreenId();

  {
    const rootId = newNodeId();
    const titleId = newNodeId();
    const subtitleId = newNodeId();
    const imageId = newNodeId();
    const buttonId = newNodeId();

    const root: StackNode = {
      id: rootId,
      type: 'stack',
      name: 'Root',
      parentId: null,
      props: {},
      children: [imageId, titleId, subtitleId, buttonId],
      style: {
        direction: 'vertical',
        align: 'stretch',
        justify: 'start',
        gap: 16,
        padding: { top: 48, right: 20, bottom: 24, left: 20 },
        width: { mode: 'fill' },
        height: { mode: 'fill' },
        fill: { light: '#FFFFFF', dark: '#000000' },
      },
    };
    const image: Node = {
      id: imageId,
      type: 'image',
      name: 'Hero',
      parentId: rootId,
      props: { src: 'https://picsum.photos/seed/mfb/600/400', fit: 'cover' },
      style: {
        width: { mode: 'fill' },
        height: { mode: 'fixed', value: 220 },
        cornerRadius: 16,
      },
    };
    const title: Node = {
      id: titleId,
      type: 'text',
      name: 'Title',
      parentId: rootId,
      props: { content: 'Welcome to Mini Flow' },
      style: {
        fontSize: 28,
        fontWeight: 700,
        textColor: { light: '#111111', dark: '#FFFFFF' },
        textAlign: 'left',
        width: { mode: 'fill' },
      },
    };
    const subtitle: Node = {
      id: subtitleId,
      type: 'text',
      name: 'Subtitle',
      parentId: rootId,
      props: { content: 'A tiny editor that mirrors a real no-code flow builder.' },
      style: {
        fontSize: 16,
        fontWeight: 400,
        textColor: { light: '#6B6B70', dark: '#AAAAB0' },
        textAlign: 'left',
        width: { mode: 'fill' },
      },
    };
    const button: Node = {
      id: buttonId,
      type: 'button',
      name: 'Continue',
      parentId: rootId,
      props: { label: 'Continue', action: { type: 'navigate', screenId: quizScreen } },
      style: {
        fill: { light: '#007AFF', dark: '#0A84FF' },
        textColor: { light: '#FFFFFF', dark: '#FFFFFF' },
        fontSize: 16,
        fontWeight: 600,
        textAlign: 'center',
        cornerRadius: 12,
        padding: { top: 14, right: 20, bottom: 14, left: 20 },
        width: { mode: 'fill' },
        height: { mode: 'hug' },
      },
    };

    doc.nodes[rootId] = root;
    doc.nodes[imageId] = image;
    doc.nodes[titleId] = title;
    doc.nodes[subtitleId] = subtitle;
    doc.nodes[buttonId] = button;

    const screen: Screen = { id: welcomeScreen, name: 'Welcome', rootId };
    doc.screens[welcomeScreen] = screen;
  }

  {
    const rootId = newNodeId();
    const questionId = newNodeId();
    const optionsId = newNodeId();
    const nextId = newNodeId();

    const root: StackNode = {
      id: rootId,
      type: 'stack',
      name: 'Root',
      parentId: null,
      props: {},
      children: [questionId, optionsId, nextId],
      style: {
        direction: 'vertical',
        align: 'stretch',
        justify: 'start',
        gap: 20,
        padding: { top: 60, right: 20, bottom: 24, left: 20 },
        width: { mode: 'fill' },
        height: { mode: 'fill' },
        fill: { light: '#FFFFFF', dark: '#000000' },
      },
    };
    doc.nodes[rootId] = root;
    doc.nodes[questionId] = {
      id: questionId,
      type: 'text',
      name: 'Question',
      parentId: rootId,
      props: { content: 'What brings you here?' },
      style: {
        fontSize: 24,
        fontWeight: 700,
        textColor: { light: '#111111', dark: '#FFFFFF' },
        textAlign: 'left',
        width: { mode: 'fill' },
      },
    };
    doc.nodes[optionsId] = {
      id: optionsId,
      type: 'options',
      name: 'Options',
      parentId: rootId,
      props: {
        selectionMode: 'single',
        options: [
          { id: newOptionId(), label: 'Just curious' },
          { id: newOptionId(), label: 'Working on a project' },
          { id: newOptionId(), label: 'Interview prep' },
        ],
      },
      style: {
        gap: 8,
        width: { mode: 'fill' },
      },
    };
    doc.nodes[nextId] = {
      id: nextId,
      type: 'button',
      name: 'Next',
      parentId: rootId,
      props: { label: 'Next', action: { type: 'navigate', screenId: paywallScreen } },
      style: {
        fill: { light: '#007AFF', dark: '#0A84FF' },
        textColor: { light: '#FFFFFF', dark: '#FFFFFF' },
        fontSize: 16,
        fontWeight: 600,
        textAlign: 'center',
        cornerRadius: 12,
        padding: { top: 14, right: 20, bottom: 14, left: 20 },
        width: { mode: 'fill' },
        height: { mode: 'hug' },
      },
    };

    doc.screens[quizScreen] = { id: quizScreen, name: 'Quiz', rootId };
  }

  {
    const rootId = newNodeId();
    const titleId = newNodeId();
    const f1 = newNodeId();
    const f2 = newNodeId();
    const f3 = newNodeId();
    const closeBtn = newNodeId();

    const root: StackNode = {
      id: rootId,
      type: 'stack',
      name: 'Root',
      parentId: null,
      props: {},
      children: [titleId, f1, f2, f3, closeBtn],
      style: {
        direction: 'vertical',
        align: 'stretch',
        justify: 'start',
        gap: 12,
        padding: { top: 60, right: 20, bottom: 24, left: 20 },
        width: { mode: 'fill' },
        height: { mode: 'fill' },
        fill: { light: '#FFFFFF', dark: '#000000' },
      },
    };
    doc.nodes[rootId] = root;
    doc.nodes[titleId] = {
      id: titleId,
      type: 'text',
      name: 'Title',
      parentId: rootId,
      props: { content: 'You are all set.' },
      style: {
        fontSize: 24,
        fontWeight: 700,
        textColor: { light: '#111111', dark: '#FFFFFF' },
        textAlign: 'left',
      },
    };
    const feature = (id: string, text: string): Node => ({
      id,
      type: 'text',
      name: 'Feature',
      parentId: rootId,
      props: { content: text },
      style: {
        fontSize: 15,
        fontWeight: 500,
        textColor: { light: '#333336', dark: '#DADAE0' },
        textAlign: 'left',
      },
    });
    doc.nodes[f1] = feature(f1, '• A normalized document model');
    doc.nodes[f2] = feature(f2, '• Patch-based undo/redo with transactions');
    doc.nodes[f3] = feature(f3, '• An exported JSON config');
    doc.nodes[closeBtn] = {
      id: closeBtn,
      type: 'button',
      name: 'Close',
      parentId: rootId,
      props: { label: 'Close', action: { type: 'close' } },
      style: {
        fill: { light: '#111111', dark: '#F5F5F5' },
        textColor: { light: '#FFFFFF', dark: '#111111' },
        fontSize: 16,
        fontWeight: 600,
        textAlign: 'center',
        cornerRadius: 12,
        padding: { top: 14, right: 20, bottom: 14, left: 20 },
        width: { mode: 'fill' },
        height: { mode: 'hug' },
      },
    };

    doc.screens[paywallScreen] = { id: paywallScreen, name: 'Paywall', rootId };
  }

  doc.screenOrder = [welcomeScreen, quizScreen, paywallScreen];
  return doc;
}
