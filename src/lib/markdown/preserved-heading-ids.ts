interface MarkdownNode {
  type?: string;
  value?: string;
  children?: MarkdownNode[];
  data?: {
    hProperties?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

function visit(node: MarkdownNode): void {
  if (node.type === 'heading' && node.children) {
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      const child = node.children[index];
      if (child.type !== 'text' || typeof child.value !== 'string') continue;
      const match = /^(.*) \{#([^{}\s]+)\}$/.exec(child.value);
      if (match) {
        child.value = match[1];
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            id: match[2],
          },
        };
      }
      break;
    }
  }
  node.children?.forEach(visit);
}

export default function preservedHeadingIds() {
  return (tree: MarkdownNode): void => visit(tree);
}
