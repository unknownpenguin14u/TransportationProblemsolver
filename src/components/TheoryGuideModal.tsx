import { BookOpen, X, Check, ArrowRight } from 'lucide-react';

interface TheoryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TheoryGuideModal({ isOpen, onClose }: TheoryGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">Operations Research: Transportation Methods Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-700 max-h-[75vh] overflow-y-auto leading-relaxed">
          {/* 1. Overview & Mathematical Formulation */}
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-xs font-bold">
                1
              </span>
              The Transportation Problem
            </h4>
            <p className="text-xs text-slate-600 mb-2">
              A special class of linear programming where commodities are transported from $m$ sources (with supplies $a_i$) to $n$ destinations (with demands $b_j$) at minimum total cost:
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
              <div>Minimize / Maximize Z = ∑ᵢ ∑ⱼ (cᵢⱼ × xᵢⱼ)</div>
              <div>Subject to:</div>
              <div>• ∑ⱼ xᵢⱼ = aᵢ  for each source i (supply constraint)</div>
              <div>• ∑ᵢ xᵢⱼ = bⱼ  for each destination j (demand constraint)</div>
              <div>• xᵢⱼ ≥ 0       for all i, j (non-negativity)</div>
            </div>
          </div>

          {/* 2. Initial Feasible Solution Methods */}
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-xs font-bold">
                2
              </span>
              Initial Basic Feasible Solution (IBFS) Heuristics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-1">North-West Corner Rule (NWCR)</h5>
                <p className="text-slate-600">
                  Starts at cell (1,1). Allocates min(Supply, Demand), moves right if demand is met, or down if supply is exhausted. Completely ignores transportation costs.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-1">Least-Cost Method (LCM)</h5>
                <p className="text-slate-600">
                  A greedy approach prioritizing the lowest unit transportation cost cell among unexhausted supply rows and unmet demand columns.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-1">Maximum Cell Profit Method</h5>
                <p className="text-slate-600">
                  Specifically tailored for maximization problems. Greedily allocates to the cell yielding the maximum unit profit or contribution margin first.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-1">Vogel's Approximation Method (VAM)</h5>
                <p className="text-slate-600">
                  Penalty method. For each row & column, calculates penalty = difference between lowest 2 costs. Prioritizes the row/column with the largest penalty, allocating to its lowest cost cell. Usually yields near-optimal initial solutions.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Stepping Stone Method: 6-Step Standard Procedure */}
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-xs font-bold">
                3
              </span>
              Transportation Problem: Stepping Stone Method (6-Step Procedure)
            </h4>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">1</span>
                  Instruction 1: Tableau Construction (r rows × c columns)
                </div>
                <p className="text-slate-700 pl-6">
                  Construct a tableau of <em>r</em> rows (sources' supply capacities) and <em>c</em> columns (destinations' demand requirements), with unit distribution costs or profits in the upper-right corner of each route cell.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">2</span>
                  Instruction 2: Initial Feasible Solution (North-West Corner Ladder Pattern & Zero Stone)
                </div>
                <p className="text-slate-700 pl-6">
                  Start at the first source–first destination cell (1, 1). The supply available at any row must first be used up before moving down to the next row, and the demand of any column must first be satisfied before moving right to the next column. All row supplies and column demands must be satisfied. If distributed units satisfy both the column demand and row supply simultaneously and the distribution is not yet finished, write <strong>“0” (zero stone)</strong> to the next row cell or next column cell and continue the ladder-like pattern until it is over.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">3</span>
                  Instruction 3: Compute the Improvement Index of Each Unused Cell
                </div>
                <p className="text-slate-700 pl-6">
                  For each unused cell (cell without entry or distribution units except zero stone), draw a closed polygon path consisting of vertical and horizontal line segments only through used cells or stones as corners, returning to the starting unused cell. The path may skip over stones or unused cells or cross over itself, but corners must be stones and the starting unused cell only. Assign <strong>“+”</strong> first at the unused cell corner, <strong>“-”</strong> to the second corner, <strong>“+”</strong> to the third corner, <strong>“-”</strong> to the fourth corner, and so on alternately. Affix the signs to their respective corner costs or profits and add them algebraically to compute the <strong>Improvement Index</strong>. The tableau is optimal if all indices are <strong>≥ 0</strong> (minimization) or <strong>≤ 0</strong> (maximization); otherwise proceed to Instructions 4, 5, and 6.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">4</span>
                  Instruction 4: Pivot Selection & Smallest Negative Corner Stone (θ)
                </div>
                <p className="text-slate-700 pl-6">
                  Choose the <strong>most negative index</strong> (minimization) or <strong>largest positive index</strong> (maximization) among the unused cells. Redraw the closed path for this chosen cell. Select the <strong>smallest stone</strong> among the stones in the negative position (θ). Add it to each stone (including the unused cell corner) in positive position, and subtract it from each stone (including itself) in negative position.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">5</span>
                  Instruction 5: Construct Next Tableau (Unchanged Stones Remain)
                </div>
                <p className="text-slate-700 pl-6">
                  Construct the next tableau incorporating the changes from Instruction 4. <em>The stones that are not found at the corners of the closed path must remain in the exact same position in the new tableau</em>. Only the corner stones and the unused cell are affected. Ensure all row supplies and column demands are satisfied.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-2xs font-bold">6</span>
                  Instruction 6: Formulate the Decision Based on Optimal Tableau
                </div>
                <p className="text-slate-700 pl-6">
                  Once all improvement indices confirm optimality, formulate the final operational decision based on the objective (Minimize Cost / Maximize Profit) and the entries in the optimal tableau, specifying the exact units to ship on each route and the total optimal objective value.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Got it, return to solver
          </button>
        </div>
      </div>
    </div>
  );
}
