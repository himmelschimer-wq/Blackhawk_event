import React from 'react';

// Color map for pure text colors (no background boxes or borders)
const COLOR_CLASSES: Record<string, string> = {
  red: 'text-[#ff3b47] font-bold',
  r: 'text-[#ff3b47] font-bold',
  yellow: 'text-[#ffd700] font-bold',
  gold: 'text-[#ffd700] font-bold',
  y: 'text-[#ffd700] font-bold',
  green: 'text-[#10b981] font-bold',
  g: 'text-[#10b981] font-bold',
  cyan: 'text-[#38bdf8] font-bold',
  blue: 'text-[#60a5fa] font-bold',
  c: 'text-[#38bdf8] font-bold',
  purple: 'text-[#c084fc] font-bold',
  violet: 'text-[#c084fc] font-bold',
  p: 'text-[#c084fc] font-bold',
  orange: 'text-[#fb923c] font-bold',
  o: 'text-[#fb923c] font-bold'
};

/**
 * Parses a single line of text with color tags and markdown bold/italics.
 */
function parseInlineFormatting(line: string, lineKey: number | string): React.ReactNode {
  if (!line) return null;

  // Regex pattern matching [color]content[/color], [color:content], **bold**, *italic*
  const pattern = /\[(red|r|yellow|gold|y|green|g|cyan|blue|c|purple|violet|p|orange|o)\]([\s\S]*?)\[\/\1\]|\[(red|r|yellow|gold|y|green|g|cyan|blue|c|purple|violet|p|orange|o):([\s\S]*?)\]|\*\*([\s\S]*?)\*\*|\*([\s\S]*?)\*/gi;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let elementIndex = 0;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      elements.push(line.substring(lastIndex, match.index));
    }

    const colorTag = (match[1] || match[3] || '').toLowerCase();
    const colorContent = match[2] || match[4];
    const boldContent = match[5];
    const italicContent = match[6];

    if (colorTag && colorContent !== undefined) {
      const colorClass = COLOR_CLASSES[colorTag] || COLOR_CLASSES.red;
      // Allow bold inside color tag if nested
      elements.push(
        <span key={`${lineKey}-${elementIndex++}`} className={colorClass}>
          {parseInlineFormatting(colorContent, `${lineKey}-col`)}
        </span>
      );
    } else if (boldContent !== undefined) {
      elements.push(
        <strong key={`${lineKey}-${elementIndex++}`} className="text-white font-bold">
          {parseInlineFormatting(boldContent, `${lineKey}-b`)}
        </strong>
      );
    } else if (italicContent !== undefined) {
      elements.push(
        <em key={`${lineKey}-${elementIndex++}`} className="text-zinc-200 italic">
          {italicContent}
        </em>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < line.length) {
    elements.push(line.substring(lastIndex));
  }

  return elements.length > 0 ? elements : line;
}

/**
 * Parses multi-line rule or description text with color tags and markdown bold/italics.
 * Preserves newlines so each line breaks cleanly.
 */
export const FormattedRuleText: React.FC<{ 
  text: string; 
  className?: string;
  asParagraphs?: boolean;
}> = ({ 
  text, 
  className = '',
  asParagraphs = false
}) => {
  if (!text) return null;

  const lines = text.split('\n');

  if (asParagraphs) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {lines.map((line, idx) => (
          <p key={idx} className="leading-relaxed">
            {parseInlineFormatting(line, idx)}
          </p>
        ))}
      </div>
    );
  }

  return (
    <span className={`inline-block ${className}`}>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <br />}
          {parseInlineFormatting(line, idx)}
        </React.Fragment>
      ))}
    </span>
  );
};

export const COLOR_OPTIONS = [
  { id: 'red', name: 'Red', tag: 'red', bg: 'bg-red-500', text: 'text-red-400', label: 'Crimson / Alert' },
  { id: 'gold', name: 'Gold', tag: 'gold', bg: 'bg-amber-400', text: 'text-amber-300', label: 'Gold / Timing' },
  { id: 'green', name: 'Green', tag: 'green', bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Green / Payout' },
  { id: 'cyan', name: 'Cyan', tag: 'cyan', bg: 'bg-cyan-400', text: 'text-cyan-300', label: 'Cyan / Info' },
  { id: 'purple', name: 'Purple', tag: 'purple', bg: 'bg-purple-400', text: 'text-purple-300', label: 'Purple / Rule' },
  { id: 'orange', name: 'Orange', tag: 'orange', bg: 'bg-orange-400', text: 'text-orange-400', label: 'Orange / Note' },
];
