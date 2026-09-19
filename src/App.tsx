/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import {
  TransportationProblem,
  MethodSolution,
} from './types/transportation';
import {
  SAMPLE_PROBLEMS,
  solveNWCR,
  solveLeastCost,
  solveMaxProfit,
  solveVAM,
  solveSteppingStone,
} from './utils/transportationAlgorithms';
import ProblemEditor from './components/ProblemEditor';
import TransportationTable from './components/TransportationTable';
import SteppingStoneViewer from './components/SteppingStoneViewer';
import MethodComparison from './components/MethodComparison';
import StepExplanation from './components/StepExplanation';
import TheoryGuideModal from './components/TheoryGuideModal';
import DiagnosticsDebugger from './components/DiagnosticsDebugger';
import PrintModal from './components/PrintModal';
import LinearProgrammingModule from './components/LinearProgrammingModule';
import {
  Truck,
  Calculator,
  Sparkles,
  BarChart3,
  HelpCircle,
  Edit3,
  Table,
  CheckCircle2,
  Printer,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Route,
  GitCompare,
  BrainCircuit,
  ClipboardCheck,
  ArrowUpRight,
  Menu,
  BookOpen,
} from 'lucide-react';

type TabType =
  | 'overview'
  | 'comparison'
  | 'stepping_stone'
  | 'nwcr'
  | 'least_cost'
  | 'max_profit'
  | 'vam'
  | 'diagnostics'
  | 'linear_programming'
  | 'editor';

const quickStartActions = [
  { id: 'editor' as TabType, label: 'Set up your problem', description: 'Update routes, supplies, and demand quickly', icon: Edit3 },
  { id: 'comparison' as TabType, label: 'Compare solutions', description: 'See which method gives the best result', icon: GitCompare },
  { id: 'diagnostics' as TabType, label: 'Check the result', description: 'Review feasibility and balance warnings', icon: ShieldCheck },
];

