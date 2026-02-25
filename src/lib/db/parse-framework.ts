/**
 * Parses a markdown table competency framework into structured records.
 *
 * Expected format (pipe-delimited table):
 * | Name | Description | Level 0 - Name | Level 1 - Name | ... |
 * | :---- | :---- | :---- | :---- | ... |
 * | Competency Name | Description | Level 0 indicators | Level 1 indicators | ... |
 *
 * Also supports simpler formats:
 * ## Competency Name
 * Description text
 * ### Level Name
 * - Indicator text
 */

export interface ParsedCompetency {
  name: string;
  description: string;
  category: string;
  levels: Array<{
    name: string;
    ordinal: number;
    indicators: string[];
  }>;
}

export function parseFrameworkText(rawText: string): ParsedCompetency[] {
  const lines = rawText.trim().split("\n");

  // Try table format first
  const tableResult = parseTableFormat(lines);
  if (tableResult.length > 0) return tableResult;

  // Fall back to markdown heading format
  return parseMarkdownFormat(lines);
}

function parseTableFormat(lines: string[]): ParsedCompetency[] {
  // Find the header row (contains "Name" and at least one "Level")
  const headerIdx = lines.findIndex(
    (line) => line.includes("|") && line.toLowerCase().includes("name") && line.toLowerCase().includes("level")
  );

  if (headerIdx === -1) return [];

  const headerCells = splitTableRow(lines[headerIdx]);
  if (headerCells.length < 3) return [];

  // Find level columns (headers containing "Level")
  const levelColumns: Array<{ index: number; name: string }> = [];
  for (let i = 2; i < headerCells.length; i++) {
    const cell = headerCells[i].trim();
    if (cell.toLowerCase().includes("level") || cell.length > 0) {
      levelColumns.push({ index: i, name: cell });
    }
  }

  // Skip separator row(s) (contain only |, -, :, spaces)
  let dataStart = headerIdx + 1;
  while (dataStart < lines.length && /^[\s|:\-]+$/.test(lines[dataStart])) {
    dataStart++;
  }

  const competencies: ParsedCompetency[] = [];

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.includes("|")) continue;

    const cells = splitTableRow(line);
    if (cells.length < 3) continue;

    const rawName = cells[0]?.trim() || "";
    const description = cells[1]?.trim() || "";

    if (!rawName) continue;

    // Extract category from name (e.g., "**Name** Category" or "Name **Category**")
    const { name, category } = extractNameAndCategory(rawName);

    const levels: ParsedCompetency["levels"] = [];
    for (let j = 0; j < levelColumns.length; j++) {
      const cellIdx = levelColumns[j].index;
      const cellText = cells[cellIdx]?.trim() || "";
      if (cellText) {
        // Split cell text into individual indicators (by sentence or period)
        const indicators = splitIntoIndicators(cellText);
        levels.push({
          name: levelColumns[j].name,
          ordinal: j,
          indicators,
        });
      }
    }

    competencies.push({ name, description, category, levels });
  }

  return competencies;
}

function parseMarkdownFormat(lines: string[]): ParsedCompetency[] {
  const competencies: ParsedCompetency[] = [];
  let current: ParsedCompetency | null = null;
  let currentLevel: { name: string; ordinal: number; indicators: string[] } | null = null;
  let levelOrdinal = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      if (current) {
        if (currentLevel) current.levels.push(currentLevel);
        competencies.push(current);
      }
      current = {
        name: trimmed.replace(/^##\s+/, "").replace(/\*\*/g, ""),
        description: "",
        category: "",
        levels: [],
      };
      currentLevel = null;
      levelOrdinal = 0;
    } else if (trimmed.startsWith("### ") && current) {
      if (currentLevel) current.levels.push(currentLevel);
      currentLevel = {
        name: trimmed.replace(/^###\s+/, ""),
        ordinal: levelOrdinal++,
        indicators: [],
      };
    } else if (trimmed.startsWith("- ") && currentLevel) {
      currentLevel.indicators.push(trimmed.replace(/^-\s+/, ""));
    } else if (current && !currentLevel && trimmed && !trimmed.startsWith("#")) {
      current.description += (current.description ? " " : "") + trimmed;
    }
  }

  if (current) {
    if (currentLevel) current.levels.push(currentLevel);
    competencies.push(current);
  }

  return competencies;
}

function splitTableRow(row: string): string[] {
  return row
    .split("|")
    .map((cell) => cell.trim())
    .filter((_, i, arr) => i > 0 && i < arr.length - (arr[arr.length - 1] === "" ? 1 : 0));
}

function extractNameAndCategory(rawName: string): { name: string; category: string } {
  // Remove markdown bold markers
  let cleaned = rawName.replace(/\*\*/g, "");

  // Common pattern: "Competency Name CategoryName" where category is at the end
  // or embedded like "Name **Software EngineeringSoftware Engineering Discipline**"
  const categoryPatterns = [
    /\s+(Software Engineering\w*|Company\w*|Leadership\w*|Everybody)\s*$/i,
  ];

  let category = "";
  for (const pattern of categoryPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      category = match[1].trim();
      cleaned = cleaned.replace(pattern, "").trim();
      break;
    }
  }

  return { name: cleaned, category };
}

function splitIntoIndicators(text: string): string[] {
  // Split by periods followed by a space and capital letter, or by explicit list markers
  const sentences = text
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}
