import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  MethodSolution,
  LoopStep,
  ProblemObjective,
} from '../types/transportation';
import { findClosedLoop } from '../utils/transportationAlgorithms';
import LoopOverlayPolygon, { CellPosition } from './LoopOverlayPolygon';
import { LoopPalette, LOOP_PALETTES } from '../utils/loopPalettes';
import { Check, Info, Sparkles, CornerRightDown, Layers, Calculator, HelpCircle } from 'lucide-react';

interface TransportationTableProps {
  solution: MethodSolution;
  objective: ProblemObjective;
  highlightLoop?: LoopStep[] | null;
  loopPalette?: LoopPalette;
  interactiveLoopInspection?: boolean;
}

export default function TransportationTable({
  solution,
  objective,
  highlightLoop = null,
  loopPalette,
  interactiveLoopInspection = true,
}: TransportationTableProps) {
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [inspectedLoop, setInspectedLoop] = useState<LoopStep[] | null>(null);
  const [showPolygonLines, setShowPolygonLines] = useState<boolean>(true);

  // VAM Penalty Tableau state
  const vamStepsWithPenalties = useMemo(() => {
    return (solution.steps || []).filter((s) => Boolean(s.penalties));
  }, [solution.steps]);

  const isVAM = solution.method === 'vam' || vamStepsWithPenalties.length > 0;
  const [showVamPenalties, setShowVamPenalties] = useState<boolean>(isVAM);
  const [selectedVamStep, setSelectedVamStep] = useState<number | null>(null);

  useEffect(() => {
    setShowVamPenalties(isVAM);
    setSelectedVamStep(null);
  }, [isVAM, solution.method]);

  const activeVamSteps = useMemo(() => {
    if (!showVamPenalties || vamStepsWithPenalties.length === 0) return [];
    if (selectedVamStep !== null) {
      return vamStepsWithPenalties.filter((s) => s.stepNumber === selectedVamStep);
    }
    return vamStepsWithPenalties;
  }, [showVamPenalties, vamStepsWithPenalties, selectedVamStep]);

  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const [cellPositions, setCellPositions] = useState<Map<string, CellPosition>>(new Map());
  const [wrapperDimensions, setWrapperDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const {
    sources,
    destinations,
    costs,
    supply,
    demand,
    allocations,
    isEpsilon,
    dummySourceIndex,
    dummyDestIndex,
  } = solution;

  const m = sources.length;
  const n = destinations.length;
  const isMax = objective === 'maximize';

  // Active loop: either passed as prop or currently inspected
  const activeLoop = highlightLoop || inspectedLoop;

  // Measure cell positions relative to table wrapper for polygon drawing
  const updateCellPositions = useCallback(() => {
    if (!tableWrapperRef.current) return;
    const wrapperRect = tableWrapperRef.current.getBoundingClientRect();
    setWrapperDimensions({
      width: tableWrapperRef.current.scrollWidth,
      height: tableWrapperRef.current.scrollHeight,
    });

    const newMap = new Map<string, CellPosition>();
    cellRefs.current.forEach((el, key) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        // Calculate offset relative to the scrollable table wrapper container
        const x = rect.left - wrapperRect.left + tableWrapperRef.current!.scrollLeft;
        const y = rect.top - wrapperRect.top + tableWrapperRef.current!.scrollTop;
        const [r, c] = key.split('-').map(Number);
        newMap.set(key, {
          row: r,
          col: c,
          x,
          y,
          width: rect.width,
          height: rect.height,
        });
      }
    });
    setCellPositions(newMap);
  }, []);

  useEffect(() => {
    updateCellPositions();
    const handleResize = () => updateCellPositions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCellPositions, solution, activeLoop]);

  // Re-measure after DOM updates when active loop changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCellPositions();
    }, 50);
    return () => clearTimeout(timer);
  }, [activeLoop, updateCellPositions]);

  const getLoopStepForCell = (r: number, c: number): { step: LoopStep; index: number } | null => {
    if (!activeLoop) return null;
    const idx = activeLoop.findIndex((s) => s.row === r && s.col === c);
    if (idx !== -1) {
      return { step: activeLoop[idx], index: idx + 1 };
    }
    return null;
  };

  const handleCellHover = (r: number, c: number) => {
    if (!interactiveLoopInspection || highlightLoop) return;
    setHoveredCell({ r, c });
    if (allocations[r][c] === null) {
      // Find closed loop for this non-basic cell
      const loop = findClosedLoop(allocations, r, c, costs);
      setInspectedLoop(loop);
    } else {
      setInspectedLoop(null);
    }
  };

  const handleCellLeave = () => {
    if (highlightLoop) return;
    setHoveredCell(null);
    setInspectedLoop(null);
  };

  // Compute row allocated sums and col allocated sums
  const rowAllocated = Array.from({ length: m }, (_, r) =>
    allocations[r].reduce<number>((acc, val) => acc + (val !== null ? val : 0), 0)
  );

  const colAllocated = Array.from({ length: n }, (_, c) =>
    Array.from({ length: m }, (_, r) => allocations[r][c]).reduce<number>(
      (acc, val) => acc + (val !== null ? val : 0),
      0
    )
  );

  // Generate formula components
  const formulaComponents: {
    source: string;
    dest: string;
    cost: number;
    amount: number;
    subtotal: number;
  }[] = [];

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const val = allocations[r][c];
      if (val !== null && val > 0) {
        formulaComponents.push({
          source: sources[r],
          dest: destinations[c],
          cost: costs[r][c],
          amount: val,
          subtotal: costs[r][c] * val,
        });
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Table Header Details */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Transportation Tableau
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {solution.methodName}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeLoop && activeLoop.length >= 4 && (
            <button
              onClick={() => setShowPolygonLines(!showPolygonLines)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                showPolygonLines
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title="Toggle polygon path and directional lines"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showPolygonLines ? 'Polygon Lines: ON' : 'Polygon Lines: OFF'}</span>
            </button>
          )}

          <div className="text-right">
            <span className="text-xs text-slate-500 block">
              {isMax ? 'Total Objective Profit' : 'Total Objective Cost'}
            </span>
            <span className="text-lg font-extrabold text-indigo-700">
              ${solution.totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Loop Feedback Pill */}
      {inspectedLoop && !highlightLoop && (
        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>
              Inspecting Stepping-Stone loop for empty cell [
              {inspectedLoop[0].row + 1}, {inspectedLoop[0].col + 1}]. Loop contains{' '}
              {inspectedLoop.length} vertices with alternating +/- transfer signs.
            </span>
          </div>
          <span className="text-indigo-600 font-medium">
            Alternating signs: {inspectedLoop.map((s) => s.sign).join(' ')}
          </span>
        </div>
      )}

      {/* VAM Penalty Tableau Mode Banner & Controls */}
      {isVAM && (
        <div className="px-4 py-3 bg-purple-50/70 border-b border-purple-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-2xs shadow-2xs">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-purple-950 block">
                Vogel&apos;s Approximation Method (VAM) Penalty Tableau
              </span>
              <span className="text-3xs text-purple-700">
                Shows row difference penalties on the right and column difference penalties at the bottom.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Penalties Display */}
            <button
              onClick={() => setShowVamPenalties(!showVamPenalties)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                showVamPenalties
                  ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                  : 'bg-white text-purple-800 border-purple-300 hover:bg-purple-100/50'
              }`}
            >
              {showVamPenalties ? '✓ Penalty Columns & Rows: Visible' : '+ Show Penalty Matrix (P₁, P₂...)'}
            </button>

            {/* Step Selection Pills */}
            {showVamPenalties && vamStepsWithPenalties.length > 1 && (
              <div className="flex items-center gap-1 bg-white/90 p-1 rounded-lg border border-purple-200">
                <span className="text-3xs font-semibold text-purple-900 px-1">Round:</span>
                <button
                  onClick={() => setSelectedVamStep(null)}
                  className={`px-2 py-0.5 rounded text-2xs font-bold transition-colors ${
                    selectedVamStep === null
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-purple-800 hover:bg-purple-100'
                  }`}
                  title="Show all penalty rounds combined on the tableau (Textbook format)"
                >
                  All (Textbook)
                </button>
                {vamStepsWithPenalties.map((st) => (
                  <button
                    key={`btn-vam-step-${st.stepNumber}`}
                    onClick={() => setSelectedVamStep(st.stepNumber)}
                    className={`px-1.5 py-0.5 rounded text-2xs font-bold transition-colors ${
                      selectedVamStep === st.stepNumber
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-purple-700 hover:bg-purple-100'
                    }`}
                    title={`Inspect only Penalty Round P${st.stepNumber}`}
                  >
                    P{st.stepNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tableau Table */}
      <div
        ref={tableWrapperRef}
        className="p-4 overflow-x-auto relative"
      >
        {/* Polygon Overlay Lines with +/- Signs */}
        {showPolygonLines && activeLoop && activeLoop.length >= 4 && (
          <LoopOverlayPolygon
            loop={activeLoop}
            cellPositions={cellPositions}
            containerWidth={wrapperDimensions.width}
            containerHeight={wrapperDimensions.height}
            palette={loopPalette || LOOP_PALETTES[0]}
            enteringCellCoord={activeLoop[0] ? { row: activeLoop[0].row, col: activeLoop[0].col } : null}
          />
        )}

        <table className="border-collapse text-sm mx-auto relative z-10">
          <thead>
            <tr>
              <th className="p-2 border border-slate-300 bg-slate-100 text-slate-700 text-left font-semibold min-w-36">
                <div className="text-2xs text-slate-500 uppercase font-medium">Sources \ Destinations</div>
                Origins
              </th>
              {destinations.map((dest, cIdx) => {
                const isDummyCol = dummyDestIndex === cIdx;
                return (
                  <th
                    key={`th-${cIdx}`}
                    className={`p-2 border border-slate-300 min-w-28 text-center font-semibold text-xs ${
                      isDummyCol
                        ? 'bg-amber-50 text-amber-900 border-dashed'
                        : 'bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>{dest}</div>
                    {isDummyCol && (
                      <span className="text-2xs font-normal text-amber-700 block mt-0.5">
                        (Dummy Balance)
                      </span>
                    )}
                  </th>
                );
              })}
              <th className="p-2 border border-slate-300 bg-indigo-50 text-indigo-900 font-bold text-center min-w-24">
                Total Supply
              </th>

              {/* VAM Row Penalty Headers */}
              {isVAM && showVamPenalties && activeVamSteps.map((step) => (
                <th
                  key={`th-vam-pen-${step.stepNumber}`}
                  className={`p-2 border border-purple-300 text-center font-bold text-xs min-w-16 ${
                    selectedVamStep === step.stepNumber
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-100/90 text-purple-950'
                  }`}
                  title={`Row Penalty Round P${step.stepNumber}`}
                >
                  <div className="font-extrabold">P{step.stepNumber}</div>
                  <div className={`text-3xs font-medium ${selectedVamStep === step.stepNumber ? 'text-purple-200' : 'text-purple-700'}`}>
                    Row Pen
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((source, rIdx) => {
              const isDummyRow = dummySourceIndex === rIdx;
              return (
                <tr key={`tr-${rIdx}`}>
                  {/* Source Row Header */}
                  <td
                    className={`p-2 border border-slate-300 font-semibold text-xs ${
                      isDummyRow
                        ? 'bg-amber-50 text-amber-900 border-dashed'
                        : 'bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>{source}</div>
                    {isDummyRow && (
                      <span className="text-2xs font-normal text-amber-700 block mt-0.5">
                        (Dummy Balance)
                      </span>
                    )}
                  </td>

                  {/* Tableau Cells */}
                  {destinations.map((_, cIdx) => {
                    const costVal = costs[rIdx][cIdx];
                    const allocVal = allocations[rIdx][cIdx];
                    const isCellEpsilon = isEpsilon[rIdx][cIdx];
                    const loopData = getLoopStepForCell(rIdx, cIdx);

                    // Styling state
                    const isAllocated = allocVal !== null;
                    const isLoopCell = Boolean(loopData);

                    // VAM allocation step lookup
                    const stepAllocated = isVAM && showVamPenalties
                      ? vamStepsWithPenalties.find(
                          (s) => s.cell?.row === rIdx && s.cell?.col === cIdx
                        )
                      : null;
                    const isStepFocused =
                      selectedVamStep !== null &&
                      stepAllocated?.stepNumber === selectedVamStep;

                    return (
                      <td
                        key={`cell-${rIdx}-${cIdx}`}
                        ref={(el) => {
                          const key = `${rIdx}-${cIdx}`;
                          if (el) {
                            cellRefs.current.set(key, el);
                          } else {
                            cellRefs.current.delete(key);
                          }
                        }}
                        onMouseEnter={() => handleCellHover(rIdx, cIdx)}
                        onMouseLeave={handleCellLeave}
                        className={`relative p-2 border border-slate-300 h-20 min-w-28 align-top transition-all ${
                          isStepFocused
                            ? 'bg-purple-100/90 ring-3 ring-purple-600 ring-inset'
                            : isLoopCell
                            ? loopData?.step.sign === '+'
                              ? 'bg-emerald-50/80 ring-2 ring-emerald-500 ring-inset'
                              : 'bg-rose-50/80 ring-2 ring-rose-500 ring-inset'
                            : isAllocated
                            ? 'bg-blue-50/30'
                            : 'bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Upper-right Corner: Unit Cost Box */}
                        <div
                          className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-2xs font-mono font-bold text-slate-700"
                          title={`Unit ${isMax ? 'profit' : 'cost'}: $${costVal}`}
                        >
                          ${costVal}
                        </div>

                        {/* Center: Allocation Content */}
                        <div className="h-full flex flex-col items-center justify-center pt-2">
                          {isAllocated ? (
                            <div className="flex flex-col items-center">
                              <span
                                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs ${
                                  isStepFocused
                                    ? 'bg-purple-700 text-white ring-2 ring-purple-300'
                                    : isCellEpsilon
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-indigo-600 text-white'
                                }`}
                              >
                                {isCellEpsilon ? '0' : allocVal}
                              </span>
                              {isCellEpsilon && (
                                <span className="text-3xs text-amber-700 mt-0.5 font-semibold">
                                  Zero Stone (0)
                                </span>
                              )}
                              {/* VAM Step Allocation Marker */}
                              {stepAllocated && (
                                <span
                                  className="mt-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-3xs font-bold bg-purple-100 text-purple-900 border border-purple-200"
                                  title={`Allocated in VAM Penalty Round P${stepAllocated.stepNumber}`}
                                >
                                  P{stepAllocated.stepNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-sm select-none font-mono">
                              —
                            </span>
                          )}

                          {/* Loop Marker Badge */}
                          {loopData && (
                            <div
                              className={`mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-2xs font-extrabold ${
                                loopData.step.sign === '+'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              <span>{loopData.step.sign}</span>
                              <span className="text-3xs opacity-80">
                                (#{loopData.index})
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Row Total Supply Check */}
                  <td className="p-2 border border-slate-300 bg-indigo-50/40 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-bold text-indigo-900">
                        {rowAllocated[rIdx]} / {supply[rIdx]}
                      </span>
                      {rowAllocated[rIdx] === supply[rIdx] && (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                  </td>

                  {/* VAM Row Penalty Cells */}
                  {isVAM && showVamPenalties && activeVamSteps.map((step) => {
                    const rowPen = step.penalties?.rowPenalties?.[rIdx];
                    const isSelected = step.penalties?.selectedRow === rIdx;
                    return (
                      <td
                        key={`td-vam-rpen-${rIdx}-${step.stepNumber}`}
                        className={`p-2 border border-purple-200 text-center font-mono text-xs transition-colors ${
                          isSelected
                            ? 'bg-purple-100 font-extrabold text-purple-950 ring-2 ring-purple-600 ring-inset'
                            : rowPen === null
                            ? 'bg-slate-50 text-slate-400'
                            : 'bg-purple-50/40 text-purple-900 font-medium'
                        }`}
                      >
                        {isSelected ? (
                          <span
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-700 text-white font-bold text-xs shadow-xs"
                            title={`Round P${step.stepNumber} WINNER: Maximum Row Penalty (${rowPen})`}
                          >
                            ★ {rowPen}
                          </span>
                        ) : rowPen === null ? (
                          <span
                            className="text-slate-400 font-bold select-none"
                            title="Row capacity exhausted prior to this round"
                          >
                            —
                          </span>
                        ) : (
                          <span>{rowPen}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Demand Row */}
            <tr>
              <td className="p-2 border border-slate-300 bg-emerald-50 text-emerald-900 font-bold text-xs text-left">
                Total Demand
              </td>
              {destinations.map((_, cIdx) => (
                <td
                  key={`col-demand-${cIdx}`}
                  className="p-2 border border-slate-300 bg-emerald-50/40 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-emerald-900">
                      {colAllocated[cIdx]} / {demand[cIdx]}
                    </span>
                    {colAllocated[cIdx] === demand[cIdx] && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                </td>
              ))}
              {/* Grand Total */}
              <td className="p-2 border border-slate-300 bg-slate-100 text-center text-xs font-extrabold text-slate-800">
                {supply.reduce((a, b) => a + b, 0)}
              </td>
              {/* Blank spacers for row penalty columns under Total Demand */}
              {isVAM && showVamPenalties && activeVamSteps.map((step) => (
                <td
                  key={`demand-spacer-${step.stepNumber}`}
                  className="p-1 border border-slate-200 bg-slate-100/50 text-center text-3xs text-slate-400"
                >
                  —
                </td>
              ))}
            </tr>

            {/* VAM Column Penalty Rows */}
            {isVAM && showVamPenalties && activeVamSteps.map((step) => (
              <tr key={`tr-vam-cpen-${step.stepNumber}`} className="bg-purple-50/20">
                <td className="p-2 border border-purple-300 bg-purple-100/70 text-purple-950 font-bold text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span>Col Penalty (P{step.stepNumber})</span>
                    <span className="text-3xs px-1 py-0.2 rounded bg-purple-200 text-purple-800 font-semibold uppercase">
                      Diff
                    </span>
                  </div>
                </td>
                {destinations.map((_, cIdx) => {
                  const colPen = step.penalties?.colPenalties?.[cIdx];
                  const isSelected = step.penalties?.selectedCol === cIdx;
                  return (
                    <td
                      key={`td-vam-cpen-${cIdx}-${step.stepNumber}`}
                      className={`p-2 border border-purple-200 text-center font-mono text-xs transition-colors ${
                        isSelected
                          ? 'bg-purple-100 font-extrabold text-purple-950 ring-2 ring-purple-600 ring-inset'
                          : colPen === null
                          ? 'bg-slate-50 text-slate-400'
                          : 'bg-white text-purple-900 font-medium'
                      }`}
                    >
                      {isSelected ? (
                        <span
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-700 text-white font-bold text-xs shadow-xs"
                          title={`Round P${step.stepNumber} WINNER: Maximum Column Penalty (${colPen})`}
                        >
                          ★ {colPen}
                        </span>
                      ) : colPen === null ? (
                        <span
                          className="text-slate-400 font-bold select-none"
                          title="Column demand satisfied prior to this round"
                        >
                          —
                        </span>
                      ) : (
                        <span>{colPen}</span>
                      )}
                    </td>
                  );
                })}
                {/* Under Total Supply: Target Allocation summary for this round */}
                <td className="p-2 border border-purple-300 bg-purple-50 text-center font-mono text-xs text-purple-900 font-semibold">
                  {step.cell ? (
                    <div
                      className="text-3xs leading-tight"
                      title={`Round P${step.stepNumber} Target: Allocated ${step.allocatedAmount} units at $${step.cost} unit cost`}
                    >
                      <span className="font-bold text-purple-800">
                        [{step.cell.row + 1},{step.cell.col + 1}]
                      </span>
                      <span className="block text-slate-500 font-normal">
                        +{step.allocatedAmount}u (${step.cost})
                      </span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                {/* Spacers for row penalty columns */}
                {activeVamSteps.map((sCol) => (
                  <td
                    key={`cpen-spacer-${step.stepNumber}-${sCol.stepNumber}`}
                    className="p-1 border border-slate-200 bg-slate-50/50 text-center text-3xs text-slate-400"
                  >
                    {step.stepNumber === sCol.stepNumber ? (
                      <span className="text-purple-700 font-bold">Round {step.stepNumber}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cost Breakdown Formula Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <CornerRightDown className="w-3.5 h-3.5 text-indigo-600" />
          <span>Detailed Transportation Objective Formula:</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed overflow-x-auto">
          <div className="text-slate-500 mb-1">
            Z = ∑ (cᵢⱼ × xᵢⱼ)
          </div>
          <div>
            Z ={' '}
            {formulaComponents.length > 0
              ? formulaComponents
                  .map(
                    (fc) =>
                      `($${fc.cost} × ${fc.amount})`
                  )
                  .join(' + ')
              : '0'}
          </div>
          <div className="font-bold text-indigo-700 mt-1">
            = {formulaComponents.map((fc) => `$${fc.subtotal}`).join(' + ')} ={' '}
            <span className="underline decoration-indigo-500 decoration-2">
              ${solution.totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* VAM Method Explanation Card */}
        {isVAM && (
          <div className="mt-3 p-3 bg-purple-50/80 border border-purple-200 rounded-lg text-xs text-purple-950">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-purple-900">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <span>How Vogel&apos;s Approximation Method (VAM) Shapes This Tableau:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-2xs text-purple-900/90 leading-relaxed">
              <li>
                <strong>Penalty Columns (Right) &amp; Rows (Bottom):</strong> In each iteration $P_k$, VAM computes the difference between the lowest and next-lowest costs for each active row and column.
              </li>
              <li>
                <strong>Max Penalty Selection:</strong> The row or column with the largest penalty difference (marked with ★) represents the route that would inflict the greatest cost penalty if neglected.
              </li>
              <li>
                <strong>Greedy Allocation within Winner:</strong> The minimum unit cost cell in that chosen row/col is filled with the maximum possible supply/demand.
              </li>
              <li>
                <strong>Initial Basis Advantage:</strong> Unlike the Northwest Corner Rule (NWCR) which blindly distributes units along the top-left ladder regardless of costs, VAM yields a tableau that is already optimal or very near optimal ($Z = ${solution.totalCost.toLocaleString()}).
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
