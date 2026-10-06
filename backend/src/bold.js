// Offsets are UTF-16 string offsets, as used by JavaScript slice/indexOf.
// Only text nodes are split; all other marks, attributes and block nodes survive.
export function boldLayout(value) {
  let text = "";
  const leaves = [];
  function walk(node) {
    if (node?.type === "text") {
      const start = text.length;
      text += node.text;
      leaves.push({ start, end: text.length, bold: node.marks?.some(mark => mark.type === "bold") });
    } else if (node?.type === "hardBreak") text += "\n";
    else {
      for (const child of node?.content || []) walk(child);
      if (["paragraph", "listItem"].includes(node?.type)) text += "\n";
    }
  }
  walk(value);
  const ranges = [];
  for (const leaf of leaves.filter(leaf => leaf.bold && leaf.end > leaf.start)) {
    if (ranges.at(-1)?.end === leaf.start) ranges.at(-1).end = leaf.end;
    else ranges.push({ start: leaf.start, end: leaf.end });
  }
  return { text, ranges };
}

export function applyBoldRanges(value, ranges) {
  const { text } = boldLayout(value);
  let end = 0;
  for (const range of ranges) {
    if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < end || range.end <= range.start || range.end > text.length)
      throw Object.assign(new Error("Correspondência de negrito inválida."), { status: 400 });
    end = range.end;
  }
  let offset = 0;
  function walk(node) {
    if (node.type === "text") {
      const start = offset;
      offset += node.text.length;
      const cuts = [...new Set([start, offset, ...ranges.flatMap(range => [range.start, range.end]).filter(point => point > start && point < offset)])].sort((a, b) => a - b);
      return cuts.slice(0, -1).map((point, index) => {
        const result = { ...node, text: node.text.slice(point - start, cuts[index + 1] - start) };
        const marks = (node.marks || []).filter(mark => mark.type !== "bold");
        if (ranges.some(range => range.start <= point && range.end >= cuts[index + 1])) marks.push({ type: "bold" });
        if (marks.length) result.marks = marks;
        else delete result.marks;
        return result;
      });
    }
    if (node.type === "hardBreak") offset++;
    const result = { ...node };
    if (node.content) result.content = node.content.flatMap(walk);
    if (["paragraph", "listItem"].includes(node.type)) offset++;
    return [result];
  }
  return walk(structuredClone(value))[0];
}

export function phraseRanges(text, phrases) {
  if (!Array.isArray(phrases)) throw new Error("Correspondência de negrito inválida.");
  const ranges = phrases.map(phrase => {
    if (typeof phrase !== "string" || !phrase.trim()) throw new Error("Trecho sem correspondência. Revise os destaques manualmente.");
    const start = text.indexOf(phrase);
    if (start < 0 || text.indexOf(phrase, start + 1) >= 0)
      throw new Error("Trecho ausente ou ambíguo. Revise os destaques manualmente.");
    return { start, end: start + phrase.length };
  }).sort((a, b) => a.start - b.start);
  if (ranges.some((range, index) => index && range.start < ranges[index - 1].end))
    throw new Error("Destaques sobrepostos. Revise os destaques manualmente.");
  return ranges;
}

export function alignmentInput(source, target) {
  const { text: sourceText, ranges } = boldLayout(source);
  return { sourceText, highlights: ranges.map(({ start, end }) => sourceText.slice(start, end)), targetText: boldLayout(target).text };
}

export function validateAlignment(input, output) {
  const phrases = JSON.parse(output);
  if (!Array.isArray(phrases) || phrases.length !== input.highlights.length) throw new Error("Correspondência de negrito incompleta.");
  return phraseRanges(input.targetText, phrases);
}

export function immediateBoldProposal(source, target) {
  if (!target?.type || !source?.type) return null;
  const left = boldLayout(source);
  const right = boldLayout(target);
  if (!left.ranges.length) return applyBoldRanges(target, []);
  if (left.text === right.text) return applyBoldRanges(target, left.ranges);
  // A completely bold paragraph needs no linguistic alignment.
  if (source.type === "paragraph" && target.type === "paragraph" && left.ranges.length === 1 &&
      left.ranges[0].start === 0 && left.ranges[0].end === left.text.length - 1 && right.text.length > 1)
    return applyBoldRanges(target, [{ start: 0, end: right.text.length - 1 }]);
  return null;
}

export async function generateBoldProposal(source, target, translate, options) {
  const immediate = immediateBoldProposal(source, target);
  if (immediate) return immediate;
  const input = alignmentInput(source, target);
  const [output] = await translate([JSON.stringify(input)], { ...options, mode: "align-bold" });
  return applyBoldRanges(target, validateAlignment(input, output));
}
