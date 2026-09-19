import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Lightbulb, Play, Plus, Trash2, XCircle } from 'lucide-react';

type Relation = '<=' | '>=';
interface Constraint { id: number; firstCoefficient: number; secondCoefficient: number; relation: Relation; rightHandSide: number; }
interface SolutionPoint { firstVariable: number; secondVariable: number; objectiveValue: number; }
interface LinearProgrammingModuleProps { onBack: () => void; }

const initialConstraints: Constraint[] = [
  { id: 1, firstCoefficient: 2, secondCoefficient: 1, relation: '<=', rightHandSide: 18 },
  { id: 2, firstCoefficient: 2, secondCoefficient: 3, relation: '<=', rightHandSide: 42 },
  { id: 3, firstCoefficient: 3, secondCoefficient: 1, relation: '<=', rightHandSide: 24 },
];

function solveModel(objectiveFirst: number, objectiveSecond: number, objective: 'maximize' | 'minimize', constraints: Constraint[]) {
  const lines = constraints.map((constraint) => ({ firstCoefficient: constraint.firstCoefficient, secondCoefficient: constraint.secondCoefficient, rightHandSide: constraint.rightHandSide }));
  lines.push({ firstCoefficient: 1, secondCoefficient: 0, rightHandSide: 0 });
  lines.push({ firstCoefficient: 0, secondCoefficient: 1, rightHandSide: 0 });
  const candidates: SolutionPoint[] = [{ firstVariable: 0, secondVariable: 0, objectiveValue: 0 }];
  for (let firstIndex = 0; firstIndex < lines.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < lines.length; secondIndex += 1) {
      const firstLine = lines[firstIndex]; const secondLine = lines[secondIndex];
      const determinant = firstLine.firstCoefficient * secondLine.secondCoefficient - secondLine.firstCoefficient * firstLine.secondCoefficient;
      if (Math.abs(determinant) < 0.000001) continue;
      const firstVariable = (firstLine.rightHandSide * secondLine.secondCoefficient - secondLine.rightHandSide * firstLine.secondCoefficient) / determinant;
      const secondVariable = (firstLine.firstCoefficient * secondLine.rightHandSide - secondLine.firstCoefficient * firstLine.rightHandSide) / determinant;
      if (firstVariable < -0.000001 || secondVariable < -0.000001) continue;
      const feasible = constraints.every((constraint) => {
        const leftSide = constraint.firstCoefficient * firstVariable + constraint.secondCoefficient * secondVariable;
        return constraint.relation === '<=' ? leftSide <= constraint.rightHandSide + 0.000001 : leftSide >= constraint.rightHandSide - 0.000001;
      });
      if (feasible) candidates.push({ firstVariable: Math.max(0, firstVariable), secondVariable: Math.max(0, secondVariable), objectiveValue: objectiveFirst * firstVariable + objectiveSecond * secondVariable });
    }
  }
  const best = candidates.reduce((currentBest, candidate) => objective === 'maximize' ? candidate.objectiveValue > currentBest.objectiveValue ? candidate : currentBest : candidate.objectiveValue < currentBest.objectiveValue ? candidate : currentBest);
  return { best, candidates };
}

