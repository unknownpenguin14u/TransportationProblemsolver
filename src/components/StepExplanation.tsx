import { useState } from 'react';
import { MethodSolution, StepLog } from '../types/transportation';
import { ListOrdered, ChevronDown, ChevronUp, Layers, Compass } from 'lucide-react';

interface StepExplanationProps {
  solution: MethodSolution;
}

export default function StepExplanation({ solution }: StepExplanationProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const steps = solution.steps;

  if (steps.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Step-by-Step Allocation Sequence ({steps.length} Steps)
          </h3>
          <span className="text-2xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
            {solution.methodName}
          </span>
        </div>
        <div className="text-slate-500">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {steps.map((step: StepLog) => (
            <div
              key={`step-${step.stepNumber}`}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-bold text-indigo-700">
                  Step {step.stepNumber}: {step.title}
                </span>
                {step.cell && (
                  <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                    Target: [{step.cell.row + 1}, {step.cell.col + 1}] | Cost: ${step.cost} | Amount: {step.allocatedAmount}
                  </span>
                )}
              </div>

              <p className="text-slate-600 mb-2 leading-relaxed">
                {step.description}
              </p>

              {/* VAM Penalties Sub-table if present */}
              {step.penalties && (
                <div className="bg-white p-2.5 rounded border border-slate-200 text-2xs mb-2">
                  <span className="font-semibold text-slate-700 block mb-1">
                    VAM Penalty Calculations at this Step:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-mono">
                    <div>
                      <span className="font-medium text-slate-500">Row Penalties: </span>
                      {step.penalties.rowPenalties.map((p, idx) => (
                        <span
                          key={`rp-${idx}`}
                          className={`mr-1.5 px-1 py-0.5 rounded ${
                            step.penalties?.selectedRow === idx
                              ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          R{idx + 1}: {p !== null ? p : '—'}
                        </span>
                      ))}
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Col Penalties: </span>
                      {step.penalties.colPenalties.map((p, idx) => (
                        <span
                          key={`cp-${idx}`}
                          className={`mr-1.5 px-1 py-0.5 rounded ${
                            step.penalties?.selectedCol === idx
                              ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          C{idx + 1}: {p !== null ? p : '—'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Remaining Supply & Demand state */}
              <div className="flex flex-wrap gap-4 text-3xs text-slate-500 font-mono">
                <div>
                  Rem. Supply: [{step.remainingSupply.join(', ')}]
                </div>
                <div>
                  Rem. Demand: [{step.remainingDemand.join(', ')}]
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
