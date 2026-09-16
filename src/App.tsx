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
} from 'lucide-react';

type TabType =
  | 'comparison'
  | 'stepping_stone'
  | 'nwcr'
  | 'least_cost'
  | 'max_profit'
  | 'vam'
  | 'diagnostics'
  | 'editor';

export default function App() {
  const [problem, setProblem] = useState<TransportationProblem>(SAMPLE_PROBLEMS[0]);
  const [activeTab, setActiveTab] = useState<TabType>('stepping_stone');
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

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Transportation Problem Solver
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-2xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Operations Research
                  </span>
                </div>
                <p className="text-2xs sm:text-xs text-slate-500">
                  NWCR • Least-Cost • Max Profit • Vogel&apos;s (VAM) • Stepping Stone
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                id="btn-nav-diagnostics"
                onClick={() => setActiveTab('diagnostics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                  activeTab === 'diagnostics'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="View Invariant Verification & MODI Dual Debugger"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Diagnostics & Debug</span>
              </button>
              <button
                onClick={() => setIsTheoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                title="Operations Research Method Guide"
              >
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">Theory & Rules</span>
              </button>
              <button
                onClick={() => setIsPrintOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Print or Export PDF"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span className="hidden md:inline">Print Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Problem Matrix Editor & Preset Controller */}
        <ProblemEditor problem={problem} onUpdateProblem={setProblem} />

        {/* Navigation Tabs Bar */}
        <div className="flex items-center border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar gap-1">
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
        </div>

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
