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
    const body = tableRows.slice(1).filter((r) => !r.every((c) => c.match(/^[:\-\s]+$/)));

    blocks.push(
      <div
        key={key}
        className="my-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
      >
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {header.map((col, idx) => (
                <th
                  key={idx}
                  className="p-3.5 font-bold text-slate-900 dark:text-white"
                >
                  {renderInlineFormatted(col.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {body.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="p-3.5 text-slate-800 dark:text-slate-200 leading-relaxed"
                  >
                    {renderInlineFormatted(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    tableRows = [];
    isTable = false;
  };

  const flushCode = (key: string) => {
    if (codeLines.length === 0) return;
    const rawCode = codeLines.join('\n');
    blocks.push(
      <div
        key={key}
        className="my-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-slate-900 overflow-hidden shadow-xs"
      >
        <div className="bg-indigo-50/80 dark:bg-slate-800 px-4 py-2.5 border-b border-indigo-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
            <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-indigo-700 dark:text-indigo-300">
              Architecture Flow &amp; Schematic Diagram
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            ASCII System Pipeline
          </span>
        </div>
        <pre className="p-4 md:p-6 overflow-x-auto text-[11px] md:text-xs font-mono text-emerald-800 dark:text-emerald-300 leading-relaxed select-text font-bold bg-white/90 dark:bg-slate-950">
          {rawCode}
        </pre>
      </div>,
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
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
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
      blocks.push(
        <hr key={`hr-${i}`} className="my-5 border-t border-slate-200 dark:border-slate-800" />,
      );
      continue;
    }

    // H1 Heading
    if (line.startsWith('# ')) {
      blocks.push(
        <div key={`h1-${i}`} className="pb-3 pt-2 border-b-2 border-indigo-500/20 mb-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{line.replace('# ', '')}</span>
          </h2>
        </div>,
      );
      continue;
    }

    // H2 Heading
    if (line.startsWith('## ')) {
      const headingText = line.replace('## ', '');
      blocks.push(
        <div key={`h2-${i}`} className="mt-6 mb-3 flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-indigo-600 dark:bg-indigo-400 rounded-full shrink-0" />
          <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
            {headingText}
          </h3>
        </div>,
      );
      continue;
    }

    // H3 Heading
    if (line.startsWith('### ')) {
      blocks.push(
        <h4
          key={`h3-${i}`}
          className="text-sm md:text-base font-bold text-slate-900 dark:text-white mt-5 mb-2.5 flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
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
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2 shrink-0" />
          <div className="text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-relaxed flex-1">
            {renderInlineFormatted(content)}
          </div>
        </div>,
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
            <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              {num}
            </span>
            <div className="text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-relaxed flex-1">
              {renderInlineFormatted(text)}
            </div>
          </div>,
        );
        continue;
      }
    }

    // Mathematical formula block ($$ ... $$)
    if (line.startsWith('$$') && line.endsWith('$$')) {
      const math = line.slice(2, -2).trim();
      blocks.push(
        <div
          key={`math-${i}`}
          className="my-3.5 p-4 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-2xl text-center font-mono text-xs md:text-sm font-bold text-cyan-300 dark:text-cyan-300 shadow-sm overflow-x-auto select-text"
        >
          {math}
        </div>,
      );
      continue;
    }

    // Callout / Key Takeaway box
    if (
      line.startsWith('**Question:**') ||
      line.startsWith('**Examination Format:**') ||
      line.startsWith('**Subject:**')
    ) {
      blocks.push(
        <div
          key={`meta-${i}`}
          className="text-xs text-slate-700 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 my-1 inline-block mr-2"
        >
          {renderInlineFormatted(line)}
        </div>,
      );
      continue;
    }

    // Standard Paragraph
    blocks.push(
      <p
        key={`p-${i}`}
        className="my-2.5 text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-relaxed"
      >
        {renderInlineFormatted(line)}
      </p>,
    );
  }

  if (inCodeBlock) flushCode('final-code');
  if (isTable) flushTable('final-table');

  return <div className="space-y-1 font-sans select-text">{blocks}</div>;
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
            <strong key={index} className="font-bold text-slate-900 dark:text-white">
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
              className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] md:text-xs font-semibold border border-slate-200 dark:border-slate-700"
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
              className="px-1.5 py-0.5 mx-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] md:text-xs font-bold border border-indigo-200 dark:border-indigo-800"
            >
              {mathText}
            </span>
          );
        }

        return (
          <span key={index} className="text-slate-800 dark:text-slate-100">
            {part}
          </span>
        );
      })}
    </>
  );
}
