import { MethodSolution, ProblemObjective } from '../types/transportation';
import {
  Trophy,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface MethodComparisonProps {
  solutions: {
    nwcr: MethodSolution;
    least_cost: MethodSolution;
    max_profit: MethodSolution;
    vam: MethodSolution;
    stepping_stone: MethodSolution;
  };
  objective: ProblemObjective;
  onSelectMethod: (method: 'nwcr' | 'least_cost' | 'max_profit' | 'vam' | 'stepping_stone') => void;
  activeMethod: string;
}

export default function MethodComparison({
  solutions,
  objective,
  onSelectMethod,
  activeMethod,
}: MethodComparisonProps) {
  const isMax = objective === 'maximize';
  const optimalCost = solutions.stepping_stone.totalCost;

  const methodList = [
    {
      id: 'nwcr' as const,
      name: 'North-West Corner Rule (NWCR)',
      shortName: 'NWCR',
      desc: 'Top-left priority allocation ignoring costs. Quick heuristic.',
      solution: solutions.nwcr,
      color: 'border-slate-300 hover:border-slate-400',
      badge: 'Heuristic Baseline',
    },
    {
      id: 'least_cost' as const,
      name: 'Least-Cost Method (LCM)',
      shortName: 'Least-Cost',
      desc: 'Greedy lowest unit-cost allocation first.',
      solution: solutions.least_cost,
      color: 'border-blue-200 hover:border-blue-400',
      badge: 'Greedy Cost',
    },
    {
      id: 'max_profit' as const,
      name: 'Maximum Cell Profit Method',
      shortName: 'Max Profit',
      desc: 'Greedy maximum cell value/margin allocation first.',
      solution: solutions.max_profit,
      color: 'border-amber-200 hover:border-amber-400',
      badge: 'Greedy Profit',
    },
    {
      id: 'vam' as const,
      name: "Vogel's Approximation Method (VAM)",
      shortName: 'VAM',
      desc: 'Calculates row & column penalties to allocate near-optimal.',
      solution: solutions.vam,
      color: 'border-purple-200 hover:border-purple-400',
      badge: 'Best Heuristic',
    },
    {
      id: 'stepping_stone' as const,
      name: 'Stepping Stone Method (Optimal)',
      shortName: 'Stepping Stone',
      desc: 'Closed-loop optimality evaluations & reallocations.',
      solution: solutions.stepping_stone,
      color: 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/20',
      badge: 'Proven Optimal',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Method Performance & Solution Comparison
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare initial basic feasible solutions against the mathematically optimal Stepping Stone solution.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
          Optimal Objective: ${optimalCost.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {methodList.map((item) => {
          const cost = item.solution.totalCost;
          const isOptimal = cost === optimalCost;
          const isSelected = activeMethod === item.id;
          const diff = cost - optimalCost;

          return (
            <div
              key={item.id}
              onClick={() => onSelectMethod(item.id)}
              className={`relative cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                item.color
              } ${
                isSelected
                  ? 'ring-2 ring-indigo-600 shadow-sm bg-indigo-50/20'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                    {item.badge}
                  </span>
                  {isOptimal && (
                    <span className="inline-flex items-center gap-0.5 text-2xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Optimal
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">
                  {item.shortName}
                </h4>
                <p className="text-3xs text-slate-500 mt-1 line-clamp-2">
                  {item.desc}
                </p>

                {/* Total Value Display */}
                <div className="mt-3">
                  <div className="text-lg font-extrabold text-slate-900">
                    ${cost.toLocaleString()}
                  </div>

                  {/* Variance vs Optimal */}
                  <div className="text-2xs mt-0.5">
                    {isOptimal ? (
                      <span className="text-emerald-600 font-medium">
                        0% variance (Optimal)
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-0.5">
                        {isMax ? (
                          <>
                            <TrendingDown className="w-3 h-3" />
                            ${Math.abs(diff)} lower profit
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            +${diff} excess cost
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Action */}
              <button
                className={`mt-3 w-full py-1 text-2xs font-semibold rounded-md flex items-center justify-center gap-1 transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isSelected ? 'Viewing' : 'View Tableau'}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
