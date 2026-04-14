/**
 * Majorka Academy lesson renderer.
 *
 * Parses a lightweight subset of markdown (headings, paragraphs, bullets,
 * blockquotes, bold, inline-code, links) into typed React nodes so we can
 * style each primitive with the Majorka dark-gold aesthetic instead of
 * shipping a full markdown dependency.
 *
 * Supported tokens:
 *   `## heading`   → h2
 *   `- bullet`     → unordered list item
 *   `> callout`    → takeaway callout block
 *   `**bold**`     → strong
 *   `` `code` ``   → inline code
 *   `[text](url)`  → anchor
 *   blank line     → paragraph break
 */
import { useMemo } from 'react';

interface LessonViewProps {
  body: string;
}

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'quote'; text: string };

export function LessonView({ body }: LessonViewProps) {
  const blocks = useMemo<Block[]>(() => parseBlocks(body), [body]);

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-[#D4D4D4]">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

function parseBlocks(body: string): Block[] {
  const lines = body.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    const text = paragraphBuffer.join(' ').trim();
    if (text.length > 0) {
      blocks.push({ kind: 'p', text });
    }
    paragraphBuffer = [];
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.trim() === '') {
      flushParagraph();
      i += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      blocks.push({ kind: 'h2', text: line.slice(3).trim() });
      i += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      const quoteLines: string[] = [line.slice(2).trim()];
      i += 1;
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2).trim());
        i += 1;
      }
      blocks.push({ kind: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      const items: string[] = [line.slice(2).trim()];
      i += 1;
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2).trim());
        i += 1;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    paragraphBuffer.push(line);
    i += 1;
  }

  flushParagraph();
  return blocks;
}

function renderBlock(block: Block, index: number) {
  switch (block.kind) {
    case 'h2':
      return (
        <h3
          key={index}
          className="mt-6 text-[18px] font-semibold tracking-tight text-[#E0E0E0] md:text-[20px]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {renderInline(block.text)}
        </h3>
      );
    case 'p':
      return (
        <p key={index} className="text-[15px] leading-relaxed text-[#C7C7C7]">
          {renderInline(block.text)}
        </p>
      );
    case 'ul':
      return (
        <ul key={index} className="space-y-1.5 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-[#C7C7C7]">
              <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[#d4af37]" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote
          key={index}
          className="my-2 rounded-xl border-l-2 border-[#d4af37] bg-[#d4af37]/[0.05] px-4 py-3 text-[14px] text-[#E0E0E0]"
        >
          {renderInline(block.text)}
        </blockquote>
      );
  }
}

type InlineNode = string | { kind: 'strong'; text: string } | { kind: 'code'; text: string } | { kind: 'link'; text: string; href: string };

function renderInline(text: string) {
  const nodes = parseInline(text);
  return (
    <>
      {nodes.map((node, i) => {
        if (typeof node === 'string') return <span key={i}>{node}</span>;
        if (node.kind === 'strong')
          return (
            <strong key={i} className="font-semibold text-[#E0E0E0]">
              {node.text}
            </strong>
          );
        if (node.kind === 'code')
          return (
            <code
              key={i}
              className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-[#e5c158]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {node.text}
            </code>
          );
        return (
          <a
            key={i}
            href={node.href}
            className="text-[#e5c158] underline decoration-[#d4af37]/40 underline-offset-2 hover:decoration-[#d4af37]"
          >
            {node.text}
          </a>
        );
      })}
    </>
  );
}

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let remaining = text;

  // Pattern order matters: links first (they contain brackets), then bold, then code.
  const patterns: Array<{ regex: RegExp; build: (m: RegExpExecArray) => InlineNode }> = [
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, build: (m) => ({ kind: 'link', text: m[1], href: m[2] }) },
    { regex: /\*\*([^*]+)\*\*/, build: (m) => ({ kind: 'strong', text: m[1] }) },
    { regex: /`([^`]+)`/, build: (m) => ({ kind: 'code', text: m[1] }) },
  ];

  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestLen = 0;
    let earliestNode: InlineNode | null = null;

    for (const pat of patterns) {
      const m = pat.regex.exec(remaining);
      if (m && m.index !== undefined) {
        if (earliestIdx === -1 || m.index < earliestIdx) {
          earliestIdx = m.index;
          earliestLen = m[0].length;
          earliestNode = pat.build(m);
        }
      }
    }

    if (earliestNode === null || earliestIdx === -1) {
      nodes.push(remaining);
      break;
    }

    if (earliestIdx > 0) {
      nodes.push(remaining.slice(0, earliestIdx));
    }
    nodes.push(earliestNode);
    remaining = remaining.slice(earliestIdx + earliestLen);
  }

  return nodes;
}
