import { InvestmentScheme, SchemeType } from '../types';

// ---------------------------------------------------------------------------
// Excel (.xlsx) format for importing Mutual Fund and NPS schemes
// ---------------------------------------------------------------------------

export const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Very High'] as const;
export const MAX_IMPORT_ROWS = 500;
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export interface SchemeColumn {
  key: 'type' | 'name' | 'category' | 'rate' | 'risk' | 'minInvestment' | 'fundHouse' | 'description';
  header: string;
  required: boolean;
  help: string;
  example: string;
  width: number;
}

export const SCHEME_COLUMNS: SchemeColumn[] = [
  {
    key: 'type',
    header: 'Scheme Type',
    required: true,
    help: 'Mutual Fund or NPS',
    example: 'Mutual Fund',
    width: 16,
  },
  {
    key: 'name',
    header: 'Scheme Name',
    required: true,
    help: 'Full name of the scheme',
    example: 'Sample Flexi Cap Fund',
    width: 38,
  },
  {
    key: 'category',
    header: 'Category',
    required: true,
    help: 'e.g. Equity - Flexi Cap, Debt - Corporate Bond, NPS Tier I - Equity',
    example: 'Equity - Flexi Cap',
    width: 26,
  },
  {
    key: 'rate',
    header: 'Expected Return Rate (% p.a.)',
    required: true,
    help: 'Number greater than 0 and up to 100, e.g. 12 or 12.5',
    example: '12.5',
    width: 28,
  },
  {
    key: 'risk',
    header: 'Risk Level',
    required: false,
    help: 'Low, Moderate, High or Very High',
    example: 'High',
    width: 14,
  },
  {
    key: 'minInvestment',
    header: 'Minimum Investment (Rs)',
    required: false,
    help: 'Whole amount in rupees, e.g. 1000',
    example: '1000',
    width: 24,
  },
  {
    key: 'fundHouse',
    header: 'Fund House / Pension Fund Manager',
    required: false,
    help: 'e.g. SBI Mutual Fund, HDFC Pension',
    example: 'Sample Fund House',
    width: 32,
  },
  {
    key: 'description',
    header: 'Description',
    required: false,
    help: 'Short note shown to customers',
    example: 'Diversified equity fund.',
    width: 40,
  },
];

export interface ParsedSchemeRow {
  rowNumber: number; // row number in the Excel sheet
  data: Omit<InvestmentScheme, 'id' | 'createdAt'> | null;
  errors: string[];
  action: 'create' | 'update' | 'invalid';
  existingId?: string;
}

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');

