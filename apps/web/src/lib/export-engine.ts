import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

export interface ExportContentItem {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullet' | 'code' | 'callout' | 'table';
  text?: string;
  code?: string;
  language?: string;
  calloutType?: 'info' | 'tip' | 'warning';
  tableData?: string[][]; // rows x cols
}

export interface ExportOptions {
  title: string;
  subject?: string;
  module?: string;
  topic?: string;
  author?: string;
  date?: string;
  institution?: string;
  sections?: {
    heading?: string;
    items: (string | ExportContentItem)[];
  }[];
  rawMarkdown?: string;
}

/**
 * Parses markdown into structured export content items
 */
export function parseMarkdownToExportItems(md: string): ExportContentItem[] {
  const lines = md.split('\n');
  const items: ExportContentItem[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        items.push({
          type: 'code',
          code: codeBuffer.join('\n'),
          language: codeLang || 'plaintext',
        });
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const isDivider = line.replace(/[\s|:-]/g, '').length === 0;
      if (!isDivider) {
        const cols = line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        tableRows.push(cols);
        inTable = true;
      }
      continue;
    } else if (inTable) {
      if (tableRows.length > 0) {
        items.push({
          type: 'table',
          tableData: tableRows,
        });
        tableRows = [];
      }
      inTable = false;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    // Headings
    if (trimmed.startsWith('# ')) {
      items.push({ type: 'heading1', text: trimmed.slice(2).trim() });
    } else if (trimmed.startsWith('## ')) {
      items.push({ type: 'heading2', text: trimmed.slice(3).trim() });
    } else if (trimmed.startsWith('### ')) {
      items.push({ type: 'heading3', text: trimmed.slice(4).trim() });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      items.push({ type: 'bullet', text: trimmed.slice(2).trim() });
    } else if (/^\d+\.\s/.test(trimmed)) {
      items.push({ type: 'bullet', text: trimmed.replace(/^\d+\.\s/, '').trim() });
    } else if (trimmed.startsWith('> ')) {
      items.push({ type: 'callout', text: trimmed.slice(2).trim(), calloutType: 'info' });
    } else {
      items.push({ type: 'paragraph', text: trimmed });
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    items.push({
      type: 'code',
      code: codeBuffer.join('\n'),
      language: codeLang,
    });
  }

  if (tableRows.length > 0) {
    items.push({
      type: 'table',
      tableData: tableRows,
    });
  }

  return items;
}

/**
 * Downloads a Blob as a file
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export document to Microsoft Word (.docx)
 */
export async function exportToDocx(options: ExportOptions): Promise<void> {
  const items: ExportContentItem[] = [];

  if (options.rawMarkdown) {
    items.push(...parseMarkdownToExportItems(options.rawMarkdown));
  }

  if (options.sections) {
    for (const sec of options.sections) {
      if (sec.heading) {
        items.push({ type: 'heading2', text: sec.heading });
      }
      for (const it of sec.items) {
        if (typeof it === 'string') {
          items.push(...parseMarkdownToExportItems(it));
        } else {
          items.push(it);
        }
      }
    }
  }

  const paragraphs: (Paragraph | Table)[] = [];

  // Title & Header
  paragraphs.push(
    new Paragraph({
      text: options.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
    })
  );

  // Metadata banner
  const metaParts: string[] = [];
  if (options.subject) metaParts.push(`Subject: ${options.subject}`);
  if (options.module) metaParts.push(`Module: ${options.module}`);
  if (options.topic) metaParts.push(`Topic: ${options.topic}`);
  metaParts.push(`Date: ${options.date || new Date().toLocaleDateString()}`);

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: metaParts.join('  •  '),
          italics: true,
          color: '666666',
          size: 20, // 10pt
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Divider
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '_________________________________________________________________________________',
          color: 'CCCCCC',
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Process items
  for (const item of items) {
    switch (item.type) {
      case 'heading1':
        paragraphs.push(
          new Paragraph({
            text: item.text,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
        break;

      case 'heading2':
        paragraphs.push(
          new Paragraph({
            text: item.text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        break;

      case 'heading3':
        paragraphs.push(
          new Paragraph({
            text: item.text,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
        break;

      case 'bullet':
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun(item.text || '')],
            spacing: { after: 80 },
          })
        );
        break;

      case 'callout':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Note: ${item.text || ''}`,
                italics: true,
                color: '1E3A8A', // Indigo/Blue
              }),
            ],
            spacing: { before: 120, after: 120 },
            border: {
              left: { color: '3B82F6', size: 16, space: 10, style: BorderStyle.SINGLE },
            },
          })
        );
        break;

      case 'code':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: item.code || '',
                font: 'Consolas',
                size: 18, // 9pt
                color: '1F2937',
              }),
            ],
            spacing: { before: 120, after: 120 },
            border: {
              top: { color: 'E5E7EB', size: 4, style: BorderStyle.SINGLE },
              bottom: { color: 'E5E7EB', size: 4, style: BorderStyle.SINGLE },
              left: { color: 'E5E7EB', size: 4, style: BorderStyle.SINGLE },
              right: { color: 'E5E7EB', size: 4, style: BorderStyle.SINGLE },
            },
          })
        );
        break;

      case 'table':
        if (item.tableData && item.tableData.length > 0) {
          const docxRows = item.tableData.map((row, rIdx) => {
            return new TableRow({
              children: row.map((cellText) => {
                return new TableCell({
                  width: { size: 100 / (row.length || 1), type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cellText,
                          bold: rIdx === 0,
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                });
              }),
            });
          });

          paragraphs.push(
            new Table({
              rows: docxRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
        break;

      case 'paragraph':
      default:
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(item.text || '')],
            spacing: { after: 120, line: 276 }, // 1.15 line spacing
          })
        );
        break;
    }
  }

  // Footer note
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Generated by Cognora Academic Intelligence Platform • https://cognora.edu',
          size: 16,
          color: '999999',
          italics: true,
        }),
      ],
      spacing: { before: 400 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTitle = (options.title || 'cognora-export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 50);
  downloadBlob(blob, `${cleanTitle}.docx`);
}

/**
 * Export document to high-fidelity printable view / PDF
 */
export function exportToPdf(options: ExportOptions): void {
  const items: ExportContentItem[] = [];

  if (options.rawMarkdown) {
    items.push(...parseMarkdownToExportItems(options.rawMarkdown));
  }

  if (options.sections) {
    for (const sec of options.sections) {
      if (sec.heading) {
        items.push({ type: 'heading2', text: sec.heading });
      }
      for (const it of sec.items) {
        if (typeof it === 'string') {
          items.push(...parseMarkdownToExportItems(it));
        } else {
          items.push(it);
        }
      }
    }
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and print your academic document.');
    return;
  }

  let bodyHtml = '';
  for (const item of items) {
    switch (item.type) {
      case 'heading1':
        bodyHtml += `<h1 class="text-2xl font-bold mt-6 mb-3 text-slate-900 border-b pb-2">${escapeHtml(item.text || '')}</h1>`;
        break;
      case 'heading2':
        bodyHtml += `<h2 class="text-xl font-semibold mt-5 mb-2 text-slate-800">${escapeHtml(item.text || '')}</h2>`;
        break;
      case 'heading3':
        bodyHtml += `<h3 class="text-lg font-medium mt-4 mb-2 text-slate-700">${escapeHtml(item.text || '')}</h3>`;
        break;
      case 'bullet':
        bodyHtml += `<li class="ml-6 list-disc mb-1.5 text-slate-800 leading-relaxed">${escapeHtml(item.text || '')}</li>`;
        break;
      case 'callout':
        bodyHtml += `<div class="bg-blue-50 border-l-4 border-blue-600 p-3 my-3 text-blue-900 text-sm rounded-r italic">${escapeHtml(item.text || '')}</div>`;
        break;
      case 'code':
        bodyHtml += `<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg my-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap">${escapeHtml(item.code || '')}</pre>`;
        break;
      case 'table':
        if (item.tableData && item.tableData.length > 0) {
          bodyHtml += `<div class="overflow-x-auto my-4"><table class="min-w-full divide-y divide-slate-200 border border-slate-200 text-sm">`;
          item.tableData.forEach((row, rIdx) => {
            const tag = rIdx === 0 ? 'th' : 'td';
            const bgClass = rIdx === 0 ? 'bg-slate-100 font-semibold' : 'bg-white';
            bodyHtml += `<tr class="${bgClass}">`;
            row.forEach((c) => {
              bodyHtml += `<${tag} class="px-3 py-2 border-r border-slate-200 text-left">${escapeHtml(c)}</${tag}>`;
            });
            bodyHtml += `</tr>`;
          });
          bodyHtml += `</table></div>`;
        }
        break;
      case 'paragraph':
      default:
        bodyHtml += `<p class="mb-3 text-slate-800 leading-relaxed text-sm">${escapeHtml(item.text || '')}</p>`;
        break;
    }
  }

  const metaParts: string[] = [];
  if (options.subject) metaParts.push(`<span><strong>Subject:</strong> ${escapeHtml(options.subject)}</span>`);
  if (options.module) metaParts.push(`<span><strong>Module:</strong> ${escapeHtml(options.module)}</span>`);
  if (options.topic) metaParts.push(`<span><strong>Topic:</strong> ${escapeHtml(options.topic)}</span>`);
  metaParts.push(`<span><strong>Date:</strong> ${escapeHtml(options.date || new Date().toLocaleDateString())}</span>`);

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(options.title)} - Cognora Academic Export</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
      @page {
        margin: 15mm 20mm 15mm 20mm;
      }
      h1, h2, h3 {
        page-break-after: avoid;
      }
      table, pre {
        page-break-inside: avoid;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen p-6 sm:p-10">
  <div class="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow border border-slate-200 print:border-none print:shadow-none print:p-0">
    <!-- Action Bar for Screen -->
    <div class="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
      <div class="flex items-center space-x-2">
        <span class="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-700">Cognora Document</span>
        <span class="text-xs text-slate-500">Ready to save as PDF or Print</span>
      </div>
      <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm text-sm transition-colors flex items-center space-x-1">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
        Print / Save to PDF
      </button>
    </div>

    <!-- Academic Header -->
    <div class="border-b-2 border-indigo-600 pb-4 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">${escapeHtml(options.title)}</h1>
          <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-slate-600">
            ${metaParts.join('')}
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">Cognora Academic Workspace</span>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="academic-content">
      ${bodyHtml}
    </div>

    <!-- Academic Footer -->
    <div class="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 flex justify-between items-center">
      <span>Cognora Academic Intelligence System</span>
      <span>Verified Learning Resource • ${new Date().toLocaleDateString()}</span>
    </div>
  </div>

  <script>
    // Prompt print automatically after stylesheet loads
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

