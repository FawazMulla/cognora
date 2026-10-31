import React from 'react';
import { Award, BookOpen, Code2 } from 'lucide-react';

interface FormattedAnswerProps {
  content: string;
}

export function FormattedAnswer({ content }: FormattedAnswerProps) {
  if (!content) return null;

  // Process markdown into structured blocks
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let tableRows: string[][] = [];
  let isTable = false;

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return;
    const header = tableRows[0];
    const body = tableRows.slice(1).filter(r => !r.every(c => c.match(/^[:\-\s]+$/)));

    blocks.push(
      <div key={key} className="my-4 overflow-x-auto rounded-xl border border-[#d9d9dd] bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-[#f4f4f4] border-b border-[#d9d9dd]">
              {header.map((col, idx) => (
                <th key={idx} className="p-3 font-bold text-[#212121]">
                  {renderInlineFormatted(col.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e8]">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#fafafb] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3 text-[#212121]">
                    {renderInlineFormatted(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    isTable = false;
  };

  const flushCode = (key: string) => {
    if (codeLines.length === 0) return;
    const rawCode = codeLines.join('\n');
    blocks.push(
      <div key={key} className="my-5 rounded-2xl border border-[#d0dcf5] bg-[#f8faff] overflow-hidden shadow-xs">
        <div className="bg-[#eef4ff] px-4 py-2.5 border-b border-[#d0dcf5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#1863dc] animate-pulse" />
            <Code2 className="w-4 h-4 text-[#1863dc]" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#1863dc]">
              Architecture Flow &amp; Schematic Diagram
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium text-[#666666] bg-white px-2 py-0.5 rounded border border-[#d0dcf5]">
            ASCII System Pipeline
          </span>
        </div>
        <pre className="p-4 md:p-6 overflow-x-auto text-[11px] md:text-xs font-mono text-[#003c33] leading-relaxed select-text font-bold bg-white/70">
          {rawCode}
        </pre>
      </div>
    );
    codeLines = [];
    inCodeBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Handle code blocks (fences)
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCode(`code-${i}`);
      } else {
        if (isTable) flushTable(`table-before-code-${i}`);
        inCodeBlock = true;
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    // Handle Markdown Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      isTable = true;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (isTable) {
      flushTable(`table-${i}`);
    }

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Dividers
    if (line === '---' || line === '***') {
      blocks.push(<hr key={`hr-${i}`} className="my-5 border-t border-[#d9d9dd]" />);
      continue;
    }

    // H1 Heading
    if (line.startsWith('# ')) {
      blocks.push(
        <div key={`h1-${i}`} className="pb-3 pt-2 border-b-2 border-[#1863dc]/20 mb-4">
          <h2 className="text-xl md:text-2xl font-black text-[#17171c] tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-[#1863dc]" />
            <span>{line.replace('# ', '')}</span>
          </h2>
        </div>
      );
      continue;
    }

    // H2 Heading
    if (line.startsWith('## ')) {
      const headingText = line.replace('## ', '');
      blocks.push(
        <div key={`h2-${i}`} className="mt-6 mb-3 flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-[#1863dc] rounded-full" />
          <h3 className="text-base md:text-lg font-bold text-[#17171c]">
            {headingText}
          </h3>
        </div>
      );
      continue;
    }

    // H3 Heading
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={`h3-${i}`} className="text-sm font-bold text-[#212121] mt-4 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-[#1863dc]" />
          <span>{renderInlineFormatted(line.replace('### ', ''))}</span>
        </h4>
      );
      continue;
    }

    // Bullet points (-, *, •)
    if (line.match(/^[-*•]\s+/)) {
      const content = line.replace(/^[-*•]\s+/, '');
      blocks.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1.5 pl-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1863dc] mt-2 shrink-0" />
          <div className="text-xs md:text-sm text-[#212121] leading-relaxed flex-1">
            {renderInlineFormatted(content)}
          </div>
        </div>
      );
      continue;
    }

    // Numbered List (1., 2., etc.)
    if (line.match(/^\d+\.\s+/)) {
      const match = line.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        const num = match[1];
        const text = match[2];
        blocks.push(
          <div key={`num-${i}`} className="flex items-start gap-3 my-2 pl-1">
            <span className="w-5 h-5 rounded-full bg-[#fafafb] border border-[#d9d9dd] text-[11px] font-mono font-bold text-[#1863dc] flex items-center justify-center shrink-0 mt-0.5">
              {num}
            </span>
            <div className="text-xs md:text-sm text-[#212121] leading-relaxed flex-1">
              {renderInlineFormatted(text)}
            </div>
          </div>
        );
        continue;
      }
    }

    // Mathematical formula block ($$ ... $$)
    if (line.startsWith('$$') && line.endsWith('$$')) {
      const math = line.slice(2, -2).trim();
      blocks.push(
        <div key={`math-${i}`} className="my-3 p-3.5 bg-[#fafafb] border border-[#d9d9dd] rounded-xl text-center font-mono text-sm md:text-base font-bold text-[#17171c] shadow-xs">
          {math}
        </div>
      );
      continue;
    }

    // Callout / Key Takeaway box
    if (line.startsWith('**Question:**') || line.startsWith('**Examination Format:**') || line.startsWith('**Subject:**')) {
      blocks.push(
        <div key={`meta-${i}`} className="text-xs text-[#666666] font-mono bg-[#f8f8fa] px-3.5 py-1.5 rounded-lg border border-[#e5e5e8] my-1 inline-block mr-2">
          {renderInlineFormatted(line)}
        </div>
      );
      continue;
    }

    // Standard Paragraph
    blocks.push(
      <p key={`p-${i}`} className="my-2.5 text-xs md:text-sm text-[#212121] leading-relaxed">
        {renderInlineFormatted(line)}
      </p>
    );
  }

  if (inCodeBlock) flushCode('final-code');
  if (isTable) flushTable('final-table');

  return <div className="space-y-1 font-sans">{blocks}</div>;
}

/**
 * Parses inline formatting like **bold**, *italic*, `code`, math ($...$), and arrows (->, =>, <->)
 */
function renderInlineFormatted(text: string): React.ReactNode {
  if (!text) return null;

  // Replace arrow symbols nicely
  let formatted = text
    .replace(/<--->/g, ' ⟷ ')
    .replace(/--->/g, ' ⟶ ')
    .replace(/-->/g, ' ⟶ ')
    .replace(/->/g, ' → ')
    .replace(/=>/g, ' ⇒ ')
    .replace(/<-/g, ' ← ');

  // Split by bold (**...**), inline code (`...`), inline math ($...$)
  const parts = formatted.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        // Bold text: **text**
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={index} className="font-bold text-[#111114]">
              {boldText}
            </strong>
          );
        }

        // Inline code: `code`
        if (part.startsWith('`') && part.endsWith('`')) {
          const codeText = part.slice(1, -1);
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#eeece7] text-[#17171c] font-mono text-[11px] md:text-xs font-semibold border border-[#d9d9dd]"
            >
              {codeText}
            </code>
          );
        }

        // Inline math: $formula$
        if (part.startsWith('$') && part.endsWith('$')) {
          const mathText = part.slice(1, -1);
          return (
            <span
              key={index}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-[#f1f5ff] text-[#1863dc] font-mono text-[11px] md:text-xs font-bold border border-[#d0dcf5]"
            >
              {mathText}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