const HEADER_ALIASES: Record<SchemeColumn['key'], string[]> = {
  type: ['schemetype', 'type'],
  name: ['schemename', 'name', 'fundname'],
  category: ['category', 'schemecategory'],
  rate: ['expectedreturnrate', 'expectedreturn', 'returnrate', 'rate', 'expectedreturnratepa', 'expectedreturnrate pa'],
  risk: ['risklevel', 'risk'],
  minInvestment: ['minimuminvestmentrs', 'minimuminvestment', 'mininvestment', 'minimuminvestmentinr'],
  fundHouse: ['fundhousepensionfundmanager', 'fundhouse', 'fundmanager', 'pensionfundmanager', 'amc'],
  description: ['description', 'notes', 'note'],
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Downloads a ready-to-fill Excel template (.xlsx) with the required columns. */
export async function downloadSchemeTemplate(): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet('Schemes');
  ws.columns = SCHEME_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', wrapText: true };
  headerRow.height = 30;
  headerRow.eachCell((cell, col) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SCHEME_COLUMNS[col - 1].required ? 'FF4F46E5' : 'FF64748B' },
    };
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  ws.addRow({
    type: 'Mutual Fund',
    name: 'Sample Mutual Fund Scheme - delete this row',
    category: 'Equity - Flexi Cap',
    rate: 12.5,
    risk: 'High',
    minInvestment: 1000,
    fundHouse: 'Sample Fund House',
    description: 'Diversified equity fund.',
  });
  ws.addRow({
    type: 'NPS',
    name: 'Sample NPS Scheme - delete this row',
    category: 'NPS Tier I - Equity',
    rate: 10,
    risk: 'Very High',
    minInvestment: 500,
    fundHouse: 'Sample Pension Fund Manager',
    description: 'Tier I equity allocation.',
  });

  // Dropdowns and number checks for the first 500 data rows
  for (let r = 2; r <= MAX_IMPORT_ROWS + 1; r++) {
    ws.getCell(`A${r}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Mutual Fund,NPS"'],
    };
    ws.getCell(`D${r}`).dataValidation = {
      type: 'decimal',
      operator: 'between',
      allowBlank: false,
      formulae: [0.01, 100],
      showErrorMessage: true,
      errorTitle: 'Expected Return Rate',
      error: 'Enter a number between 0.01 and 100 (percent per year).',
    };
    ws.getCell(`E${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Low,Moderate,High,Very High"'],
    };
  }

  const help = wb.addWorksheet('Instructions');
  help.columns = [
    { header: 'Column', key: 'col', width: 36 },
    { header: 'Required?', key: 'req', width: 12 },
    { header: 'What to enter', key: 'help', width: 70 },
    { header: 'Example', key: 'ex', width: 34 },
  ];
  help.getRow(1).font = { bold: true };
  SCHEME_COLUMNS.forEach((c) =>
    help.addRow({ col: c.header, req: c.required ? 'Yes' : 'No', help: c.help, ex: c.example })
  );
  help.addRow({});
  help.addRow({ col: 'Notes' });
  [
    'Keep the column headings in row 1 of the "Schemes" sheet exactly as given.',
    'Delete the two sample rows before importing.',
    `Up to ${MAX_IMPORT_ROWS} schemes per file. Only .xlsx Excel files are accepted.`,
    'If a scheme with the same Type and Name already exists, the import updates it instead of adding a duplicate.',
  ].forEach((t) => help.addRow({ col: t }));

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'schemes-import-template.xlsx'
  );
}

// -- parsing ----------------------------------------------------------------

const cellText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v.richText)) return (v.richText as { text: string }[]).map((t) => t.text).join('').trim();
    if ('result' in v) return cellText(v.result);
    if ('text' in v) return cellText(v.text);
    if (value instanceof Date) return value.toISOString();
    return '';
  }
  return String(value).trim();
};

const parseNumber = (raw: unknown, isPercentCell: boolean): number | null => {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return isPercentCell ? raw * 100 : raw;
  const t = cellText(raw).replace(/[,₹\s]/g, '').replace(/^rs\.?/i, '');
  if (!t) return null;
  const hasPercent = t.endsWith('%');
  const n = Number(hasPercent ? t.slice(0, -1) : t);
  return Number.isFinite(n) ? n : NaN;
};

const toType = (t: string): SchemeType | null => {
  const n = normalize(t);
  if (['mutualfund', 'mf', 'mutual'].includes(n)) return 'mutual_fund';
  if (['nps', 'nationalpensionsystem', 'nationalpensionscheme'].includes(n)) return 'nps';
  return null;
};

const toRisk = (t: string): InvestmentScheme['riskLevel'] | null => {
  const n = normalize(t);
  const found = RISK_LEVELS.find((r) => normalize(r) === n);
  return found ?? null;
};

