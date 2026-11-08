import JSZip from 'jszip';

/**
 * Extracts plain text and paragraphs from a DOCX file directly in the browser.
 */
export async function parseDocxInBrowser(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX format: word/document.xml not found.');
  }

  const xmlText = await docXmlFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  // Extract paragraphs
  const pElements = xmlDoc.getElementsByTagName('w:p');
  const paragraphs = [];
  const allTextChunks = [];

  for (let i = 0; i < pElements.length; i++) {
    const p = pElements[i];
    const textNodes = p.getElementsByTagName('w:t');
    let pText = '';
    for (let j = 0; j < textNodes.length; j++) {
      pText += textNodes[j].textContent || '';
    }
    pText = pText.trim();
    if (pText) {
      allTextChunks.push(pText);
      const isHeading = pText.length < 90 && (pText.toUpperCase() === pText || pText.startsWith('1.') || pText.startsWith('2.') || pText.startsWith('3.'));
      paragraphs.push({
        index: i,
        text: pText,
        is_heading: isHeading,
        has_brackets: pText.includes('[') && pText.includes(']')
      });
    }
  }

  const fullText = allTextChunks.join('\n');
  const placeholders = extractClientPlaceholders(fullText);

  return {
    filename: file.name,
    filepath: file.name,
    filesize: file.size,
    paragraph_count: paragraphs.length,
    table_count: xmlDoc.getElementsByTagName('w:tbl').length,
    word_count: fullText.split(/\s+/).filter(Boolean).length,
    placeholders,
    sample_paragraphs: paragraphs.map(p => ({
      is_heading: p.is_heading,
      text: p.text
    }))
  };
}

/**
 * Extracts [Bracket] placeholders from text.
 */
export function extractClientPlaceholders(text) {
  const seen = new Set();
  const list = [];

  // 1. Complex nested or conditional clauses: [[...]/[...]] or [ ... / ... ]
  const clauseRegex = /\[([^[\]]*\[[^[\]]+\][^[\]]*)\]/g;
  let match;
  while ((match = clauseRegex.exec(text)) !== null) {
    const raw = match[0];
    const inner = match[1].trim();
    if (!seen.has(raw)) {
      seen.add(raw);
      list.push({
        raw,
        key: inner,
        label: generateCleanLabel(inner),
        type: 'clause',
        is_clause: true,
        is_conditional: inner.includes('/'),
        suggested: inner.split('/')[0].trim(),
        occurrences: text.split(raw).length - 1
      });
    }
  }

  // 2. Simple bracket tokens: [Field]
  const simpleRegex = /\[([^\[\]\n\r]+)\]/g;
  while ((match = simpleRegex.exec(text)) !== null) {
    const raw = match[0];
    const inner = match[1].trim();
    if (!seen.has(raw) && inner) {
      seen.add(raw);
      list.push({
        raw,
        key: inner,
        label: inner,
        type: inferType(inner),
        is_clause: false,
        is_conditional: false,
        suggested: inferSuggested(inner),
        occurrences: text.split(raw).length - 1
      });
    }
  }

  return list;
}

function generateCleanLabel(clause) {
  const l = clause.toLowerCase();
  if (l.includes('fee') || l.includes('subsidized') || l.includes('surcharge')) return 'Fee & Subsidy Terms';
  if (l.includes('logistics') || l.includes('deducts')) return 'Logistics Protocol';
  if (l.includes('payout') || l.includes('timing')) return 'Payout Window';
  return clause.length > 25 ? clause.substring(0, 22) + '...' : clause;
}

function inferType(key) {
  const l = key.toLowerCase();
  if (l.includes('amount') || l.includes('fee') || l.includes('rate') || l.includes('price') || l.includes('cost') || key.trim() === 'X') {
    return 'number';
  }
  if (l.includes('date') || l.includes('deadline')) return 'date';
  if (l.includes('email') || l.includes('mail')) return 'email';
  if (l.includes('signature') || l.includes('stamp')) return 'signature';
  return 'text';
}

function inferSuggested(key) {
  const l = key.toLowerCase();
  if (l.includes('name')) return 'Commander Valeria Cross';
  if (l.includes('amount') || l.includes('cost')) return '45,000';
  if (key.trim() === 'X') return '6';
  if (l.includes('date')) return '2026-12-01';
  return '';
}
