import React, { useEffect, useState } from 'react';
import { ListChecks, Plus, Trash2, Save, ArrowUp, ArrowDown, AlertCircle, Pencil, Check, X } from 'lucide-react';
import { User } from '../types';
import { apiService } from '../services/api';
import {
  HealthCategory,
  HealthQuestion,
  HealthConfig,
  HealthOption,
  AnswerType,
  ANSWER_TYPES,
  DEFAULT_HEALTH_CONFIG,
  cleanHealthConfig,
  hasOptions,
  isScoredQuestion,
  questionType,
} from '../utils/healthCheck';
import { ConfirmModal } from './ConfirmModal';
import { SaveErrorNotice, SaveProblem, describeSaveError } from './SaveErrorNotice';

interface HealthQuestionsAdminProps {
  currentUser: User;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const MAX_QUESTIONS = 200;
const MAX_OPTIONS = 12;

const defaultOptions = (type: AnswerType): HealthOption[] =>
  type === 'checklist'
    ? [
        { id: uid('o'), label: '', score: 50 },
        { id: uid('o'), label: '', score: 50 },
      ]
    : [
        { id: uid('o'), label: '', score: 100 },
        { id: uid('o'), label: '', score: 0 },
      ];

/** Checks the options of one question; returns one message or null */
const optionsProblem = (options: HealthOption[]): string | null => {
  const filled = options.filter((o) => o.label.trim());
  if (filled.length < 2) return 'Add at least two options with a name.';
  if (filled.some((o) => !Number.isFinite(o.score) || o.score < 0 || o.score > 100)) return 'Points must be between 0 and 100.';
  return null;
};

const OptionsEditor: React.FC<{ options: HealthOption[]; onChange: (o: HealthOption[]) => void; type: AnswerType }> = ({
  options,
  onChange,
  type,
}) => (
  <div className="space-y-2">
    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Options and points (0 to 100)</p>
    {options.map((o, i) => (
      <div key={o.id} className="flex items-center gap-2">
        <input
          value={o.label}
          onChange={(e) => onChange(options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))}
          placeholder={`Option ${i + 1}`}
          aria-label={`Option ${i + 1} name`}
          className="flex-1 px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
        />
        <input
          inputMode="numeric"
          value={String(o.score)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^0-9]/g, '') || 0);
            onChange(options.map((x) => (x.id === o.id ? { ...x, score: Math.min(100, n) } : x)));
          }}
          aria-label={`Option ${i + 1} points`}
          className="w-20 px-2 py-2 text-sm font-bold text-center border border-slate-300 rounded-lg"
        />
        <button
          type="button"
          onClick={() => onChange(options.filter((x) => x.id !== o.id))}
          disabled={options.length <= 2}
          title="Remove option"
          className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-30 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => options.length < MAX_OPTIONS && onChange([...options, { id: uid('o'), label: '', score: 0 }])}
        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> Add option
      </button>
      <p className="text-[11px] text-slate-500">
        {type === 'checklist'
          ? `If every option is ticked: ${Math.min(100, options.reduce((n, o) => n + (o.score || 0), 0))} points (maximum 100).`
          : 'Give the best answer 100 points and the weakest 0.'}
      </p>
    </div>
  </div>
);
const MAX_CATEGORIES = 30;