export default function App() {
  const [problem, setProblem] = useState<TransportationProblem>(SAMPLE_PROBLEMS[0]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSolverOpen, setIsSolverOpen] = useState(false);
  const [steppingStoneInitialMethod, setSteppingStoneInitialMethod] = useState<
    'nwcr' | 'least_cost' | 'max_profit' | 'vam'
  >('nwcr');
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);

  // Memoized solutions calculation
  const solutions = useMemo(() => {
    const nwcr = solveNWCR(problem);
    const least_cost = solveLeastCost(problem);
    const max_profit = solveMaxProfit(problem);
    const vam = solveVAM(problem);

    // Initial solution selected for Stepping Stone optimization
    let initialForSteppingStone = nwcr;
    if (steppingStoneInitialMethod === 'least_cost') initialForSteppingStone = least_cost;
    if (steppingStoneInitialMethod === 'max_profit') initialForSteppingStone = max_profit;
    if (steppingStoneInitialMethod === 'vam') initialForSteppingStone = vam;

    const stepping_stone = solveSteppingStone(
      initialForSteppingStone,
      problem.objective
    );

    return {
      nwcr,
      least_cost,
      max_profit,
      vam,
      stepping_stone,
    };
  }, [problem, steppingStoneInitialMethod]);

  const activeSolution: MethodSolution | null =
    activeTab === 'nwcr'
      ? solutions.nwcr
      : activeTab === 'least_cost'
      ? solutions.least_cost
      : activeTab === 'max_profit'
      ? solutions.max_profit
      : activeTab === 'vam'
      ? solutions.vam
      : activeTab === 'stepping_stone'
      ? solutions.stepping_stone
      : null;

  const handlePrint = () => {
    window.print();
  };

  const openSolver = (tab: TabType) => {
    setActiveTab(tab);
    setIsSolverOpen(true);
  };

  const overviewGroups = [
    {
      label: 'Transportation & Network Models',
      description: 'Build feasible routes, minimize distribution cost, and verify the optimal network basis.',
      accent: 'text-cyan-300',
      ids: ['stepping_stone', 'vam', 'least_cost', 'nwcr'] as TabType[],
    },
    {
      label: 'Optimization Analysis',
      description: 'Compare strategies and inspect the mathematical evidence behind each decision.',
      accent: 'text-violet-300',
      ids: ['comparison', 'max_profit', 'diagnostics', 'linear_programming'] as TabType[],
    },
  ];

  const navigationItems: { id: TabType; label: string; description: string; icon: typeof LayoutDashboard; group: string }[] = [
    { id: 'overview', label: 'Overview', description: 'OR command center', icon: LayoutDashboard, group: 'Workspace' },
    { id: 'editor', label: 'Edit Problem', description: 'Adjust your tableau', icon: Edit3, group: 'Workspace' },
    { id: 'stepping_stone', label: 'Stepping Stone', description: 'Optimality solver', icon: Route, group: 'Workspace' },
    { id: 'comparison', label: 'Method Comparison', description: 'Compare heuristics', icon: GitCompare, group: 'Workspace' },
    { id: 'vam', label: "Vogel's Approximation", description: 'Penalty heuristic', icon: BrainCircuit, group: 'Initial Solvers' },
    { id: 'least_cost', label: 'Least-Cost Method', description: 'Cost minimization', icon: ClipboardCheck, group: 'Initial Solvers' },
    { id: 'max_profit', label: 'Max Cell Profit', description: 'Profit maximization', icon: ArrowUpRight, group: 'Initial Solvers' },
    { id: 'nwcr', label: 'North-West Corner', description: 'Feasible starting plan', icon: Route, group: 'Initial Solvers' },
    { id: 'diagnostics', label: 'Diagnostics', description: 'Verify your solution', icon: ShieldCheck, group: 'Tools' },
    { id: 'linear_programming', label: 'Linear Programming', description: 'Module 1 foundations', icon: BookOpen, group: 'Learning Modules' },
  ];

  const renderNavigationGroup = (group: string) => (
    <div className="mb-6" key={group}>
      <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{group}</p>
      <div className="space-y-1">
        {navigationItems.filter((item) => item.group === group).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => item.id === 'overview' ? (setIsSolverOpen(false), setActiveTab('overview')) : openSolver(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/15' : 'bg-slate-100'}`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold">{item.label}</span>
                <span className={`block truncate text-[10px] ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{item.description}</span>
              </span>
              {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="glossy-app min-h-screen bg-transparent text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="glass-header border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="brand-mark w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-white flex items-center justify-center shadow-lg shrink-0">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
                  Transportation Problem Solver
                </h1>
                <p className="hidden sm:block text-[10px] text-slate-500">
                  NWCR • Least-Cost • Max Profit • Vogel&apos;s • Stepping Stone
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="btn-nav-diagnostics"
                onClick={() => setActiveTab('diagnostics')}
                className={`flex items-center justify-center rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-colors sm:px-3 sm:text-xs ${
                  activeTab === 'diagnostics'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="View Invariant Verification & MODI Dual Debugger"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline sm:ml-1.5">Diagnostics</span>
              </button>
              <button
                onClick={() => setIsTheoryOpen(true)}
                className="hidden sm:flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                title="Operations Research Method Guide"
              >
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Theory
              </button>
              <button
                onClick={() => setIsPrintOpen(true)}
                className="hidden sm:flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                title="Print or Export PDF"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                Print
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <div className="mb-4 flex items-center gap-2 overflow-x-auto lg:hidden no-scrollbar">
          <Menu className="h-4 w-4 shrink-0 text-slate-400" />
          {navigationItems.slice(0, 3).map((item) => (
            <button
              key={item.id}
                onClick={() => item.id === 'overview' ? (setIsSolverOpen(false), setActiveTab('overview')) : openSolver(item.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${activeTab === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="glass-panel sticky top-24 rounded-2xl p-3">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 px-2 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200"><Truck className="h-5 w-5" /></div>
                <div><p className="text-xs font-extrabold tracking-tight text-slate-900">OR WORKSPACE</p><p className="text-[10px] text-slate-400">Decision intelligence</p></div>
              </div>
              {['Workspace', 'Initial Solvers', 'Learning Modules', 'Tools'].map(renderNavigationGroup)}
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active model</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
                <p className="truncate text-xs font-bold text-slate-700">{problem.name}</p>
                <p className="mt-1 text-[10px] text-slate-400">{problem.sources.length} origins · {problem.destinations.length} markets</p>
              </div>
            </div>
          </aside>
          <section className="min-w-0">
        {(!isSolverOpen || activeTab === 'overview') && (
          <div className="space-y-4 sm:space-y-6">
            <div className="hero-panel overflow-hidden rounded-2xl p-4 text-white shadow-xl sm:p-6 lg:p-8">
              <div className="hero-orb" />
              <div className="hero-orb second" />
              <div className="relative z-10 flex flex-col gap-5">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-100 sm:text-[10px]"><BrainCircuit className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Easy planning</div>
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Plan smarter routes in a few steps.</h2>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-slate-200 sm:text-sm sm:leading-6">Build a transportation problem, compare methods, and check feasibility without getting lost in details.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button onClick={() => openSolver('editor')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-slate-900/25 px-3 py-2.5 text-[11px] font-bold text-white transition hover:border-indigo-200 hover:bg-slate-900/35 sm:px-4 sm:py-3 sm:text-xs"><Edit3 className="h-4 w-4" /> Start editing</button>
                  <button onClick={() => openSolver('stepping_stone')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl primary-action px-3 py-2.5 text-[11px] font-bold text-white shadow-lg transition hover:brightness-110 sm:px-4 sm:py-3 sm:text-xs"><Route className="h-4 w-4" /> Find the best plan <ArrowUpRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {quickStartActions.map(({ id, label, description, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => openSolver(id)}
                  className="glass-panel rounded-2xl p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">{label}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">{description}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Quick start</p>
                    <h3 className="mt-1 text-base font-bold text-slate-900">Follow these simple steps</h3>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Friendly</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['1', 'Create or edit', 'Change supplies, demand, and route costs in one place.'],
                    ['2', 'Pick a method', 'Compare basic and advanced planning methods.'],
                    ['3', 'Review the results', 'Check the answer and confirm it is balanced.'],
                  ].map(([step, title, detail]) => (
                    <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">{step}</div>
                      <p className="text-sm font-bold text-slate-900">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-indigo-50">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">Why it feels easier</p>
                <h3 className="mt-1 text-base font-bold text-slate-900">Designed to be clear</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li>• Consistent actions and labels throughout the app</li>
                  <li>• Clear steps for editing, comparing, and checking</li>
                  <li>• Simple cards and status feedback for quick decisions</li>
                  <li>• A calmer layout that is easier to scan on mobile</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[['Active model', problem.name, 'Balanced transportation plan'], ['Decision surface', `${problem.sources.length} × ${problem.destinations.length}`, 'Origins × destination markets'], ['Optimal benchmark', `$${solutions.stepping_stone.totalCost.toLocaleString()}`, 'Stepping Stone result']].map(([label, value, detail]) => <div key={label} className="glass-panel rounded-2xl p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-2 truncate text-lg font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}
            </div>
            <div className="space-y-7">
              {overviewGroups.map((group) => (
                <div key={group.label}>
                  <div className="mb-3 flex items-end justify-between gap-4"><div><p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${group.accent}`}>{group.label}</p><p className="mt-1 max-w-2xl text-xs text-slate-400">{group.description}</p></div><span className="shrink-0 text-xs text-slate-400">{group.ids.length} tools</span></div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{navigationItems.filter((item) => group.ids.includes(item.id)).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => openSolver(item.id)} className="glass-panel group rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"><div className="mb-5 flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></span><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 opacity-0 transition group-hover:opacity-100">Launch Solver <ArrowUpRight className="h-3.5 w-3.5" /></span></div><p className="text-sm font-extrabold text-slate-900">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}. Work with the active model.</p></button>; })}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Problem Matrix Editor & Preset Controller */}
        {isSolverOpen && activeTab === 'linear_programming' && <LinearProgrammingModule onBack={() => { setIsSolverOpen(false); setActiveTab('overview'); }} />}
        {isSolverOpen && activeTab === 'editor' && (
          <div className="solver-drawer" aria-label="Problem editor workspace">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-400/30 bg-slate-950/70 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Edit the problem</p>
                <p className="mt-1 text-sm font-bold text-white">Modify supplies, demands, and route costs</p>
              </div>
              <button onClick={() => { setIsSolverOpen(false); setActiveTab('overview'); }} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-cyan-300 hover:text-white">Back to overview</button>
            </div>
            <ProblemEditor problem={problem} onUpdateProblem={setProblem} autoFocus />
          </div>
        )}
        {isSolverOpen && activeTab !== 'overview' && activeTab !== 'linear_programming' && activeTab !== 'editor' && <div className="solver-drawer" aria-label="Active solver workspace"><div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-400/30 bg-slate-950/70 px-4 py-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Active solver workspace</p><p className="mt-1 text-sm font-bold text-white">{navigationItems.find((item) => item.id === activeTab)?.label}</p></div><button onClick={() => { setIsSolverOpen(false); setActiveTab('overview'); }} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-cyan-300 hover:text-white">Back to overview</button></div><ProblemEditor problem={problem} onUpdateProblem={setProblem} autoFocus /></div>}

        {/* Navigation Tabs Bar */}
        {isSolverOpen && activeTab !== 'overview' && activeTab !== 'linear_programming' && activeTab !== 'editor' && <div className="flex items-center border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('stepping_stone')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'stepping_stone'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Stepping Stone (Optimal Loop)
            <span className="text-2xs px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
              ${solutions.stepping_stone.totalCost.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'comparison'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Method Comparison
          </button>

          <button
            onClick={() => setActiveTab('vam')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'vam'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Vogel&apos;s (VAM)
            <span className="text-2xs text-slate-500">
              (${solutions.vam.totalCost.toLocaleString()})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('least_cost')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'least_cost'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Least-Cost
            <span className="text-2xs text-slate-500">
              (${solutions.least_cost.totalCost.toLocaleString()})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('max_profit')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'max_profit'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Max Cell Profit
            <span className="text-2xs text-slate-500">
              (${solutions.max_profit.totalCost.toLocaleString()})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('nwcr')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'nwcr'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            NW Corner Rule
            <span className="text-2xs text-slate-500">
              (${solutions.nwcr.totalCost.toLocaleString()})
            </span>
          </button>

          <button
            id="tab-diagnostics"
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'diagnostics'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Diagnostics & Invariants
          </button>
        </div>}

        {/* Tab Content Panes */}
        {activeTab === 'diagnostics' && (
          <DiagnosticsDebugger
            solution={activeSolution || solutions.stepping_stone}
            objective={problem.objective}
          />
        )}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <MethodComparison
              solutions={solutions}
              objective={problem.objective}
              onSelectMethod={(m) => setActiveTab(m)}
              activeMethod={activeTab}
            />

            {/* Side-by-side Optimal vs VAM comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Stepping Stone Optimal Solution
                </div>
                <TransportationTable
                  solution={solutions.stepping_stone}
                  objective={problem.objective}
                />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-purple-600" />
                  Vogel&apos;s Approximation Method (VAM)
                </div>
                <TransportationTable
                  solution={solutions.vam}
                  objective={problem.objective}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stepping_stone' && (
          <div>
            <SteppingStoneViewer
              initialSolutions={solutions}
              steppingStoneSolution={solutions.stepping_stone}
              objective={problem.objective}
              onSelectInitialMethod={(m) => setSteppingStoneInitialMethod(m)}
              selectedInitialMethod={steppingStoneInitialMethod}
            />
          </div>
        )}

        {(activeTab === 'nwcr' ||
          activeTab === 'least_cost' ||
          activeTab === 'max_profit' ||
          activeTab === 'vam') &&
          activeSolution && (
            <div className="space-y-6">
              {/* Informative Header Banner */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {activeSolution.methodName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTab === 'nwcr' &&
                      'Allocates starting strictly at the top-left (North-West) corner and moves across until supply and demand are satisfied.'}
                    {activeTab === 'least_cost' &&
                      'Greedily allocates to the cell with the lowest unit cost in the active tableau to minimize initial expenditure.'}
                    {activeTab === 'max_profit' &&
                      'Prioritizes the cells with the largest unit contribution margin/profit first.'}
                    {activeTab === 'vam' &&
                      'Calculates row and column difference penalties to prevent high-cost alternative assignments.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSteppingStoneInitialMethod(activeTab as any);
                      setActiveTab('stepping_stone');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs transition-all ${
                      activeTab === 'vam'
                        ? 'bg-purple-700 hover:bg-purple-800 ring-2 ring-purple-300'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {activeTab === 'vam'
                      ? 'Use VAM Tableau in Stepping Stone Solver'
                      : 'Test Optimality in Stepping Stone'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Solution Tableau */}
              <TransportationTable
                solution={activeSolution}
                objective={problem.objective}
              />

              {/* Step Logs Walkthrough */}
              <StepExplanation solution={activeSolution} />
            </div>
          )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Transportation Problem Operations Research Solver — Implementing NWCR, Least-Cost, Maximum Cell Profit, VAM, and Stepping Stone Optimality.
        </p>
      </footer>

      {/* Theory Guide Modal */}
      <TheoryGuideModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />

      {/* Print & Export Report Modal */}
      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        problem={problem}
        solutions={solutions}
        activeTab={activeTab}
        objective={problem.objective}
      />
    </div>
  );
}
