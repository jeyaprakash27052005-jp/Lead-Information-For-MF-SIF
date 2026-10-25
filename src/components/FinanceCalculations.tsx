import React, { useMemo, useState } from 'react';
import { Calculator, TrendingUp, Coins, PiggyBank, Wallet, Repeat } from 'lucide-react';
import * as fm from '../utils/financeMath';
import { formatInr } from '../utils/currency';
import { NumField } from './NumField';

type Tab = 'lump-future' | 'sip-future' | 'lump-growth' | 'sip-growth' | 'dividend';

const n = (s: string) => (s.trim() === '' ? NaN : Number(s));
const fmtPct = (x: number, d = 2) => (Number.isFinite(x) ? `${x.toFixed(d)} %` : '-');
const fmtNum = (x: number, d = 2) => (Number.isFinite(x) ? x.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d }) : '-');
const fmtInr = (x: number) => (Number.isFinite(x) ? formatInr(x) : '-');

const Result: React.FC<{ label: string; value: string; strong?: boolean; tone?: 'good' | 'bad' }> = ({ label, value, strong, tone }) => (
  <div className={`rounded-xl border p-3 ${strong ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}>
    <p className={`text-[10px] font-bold uppercase tracking-wider ${strong ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
    <p className={`text-base font-black mt-0.5 ${strong ? '' : tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const Formula: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 whitespace-pre-line">{children}</p>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
    <p className="text-sm font-black text-slate-900">{title}</p>
    {children}
  </div>
);

const Grid: React.FC<{ children: React.ReactNode; cols?: string }> = ({ children, cols = 'grid-cols-2 md:grid-cols-4' }) => <div className={`grid gap-3 ${cols}`}>{children}</div>;

const YearTable: React.FC<{ rows: fm.YearRow[]; investedLabel?: string }> = ({ rows, investedLabel = 'Invested' }) => {
  const max = Math.max(...rows.map((x) => x.value), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-1.5 pr-3">Year</th>
            <th className="pr-3">{investedLabel}</th>
            <th className="pr-3">Value</th>
            <th className="pr-3">Growth</th>
            <th className="w-1/3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.year} className="border-b border-slate-100">
              <td className="py-1.5 pr-3 font-bold">{fmtNum(x.year, x.year % 1 ? 1 : 0)}</td>
              <td className="pr-3">{fmtInr(x.invested)}</td>
              <td className="pr-3 font-bold">{fmtInr(x.value)}</td>
              <td className="pr-3 text-emerald-700">{fmtInr(x.value - x.invested)}</td>
              <td>
                <div className="h-2 rounded bg-slate-100 overflow-hidden flex">
                  <div className="bg-slate-400" style={{ width: `${(x.invested / max) * 100}%` }} />
                  <div className="bg-emerald-500" style={{ width: `${(Math.max(x.value - x.invested, 0) / max) * 100}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------- Lumpsum: future value
const LumpsumFutureTab: React.FC = () => {
  const [amt, setAmt] = useState('100000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [infl, setInfl] = useState('6');
  const ok = n(amt) > 0 && n(rate) >= 0 && n(years) > 0;
  const r = useMemo(() => (ok ? fm.lumpsumRows({ lumpsum: n(amt), ratePct: n(rate), years: n(years), inflationPct: n(infl) || 0 }) : null), [amt, rate, years, infl, ok]);
  return (
    <Card title="Lumpsum: future value (one-time investment)">
      <Grid>
        <NumField label="Lumpsum amount (₹)" value={amt} onChange={setAmt} />
        <NumField label="Expected return (% a year)" value={rate} onChange={setRate} suffix="%" />
        <NumField label="Years" value={years} onChange={setYears} />
        <NumField label="Inflation (% a year)" value={infl} onChange={setInfl} suffix="%" />
      </Grid>
      <Formula>{`FV = P × (1 + r)^t\nToday's value = FV ÷ (1 + inflation)^t`}</Formula>
      {r ? (
        <>
          <Grid>
            <Result label="Future value" value={fmtInr(r.futureValue)} strong />
            <Result label="Amount invested" value={fmtInr(n(amt))} />
            <Result label="Growth value (gain)" value={fmtInr(r.gain)} tone="good" />
            <Result label="Worth in today's money" value={fmtInr(r.realValue)} />
          </Grid>
          <YearTable rows={r.rows} />
        </>
      ) : (
        <p className="text-xs font-semibold text-rose-600">Enter the amount, the return and the years.</p>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------- SIP: future value
const SipFutureTab: React.FC = () => {
  const [sip, setSip] = useState('10000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [step, setStep] = useState('0');
  const [infl, setInfl] = useState('6');
  const [goal, setGoal] = useState('10000000');
  const ok = n(sip) > 0 && n(rate) >= 0 && n(years) > 0;
  const r = useMemo(() => (ok ? fm.futureValue({ lumpsum: 0, sip: n(sip), ratePct: n(rate), years: n(years), stepUpPct: n(step) || 0, inflationPct: n(infl) || 0 }) : null), [sip, rate, years, step, infl, ok]);
  const need = n(rate) >= 0 && n(years) > 0 && n(goal) > 0 ? fm.sipForGoal(n(goal), n(rate), n(years)) : NaN;
  return (
    <div className="space-y-4">
      <Card title="SIP: future value (monthly investment)">
        <Grid>
          <NumField label="Monthly SIP (₹)" value={sip} onChange={setSip} />
          <NumField label="Expected return (% a year)" value={rate} onChange={setRate} suffix="%" />
          <NumField label="Years" value={years} onChange={setYears} />
          <NumField label="Yearly SIP step-up (%)" value={step} onChange={setStep} suffix="%" hint="0 = same SIP every year" />
          <NumField label="Inflation (% a year)" value={infl} onChange={setInfl} suffix="%" />
        </Grid>
        <Formula>{`FV = Σ SIP × (1 + i)^(months left),  i = (1 + r)^(1/12) − 1  (paid at the start of each month)\nToday's value = FV ÷ (1 + inflation)^t`}</Formula>
        {r ? (
          <>
            <Grid>
              <Result label="Future value" value={fmtInr(r.futureValue)} strong />
              <Result label="Total invested" value={fmtInr(r.invested)} />
              <Result label="Growth value (gain)" value={fmtInr(r.gain)} tone="good" />
              <Result label="Worth in today's money" value={fmtInr(r.realValue)} />
            </Grid>
            <YearTable rows={r.rows} investedLabel="Invested so far" />
          </>
        ) : (
          <p className="text-xs font-semibold text-rose-600">Enter the SIP amount, the return and the years.</p>
        )}
      </Card>
      <Card title="Monthly SIP needed for a goal">
        <Grid cols="grid-cols-1 sm:grid-cols-2">
          <NumField label="Goal amount (₹)" value={goal} onChange={setGoal} />
          <Result label={`SIP needed for ${years || '?'} years at ${rate || '?'} %`} value={fmtInr(need)} strong />
        </Grid>
        <Formula>{`SIP = Goal ÷ [ ((1 + i)^n − 1) ÷ i × (1 + i) ]   (return and years from the box above)`}</Formula>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------- Lumpsum: growth
const LumpsumGrowthTab: React.FC = () => {
  const [begin, setBegin] = useState('100000');
  const [end, setEnd] = useState('250000');
  const [years, setYears] = useState('5');
  const [nom, setNom] = useState('12');
  const [infl, setInfl] = useState('6');
  const [fee, setFee] = useState('1.5');
  const [yrs2, setYrs2] = useState('20');
  const d = fm.doublingYears(n(nom));
  const drag = fm.costDrag({ lumpsum: n(begin), grossPct: n(nom), expensePct: n(fee), years: n(yrs2) });
  return (
    <div className="space-y-4">
      <Card title="Lumpsum: growth value, absolute return and CAGR">
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <NumField label="Amount invested (₹)" value={begin} onChange={setBegin} />
          <NumField label="Value now / at the end (₹)" value={end} onChange={setEnd} />
          <NumField label="Years held" value={years} onChange={setYears} />
        </Grid>
        <Formula>{`Growth value = End − Begin\nAbsolute return = (End − Begin) ÷ Begin × 100\nCAGR = (End ÷ Begin)^(1 ÷ years) − 1`}</Formula>
        <Grid>
          <Result label="Growth value" value={fmtInr(n(end) - n(begin))} tone={n(end) >= n(begin) ? 'good' : 'bad'} />
          <Result label="Absolute return" value={fmtPct(fm.absoluteReturn(n(begin), n(end)))} />
          <Result label="CAGR (per year)" value={fmtPct(fm.cagr(n(begin), n(end), n(years)))} strong />
          <Result label="Growth multiple" value={Number.isFinite(n(end) / n(begin)) ? `${fmtNum(n(end) / n(begin))} ×` : '-'} />
        </Grid>
      </Card>
      <Card title="Lumpsum: real return, doubling time and cost of the fund">
        <Grid cols="grid-cols-2 md:grid-cols-4">
          <NumField label="Return (% a year)" value={nom} onChange={setNom} suffix="%" />
          <NumField label="Inflation (% a year)" value={infl} onChange={setInfl} suffix="%" />
          <NumField label="Expense ratio (% a year)" value={fee} onChange={setFee} suffix="%" />
          <NumField label="Years for the cost check" value={yrs2} onChange={setYrs2} />
        </Grid>
        <Formula>{`Real return = (1 + nominal) ÷ (1 + inflation) − 1\nRule of 72: doubling years ≈ 72 ÷ return;  exact = ln 2 ÷ ln(1 + r)\nCost of the fund = value at gross return − value at (return − expense ratio)`}</Formula>
        <Grid>
          <Result label="Real return (Fisher)" value={fmtPct(fm.realReturn(n(nom), n(infl)))} strong />
          <Result label="Doubles in (Rule of 72)" value={`${fmtNum(d.rule72)} years`} />
          <Result label="Doubles in (exact)" value={`${fmtNum(d.exact)} years`} />
          <Result label="Lost to fund costs" value={fmtInr(drag.lost)} tone="bad" />
          <Result label="Value before costs" value={fmtInr(drag.before)} />
          <Result label="Value after costs" value={fmtInr(drag.after)} />
        </Grid>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------- SIP: growth
const SipGrowthTab: React.FC = () => {
  const [sip, setSip] = useState('10000');
  const [years, setYears] = useState('5');
  const [value, setValue] = useState('800000');
  const [rate, setRate] = useState('12');
  const [infl, setInfl] = useState('6');
  const months = Math.round(n(years) * 12);
  const invested = n(sip) * months;
  const ret = fm.sipReturn(n(sip), n(years), n(value));
  const ok = n(sip) > 0 && n(years) > 0;
  const real = fm.realReturn(n(rate), n(infl));
  return (
    <div className="space-y-4">
      <Card title="SIP: growth value and the return it earned">
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <NumField label="Monthly SIP (₹)" value={sip} onChange={setSip} />
          <NumField label="Years of SIP" value={years} onChange={setYears} />
          <NumField label="Value of the SIP now (₹)" value={value} onChange={setValue} />
        </Grid>
        <Formula>{`Total invested = SIP × months\nGrowth value = Value now − Total invested\nAbsolute return = Growth value ÷ Total invested × 100\nYearly return: the r at which a SIP of this size for this long grows to the value now`}</Formula>
        {ok ? (
          <Grid>
            <Result label="Total invested" value={fmtInr(invested)} />
            <Result label="Growth value" value={fmtInr(n(value) - invested)} tone={n(value) >= invested ? 'good' : 'bad'} />
            <Result label="Absolute return" value={fmtPct(fm.absoluteReturn(invested, n(value)))} />
            <Result label="Yearly return earned" value={fmtPct(ret)} strong />
          </Grid>
        ) : (
          <p className="text-xs font-semibold text-rose-600">Enter the SIP amount, the years and the value now.</p>
        )}
      </Card>
      <Card title="SIP: real return after inflation">
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <NumField label="Return (% a year)" value={rate} onChange={setRate} suffix="%" />
          <NumField label="Inflation (% a year)" value={infl} onChange={setInfl} suffix="%" />
          <Result label="Real return (Fisher)" value={fmtPct(real)} strong />
        </Grid>
        <Formula>{`Real return = (1 + nominal) ÷ (1 + inflation) − 1`}</Formula>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------- tab 3: dividends
const DividendTab: React.FC = () => {
  const [units, setUnits] = useState('1000');
  const [dps, setDps] = useState('2');
  const [nav, setNav] = useState('50');
  const [tax, setTax] = useState('10');
  const [perYear, setPerYear] = useState('4');
  const [avgNav, setAvgNav] = useState('50');
  const [b, setB] = useState('40');
  const [e, setE] = useState('50');
  const [dsum, setDsum] = useState('6');
  const [yrs, setYrs] = useState('3');
  const d = fm.dividend({ units: n(units), dps: n(dps), navBefore: n(nav), taxPct: n(tax) || 0 });
  const t = fm.totalReturnWithDividends({ beginNav: n(b), endNav: n(e), dividendsPerUnit: n(dsum) || 0, years: n(yrs) });
  return (
    <div className="space-y-4">
      <Card title="Dividend (IDCW) payout and reinvestment">
        <Grid>
          <NumField label="Units held" value={units} onChange={setUnits} />
          <NumField label="Dividend per unit (₹)" value={dps} onChange={setDps} />
          <NumField label="NAV before dividend (₹)" value={nav} onChange={setNav} />
          <NumField label="Tax on dividend (%)" value={tax} onChange={setTax} suffix="%" hint="Enter the investor's own rate" />
        </Grid>
        <Formula>{`Dividend = units × dividend per unit\nYield = dividend per unit ÷ NAV before\nNAV after = NAV before − dividend per unit\nReinvested units = net dividend ÷ NAV after`}</Formula>
        <Grid>
          <Result label="Gross dividend" value={fmtInr(d.gross)} strong />
          <Result label="Tax" value={fmtInr(d.tax)} tone="bad" />
          <Result label="Net dividend" value={fmtInr(d.net)} tone="good" />
          <Result label="Dividend yield" value={fmtPct(d.yieldPct)} />
          <Result label="NAV after dividend" value={fmtInr(d.navAfter)} />
          <Result label="Units if reinvested" value={fmtNum(d.reinvestUnits, 3)} />
          <Result label="Total units then" value={fmtNum(d.totalUnitsAfterReinvest, 3)} />
          <Result label="Value after reinvesting" value={fmtInr(d.valueAfterReinvest)} />
        </Grid>
        <p className="text-[11px] text-slate-500">The NAV falls by the dividend paid, so a dividend is a part of your own money paid out, not extra growth.</p>
      </Card>
      <Card title="Annual dividend yield">
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <NumField label="Dividend per unit paid in a year (₹)" value={perYear} onChange={setPerYear} />
          <NumField label="Average NAV in the year (₹)" value={avgNav} onChange={setAvgNav} />
          <Result label="Annual dividend yield" value={fmtPct(fm.annualDividendYield(n(perYear), n(avgNav)))} strong />
        </Grid>
      </Card>
      <Card title="Total return including dividends">
        <Grid cols="grid-cols-2 md:grid-cols-4">
          <NumField label="Beginning NAV (₹)" value={b} onChange={setB} />
          <NumField label="Ending NAV (₹)" value={e} onChange={setE} />
          <NumField label="Dividends received per unit (₹)" value={dsum} onChange={setDsum} />
          <NumField label="Years" value={yrs} onChange={setYrs} />
        </Grid>
        <Formula>{`Total return = (End NAV + dividends − Begin NAV) ÷ Begin NAV\nAnnual = ((End NAV + dividends) ÷ Begin NAV)^(1 ÷ years) − 1`}</Formula>
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <Result label="Price return only" value={fmtPct(t.priceOnly)} />
          <Result label="Total return with dividends" value={fmtPct(t.total)} strong />
          <Result label="Per year (with dividends)" value={fmtPct(t.annual)} />
        </Grid>
      </Card>
    </div>
  );
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'lump-future', label: 'Lumpsum: future value', icon: <Wallet className="w-4 h-4" /> },
  { id: 'sip-future', label: 'SIP: future value', icon: <PiggyBank className="w-4 h-4" /> },
  { id: 'lump-growth', label: 'Lumpsum: growth', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'sip-growth', label: 'SIP: growth', icon: <Repeat className="w-4 h-4" /> },
  { id: 'dividend', label: 'Dividend', icon: <Coins className="w-4 h-4" /> },
];

/** Admin tool (Head, Regional and Area Incharge only): lumpsum and SIP future value and growth, and dividends, each with the formula shown */
export const FinanceCalculations: React.FC = () => {
  const [tab, setTab] = useState<Tab>('lump-future');
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Calculator className="w-4 h-4" /> Investment Calculations
        </div>
        <h2 className="text-lg font-black text-slate-900">Future value, growth and dividend: lumpsum and SIP shown separately</h2>
        <p className="text-xs text-slate-500 mt-0.5">For explaining numbers to customers. Every result shows the formula used. Projections are estimates and not guaranteed returns.</p>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer border ${tab === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === 'lump-future' && <LumpsumFutureTab />}
      {tab === 'sip-future' && <SipFutureTab />}
      {tab === 'lump-growth' && <LumpsumGrowthTab />}
      {tab === 'sip-growth' && <SipGrowthTab />}
      {tab === 'dividend' && <DividendTab />}
    </div>
  );
};