/** Head Incharge and Regional Incharge write the questions shown in the Finance Health Check-up */
export const HealthQuestionsAdmin: React.FC<HealthQuestionsAdminProps> = ({ currentUser, onNotify }) => {
  const allowed = currentUser.role === 'head' || currentUser.role === 'regional_incharge';
  const [loaded, setLoaded] = useState(false);
  const [cats, setCats] = useState<HealthCategory[]>([]);
  const [qs, setQs] = useState<HealthQuestion[]>([]);
  const [savedKey, setSavedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveProblem, setSaveProblem] = useState<SaveProblem | null>(null);

  // add-question form
  const [newText, setNewText] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newReverse, setNewReverse] = useState(false);
  const [newType, setNewType] = useState<AnswerType>('scale');
  const [newOptions, setNewOptions] = useState<HealthOption[]>(defaultOptions('choice'));
  const [newRequired, setNewRequired] = useState(false);
  const [editOptions, setEditOptions] = useState<HealthOption[]>([]);
  // add-category form
  const [catLabel, setCatLabel] = useState('');
  const [catIntro, setCatIntro] = useState('');
  const [catLow, setCatLow] = useState('');
  const [catMid, setCatMid] = useState('');
  const [catHigh, setCatHigh] = useState('');
  // editing
  const [editQ, setEditQ] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [toDeleteCat, setToDeleteCat] = useState<HealthCategory | null>(null);

  const keyOf = (c: HealthCategory[], q: HealthQuestion[]) => JSON.stringify({ c, q });

  useEffect(() => {
    apiService
      .getHealthConfig()
      .then((cfg: HealthConfig | null) => {
        const c = cfg?.categories || [];
        const q = cfg?.questions || [];
        setCats(c);
        setQs(q);
        setSavedKey(keyOf(c, q));
        setNewCat(c[0]?.id || '');
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  if (!allowed) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-sm font-semibold text-slate-600">
        Only Head Incharge and Regional Incharge can manage the health check-up questions.
      </div>
    );
  }

  const dirty = keyOf(cats, qs) !== savedKey;

  const loadStarter = () => {
    setCats(DEFAULT_HEALTH_CONFIG.categories.map((c) => ({ ...c })));
    setQs(DEFAULT_HEALTH_CONFIG.questions.map((q) => ({ ...q })));
    setNewCat(DEFAULT_HEALTH_CONFIG.categories[0]?.id || '');
  };

  const addCategory = () => {
    setError(null);
    if (!catLabel.trim()) return setError('Enter a name for the topic.');
    if (cats.length >= MAX_CATEGORIES) return setError(`You can have at most ${MAX_CATEGORIES} topics.`);
    const c: HealthCategory = {
      id: uid('cat'),
      label: catLabel.trim(),
      intro: catIntro.trim() || `Questions about ${catLabel.trim().toLowerCase()}.`,
      low: catLow.trim() || 'Work on this area step by step and speak to an adviser if needed.',
      mid: catMid.trim() || 'You are doing reasonably well here. A few improvements will help.',
      high: catHigh.trim() || 'You are doing well here. Keep it up.',
    };
    setCats((p) => [...p, c]);
    setNewCat(c.id);
    setCatLabel('');
    setCatIntro('');
    setCatLow('');
    setCatMid('');
    setCatHigh('');
  };

  const changeNewType = (t: AnswerType) => {
    setNewType(t);
    setNewReverse(false);
    setNewRequired(false);
    if (ANSWER_TYPES.find((x) => x.value === t)?.hasOptions) setNewOptions(defaultOptions(t));
  };

  const addQuestion = () => {
    setError(null);
    if (!newCat) return setError('Add a topic first, then choose it for the question.');
    if (newText.trim().length < 8) return setError('Write the question in full (at least 8 characters).');
    if (qs.length >= MAX_QUESTIONS) return setError(`You can have at most ${MAX_QUESTIONS} questions.`);
    const typeInfo = ANSWER_TYPES.find((x) => x.value === newType)!;
    let options: HealthOption[] | undefined;
    if (typeInfo.hasOptions) {
      const problem = optionsProblem(newOptions);
      if (problem) return setError(problem);
      options = newOptions.filter((o) => o.label.trim()).map((o) => ({ ...o, label: o.label.trim() }));
    }
    const q: HealthQuestion = { id: uid('q'), category: newCat, text: newText.trim() };
    if (newType === 'scale' && newReverse) q.reverse = true;
    if (newType !== 'scale') q.type = newType;
    if (options) q.options = options;
    if ((newType === 'text' || newType === 'checklist') && newRequired) q.required = true;
    setQs((p) => [...p, q]);
    setNewText('');
    setNewReverse(false);
    setNewRequired(false);
    if (typeInfo.hasOptions) setNewOptions(defaultOptions(newType));
  };

  const move = (id: string, dir: -1 | 1) =>
    setQs((p) => {
      const i = p.findIndex((q) => q.id === id);
      const cat = p[i].category;
      // swap with the nearest question of the same topic
      let j = i + dir;
      while (j >= 0 && j < p.length && p[j].category !== cat) j += dir;
      if (j < 0 || j >= p.length) return p;
      const copy = p.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const removeCategory = (c: HealthCategory) => {
    setCats((p) => p.filter((x) => x.id !== c.id));
    setQs((p) => p.filter((q) => q.category !== c.id));
    if (newCat === c.id) setNewCat(cats.find((x) => x.id !== c.id)?.id || '');
    setToDeleteCat(null);
  };

  const save = async () => {
    setError(null);
    setSaveProblem(null);
    const unscored = cats.find((c) => {
      const list = qs.filter((q) => q.category === c.id);
      return list.length > 0 && !list.some(isScoredQuestion);
    });
    if (unscored) {
      setError(
        `The topic "${unscored.label}" has only text-box questions. Add at least one scale, choice, list or check-list question to it so it can have a score.`
      );
      return;
    }
    const cleaned = cleanHealthConfig({ categories: cats, questions: qs });
    const dropped = cats.length - cleaned.categories.length;
    setSaving(true);
    try {
      const saved = await apiService.saveHealthConfig(cleaned, `${currentUser.name} (${currentUser.designation})`);
      setCats(saved.categories);
      setQs(saved.questions);
      setSavedKey(keyOf(saved.categories, saved.questions));
      onNotify(
        dropped > 0
          ? `Questions published. ${dropped} topic(s) without questions were not saved.`
          : 'Questions published. The Finance Health Check-up now shows them.',
        'success'
      );
    } catch (e) {
      setSaveProblem(describeSaveError(e, 'The questions'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ListChecks className="w-4 h-4" />
            Finance Health Check-up
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Health Check-up Questions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Only the questions you add here are asked in the Finance Health Check-up. For each question you choose how the customer
            answers: an agree / disagree scale, a choice, a list box, a check list or a text box. For choices, lists and check lists you
            set the points of each option.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Publishing...' : 'Publish questions'}
        </button>
      </div>

      {/* Only one error is shown at a time */}
      {saveProblem ? (
        <SaveErrorNotice problem={saveProblem} />
      ) : (
        error && (
          <p className="flex items-start gap-1.5 text-xs font-semibold text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )
      )}
      {dirty && <p className="text-xs font-semibold text-amber-700">You have changes that are not published yet.</p>}

      {loaded && qs.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
          <p className="font-bold">No questions yet - the Health Check-up shows &quot;being prepared&quot; until you publish some.</p>
          <button
            type="button"
            onClick={loadStarter}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
          >
            Load the starter questions (you can edit them)
          </button>
        </div>
      )}

      {/* Add a question */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900">Add a question</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Question (a statement)</label>
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. I review my investments at least once a year."
              className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Topic</label>
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
            >
              {cats.length === 0 && <option value="">Add a topic first</option>}
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Answer type</label>
            <select
              value={newType}
              onChange={(e) => changeNewType(e.target.value as AnswerType)}
              aria-label="Answer type"
              className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
            >
              {ANSWER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-500 sm:pt-6">{ANSWER_TYPES.find((t) => t.value === newType)?.help}</p>
        </div>
        {ANSWER_TYPES.find((t) => t.value === newType)?.hasOptions && (
          <OptionsEditor options={newOptions} onChange={setNewOptions} type={newType} />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {newType === 'scale' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={newReverse} onChange={(e) => setNewReverse(e.target.checked)} />
              Negative habit (agreeing lowers the score)
            </label>
          )}
          {(newType === 'text' || newType === 'checklist') && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} />
              The customer must answer this question
            </label>
          )}
          {newType !== 'scale' && newType !== 'text' && newType !== 'checklist' && <span />}
          <button
            type="button"
            onClick={addQuestion}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add question
          </button>
        </div>
      </div>

      {/* Add a topic */}
      <details className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <summary className="text-sm font-bold text-slate-900 cursor-pointer">Add a new topic (group of questions)</summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <input
            value={catLabel}
            onChange={(e) => setCatLabel(e.target.value)}
            placeholder="Topic name, e.g. Retirement Planning"
            className="px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
          />
          <input
            value={catIntro}
            onChange={(e) => setCatIntro(e.target.value)}
            placeholder="One line shown above the questions"
            className="px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
          />
          <input
            value={catLow}
            onChange={(e) => setCatLow(e.target.value)}
            placeholder="Advice when the score is low"
            className="px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
          />
          <input
            value={catMid}
            onChange={(e) => setCatMid(e.target.value)}
            placeholder="Advice when the score is medium"
            className="px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
          />
          <input
            value={catHigh}
            onChange={(e) => setCatHigh(e.target.value)}
            placeholder="Advice when the score is high"
            className="px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg sm:col-span-2"
          />
        </div>
        <button
          type="button"
          onClick={addCategory}
          className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add topic
        </button>
      </details>

      {/* Existing */}
      {cats.map((c) => {
        const list = qs.filter((q) => q.category === c.id);
        return (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">
                  {c.label} <span className="text-[11px] font-bold text-slate-400">({list.length})</span>
                </p>
                <p className="text-[11px] text-slate-500">{c.intro}</p>
              </div>
              <button
                type="button"
                onClick={() => setToDeleteCat(c)}
                title="Delete this topic and its questions"
                className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {list.length === 0 ? (
              <p className="px-5 py-3 text-xs text-amber-700 font-semibold">No questions in this topic. Topics without questions are not saved.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {list.map((q) => (
                  <li key={q.id} className="px-5 py-2.5 flex items-start gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      {editQ === q.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="flex-1 px-2 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editText.trim().length < 8) return setError('Write the question in full (at least 8 characters).');
                                if (hasOptions(q)) {
                                  const problem = optionsProblem(editOptions);
                                  if (problem) return setError(problem);
                                }
                                setError(null);
                                setQs((p) =>
                                  p.map((x) =>
                                    x.id === q.id
                                      ? {
                                          ...x,
                                          text: editText.trim(),
                                          ...(hasOptions(q)
                                            ? { options: editOptions.filter((o) => o.label.trim()).map((o) => ({ ...o, label: o.label.trim() })) }
                                            : {}),
                                        }
                                      : x
                                  )
                                );
                                setEditQ(null);
                              }}
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-pointer"
                              aria-label="Save edit"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditQ(null)}
                              className="p-1.5 rounded-lg text-slate-600 bg-slate-50 border border-slate-200 cursor-pointer"
                              aria-label="Cancel edit"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {hasOptions(q) && <OptionsEditor options={editOptions} onChange={setEditOptions} type={questionType(q)} />}
                        </div>
                      ) : (
                        <p className="font-semibold text-slate-800">{q.text}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          {ANSWER_TYPES.find((t) => t.value === questionType(q))?.label}
                        </span>
                        {hasOptions(q) && q.options && (
                          <span className="ml-2">{q.options.map((o) => `${o.label} (${o.score})`).join(' • ')}</span>
                        )}
                        {questionType(q) === 'text' && <span className="ml-2">Not scored</span>}
                      </p>
                      {questionType(q) === 'scale' && (
                        <label className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!q.reverse}
                            onChange={(e) => setQs((p) => p.map((x) => (x.id === q.id ? { ...x, reverse: e.target.checked || undefined } : x)))}
                          />
                          Negative habit (agreeing lowers the score)
                        </label>
                      )}
                      {(questionType(q) === 'text' || questionType(q) === 'checklist') && (
                        <label className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!q.required}
                            onChange={(e) => setQs((p) => p.map((x) => (x.id === q.id ? { ...x, required: e.target.checked || undefined } : x)))}
                          />
                          The customer must answer this question
                        </label>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => move(q.id, -1)} title="Move up" className="p-1.5 rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => move(q.id, 1)} title="Move down" className="p-1.5 rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditQ(q.id);
                          setEditText(q.text);
                          setEditOptions(q.options ? q.options.map((o) => ({ ...o })) : []);
                        }}
                        title="Edit question"
                        className="p-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQs((p) => p.filter((x) => x.id !== q.id))}
                        title="Delete question"
                        className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <p className="text-[11px] text-slate-500">
        Reports that were already taken keep the questions the person answered, so changing questions never changes old reports.
      </p>

      <ConfirmModal
        isOpen={!!toDeleteCat}
        title="Delete this topic?"
        message={`"${toDeleteCat?.label}" and all its questions will be removed from the list. This is saved only when you publish.`}
        confirmLabel="Delete topic"
        onConfirm={() => toDeleteCat && removeCategory(toDeleteCat)}
        onCancel={() => setToDeleteCat(null)}
      />
    </div>
  );
};
