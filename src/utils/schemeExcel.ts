import { InvestmentScheme, SchemeType } from '../types';

// ---------------------------------------------------------------------------
// Excel (.xlsx) import formats - one for Mutual Fund schemes, one for NPS schemes
// ---------------------------------------------------------------------------

export type ImportKind = 'mutual_fund' | 'nps';

export const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Very High'] as const;
export const NPS_TIERS = ['Tier I', 'Tier II'] as const;
export const NPS_ASSET_CLASSES = [
  'Equity (E)',
  'Corporate Bonds (C)',
  'Government Bonds (G)',
  'Alternative (A)',
  'Auto Choice',
] as const;
export const MAX_IMPORT_ROWS = 500;
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export type ColumnKey =
  | 'name'
  | 'category'
  | 'tier'
  | 'assetClass'
  | 'rate'
  | 'risk'
  | 'minInvestment'
  | 'fundHouse'
  | 'description';

export interface SchemeColumn {
  key: ColumnKey;
  header: string;
  required: boolean;
  help: string;
  example: string;
  width: number;
}

const MF_COLUMNS: SchemeColumn[] = [
  { key: 'name', header: 'Scheme Name', required: true, help: 'Full name of the mutual fund scheme', example: 'Sample Flexi Cap Fund', width: 38 },
  { key: 'category', header: 'Category', required: true, help: 'e.g. Equity - Flexi Cap, Debt - Corporate Bond', example: 'Equity - Flexi Cap', width: 26 },
  { key: 'rate', header: 'Expected Return Rate (% p.a.)', required: true, help: 'Number above 0 and up to 100, e.g. 12 or 12.5', example: '12.5', width: 28 },
  { key: 'risk', header: 'Risk Level', required: false, help: 'Low, Moderate, High or Very High', example: 'High', width: 14 },
  { key: 'minInvestment', header: 'Minimum Investment (Rs)', required: false, help: 'Whole amount in rupees, e.g. 1000', example: '1000', width: 24 },
  { key: 'fundHouse', header: 'Fund House', required: false, help: 'e.g. SBI Mutual Fund', example: 'Sample Fund House', width: 28 },
  { key: 'description', header: 'Description', required: false, help: 'Short note shown to customers', example: 'Diversified equity fund.', width: 40 },
];

const NPS_COLUMNS: SchemeColumn[] = [
  { key: 'name', header: 'Scheme Name', required: true, help: 'Full name of the NPS scheme', example: 'Sample NPS Scheme E', width: 38 },
  { key: 'fundHouse', header: 'Pension Fund Manager', required: false, help: 'e.g. SBI Pension Funds, HDFC Pension', example: 'Sample Pension Fund Manager', width: 30 },
  { key: 'tier', header: 'Tier', required: true, help: 'Tier I or Tier II', example: 'Tier I', width: 12 },
  { key: 'assetClass', header: 'Asset Class', required: true, help: NPS_ASSET_CLASSES.join(', '), example: 'Equity (E)', width: 24 },
  { key: 'rate', header: 'Expected Return Rate (% p.a.)', required: true, help: 'Number above 0 and up to 100, e.g. 10 or 12.5', example: '12', width: 28 },
  { key: 'risk', header: 'Risk Level', required: false, help: 'Low, Moderate, High or Very High', example: 'Very High', width: 14 },
  { key: 'minInvestment', header: 'Minimum Contribution (Rs)', required: false, help: 'Whole amount in rupees, e.g. 500', example: '500', width: 26 },
  { key: 'description', header: 'Description', required: false, help: 'Short note shown to customers', example: 'Equity allocation scheme.', width: 40 },
];

export const getColumns = (kind: ImportKind): SchemeColumn[] => (kind === 'nps' ? NPS_COLUMNS : MF_COLUMNS);

export const KIND_LABEL: Record<ImportKind, string> = {
  mutual_fund: 'Mutual Fund',
  nps: 'NPS',
};

export interface ParsedSchemeRow {
  rowNumber: number; // row number in the Excel sheet
  data: Omit<InvestmentScheme, 'id' | 'createdAt'> | null;
  errors: string[];
  action: 'create' | 'update' | 'invalid';
  existingId?: string;
}

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');

