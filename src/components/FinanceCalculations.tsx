import React, { useMemo, useState } from 'react';
import { Calculator, TrendingUp, Coins, GraduationCap, PiggyBank } from 'lucide-react';
import * as fm from '../utils/financeMath';
import { formatInr } from '../utils/currency';
import { NumField } from './NumField';

type Tab = 'future' | 'growth' | 'dividend' | 'pro';

const n = (s: string) => (s.trim() === '' ? NaN : Number(s));
const fmtPct = (x: number, d = 2) => (Number.isFinite(x) ? `${x.toFixed(d)} %` : '-');
const fmtNum = (x: number, d = 2) => (Number.isFinite(x) ? x.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d }) : '-');
const fmtInr = (x: number) => (Number.isFinite(x) ? formatInr(x) : '-');
const parseList = (s: string) => s.split(/[,\s]+/).filter(Boolean).map(Number);

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

// ---------------------------------------------------------------- tab 1: future value
const FutureTab: React.FC = () => {
  const [lump, setLump] = useState('100000');
  const [sip, setSip] = useState('10000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [step, setStep] = useState('0');
  const [infl, setInfl] = useState('6');
  const [goal, setGoal] = useState('10000000');
  const ok = n(rate) >= 0 && n(years) > 0;
  const r = useMemo(
    () => (ok ? fm.futureValue({ lumpsum: n(lump) || 0, sip: n(sip) || 0, ratePct: n(rate), years: n(years), stepUpPct: n(step) || 0, inflationPct: n(infl) || 0 }) : null),
    [lump, sip, rate, years, step, infl, ok]
  );
  const need = ok && n(goal) > 0 ? fm.sipForGoal(n(goal), n(rate), n(years), n(lump) || 0) : NaN;
  const max = r ? Math.max(...r.rows.map((x) => x.value), 1) : 1;
  return (
    <div className="space-y-4">
      <Card title="Future value of a lumpsum + SIP">
        <Grid>
          <NumField label="Lumpsum now (₹)" value={lump} onChange={setLump} />
          <NumField label="Monthly SIP (₹)" value={sip} onChange={setSip} />
          <NumField label="Expected return (% a year)" value={rate} onChange={setRate} suffix="%" />
          <NumField label="Years" value={years} onChange={setYears} />
          <NumField label="Yearly SIP step-up (%)" value={step} onChange={setStep} suffix="%" hint="0 = same SIP every year" />
          <NumField label="Inflation (% a year)" value={infl} onChange={setInfl} suffix="%" />
        </Grid>
        <Formula>{`Lumpsum: FV = P × (1 + r)^t\nSIP: FV = Σ SIP × (1 + i)^months left,  i = (1 + r)^(1/12) − 1  (paid at the start of each month)\nToday's value = FV ÷ (1 + inflation)^t`}</Formula>
        {r && (
          <>
            <Grid>
              <Result label="Future value" value={fmtInr(r.futureValue)} strong />
              <Result label="Amount invested" value={fmtInr(r.invested)} />
              <Result label="Growth value (gain)" value={fmtInr(r.gain)} tone="good" />
              <Result label="Worth in today's money" value={fmtInr(r.realValue)} />
            </Grid>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-1.5 pr-3">Year</th>
                    <th className="pr-3">Invested</th>
                    <th className="pr-3">Value</th>
                    <th className="pr-3">Growth</th>
                    <th className="w-1/3" />
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((x) => (
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
          </>
        )}
      </Card>
      <Card title="Monthly SIP needed for a goal">
        <Grid cols="grid-cols-1 sm:grid-cols-2">
          <NumField label="Goal amount (₹)" value={goal} onChange={setGoal} />
          <Result label={`SIP needed for ${years || '?'} years at ${rate || '?'} %`} value={fmtInr(need)} strong />
        </Grid>
        <Formula>{`SIP = (Goal − Lumpsum × (1 + i)^n) ÷ [ ((1 + i)^n − 1) ÷ i × (1 + i) ]   (uses the lumpsum, rate and years above)`}</Formula>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------- tab 2: growth
const GrowthTab: React.FC = () => {
  const [begin, setBegin] = useState('100000');
  const [end, setEnd] = useState('250000');
  const [years, setYears] = useState('5');
  const [nom, setNom] = useState('12');
  const [infl, setInfl] = useState('6');
  const [rr, setRr] = useState('12');
  const [fee, setFee] = useState('1.5');
  const [amt, setAmt] = useState('1000000');
  const [yrs2, setYrs2] = useState('20');
  const c = fm.cagr(n(begin), n(end), n(years));
  const d = fm.doublingYears(n(rr));
  const drag = fm.costDrag({ lumpsum: n(amt), grossPct: n(nom), expensePct: n(fee), years: n(yrs2) });
  return (
    <div className="space-y-4">
      <Card title="Growth value, absolute return and CAGR">
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <NumField label="Beginning value (₹)" value={begin} onChange={setBegin} />
          <NumField label="Ending value (₹)" value={end} onChange={setEnd} />
          <NumField label="Years held" value={years} onChange={setYears} />
        </Grid>
        <Formula>{`Growth value = End − Begin\nAbsolute return = (End − Begin) ÷ Begin × 100\nCAGR = (End ÷ Begin)^(1 ÷ years) − 1`}</Formula>
        <Grid>
          <Result label="Growth value" value={fmtInr(n(end) - n(begin))} tone={n(end) >= n(begin) ? 'good' : 'bad'} />
          <Result label="Absolute return" value={fmtPct(fm.absoluteReturn(n(begin), n(end)))} />
          <Result label="CAGR (per year)" value={fmtPct(c)} strong />
          <Result label="Growth multiple" value={Number.isFinite(n(end) / n(begin)) ? `${fmtNum(n(end) / n(begin))} ×` : '-'} />
        </Grid>
      </Card>
      <Card title="Real (after inflation) return and doubling time">
        <Grid cols="grid-cols-2 md:grid-cols-4">
          <NumField label="Nominal return (% a year)" value={nom} onChange={setNom} suffix="%" />
          <NumField label="Inflation (% a year)" value={infl} onChange={setInfl} suffix="%" />
          <NumField label="Return for doubling (%)" value={rr} onChange={setRr} suffix="%" />
          <Result label="Real return (Fisher)" value={fmtPct(fm.realReturn(n(nom), n(infl)))} strong />
        </Grid>
        <Formula>{`Real return = (1 + nominal) ÷ (1 + inflation) − 1\nRule of 72: doubling years ≈ 72 ÷ return;  exact = ln 2 ÷ ln(1 + r)`}</Formula>
        <Grid cols="grid-cols-2">
          <Result label="Doubling time (Rule of 72)" value={`${fmtNum(d.rule72)} years`} />
          <Result label="Doubling time (exact)" value={`${fmtNum(d.exact)} years`} />
        </Grid>
      </Card>
      <Card title="What the fund's expense ratio costs you">
        <Grid cols="grid-cols-2 md:grid-cols-4">
          <NumField label="Investment (₹)" value={amt} onChange={setAmt} />
          <NumField label="Expense ratio (% a year)" value={fee} onChange={setFee} suffix="%" />
          <NumField label="Years" value={yrs2} onChange={setYrs2} />
          <Result label="Gross return used" value={fmtPct(n(nom))} />
        </Grid>
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <Result label="Value before costs" value={fmtInr(drag.before)} />
          <Result label="Value after costs" value={fmtInr(drag.after)} strong />
          <Result label="Lost to costs" value={fmtInr(drag.lost)} tone="bad" />
        </Grid>
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

// ---------------------------------------------------------------- tab 4: professional / MBA formulas
const ProTab: React.FC = () => {
  const [cfs, setCfs] = useState('-100000, 30000, 40000, 50000, 60000');
  const [disc, setDisc] = useState('10');
  const [xs, setXs] = useState('2024-01-01, -100000\n2024-07-01, -50000\n2026-01-01, 190000');
  const [pay, setPay] = useState('10000');
  const [prate, setPrate] = useState('8');
  const [pn, setPn] = useState('10');
  const [loan, setLoan] = useState('1000000');
  const [lrate, setLrate] = useState('9');
  const [lyears, setLyears] = useState('20');
  const [rp, setRp] = useState('15');
  const [rf, setRf] = useState('7');
  const [rm, setRm] = useState('12');
  const [beta, setBeta] = useState('1.2');
  const [sd, setSd] = useState('14');
  const [rets, setRets] = useState('12, -4, 18, 9, 22, -8, 15');
  const [eq, setEq] = useState('600');
  const [debt, setDebt] = useState('400');
  const [re, setRe] = useState('14');
  const [rd, setRd] = useState('9');
  const [tc, setTc] = useState('25');

  const list = parseList(cfs);
  const listOk = list.length >= 2 && list.every(Number.isFinite);
  const xl = xs
    .split('\n')
    .map((l) => l.split(',').map((p) => p.trim()))
    .filter((p) => p.length >= 2 && p[0])
    .map((p) => ({ date: new Date(p[0]), amount: Number(p[1]) }))
    .filter((x) => !isNaN(x.date.getTime()) && Number.isFinite(x.amount));
  const ms = fm.meanStd(parseList(rets).filter(Number.isFinite));
  const emi = fm.pmt(n(loan), n(lrate) / 12, n(lyears) * 12);
  const sh = fm.sharpe(n(rp), n(rf), n(sd));
  return (
    <div className="space-y-4">
      <Card title="Capital budgeting: NPV, IRR, payback, profitability index">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-2 block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Cash flows, year 0 first (comma separated)
            <input value={cfs} onChange={(e) => setCfs(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg" />
          </label>
          <NumField label="Discount rate (%)" value={disc} onChange={setDisc} suffix="%" />
        </div>
        <Formula>{`NPV = Σ CFt ÷ (1 + r)^t\nIRR: the rate where NPV = 0\nPayback: time to recover the outlay\nProfitability index = PV of inflows ÷ initial outlay`}</Formula>
        {listOk ? (
          <Grid>
            <Result label="NPV" value={fmtInr(fm.npv(n(disc), list))} strong tone={fm.npv(n(disc), list) >= 0 ? 'good' : 'bad'} />
            <Result label="IRR" value={fmtPct(fm.irr(list))} />
            <Result label="Payback (simple)" value={fm.payback(null, list) === null ? 'not recovered' : `${fmtNum(fm.payback(null, list) as number)} yrs`} />
            <Result label="Payback (discounted)" value={fm.payback(n(disc), list) === null ? 'not recovered' : `${fmtNum(fm.payback(n(disc), list) as number)} yrs`} />
            <Result label="Profitability index" value={fmtNum(fm.profitabilityIndex(n(disc), list))} />
            <Result label="Decision" value={fm.npv(n(disc), list) >= 0 ? 'Accept (NPV ≥ 0)' : 'Reject (NPV < 0)'} />
          </Grid>
        ) : (
          <p className="text-xs font-semibold text-rose-600">Enter at least two numbers, for example -100000, 30000, 40000.</p>
        )}
      </Card>

      <Card title="XIRR (cash flows on dates)">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          One line per cash flow: date (YYYY-MM-DD), amount. Money invested is negative.
          <textarea value={xs} onChange={(e) => setXs(e.target.value)} rows={4} className="mt-1 w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg" />
        </label>
        <Formula>{`Solve Σ CFi ÷ (1 + XIRR)^((di − d0) ÷ 365) = 0`}</Formula>
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <Result label="XIRR (per year)" value={fmtPct(fm.xirr(xl))} strong />
        </Grid>
      </Card>

      <Card title="Time value of money: annuity, perpetuity and loan EMI">
        <Grid>
          <NumField label="Payment each year (₹)" value={pay} onChange={setPay} />
          <NumField label="Rate (% a year)" value={prate} onChange={setPrate} suffix="%" />
          <NumField label="Number of years" value={pn} onChange={setPn} />
          <Result label="PV of annuity" value={fmtInr(fm.pvAnnuity(n(pay), n(prate), n(pn)))} strong />
          <Result label="FV of annuity" value={fmtInr(fm.fvAnnuity(n(pay), n(prate), n(pn)))} />
          <Result label="PV of perpetuity" value={fmtInr(fm.pvPerpetuity(n(pay), n(prate)))} />
        </Grid>
        <Formula>{`PV annuity = C × (1 − (1 + r)^−n) ÷ r\nFV annuity = C × ((1 + r)^n − 1) ÷ r\nPerpetuity = C ÷ r`}</Formula>
        <Grid>
          <NumField label="Loan amount (₹)" value={loan} onChange={setLoan} />
          <NumField label="Loan rate (% a year)" value={lrate} onChange={setLrate} suffix="%" />
          <NumField label="Loan years" value={lyears} onChange={setLyears} />
          <Result label="Monthly EMI" value={fmtInr(emi)} strong />
        </Grid>
        <Formula>{`EMI = P × i ÷ (1 − (1 + i)^−n),  i = annual rate ÷ 12,  n = months`}</Formula>
      </Card>

      <Card title="Risk and return: CAPM, Sharpe, Treynor, Jensen's alpha">
        <Grid>
          <NumField label="Portfolio / fund return (%)" value={rp} onChange={setRp} suffix="%" />
          <NumField label="Risk-free rate (%)" value={rf} onChange={setRf} suffix="%" />
          <NumField label="Market return (%)" value={rm} onChange={setRm} suffix="%" />
          <NumField label="Beta" value={beta} onChange={setBeta} />
          <NumField label="Standard deviation (%)" value={sd} onChange={setSd} suffix="%" />
        </Grid>
        <Formula>{`CAPM expected return = Rf + β (Rm − Rf)\nSharpe = (Rp − Rf) ÷ σ     Treynor = (Rp − Rf) ÷ β\nJensen's alpha = Rp − CAPM expected return`}</Formula>
        <Grid>
          <Result label="CAPM expected return" value={fmtPct(fm.capm(n(rf), n(beta), n(rm)))} />
          <Result label="Sharpe ratio" value={fmtNum(sh)} strong />
          <Result label="Treynor ratio" value={fmtNum(fm.treynor(n(rp), n(rf), n(beta)))} />
          <Result label="Jensen's alpha" value={fmtPct(fm.jensenAlpha(n(rp), n(rf), n(beta), n(rm)))} tone={fm.jensenAlpha(n(rp), n(rf), n(beta), n(rm)) >= 0 ? 'good' : 'bad'} />
        </Grid>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Yearly returns (%) to find the average and risk
          <input value={rets} onChange={(e) => setRets(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg" />
        </label>
        <Grid cols="grid-cols-1 sm:grid-cols-3">
          <Result label="Average return" value={fmtPct(ms.mean)} />
          <Result label="Variance" value={fmtNum(ms.variance)} />
          <Result label="Standard deviation" value={fmtPct(ms.std)} />
        </Grid>
      </Card>

      <Card title="Cost of capital (WACC)">
        <Grid cols="grid-cols-2 md:grid-cols-3">
          <NumField label="Equity value" value={eq} onChange={setEq} />
          <NumField label="Debt value" value={debt} onChange={setDebt} />
          <NumField label="Cost of equity (%)" value={re} onChange={setRe} suffix="%" />
          <NumField label="Cost of debt (%)" value={rd} onChange={setRd} suffix="%" />
          <NumField label="Tax rate (%)" value={tc} onChange={setTc} suffix="%" />
          <Result label="WACC" value={fmtPct(fm.wacc(n(eq), n(debt), n(re), n(rd), n(tc)))} strong />
        </Grid>
        <Formula>{`WACC = E/V × Re + D/V × Rd × (1 − tax),  V = E + D`}</Formula>
      </Card>
    </div>
  );
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'future', label: 'Future value', icon: <PiggyBank className="w-4 h-4" /> },
  { id: 'growth', label: 'Growth value', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'dividend', label: 'Dividend', icon: <Coins className="w-4 h-4" /> },
  { id: 'pro', label: 'Professional (MBA) formulas', icon: <GraduationCap className="w-4 h-4" /> },
];

/** Admin tool: future value, growth value, dividend and professional finance formulas, each with the formula shown */
export const FinanceCalculations: React.FC = () => {
  const [tab, setTab] = useState<Tab>('future');
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Calculator className="w-4 h-4" /> Investment Calculations
        </div>
        <h2 className="text-lg font-black text-slate-900">Future value, growth, dividend and professional finance formulas</h2>
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
      {tab === 'future' && <FutureTab />}
      {tab === 'growth' && <GrowthTab />}
      {tab === 'dividend' && <DividendTab />}
      {tab === 'pro' && <ProTab />}
    </div>
  );
};