export default function LinearProgrammingModule({ onBack }: LinearProgrammingModuleProps) {
  const [objective, setObjective] = useState<'maximize' | 'minimize'>('maximize');
  const [objectiveFirst, setObjectiveFirst] = useState(5);
  const [objectiveSecond, setObjectiveSecond] = useState(4);
  const [constraints, setConstraints] = useState<Constraint[]>(initialConstraints);
  const [hasSolved, setHasSolved] = useState(false);
  const result = useMemo(() => solveModel(objectiveFirst, objectiveSecond, objective, constraints), [objectiveFirst, objectiveSecond, objective, constraints]);
  const graphMaxX = Math.max(10, ...constraints.map((constraint) => constraint.firstCoefficient > 0 ? constraint.rightHandSide / constraint.firstCoefficient : 0), result.best.firstVariable * 1.25);
  const graphMaxY = Math.max(10, ...constraints.map((constraint) => constraint.secondCoefficient > 0 ? constraint.rightHandSide / constraint.secondCoefficient : 0), result.best.secondVariable * 1.25);
  const graphWidth = 520;
  const graphHeight = 300;
  const graphPadding = 34;
  const graphX = (value: number) => graphPadding + (value / graphMaxX) * (graphWidth - graphPadding * 1.5);
  const graphY = (value: number) => graphHeight - graphPadding - (value / graphMaxY) * (graphHeight - graphPadding * 1.5);
  const updateConstraint = (id: number, field: keyof Constraint, value: number | Relation) => { setConstraints((currentConstraints) => currentConstraints.map((constraint) => constraint.id === id ? { ...constraint, [field]: value } : constraint)); setHasSolved(false); };
  const addConstraint = () => { const nextId = Math.max(...constraints.map((constraint) => constraint.id), 0) + 1; setConstraints([...constraints, { id: nextId, firstCoefficient: 1, secondCoefficient: 1, relation: '<=', rightHandSide: 10 }]); setHasSolved(false); };
  const removeConstraint = (id: number) => { if (constraints.length <= 2) return; setConstraints(constraints.filter((constraint) => constraint.id !== id)); setHasSolved(false); };

  return (
    <div className="lp-module solver-drawer space-y-5" aria-label="Linear programming module">
      <style>{`
        .lp-module {
          --lp-surface: rgba(255, 255, 255, 0.82);
          --lp-panel-soft: rgba(236, 244, 241, 0.9);
          --lp-panel-cyan: rgba(204, 247, 241, 0.9);
          --lp-border: rgba(148, 163, 184, 0.32);
          --lp-text: #0f172a;
          --lp-muted: #475569;
          --lp-input-bg: rgba(15, 23, 42, 0.94);
          --lp-input-text: #f8fafc;
        }
        .lp-module .glass-panel,
        .lp-module .bg-slate-950\/80,
        .lp-module .bg-slate-950\/35,
        .lp-module .rounded-xl {
          background: var(--lp-surface) !important;
          border-color: var(--lp-border) !important;
          color: var(--lp-text) !important;
        }
        .lp-module .bg-violet-400\/5,
        .lp-module .bg-cyan-400\/5 {
          background: var(--lp-panel-soft) !important;
        }
        .lp-module .text-white,
        .lp-module .text-slate-100,
        .lp-module .text-slate-200,
        .lp-module .text-slate-300,
        .lp-module .text-slate-400,
        .lp-module .text-slate-500,
        .lp-module .text-slate-600 {
          color: var(--lp-text) !important;
        }
        .lp-module .text-slate-400,
        .lp-module .text-slate-500,
        .lp-module .text-slate-600,
        .lp-module .text-slate-300 {
          color: var(--lp-muted) !important;
        }
        .lp-module .bg-slate-950,
        .lp-module select,
        .lp-module input {
          background: var(--lp-input-bg) !important;
          color: var(--lp-input-text) !important;
          border-color: rgba(148, 163, 184, 0.5) !important;
        }
        .lp-module select,
        .lp-module input,
        .lp-module button {
          box-shadow: none !important;
        }
        .lp-module svg rect {
          fill: rgba(255, 255, 255, 0.9) !important;
        }
        .lp-module svg text {
          fill: #0f172a !important;
        }
        .lp-module .border-slate-600,
        .lp-module .border-slate-700,
        .lp-module .border-slate-800,
        .lp-module .border-slate-200,
        .lp-module .border-cyan-300\/30,
        .lp-module .border-violet-300\/25 {
          border-color: rgba(148, 163, 184, 0.35) !important;
        }
        .lp-module .text-cyan-200,
        .lp-module .text-violet-200,
        .lp-module .text-cyan-300,
        .lp-module .text-violet-300 {
          color: #4b5d82 !important;
        }
      `}</style>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-400/30 bg-slate-950/80 p-5 shadow-xl"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200"><BookOpen className="h-3.5 w-3.5" /> Module 1 · Interactive Solver</div><h2 className="text-2xl font-black tracking-tight text-white">Linear Programming</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">Formulate a two-variable model and calculate its best feasible corner point.</p></div><button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-violet-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to modules</button></div>
      <section className="glass-panel rounded-2xl p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Interactive model builder</p><h3 className="mt-1 text-xl font-black text-white">Define your linear program</h3><p className="mt-2 text-xs leading-5 text-slate-400">The solver evaluates every feasible vertex created by your constraints, including non-negativity boundaries.</p></div><button onClick={() => setHasSolved(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400"><Play className="h-4 w-4" /> Solve model</button></div><div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]"><div className="rounded-xl border border-violet-300/25 bg-violet-400/5 p-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-violet-200">Objective function</p><div className="flex flex-wrap items-center gap-2"><select value={objective} onChange={(event) => { setObjective(event.target.value as 'maximize' | 'minimize'); setHasSolved(false); }} className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-2 text-xs font-bold text-white"><option value="maximize">Maximize</option><option value="minimize">Minimize</option></select><input aria-label="Objective coefficient x1" type="number" value={objectiveFirst} onChange={(event) => { setObjectiveFirst(Number(event.target.value)); setHasSolved(false); }} className="w-16 rounded-lg border border-slate-600 bg-slate-950 px-2 py-2 text-center text-sm font-bold text-white" /><span className="text-slate-300">x₁ +</span><input aria-label="Objective coefficient x2" type="number" value={objectiveSecond} onChange={(event) => { setObjectiveSecond(Number(event.target.value)); setHasSolved(false); }} className="w-16 rounded-lg border border-slate-600 bg-slate-950 px-2 py-2 text-center text-sm font-bold text-white" /><span className="text-slate-300">x₂</span></div></div><div className="rounded-xl border border-cyan-300/25 bg-cyan-400/5 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">Constraints</p><button onClick={addConstraint} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/30 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-300/10"><Plus className="h-3.5 w-3.5" /> Add constraint</button></div><div className="space-y-2">{constraints.map((constraint) => <div key={constraint.id} className="flex flex-wrap items-center gap-1.5"><input aria-label={`Constraint ${constraint.id} x1 coefficient`} type="number" value={constraint.firstCoefficient} onChange={(event) => updateConstraint(constraint.id, 'firstCoefficient', Number(event.target.value))} className="w-14 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-center text-xs font-bold text-white" /><span className="text-xs text-slate-300">x₁ +</span><input aria-label={`Constraint ${constraint.id} x2 coefficient`} type="number" value={constraint.secondCoefficient} onChange={(event) => updateConstraint(constraint.id, 'secondCoefficient', Number(event.target.value))} className="w-14 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-center text-xs font-bold text-white" /><span className="text-xs text-slate-300">x₂</span><select value={constraint.relation} onChange={(event) => updateConstraint(constraint.id, 'relation', event.target.value as Relation)} className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs font-bold text-cyan-200"><option value="<=">≤</option><option value=">=">≥</option></select><input aria-label={`Constraint ${constraint.id} right hand side`} type="number" value={constraint.rightHandSide} onChange={(event) => updateConstraint(constraint.id, 'rightHandSide', Number(event.target.value))} className="w-16 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-center text-xs font-bold text-white" /><button aria-label={`Remove constraint ${constraint.id}`} onClick={() => removeConstraint(constraint.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div></div></div></section>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.3fr]"><div className="glass-panel rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-300" /><h3 className="text-sm font-bold text-white">Solver result</h3></div>{hasSolved ? <div className="space-y-4"><div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Best feasible solution</p><p className="mt-2 font-mono text-2xl font-black text-white">{objective === 'maximize' ? 'Maximum' : 'Minimum'} = {result.best.objectiveValue.toFixed(2)}</p><p className="mt-1 text-sm text-emerald-100">x₁ = {result.best.firstVariable.toFixed(2)} · x₂ = {result.best.secondVariable.toFixed(2)}</p></div><div className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {result.candidates.length} feasible corner points evaluated</div></div> : <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">Model changed. Press Solve model to calculate the new optimum.</div>}</div><div className="glass-panel rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Feasible vertices</p><h3 className="text-sm font-bold text-white">Candidate solutions</h3></div><span className="text-xs text-slate-400">x₁, x₂ ≥ 0</span></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="p-2">Point</th><th className="p-2">x₁</th><th className="p-2">x₂</th><th className="p-2 text-right">Objective</th></tr></thead><tbody>{result.candidates.map((candidate, index) => <tr key={`${candidate.firstVariable}-${candidate.secondVariable}-${index}`} className="border-b border-slate-800 text-slate-200"><td className="p-2">V{index + 1}</td><td className="p-2 font-mono">{candidate.firstVariable.toFixed(2)}</td><td className="p-2 font-mono">{candidate.secondVariable.toFixed(2)}</td><td className="p-2 text-right font-mono font-bold text-cyan-200">{candidate.objectiveValue.toFixed(2)}</td></tr>)}</tbody></table></div>{result.candidates.length === 1 && <p className="mt-3 flex items-center gap-2 text-xs text-red-300"><XCircle className="h-4 w-4" /> No feasible constraint intersection was found.</p>}</div></section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="glass-panel rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Graphical method</p><h3 className="text-sm font-bold text-white">Feasible region and vertices</h3></div><span className="text-xs text-slate-400">{constraints.length} boundary lines</span></div><div className="overflow-x-auto"><svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="min-w-[480px] w-full" role="img" aria-label="Linear programming feasible region graph"><rect x="0" y="0" width={graphWidth} height={graphHeight} rx="12" fill="rgba(2, 15, 29, 0.48)" /><polygon points={`${graphX(0)},${graphY(0)} ${result.candidates.map((candidate) => `${graphX(candidate.firstVariable)},${graphY(candidate.secondVariable)}`).join(' ')}`} fill="rgba(45, 212, 191, 0.12)" />{[0, 0.25, 0.5, 0.75, 1].map((step) => <g key={step}><line x1={graphX(graphMaxX * step)} y1={graphY(0)} x2={graphX(graphMaxX * step)} y2={graphY(graphMaxY)} stroke="rgba(148,163,184,0.16)" /><line x1={graphX(0)} y1={graphY(graphMaxY * step)} x2={graphX(graphMaxX)} y2={graphY(graphMaxY * step)} stroke="rgba(148,163,184,0.16)" /></g>)}<line x1={graphX(0)} y1={graphY(0)} x2={graphX(graphMaxX)} y2={graphY(0)} stroke="#dbeafe" strokeWidth="1.5" /><line x1={graphX(0)} y1={graphY(0)} x2={graphX(0)} y2={graphY(graphMaxY)} stroke="#dbeafe" strokeWidth="1.5" />{constraints.map((constraint, index) => { const stroke = ['#22d3ee', '#a78bfa', '#fbbf24', '#34d399', '#fb7185'][index % 5]; if (constraint.secondCoefficient === 0) { const xValue = constraint.rightHandSide / constraint.firstCoefficient; return <line key={constraint.id} x1={graphX(xValue)} y1={graphY(0)} x2={graphX(xValue)} y2={graphY(graphMaxY)} stroke={stroke} strokeWidth="2" />; } const firstY = constraint.rightHandSide / constraint.secondCoefficient; const secondY = (constraint.rightHandSide - constraint.firstCoefficient * graphMaxX) / constraint.secondCoefficient; return <line key={constraint.id} x1={graphX(0)} y1={graphY(firstY)} x2={graphX(graphMaxX)} y2={graphY(secondY)} stroke={stroke} strokeWidth="2" />; })}{result.candidates.map((candidate, index) => <g key={`graph-${candidate.firstVariable}-${candidate.secondVariable}-${index}`}><circle cx={graphX(candidate.firstVariable)} cy={graphY(candidate.secondVariable)} r={candidate === result.best ? 6 : 4} fill={candidate === result.best ? '#34d399' : '#f8fafc'} stroke={candidate === result.best ? '#bbf7d0' : '#67e8f9'} strokeWidth="2" /><text x={graphX(candidate.firstVariable) + 7} y={graphY(candidate.secondVariable) - 7} fill="#e2e8f0" fontSize="10">V{index + 1}</text></g>)}<text x={graphX(graphMaxX) - 12} y={graphY(0) - 8} fill="#cbd5e1" fontSize="11">x₁</text><text x={graphX(0) + 8} y={graphY(graphMaxY) + 12} fill="#cbd5e1" fontSize="11">x₂</text></svg></div><div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-400"><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-300" /> Optimal vertex</span><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-cyan-200" /> Feasible vertex</span><span>Shaded area represents candidate feasible space</span></div></div>
        <div className="glass-panel rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-bold text-white">Optimality calculation</h3></div>{hasSolved ? <div className="space-y-3 text-xs"><div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-3 font-mono text-emerald-100">{objective === 'maximize' ? 'Max' : 'Min'} Z = ({objectiveFirst} × {result.best.firstVariable.toFixed(2)}) + ({objectiveSecond} × {result.best.secondVariable.toFixed(2)}) = <strong>{result.best.objectiveValue.toFixed(2)}</strong></div><p className="text-slate-400">The selected vertex is tested against every constraint:</p>{constraints.map((constraint) => { const leftSide = constraint.firstCoefficient * result.best.firstVariable + constraint.secondCoefficient * result.best.secondVariable; const passes = constraint.relation === '<=' ? leftSide <= constraint.rightHandSide + 0.000001 : leftSide >= constraint.rightHandSide - 0.000001; return <div key={`check-${constraint.id}`} className="flex items-center justify-between rounded-lg bg-slate-950/35 px-3 py-2 font-mono text-slate-300"><span>{constraint.firstCoefficient}x₁ + {constraint.secondCoefficient}x₂ {constraint.relation === '<=' ? '≤' : '≥'} {constraint.rightHandSide}</span><span className={passes ? 'text-emerald-300' : 'text-red-300'}>{leftSide.toFixed(2)} {passes ? '✓' : '✕'}</span></div>; })}</div> : <p className="text-xs leading-6 text-slate-400">Solve the model to see the objective substitution and constraint verification.</p>}</div>
      </section>
      <section className="glass-panel rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-violet-300" /><h3 className="text-sm font-bold text-white">What this model teaches</h3></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs leading-5 text-slate-400"><p><strong className="text-white">Decision variables:</strong> x₁ and x₂ represent unknown activity levels.</p><p><strong className="text-white">Objective:</strong> coefficients describe the contribution to the desired outcome.</p><p><strong className="text-white">Constraints:</strong> inequalities describe resource limits and non-negativity.</p></div></section>
    </div>
  );
}