const HEADER_ALIASES: Record<ColumnKey, string[]> = {
  name: ['schemename', 'name', 'fundname', 'npsschemename'],
  category: ['category', 'schemecategory'],
  tier: ['tier', 'npstier'],
  assetClass: ['assetclass', 'asset', 'schemeclass'],
  rate: ['expectedreturnrate', 'expectedreturn', 'returnrate', 'rate', 'expectedreturnratepa'],
  risk: ['risklevel', 'risk'],
  minInvestment: [
    'minimuminvestmentrs',
    'minimuminvestment',
    'mininvestment',
    'minimumcontributionrs',
    'minimumcontribution',
    'mincontribution',
  ],
  fundHouse: ['fundhouse', 'fundmanager', 'pensionfundmanager', 'pfm', 'amc', 'fundhousepensionfundmanager'],
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

const colLetter = (index: number) => String.fromCharCode(65 + index);

/** Downloads a ready-to-fill Excel template (.xlsx) for the chosen scheme type. */
export async function downloadSchemeTemplate(kind: ImportKind): Promise<void> {
  const columns = getColumns(kind);
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet('Schemes');
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', wrapText: true };
  headerRow.height = 30;
  headerRow.eachCell((cell, col) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: columns[col - 1].required ? 'FF4F46E5' : 'FF64748B' },
    };
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  if (kind === 'nps') {
    ws.addRow({
      name: 'Sample NPS Scheme E - delete this row',
      fundHouse: 'Sample Pension Fund Manager',
      tier: 'Tier I',
      assetClass: 'Equity (E)',
      rate: 12,
      risk: 'Very High',
      minInvestment: 500,
      description: 'Equity allocation scheme.',
    });
    ws.addRow({
      name: 'Sample NPS Scheme G - delete this row',
      fundHouse: 'Sample Pension Fund Manager',
      tier: 'Tier I',
      assetClass: 'Government Bonds (G)',
      rate: 8.5,
      risk: 'Low',
      minInvestment: 500,
      description: 'Government securities scheme.',
    });
  } else {
    ws.addRow({
      name: 'Sample Mutual Fund Scheme - delete this row',
      category: 'Equity - Flexi Cap',
      rate: 12.5,
      risk: 'High',
      minInvestment: 1000,
      fundHouse: 'Sample Fund House',
      description: 'Diversified equity fund.',
    });
    ws.addRow({
      name: 'Sample Debt Fund - delete this row',
      category: 'Debt - Corporate Bond',
      rate: 7.8,
      risk: 'Low',
      minInvestment: 1000,
      fundHouse: 'Sample Fund House',
      description: 'Corporate bond fund.',
    });
  }

  // Dropdowns and number checks for the first rows
  const idx = (k: ColumnKey) => columns.findIndex((c) => c.key === k);
  for (let r = 2; r <= MAX_IMPORT_ROWS + 1; r++) {
    ws.getCell(`${colLetter(idx('rate'))}${r}`).dataValidation = {
      type: 'decimal',
      operator: 'between',
      allowBlank: false,
      formulae: [0.01, 100],
      showErrorMessage: true,
      errorTitle: 'Expected Return Rate',
      error: 'Enter a number between 0.01 and 100 (percent per year).',
    };
    ws.getCell(`${colLetter(idx('risk'))}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${RISK_LEVELS.join(',')}"`],
    };
    if (kind === 'nps') {
      ws.getCell(`${colLetter(idx('tier'))}${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${NPS_TIERS.join(',')}"`],
      };
      ws.getCell(`${colLetter(idx('assetClass'))}${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${NPS_ASSET_CLASSES.join(',')}"`],
      };
    }
  }

  const help = wb.addWorksheet('Instructions');
  help.columns = [
    { header: 'Column', key: 'col', width: 36 },
    { header: 'Required?', key: 'req', width: 12 },
    { header: 'What to enter', key: 'help', width: 70 },
    { header: 'Example', key: 'ex', width: 34 },
  ];
  help.getRow(1).font = { bold: true };
  columns.forEach((c) => help.addRow({ col: c.header, req: c.required ? 'Yes' : 'No', help: c.help, ex: c.example }));
  help.addRow({});
  help.addRow({ col: 'Notes' });
  [
    `This template is for ${KIND_LABEL[kind]} schemes only.`,
    'Keep the column headings in row 1 of the "Schemes" sheet exactly as given.',
    'Delete the two sample rows before importing.',
    `Up to ${MAX_IMPORT_ROWS} schemes per file. Only .xlsx Excel files are accepted.`,
    `If a ${KIND_LABEL[kind]} scheme with the same Name already exists, the import updates it instead of adding a duplicate.`,
  ].forEach((t) => help.addRow({ col: t }));

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    kind === 'nps' ? 'nps-schemes-import-template.xlsx' : 'mutual-fund-schemes-import-template.xlsx'
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
    return '';
  }
  return String(value).trim();
};

const parseNumber = (raw: unknown, isPercentCell: boolean): number | null => {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return isPercentCell ? raw * 100 : raw;
  const t = cellText(raw).replace(/[,₹\s]/g, '').replace(/^rs\.?/i, '');
  if (!t) return null;
  const n = Number(t.endsWith('%') ? t.slice(0, -1) : t);
  return Number.isFinite(n) ? n : NaN;
};