/** Reads an .xlsx file and validates every row. Nothing is saved here. */
export async function parseSchemeExcel(
  file: File,
  existing: InvestmentScheme[]
): Promise<ParsedSchemeRow[]> {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error('Please choose an Excel file in .xlsx format.');
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error('The file is larger than 5 MB. Please split it into smaller files.');
  }

  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch (_e) {
    throw new Error('This file could not be read. Please upload a valid .xlsx Excel file.');
  }

  const ws = wb.getWorksheet('Schemes') || wb.worksheets[0];
  if (!ws) throw new Error('The Excel file has no sheets.');

  // Map header text -> column number
  const colIndex: Partial<Record<SchemeColumn['key'], number>> = {};
  ws.getRow(1).eachCell((cell, col) => {
    const h = normalize(cellText(cell.value));
    (Object.keys(HEADER_ALIASES) as SchemeColumn['key'][]).forEach((key) => {
      if (colIndex[key] === undefined && HEADER_ALIASES[key].map(normalize).includes(h)) {
        colIndex[key] = col;
      }
    });
  });

  const missing = SCHEME_COLUMNS.filter((c) => c.required && colIndex[c.key] === undefined).map((c) => c.header);
  if (missing.length > 0) {
    throw new Error(
      `Missing column heading(s) in row 1: ${missing.join(', ')}. Download the template to see the correct format.`
    );
  }

  const rows: ParsedSchemeRow[] = [];
  const seen = new Set<string>();

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (key: SchemeColumn['key']) => {
      const c = colIndex[key];
      return c === undefined ? undefined : row.getCell(c);
    };
    const text = (key: SchemeColumn['key']) => cellText(get(key)?.value);

    const allBlank = SCHEME_COLUMNS.every((c) => text(c.key) === '');
    if (allBlank) continue;

    if (rows.length >= MAX_IMPORT_ROWS) {
      throw new Error(`Too many rows. Please import at most ${MAX_IMPORT_ROWS} schemes at a time.`);
    }

    const errors: string[] = [];

    const type = toType(text('type'));
    if (!type) errors.push('Scheme Type must be "Mutual Fund" or "NPS"');

    const name = text('name');
    if (!name) errors.push('Scheme Name is required');

    const category = text('category');
    if (!category) errors.push('Category is required');

    const rateCell = get('rate');
    const isPct = typeof rateCell?.numFmt === 'string' && rateCell.numFmt.includes('%');
    const rate = parseNumber(rateCell?.value, isPct);
    if (rate === null) errors.push('Expected Return Rate is required');
    else if (Number.isNaN(rate) || rate <= 0 || rate > 100)
      errors.push('Expected Return Rate must be a number above 0 and up to 100');

    let risk: InvestmentScheme['riskLevel'] | undefined;
    if (text('risk')) {
      const rk = toRisk(text('risk'));
      if (!rk) errors.push('Risk Level must be Low, Moderate, High or Very High');
      else risk = rk;
    }

    let minInvestment: number | undefined;
    const minCell = get('minInvestment');
    if (minCell && text('minInvestment') !== '') {
      const m = parseNumber(minCell.value, false);
      if (m === null || Number.isNaN(m) || m < 0) errors.push('Minimum Investment must be a number (0 or more)');
      else minInvestment = Math.round(m);
    }

    if (type && name) {
      const key = `${type}|${name.toLowerCase()}`;
      if (seen.has(key)) errors.push('Duplicate of another row in this file');
      seen.add(key);
    }

    if (errors.length > 0 || !type || rate === null) {
      rows.push({ rowNumber: r, data: null, errors, action: 'invalid' });
      continue;
    }

    const match = existing.find((s) => s.type === type && s.name.trim().toLowerCase() === name.toLowerCase());
    rows.push({
      rowNumber: r,
      errors: [],
      action: match ? 'update' : 'create',
      existingId: match?.id,
      data: {
        name,
        type,
        category,
        expectedReturnRate: Math.round((rate as number) * 100) / 100,
        riskLevel: risk,
        minInvestment,
        fundHouse: text('fundHouse') || undefined,
        description: text('description') || undefined,
      },
    });
  }

  if (rows.length === 0) {
    throw new Error('No scheme rows were found. Fill the data from row 2 of the "Schemes" sheet.');
  }
  return rows;
}
