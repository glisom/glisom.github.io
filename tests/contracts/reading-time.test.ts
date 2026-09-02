import { describe, expect, it } from 'vitest';
import { calculateReadingMinutes } from '../../src/lib/content/reading-time';

describe('calculateReadingMinutes', () => {
  it('counts prose while excluding metadata, code, URLs, and tag syntax', () => {
    const prose = Array.from(
      { length: 226 },
      (_, index) => `word${index}`,
    ).join(' ');
    const markdown = `---\ntitle: Hidden words\n---\n${prose}\n\n\`\`\`ts\n${'code '.repeat(500)}\n\`\`\`\n![alt](/images/example.png)`;
    expect(calculateReadingMinutes(markdown)).toBe(2);
  });

  it('never returns less than one minute', () => {
    expect(calculateReadingMinutes('A short note.')).toBe(1);
  });

  it('counts a Markdown link label but not its destination', () => {
    expect(
      calculateReadingMinutes(
        '[two words](/a/very/long/internal/path/that/is/not/prose)',
        2,
      ),
    ).toBe(1);
  });
});
