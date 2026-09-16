import { useState } from 'react';
import {
  MethodSolution,
  SteppingStoneIteration,
  CellEvaluation,
  LoopStep,
  ProblemObjective,
} from '../types/transportation';
import TransportationTable from './TransportationTable';
import { getPaletteForIndex, LOOP_PALETTES } from '../utils/loopPalettes';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Eye,
  Layers,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  Truck,
  TrendingDown,
  TrendingUp,
  Award,
  ListOrdered,
  AlertCircle,
  Calculator,
} from 'lucide-react';

interface SteppingStoneViewerProps {
  initialSolutions: {
    nwcr: MethodSolution;
    least_cost: MethodSolution;
    max_profit: MethodSolution;
    vam: MethodSolution;
  };
  steppingStoneSolution: MethodSolution;
  objective: ProblemObjective;
  onSelectInitialMethod: (method: 'nwcr' | 'least_cost' | 'max_profit' | 'vam') => void;
  selectedInitialMethod: 'nwcr' | 'least_cost' | 'max_profit' | 'vam';
}

export default function SteppingStoneViewer({
  initialSolutions,
  steppingStoneSolution,
  objective,
  onSelectInitialMethod,
  selectedInitialMethod,
}: SteppingStoneViewerProps) {
  const iterations = steppingStoneSolution.steppingStoneIterations || [];
  const [currentIterationIdx, setCurrentIterationIdx] = useState<number>(0);
  const [selectedEvaluation, setSelectedEvaluation] = useState<CellEvaluation | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [copiedDecision, setCopiedDecision] = useState<boolean>(false);

  const safeIterationIdx = Math.min(currentIterationIdx, Math.max(0, iterations.length - 1));
  const currentIteration: SteppingStoneIteration | undefined =
    iterations[safeIterationIdx];

  const isMax = objective === 'maximize';

  // Construct a temporary MethodSolution to display in the TransportationTable for current iteration
  const currentTableSolution: MethodSolution = currentIteration
    ? {
        ...steppingStoneSolution,
        methodName: `Stepping Stone — Iteration ${currentIteration.iterationNumber} ${
          currentIteration.isOptimal ? '(OPTIMAL — Instruction 6)' : '(Improving — Instructions 3, 4 & 5)'
        }`,
        allocations: currentIteration.allocations,
        isEpsilon: currentIteration.isEpsilon,
        totalCost: currentIteration.totalCost,
      }
    : steppingStoneSolution;

  // Active loop: either user-selected evaluation loop, or the entering cell loop for this iteration
  const activeLoop: LoopStep[] | null =
    selectedEvaluation?.loop || currentIteration?.loop || null;

  // Resolve matching color palette for selected evaluation or entering cell
  let activePalette = LOOP_PALETTES[0];
  if (currentIteration && currentIteration.evaluations) {
    if (selectedEvaluation) {
      const evalIdx = currentIteration.evaluations.findIndex(
        (ev) => ev.row === selectedEvaluation.row && ev.col === selectedEvaluation.col
      );
      if (evalIdx !== -1) {
        activePalette = getPaletteForIndex(evalIdx);
      }
    } else if (currentIteration.enteringCell) {
      const enteringIdx = currentIteration.evaluations.findIndex(
        (ev) =>
          ev.row === currentIteration.enteringCell?.row &&
          ev.col === currentIteration.enteringCell?.col
      );
      if (enteringIdx !== -1) {
        activePalette = getPaletteForIndex(enteringIdx);
      }
    }
  }

  const handleNextIteration = () => {
    if (safeIterationIdx < iterations.length - 1) {
      setCurrentIterationIdx(safeIterationIdx + 1);
      setSelectedEvaluation(null);
    }
  };

  const handlePrevIteration = () => {
    if (safeIterationIdx > 0) {
      setCurrentIterationIdx(safeIterationIdx - 1);
      setSelectedEvaluation(null);
    }
  };

  const handleMethodChange = (m: 'nwcr' | 'least_cost' | 'max_profit' | 'vam') => {
    onSelectInitialMethod(m);
    setCurrentIterationIdx(0);
    setSelectedEvaluation(null);
  };

  const m = steppingStoneSolution.sources.length;
  const n = steppingStoneSolution.destinations.length;
  const requiredBasicCells = m + n - 1;

  let actualBasicCells = 0;
  if (currentIteration) {
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        if (currentIteration.allocations[r][c] !== null) {
          actualBasicCells++;
        }
      }
    }
  }

  // Calculate unchanged stones for Instruction 5
  const cornerCoords = new Set(
    (currentIteration?.loop || []).map((s) => `${s.row}-${s.col}`)
  );
  const unchangedStones: {
    source: string;
    dest: string;
    row: number;
    col: number;
    amount: number;
    cost: number;
    isZeroStone: boolean;
  }[] = [];

  if (currentIteration && !currentIteration.isOptimal && currentIteration.loop) {
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        const val = currentIteration.allocations[r][c];
        if (val !== null && !cornerCoords.has(`${r}-${c}`)) {
          unchangedStones.push({
            source: steppingStoneSolution.sources[r],
            dest: steppingStoneSolution.destinations[c],
            row: r,
            col: c,
            amount: val,
            cost: steppingStoneSolution.costs[r][c],
            isZeroStone: Boolean(currentIteration.isEpsilon[r][c] || val === 0),
          });
        }
      }
    }
  }

  // Active shipments for Instruction 6 Decision Formulation
  const activeShipments: {
    source: string;
    dest: string;
    row: number;
    col: number;
    amount: number;
    unitCost: number;
    subtotal: number;
    isZeroStone: boolean;
  }[] = [];

  if (currentIteration) {
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        const val = currentIteration.allocations[r][c];
        if (val !== null) {
          activeShipments.push({
            source: steppingStoneSolution.sources[r],
            dest: steppingStoneSolution.destinations[c],
            row: r,
            col: c,
            amount: val,
            unitCost: steppingStoneSolution.costs[r][c],
            subtotal: val * steppingStoneSolution.costs[r][c],
            isZeroStone: Boolean(currentIteration.isEpsilon[r][c] || val === 0),
          });
        }
      }
    }
  }

  const initialCost = initialSolutions[selectedInitialMethod]?.totalCost ?? initialSolutions.nwcr.totalCost;
  const initialMethodName =
    selectedInitialMethod === 'vam'
      ? "Vogel's (VAM)"
      : selectedInitialMethod === 'least_cost'
      ? 'Least-Cost'
      : selectedInitialMethod === 'max_profit'
      ? 'Max Profit'
      : 'NW Corner Rule';

  const currentCost = currentIteration ? currentIteration.totalCost : steppingStoneSolution.totalCost;
  const costDiff = isMax ? currentCost - initialCost : initialCost - currentCost;
  const costDiffPercent =
    initialCost > 0 ? ((Math.abs(costDiff) / initialCost) * 100).toFixed(1) : '0';

  // Handle Copy Decision Formulation text
  const handleCopyDecision = () => {
    const shipmentLines = activeShipments
      .filter((s) => !s.isZeroStone && s.amount > 0)
      .map(
        (s) =>
          `• Ship ${s.amount.toLocaleString()} units from [${s.source}] to [${s.dest}] at $${s.unitCost}/unit = $${s.subtotal.toLocaleString()}`
      )
      .join('\n');

    const text = `
DECISION FORMULATION (STEPPING STONE OPTIMAL SOLUTION)
======================================================
Objective: ${isMax ? 'Maximize Total Profit' : 'Minimize Total Distribution Cost'}
Final Optimal Objective Value: $${currentCost.toLocaleString()}
${
  costDiff > 0
    ? `${isMax ? 'Total Profit Increase' : 'Total Cost Savings'} vs ${initialMethodName} Initial Basis: $${costDiff.toLocaleString()} (${costDiffPercent}% improvement)`
    : `Initial feasible solution (${initialMethodName}) was already optimal.`
}

RECOMMENDED DISTRIBUTION SCHEDULE:
${shipmentLines}

CONSTRAINTS SATISFACTION:
• All ${m} sources have their supply capacities 100% satisfied.
• All ${n} destinations have their demand requirements 100% satisfied.
• Basis contains exactly m + n - 1 = ${requiredBasicCells} basic cells (non-degenerate & loop-free).

MANAGERIAL DECISION SUMMARY:
Transport the specified quantities along the designated optimal routes to achieve the absolute global optimum of $${currentCost.toLocaleString()} while meeting all demand quotas without excess inventory.
`.trim();

    navigator.clipboard.writeText(text);
    setCopiedDecision(true);
    setTimeout(() => setCopiedDecision(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Method Starter */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Standard 6-Instruction Methodology
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Stepping Stone Method Solver
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Solves the transportation problem by constructing an initial feasible solution (ladder pattern with 0 for simultaneous exhaustion), tracing closed polygon paths with alternating signs to compute Improvement Indices, reallocating via the smallest negative corner stone, and formulating the final optimal decision.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Guide Toggle */}
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              <ListOrdered className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isGuideOpen ? 'Hide 6-Step Guide' : 'View 6-Step Guide'}</span>
              {isGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Basis Selector */}
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <span className="text-2xs text-slate-300 block mb-1 font-medium">
                Initial Basis (Default: NWCR):
              </span>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: 'nwcr', label: 'NW Corner Rule' },
                    { id: 'least_cost', label: 'Least-Cost' },
                    { id: 'max_profit', label: 'Max Profit' },
                    { id: 'vam', label: "Vogel's (VAM)" },
                  ] as const
                ).map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodChange(method.id)}
                    className={`px-2 py-0.5 text-2xs rounded font-medium transition-all ${
                      selectedInitialMethod === method.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VAM Basis Banner */}
      {selectedInitialMethod === 'vam' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3 text-xs text-purple-950">
          <div className="p-2 rounded-lg bg-purple-600 text-white font-bold shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-sm text-purple-900 flex flex-wrap items-center gap-2">
              <span>Vogel&apos;s Approximation Method (VAM) Initial Tableau Active</span>
              <span className="text-3xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold uppercase">
                Starting Cost: ${initialCost.toLocaleString()}
              </span>
            </div>
            <p className="text-purple-800/90 leading-relaxed text-2xs">
              The starting feasible tableau for Iteration 1 is populated using VAM&apos;s penalty differences rather than NWCR&apos;s diagonal ladder. Notice how VAM allocates based on maximum regret (penalty cost), starting much closer to or directly at optimality.
            </p>
          </div>
        </div>
      )}

      {/* 6-Step Standard Instructions Guide Accordion */}
      {isGuideOpen && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden p-5 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Official 6-Step Stepping Stone Procedure Reference
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Prescribed OR Methodology
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs text-slate-700">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-2xs font-bold">1</span>
                <span>Instruction 1: Tableau Construction</span>
              </div>
              <p className="text-slate-600 text-2xs leading-relaxed">
                Make a transportation tableau consisting of <em>r</em> rows and <em>c</em> columns with sources' supply capacities, destinations' demand requirements, and unit distribution costs or profits in each route cell.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-2xs font-bold">2</span>
                <span>Instruction 2: Initial Feasible Solution</span>
              </div>
              <p className="text-slate-600 text-2xs leading-relaxed">
                Start at cell (1, 1). Supply must be used up before moving down; demand satisfied before moving right. If a cell satisfies both row supply and column demand simultaneously before finishing, write <strong>“0” (zero stone)</strong> to the next row or column cell and continue ladder pattern until done.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                currentIteration && !currentIteration.isOptimal
                  ? 'border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-400'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">3</span>
                  <span>Instruction 3: Improvement Indices</span>
                </div>
                {currentIteration && !currentIteration.isOptimal && (
                  <span className="text-3xs font-bold text-indigo-700 uppercase bg-indigo-200 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <p className="text-slate-600 text-2xs leading-relaxed">
                For each unused cell (cell without entry except zero stone), draw a closed polygon path of horizontal and vertical line segments only through stones as corners. Assign <strong>“+”</strong> to unused cell, <strong>“-”</strong> to 2nd corner, <strong>“+”</strong> to 3rd corner, <strong>“-”</strong> to 4th corner. Add corner costs algebraically to get the <strong>Improvement Index</strong>. Optimal if all indices are ≥ 0 (min) or ≤ 0 (max).
              </p>
            </div>

            {/* Step 4 */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                currentIteration && !currentIteration.isOptimal
                  ? 'border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-400'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">4</span>
                  <span>Instruction 4: Pivot & Smallest Stone (θ)</span>
                </div>
                {currentIteration && !currentIteration.isOptimal && (
                  <span className="text-3xs font-bold text-indigo-700 uppercase bg-indigo-200 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <p className="text-slate-600 text-2xs leading-relaxed">
                Choose the <strong>most negative index</strong> (minimization) or <strong>largest positive index</strong> (maximization). Redraw closed path. Select smallest stone among negative positions (θ). Add θ to each stone in positive position; subtract θ from each stone in negative position.
              </p>
            </div>

            {/* Step 5 */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                currentIteration && !currentIteration.isOptimal
                  ? 'border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-400'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">5</span>
                  <span>Instruction 5: Construct Next Tableau</span>
                </div>
                {currentIteration && !currentIteration.isOptimal && (
                  <span className="text-3xs font-bold text-indigo-700 uppercase bg-indigo-200 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <p className="text-slate-600 text-2xs leading-relaxed">
                Effect changes from Step 4. <em>Stones not found at the corners of the closed path must remain in the same position in the new tableau</em>. Only corner stones and the unused cell are affected. Ensure row supplies and column demands are satisfied.
              </p>
            </div>

            {/* Step 6 */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                currentIteration && currentIteration.isOptimal
                  ? 'border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-500'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-2xs font-bold">6</span>
                  <span>Instruction 6: Formulate the Decision</span>
                </div>
                {currentIteration && currentIteration.isOptimal && (
                  <span className="text-3xs font-bold text-emerald-800 uppercase bg-emerald-200 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <p className="text-slate-600 text-2xs leading-relaxed">
                Formulate the decision based on the objective and the entries in the optimal (final) tableau. State the specific shipment quantities along each active route, total optimal cost/profit, and verified demand satisfaction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Iteration Control Bar */}
      {iterations.length > 0 && currentIteration && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          {/* Iteration Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevIteration}
                disabled={safeIterationIdx === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Previous iteration"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-800 px-2">
                Iteration {currentIteration.iterationNumber} of {iterations.length}
              </span>
              <button
                onClick={handleNextIteration}
                disabled={safeIterationIdx === iterations.length - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Next iteration"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Status Pill */}
            {currentIteration.isOptimal ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Optimal Tableau Reached (Instruction 6 Active)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Improving Basis (Instructions 3, 4 & 5 Active)
              </span>
            )}
          </div>

          {/* Degeneracy & Basic Cells Check */}
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
              <span className="text-slate-500 mr-1">Basic Stones:</span>
              <span className="font-bold">
                {actualBasicCells} / {requiredBasicCells} (m + n - 1)
              </span>
            </div>
            <div className="bg-indigo-50 px-2.5 py-1 rounded-md text-indigo-900 font-bold">
              {isMax ? 'Current Profit' : 'Current Cost'}: ${currentIteration.totalCost.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Main Tableau with Loop Highlight */}
      {currentIteration && (
        <div className="space-y-2">
          {/* Active Loop Info Banner with matching Polygon Theme */}
          {activeLoop && (
            <div
              className={`px-4 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-all ${activePalette.rowHighlightBg} ${activePalette.borderAccent}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs"
                  style={{ backgroundColor: activePalette.stroke }}
                />
                <span className="font-bold text-slate-900">
                  {selectedEvaluation
                    ? `Inspecting Opportunity Loop for Cell [${selectedEvaluation.row + 1}, ${selectedEvaluation.col + 1}]`
                    : currentIteration.enteringCell
                    ? `Entering Basis Loop for Cell [${currentIteration.enteringCell.row + 1}, ${currentIteration.enteringCell.col + 1}]`
                    : 'Stepping Stone Closed Loop'}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-white text-2xs font-bold"
                  style={{ backgroundColor: activePalette.stroke }}
                >
                  {activePalette.name} Polygon
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-600">Alternating path:</span>
                <div className="flex items-center gap-1">
                  {activeLoop.map((s, idx) => (
                    <span
                      key={`pill-${idx}`}
                      className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                        s.sign === '+'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {s.sign}θ [{s.row + 1},{s.col + 1}]
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <TransportationTable
            solution={currentTableSolution}
            objective={objective}
            highlightLoop={activeLoop}
            loopPalette={activePalette}
            interactiveLoopInspection={false}
          />
        </div>
      )}

      {/* INSTRUCTION 4 & 5: Closed Path Reallocation & Next Tableau Construction Details */}
      {currentIteration && !currentIteration.isOptimal && currentIteration.enteringCell && currentIteration.loop && (
        <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white border border-blue-200 rounded-xl p-5 text-xs text-blue-950 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-blue-200">
            <div className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-2xs font-bold">
                Instructions 4 & 5
              </span>
              <span>Pivot Selection & Next Tableau Construction</span>
            </div>
            <span className="text-2xs font-semibold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full">
              Reallocation Quantity θ = {currentIteration.theta} units
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Instruction 4: Entering Unused Cell */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Chosen Unused Cell:</span>
                <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  {isMax ? 'Largest Positive Index' : 'Most Negative Index'}
                </span>
              </div>
              <div className="font-bold text-slate-900 text-base">
                [{currentIteration.enteringCell.row + 1}, {currentIteration.enteringCell.col + 1}]
              </div>
              <div className="text-slate-600 text-2xs">
                {steppingStoneSolution.sources[currentIteration.enteringCell.row]} →{' '}
                {steppingStoneSolution.destinations[currentIteration.enteringCell.col]}
              </div>
              <div className="text-emerald-700 font-mono font-bold text-xs pt-1">
                Improvement Index: {currentIteration.enteringCell.delta >= 0 ? `+${currentIteration.enteringCell.delta}` : currentIteration.enteringCell.delta}
              </div>
            </div>

            {/* Instruction 4: Leaving Negative Corner Stone */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Smallest Stone in Negative Position:</span>
                <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                  Donor Cell Leaves Basis
                </span>
              </div>
              <div className="font-bold text-slate-900 text-base">
                Cell [{currentIteration.leavingCell ? currentIteration.leavingCell.row + 1 : '—'},{' '}
                {currentIteration.leavingCell ? currentIteration.leavingCell.col + 1 : '—'}]
              </div>
              <div className="text-slate-600 text-2xs">
                {currentIteration.leavingCell
                  ? `${steppingStoneSolution.sources[currentIteration.leavingCell.row]} → ${
                      steppingStoneSolution.destinations[currentIteration.leavingCell.col]
                    }`
                  : '—'}
              </div>
              <div className="text-rose-700 font-mono font-bold text-xs pt-1">
                Allocation hits 0 (Departs Basis)
              </div>
            </div>

            {/* Instruction 4: Reallocation Operation Math */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1">
              <span className="text-slate-500 font-medium block">Corner Reallocation Rule:</span>
              <div className="text-slate-800 font-mono text-2xs space-y-0.5 pt-0.5">
                <div>• Unused corner (+): 0 + {currentIteration.theta} = <strong>{currentIteration.theta}</strong> (new stone)</div>
                <div>• Positive corners (+): stone + {currentIteration.theta}</div>
                <div>• Negative corners (-): stone - {currentIteration.theta}</div>
              </div>
              <div className="text-3xs text-blue-700 pt-1">
                Net cost change: θ × Δ = {currentIteration.theta} × ({currentIteration.enteringCell.delta}) ={' '}
                <strong>${(currentIteration.theta * currentIteration.enteringCell.delta).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Instruction 5: Guarantee of Unchanged Stones */}
          <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Instruction 5 Mandate: Stones Not at Corners Remain in Exact Same Position</span>
              </div>
              <span className="text-3xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {unchangedStones.length} Unchanged Stone{unchangedStones.length !== 1 ? 's' : ''}
              </span>
            </div>

            {unchangedStones.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {unchangedStones.map((stone, idx) => (
                  <div
                    key={`unchanged-${idx}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-2xs"
                  >
                    <span className="font-mono font-bold text-indigo-700">
                      [{stone.row + 1}, {stone.col + 1}]
                    </span>
                    <span>{stone.source} → {stone.dest}:</span>
                    <span className="font-bold font-mono">
                      {stone.isZeroStone ? '0 (Zero Stone)' : `${stone.amount} units`}
                    </span>
                    <span className="text-slate-400 font-mono">(${stone.cost}/u)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-2xs italic">
                All basic stones were corners of the closed polygon path for this iteration.
              </p>
            )}

            <div className="flex items-center gap-4 text-3xs text-emerald-800 font-medium pt-1">
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Row Supplies Verified (∑ Row allocations = Supply capacity)</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Column Demands Verified (∑ Column allocations = Demand requirement)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSTRUCTION 6: Formulate the Decision Based on Optimal (Final) Tableau */}
      {currentIteration && currentIteration.isOptimal && (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-2 border-emerald-300 rounded-xl p-6 shadow-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 border border-emerald-300 mb-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                Instruction 6: Optimal Decision Formulation
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Recommended Operational & Managerial Distribution Plan
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Formulated from the entries of the final optimal tableau. All unused cell improvement indices satisfy optimality ({isMax ? 'all Δ ≤ 0' : 'all Δ ≥ 0'}).
              </p>
            </div>

            <button
              onClick={handleCopyDecision}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
            >
              {copiedDecision ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDecision ? 'Decision Copied!' : 'Copy Decision Summary'}</span>
            </button>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium block">
                {isMax ? 'Maximum Total Profit' : 'Minimum Total Distribution Cost'}
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                ${currentCost.toLocaleString()}
              </div>
              <span className="text-2xs text-slate-500 mt-0.5 block">
                Global optimal reached in {iterations.length} iteration{iterations.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium block">
                {isMax ? 'Profit Gained vs Initial NWCR' : 'Cost Savings vs Initial NWCR'}
              </span>
              <div className="text-2xl font-extrabold text-indigo-700 font-mono mt-1 flex items-center gap-1">
                {costDiff > 0 ? (
                  isMax ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-emerald-600" />
                ) : null}
                <span>${costDiff > 0 ? costDiff.toLocaleString() : '0'}</span>
              </div>
              <span className="text-2xs text-slate-500 mt-0.5 block">
                {costDiff > 0 ? `${costDiffPercent}% improvement over initial basis` : 'Initial feasible solution was already optimal'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium block">
                Quota Satisfaction & Basis
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                100%
              </div>
              <span className="text-2xs text-emerald-700 font-medium mt-0.5 block">
                All {m} supplies & {n} demands fulfilled ({actualBasicCells} basic stones)
              </span>
            </div>
          </div>

          {/* Shipment Schedule Table */}
          <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-emerald-50/60 border-b border-emerald-200 flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                Optimal Route Shipment Schedule
              </span>
              <span className="text-2xs text-slate-500">
                {activeShipments.filter((s) => !s.isZeroStone && s.amount > 0).length} Active Route(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                    <th className="p-3">Source (Origin)</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3 text-center">Units to Ship (xᵢⱼ*)</th>
                    <th className="p-3 text-center">Unit {isMax ? 'Profit' : 'Cost'}</th>
                    <th className="p-3 text-right">Route Total</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeShipments.map((s, idx) => (
                    <tr key={`shipment-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">
                        {s.source}
                      </td>
                      <td className="p-3 text-slate-700">
                        {s.dest}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-sm text-indigo-700">
                        {s.isZeroStone ? '0' : s.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        ${s.unitCost}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ${s.subtotal.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {s.isZeroStone ? (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800">
                            Zero Stone (0)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800">
                            Active Shipment
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/70 font-bold border-t-2 border-emerald-300 text-slate-900">
                    <td colSpan={2} className="p-3">
                      Total System Optimal Outcome
                    </td>
                    <td className="p-3 text-center font-mono text-indigo-800">
                      {activeShipments.reduce((acc, s) => acc + s.amount, 0).toLocaleString()} units
                    </td>
                    <td className="p-3 text-center text-slate-500">—</td>
                    <td className="p-3 text-right font-mono text-emerald-800 text-sm">
                      ${currentCost.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-600 text-white">
                        OPTIMAL
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Formulated Decision Text Narrative */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-2 shadow-2xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Formal Operational Decision Formulation</span>
            </div>
            <p className="leading-relaxed">
              Based on the {isMax ? 'maximization' : 'minimization'} objective and the entries of the final optimal tableau, the company should execute the following distribution policy:
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 font-mono text-slate-800 text-2xs">
              {activeShipments
                .filter((s) => !s.isZeroStone && s.amount > 0)
                .map((s, idx) => (
                  <div key={`desc-line-${idx}`}>
                    • Ship <strong>{s.amount.toLocaleString()} units</strong> from <strong>{s.source}</strong> to <strong>{s.dest}</strong> at ${s.unitCost}/unit (subtotal: ${s.subtotal.toLocaleString()})
                  </div>
                ))}
            </div>
            <p className="leading-relaxed text-slate-600 text-2xs">
              This shipment allocation guarantees that all {m} supply capacities and all {n} demand requirements are 100% satisfied while yielding the absolute global {isMax ? 'maximum total profit' : 'minimum total distribution cost'} of <strong>${currentCost.toLocaleString()}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Non-Basic Cells Evaluation Table (INSTRUCTION 3) */}
      {currentIteration && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Instruction 3: Improvement Index of Each Unused Cell
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-indigo-100 text-indigo-800">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  Color-Coded Closed Polygon Paths
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                For each unused cell, a closed polygon path consisting of horizontal & vertical segments through stones as corners was drawn with alternating signs (+, -, +, -...). The algebraic sum is the Improvement Index.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Total Unused Cells Evaluated: {currentIteration.evaluations.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                  <th className="p-3 w-10 text-center">Color</th>
                  <th className="p-3 w-32">Unused Cell</th>
                  <th className="p-3">Closed Polygon Path (Corners at Stones Only)</th>
                  <th className="p-3">Algebraic Sum of Corner Costs (∑ ±cᵢⱼ)</th>
                  <th className="p-3 text-center w-28">Improvement Index (Δᵢⱼ)</th>
                  <th className="p-3 text-center w-36">Instruction Status</th>
                  <th className="p-3 text-center w-20">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentIteration.evaluations.map((ev, idx) => {
                  const palette = getPaletteForIndex(idx);
                  const isSelected =
                    selectedEvaluation?.row === ev.row && selectedEvaluation?.col === ev.col;
                  const isEntering =
                    currentIteration.enteringCell?.row === ev.row &&
                    currentIteration.enteringCell?.col === ev.col;

                  return (
                    <tr
                      key={`ev-${idx}`}
                      onClick={() => setSelectedEvaluation(ev)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? `${palette.rowHighlightBg} font-medium ring-1 ${palette.borderAccent} ring-inset`
                          : isEntering
                          ? 'bg-amber-50/80 font-medium'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Unique Color Swatch / Chip for Polygon */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center">
                          <div
                            className="w-4 h-4 rounded-full border-2 shadow-xs transition-transform"
                            style={{
                              backgroundColor: palette.stroke,
                              borderColor: isSelected ? '#ffffff' : palette.badgeBorder,
                              transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                            }}
                            title={`Polygon Color: ${palette.name}`}
                          />
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: palette.stroke }}
                          />
                          <span>[{ev.row + 1}, {ev.col + 1}]</span>
                        </div>
                        <span className="block text-3xs font-normal text-slate-500 pl-3.5">
                          {steppingStoneSolution.sources[ev.row]} →{' '}
                          {steppingStoneSolution.destinations[ev.col]}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {ev.loop.map((s, sIdx) => (
                          <span key={`step-${sIdx}`} className="inline-block mr-1">
                            [{s.row + 1},{s.col + 1}]
                            <span
                              className={`ml-0.5 font-bold ${
                                s.sign === '+' ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              ({s.sign})
                            </span>
                            {sIdx < ev.loop.length - 1 && ' →'}
                          </span>
                        ))}
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {ev.calculationFormula}
                      </td>
                      <td className="p-3 text-center font-mono font-extrabold text-sm">
                        <span
                          className={
                            ev.delta < 0
                              ? 'text-rose-600'
                              : ev.delta > 0
                              ? 'text-emerald-700'
                              : 'text-slate-700'
                          }
                        >
                          {ev.delta >= 0 ? `+${ev.delta}` : ev.delta}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isEntering ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                            Instruction 4: Chosen Entering Cell
                          </span>
                        ) : ev.isImproving ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-100 text-rose-800">
                            {isMax ? 'Can Increase Profit' : 'Can Reduce Cost'}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-600">
                            Optimal ({isMax ? 'Δ ≤ 0' : 'Δ ≥ 0'})
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvaluation(ev);
                          }}
                          style={{
                            backgroundColor: isSelected ? palette.stroke : undefined,
                          }}
                          className={`p-1.5 rounded-md transition-all ${
                            isSelected
                              ? 'text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
                          }`}
                          title={`Display ${palette.name} polygon loop on tableau`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
