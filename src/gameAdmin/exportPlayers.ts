import { GamePlayer } from '../services/gameAdminStore';
import { GAME_LIST, deviceLabel, detailsText } from './games';

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const today = () => new Date().toISOString().slice(0, 10);

const COLS: { header: string; width: number; get: (p: GamePlayer) => string | number }[] = [
  { header: 'Registered', width: 20, get: (p) => when(p.registeredAt) },
  { header: 'Game', width: 28, get: (p) => p.gameName },
  { header: 'Name', width: 22, get: (p) => p.name },
  { header: 'Mobile', width: 13, get: (p) => p.mobile },
  { header: 'Email', width: 26, get: (p) => p.email },
  { header: 'Age', width: 6, get: (p) => p.age || '' },
  { header: 'Language', width: 10, get: (p) => (p.lang === 'ta' ? 'Tamil' : p.lang === 'en' ? 'English' : p.lang) },
  { header: 'Mode', width: 11, get: (p) => p.mode },
  { header: 'Device', width: 18, get: (p) => deviceLabel(p.device) },
  { header: 'Status', width: 10, get: (p) => (p.status === 'finished' ? 'Finished' : 'Started') },
  { header: 'Result', width: 16, get: (p) => p.result || '' },
  { header: 'Score', width: 12, get: (p) => (typeof p.score === 'number' ? p.score : '') },
  { header: 'Finished', width: 20, get: (p) => when(p.finishedAt) },
  { header: 'Details', width: 60, get: (p) => detailsText(p.details) },
];

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportCsv(rows: GamePlayer[]) {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = '﻿' + [COLS.map((c) => q(c.header)).join(','), ...rows.map((p) => COLS.map((c) => q(c.get(p))).join(','))].join('\r\n');
  save(new Blob([text], { type: 'text/csv;charset=utf-8' }), `mcube-game-players-${today()}.csv`);
}

export async function exportExcel(rows: GamePlayer[], filterNote: string) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mcube Game Admin';

  const ws = wb.addWorksheet('Players');
  ws.columns = COLS.map((c) => ({ header: c.header, width: c.width }));
  rows.forEach((p) => ws.addRow(COLS.map((c) => c.get(p))));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.height = 22;
  head.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F3CC9' } };
    cell.alignment = { vertical: 'middle' };
  });
  ws.getColumn(4).numFmt = '@';
  ws.getColumn(12).numFmt = '#,##,##0';
  ws.getColumn(14).alignment = { wrapText: true, vertical: 'top' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLS.length } };

  const sm = wb.addWorksheet('Summary');
  sm.columns = [
    { header: 'Game', width: 32 },
    { header: 'Players', width: 10 },
    { header: 'Finished', width: 10 },
    { header: 'Highest score', width: 15 },
    { header: 'Last played', width: 22 },
  ];
  GAME_LIST.forEach((g) => {
    const list = rows.filter((p) => p.game === g.id);
    const scores = list.map((p) => p.score).filter((s): s is number => typeof s === 'number');
    sm.addRow([g.name, list.length, list.filter((p) => p.status === 'finished').length, scores.length ? Math.max(...scores) : '', when(list[0]?.registeredAt)]);
  });
  sm.addRow([]);
  sm.addRow(['Total', rows.length, rows.filter((p) => p.status === 'finished').length]);
  sm.addRow([]);
  sm.addRow([`Exported ${when(new Date().toISOString())}${filterNote ? ` · ${filterNote}` : ''}`]);
  sm.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sm.getRow(1).eachCell((cell) => (cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F3CC9' } }));
  sm.getColumn(4).numFmt = '#,##,##0';

  const buf = await wb.xlsx.writeBuffer();
  save(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `mcube-game-players-${today()}.xlsx`);
}