const toRisk = (t: string): InvestmentScheme['riskLevel'] | null => {
  const n = normalize(t);
  return RISK_LEVELS.find((r) => normalize(r) === n) ?? null;
};

const toTier = (t: string): string | null => {
  const n = normalize(t);
  if (['tieri', 'tier1', 'i', '1'].includes(n)) return 'Tier I';
  if (['tierii', 'tier2', 'ii', '2'].includes(n)) return 'Tier II';
  return null;
};

const toAssetClass = (t: string): string | null => {
  const n = normalize(t);
  if (['equitye', 'equity', 'e', 'schemee'].includes(n)) return 'Equity (E)';
  if (['corporatebondsc', 'corporatebonds', 'corporatebond', 'corporate', 'c', 'schemec'].includes(n)) return 'Corporate Bonds (C)';
  if (['governmentbondsg', 'governmentbonds', 'governmentbond', 'govtbonds', 'government', 'gsec', 'g', 'schemeg'].includes(n)) return 'Government Bonds (G)';
  if (['alternativea', 'alternative', 'a', 'schemea'].includes(n)) return 'Alternative (A)';
  if (['autochoice', 'auto', 'lifecycle'].includes(n)) return 'Auto Choice';
  return null;
};

/** Reads an .xlsx file and validates every row. Nothing is saved here. */
export async function parseSchemeExcel(
  file: File,
  existing: InvestmentScheme[],
  kind: ImportKind
): Promise<ParsedSchemeRow[]> {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error('Please choose an Excel file in .xlsx format.');
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error('The file is larger than 5 MB. Please split it into smaller files.');
  }

  const columns = getColumns(kind);
  const schemeType: SchemeType = kind;

  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch (_e) {
    throw new Error('This file could not be read. Please upload a valid .xlsx Excel file.');
  }

  const ws = wb.getWorksheet('Schemes') || wb.worksheets[0];
  if (!ws) throw new Error('The Excel file has no sheets.');

  const colIndex: Partial<Record<ColumnKey, number>> = {};
  ws.getRow(1).eachCell((cell, col) => {
    const h = normalize(cellText(cell.value));
    columns.forEach((c) => {
      if (colIndex[c.key] === undefined && HEADER_ALIASES[c.key].includes(h)) colIndex[c.key] = col;
    });
  });

  const missing = columns.filter((c) => c.required && colIndex[c.key] === undefined).map((c) => c.header);
  if (missing.length > 0) {
    throw new Error(
      `Missing column heading(s) in row 1: ${missing.join(', ')}. This is the ${KIND_LABEL[kind]} import - download its template to see the correct format.`
    );
  }

  const rows: ParsedSchemeRow[] = [];
  const seen = new Set<string>();

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (key: ColumnKey) => {
      const c = colIndex[key];
      return c === undefined ? undefined : row.getCell(c);
    };
    const text = (key: ColumnKey) => cellText(get(key)?.value);

    if (columns.every((c) => text(c.key) === '')) continue;

    if (rows.length >= MAX_IMPORT_ROWS) {
      throw new Error(`Too many rows. Please import at most ${MAX_IMPORT_ROWS} schemes at a time.`);
    }

    const errors: string[] = [];

    const name = text('name');
    if (!name) errors.push('Scheme Name is required');

    let category = '';
    if (kind === 'nps') {
      const tier = toTier(text('tier'));
      const asset = toAssetClass(text('assetClass'));
      if (!tier) errors.push('Tier must be "Tier I" or "Tier II"');
      if (!asset) errors.push(`Asset Class must be one of: ${NPS_ASSET_CLASSES.join(', ')}`);
      if (tier && asset) category = `NPS ${tier} - ${asset}`;
    } else {
      category = text('category');
      if (!category) errors.push('Category is required');
    }

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
      if (m === null || Number.isNaN(m) || m < 0) errors.push('Minimum amount must be a number (0 or more)');
      else minInvestment = Math.round(m);
    }

    if (name) {
      const key = name.toLowerCase();
      if (seen.has(key)) errors.push('Duplicate of another row in this file');
      seen.add(key);
    }

    if (errors.length > 0 || rate === null) {
      rows.push({ rowNumber: r, data: null, errors, action: 'invalid' });
      continue;
    }

    const match = existing.find((s) => s.type === schemeType && s.name.trim().toLowerCase() === name.toLowerCase());
    rows.push({
      rowNumber: r,
      errors: [],
      action: match ? 'update' : 'create',
      existingId: match?.id,
      data: {
        name,
        type: schemeType,
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
