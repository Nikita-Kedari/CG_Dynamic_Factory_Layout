export interface CSVParseOptions {
  hasHeader: boolean;
  delimiter?: string;
}

export function parseCSV(
  content: string,
  options: CSVParseOptions = { hasHeader: true, delimiter: ',' }
): string[][] {
  const lines = content.split('\n').filter((line) => line.trim());
  const delimiter = options.delimiter || ',';

  return lines.map((line) => {
    const fields: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    fields.push(current.trim());
    return fields;
  });
}

export function csvToObjects(
  content: string,
  options: CSVParseOptions = { hasHeader: true, delimiter: ',' }
): Record<string, string>[] {
  const rows = parseCSV(content, options);

  if (rows.length === 0) return [];

  let headers = rows[0];
  let dataRows = rows.slice(1);

  if (!options.hasHeader) {
    headers = headers.map((_, i) => `Column${i + 1}`);
    dataRows = rows;
  }

  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

export function objectsToCSV(
  objects: Record<string, string>[],
  headers?: string[]
): string {
  if (objects.length === 0) return '';

  const usedHeaders = headers || Object.keys(objects[0]);
  const lines: string[] = [];

  // Add header row
  lines.push(
    usedHeaders
      .map((h) => (h.includes(',') || h.includes('"') ? `"${h.replace(/"/g, '""')}"` : h))
      .join(',')
  );

  // Add data rows
  objects.forEach((obj) => {
    const row = usedHeaders.map((header) => {
      const value = obj[header] || '';
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

export function detectHeaders(rows: string[][]): string[] {
  if (rows.length === 0) return [];
  return rows[0];
}

export function downloadCSV(content: string, filename: string = 'export.csv'): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateFactoryCSV(
  factoryName: string,
  factoryWidth: number,
  factoryHeight: number,
  gridUnit: number,
  areas: Array<{ areaId: string; areaName: string; x: number; y: number; width: number; height: number }>
): string {
  const lines: string[] = [];

  // Factory metadata row
  lines.push(`factoryName,factoryWidth,factoryHeight,gridUnit`);
  lines.push(`${factoryName},${factoryWidth},${factoryHeight},${gridUnit}`);
  lines.push(''); // Blank line

  // Area headers
  lines.push(`AreaId,AreaName,X,Y,Width,Height,ImageUrl`);

  // Area rows
  areas.forEach((area) => {
    lines.push(`${area.areaId},${area.areaName},${area.x},${area.y},${area.width},${area.height},`);
  });

  return lines.join('\n');
}
