import { describe, expect, it } from 'vitest';
import preservedHeadingIds from '../../src/lib/markdown/preserved-heading-ids';

describe('preserved heading IDs', () => {
  it('moves the explicit suffix into heading properties and visible text', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Heading {#deployed-id}' }],
        },
      ],
    };
    preservedHeadingIds()(tree as never);
    const heading = tree.children[0] as (typeof tree.children)[0] & {
      data?: { hProperties?: { id?: string } };
    };
    expect(heading.children[0].value).toBe('Heading');
    expect(heading.data?.hProperties?.id).toBe('deployed-id');
  });

  it('recursively visits nested headings and leaves unmarked headings alone', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'blockquote',
          children: [
            {
              type: 'heading',
              depth: 3,
              children: [
                {
                  type: 'emphasis',
                  children: [{ type: 'text', value: 'Nested' }],
                },
                { type: 'text', value: ' heading {#nested-id}' },
              ],
            },
          ],
        },
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Ordinary heading' }],
        },
      ],
    };
    preservedHeadingIds()(tree as never);
    const nested = tree.children[0].children?.[0] as unknown as {
      children: Array<{ value?: string }>;
      data?: { hProperties?: { id?: string } };
    };
    expect(nested.children[1].value).toBe(' heading');
    expect(nested.data?.hProperties?.id).toBe('nested-id');
    expect(tree.children[1]).not.toHaveProperty('data');
  });
});
