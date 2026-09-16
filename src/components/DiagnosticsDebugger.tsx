import { useState } from 'react';
import { MethodSolution, ProblemObjective } from '../types/transportation';
import {
  generateDiagnosticsReport,
  runAlgorithmSelfTest,
  SelfTestResult,
} from '../utils/transportationAlgorithms';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Info,
  Scale,
  Hash,
  Calculator,
} from 'lucide-react';

interface DiagnosticsDebuggerProps {
  solution: MethodSolution;
  objective: ProblemObjective;
}

export default function DiagnosticsDebugger({
  solution,
  objective,
}: DiagnosticsDebuggerProps) {
  const [selfTestResult, setSelfTestResult] = useState<SelfTestResult | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const report = generateDiagnosticsReport(solution, objective);
  const isMax = objective === 'maximize';

  const handleRunSelfTest = () => {
    setIsRunningTest(true);
    setTimeout(() => {
      const res = runAlgorithmSelfTest();
      setSelfTestResult(res);
      setIsRunningTest(false);
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                report.allPassed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {report.allPassed ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Operations Research Diagnostic & Debugger
                </h3>
                <span
                  className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                    report.allPassed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {report.allPassed ? 'All Invariants Passed' : 'Invariant Violation'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Rigorous mathematical verification of feasibility, basis rank ({solution.sources.length + solution.destinations.length - 1}), and dual multiplier consistency for{' '}
                <span className="font-semibold text-slate-700">{solution.methodName}</span>.
              </p>
            </div>
          </div>

          <button
            id="btn-run-self-test"
            onClick={handleRunSelfTest}
            disabled={isRunningTest}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {isRunningTest ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Running Battery...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Run In-App Self-Test Battery
              </>
            )}
          </button>
        </div>

        {/* Self Test Results if Run */}
        {selfTestResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">
                  Automated Self-Test Battery: {selfTestResult.passedTests} / {selfTestResult.totalTests} Passed
                </span>
              </div>
              <span className="text-2xs font-mono text-slate-500">
                Completed in {selfTestResult.durationMs}ms
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {selfTestResult.details.map((item, idx) => (
                <div
                  key={`test-${idx}`}
                  className="p-2 rounded bg-white border border-slate-200 text-2xs flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-slate-800">{item.method}</span>
                    <span className="text-slate-400 block truncate">{item.problemName}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-3xs">
                    <CheckCircle2 className="w-3 h-3" /> PASS (${item.cost.toLocaleString()})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 1. Invariants Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-600" />
          Mathematical Invariant Verification
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.invariants.map((inv) => (
            <div
              key={inv.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                inv.passed
                  ? 'border-slate-200 bg-slate-50/50'
                  : 'border-rose-300 bg-rose-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs text-slate-900">{inv.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold ${
                      inv.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inv.passed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Passed
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Failed
                      </>
                    )}
                  </span>
                </div>
                <p className="text-2xs text-slate-600 mt-1">{inv.details}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-3xs font-mono text-slate-500">
                <span>Observed: {inv.actual}</span>
                <span>Expected: {inv.expected}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MODI Dual System & Loop Equivalence */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-600" />
              MODI (u-v Method) Dual Multipliers & Loop Cross-Check
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirms that the dual equations $u_i + v_j = c_{'{'}ij{'}'}$ for basic cells yield opportunity costs $d_{'{'}ij{'}'} = c_{'{'}ij{'}'} - (u_i + v_j)$ that match the Stepping Stone loop evaluation $\Delta_{'{'}ij{'}'}$ with 100% mathematical precision.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Info className="w-3 h-3" /> Reference Dual: u₁ = 0
          </div>
        </div>

        {/* Dual Variables Multipliers (u_i and v_j) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Row Multipliers u_i */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-2xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-600" />
              Row Potentials (uᵢ)
            </div>
            <div className="flex flex-wrap gap-2">
              {report.dualVerification.u.map((uVal, idx) => (
                <span
                  key={`u-${idx}`}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800 shadow-2xs"
                >
                  <span className="text-slate-400">u{idx + 1} ({solution.sources[idx]}): </span>
                  <span className="font-bold text-indigo-600">
                    {uVal !== null ? uVal : '—'}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Col Multipliers v_j */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-2xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-600" />
              Column Potentials (vⱼ)
            </div>
            <div className="flex flex-wrap gap-2">
              {report.dualVerification.v.map((vVal, idx) => (
                <span
                  key={`v-${idx}`}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800 shadow-2xs"
                >
                  <span className="text-slate-400">v{idx + 1} ({solution.destinations[idx]}): </span>
                  <span className="font-bold text-emerald-600">
                    {vVal !== null ? vVal : '—'}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Opportunity Cost Delta Comparison Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-2 font-semibold">Non-Basic Cell</th>
                <th className="p-2 font-semibold">Unit Cost (cᵢⱼ)</th>
                <th className="p-2 font-semibold">Dual Sum (uᵢ + vⱼ)</th>
                <th className="p-2 font-semibold">MODI Delta [cᵢⱼ - (uᵢ + vⱼ)]</th>
                <th className="p-2 font-semibold">Stepping Stone Loop (Δᵢⱼ)</th>
                <th className="p-2 font-semibold text-center">Dual Match</th>
                <th className="p-2 font-semibold">Optimality Status</th>
              </tr>
            </thead>
            <tbody>
              {report.dualVerification.comparisons.map((c) => {
                const isOptimalForCell = isMax ? c.modiDelta <= 0 : c.modiDelta >= 0;
                return (
                  <tr
                    key={`comp-${c.row}-${c.col}`}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-2 font-bold text-slate-800">
                      [{c.row + 1}, {c.col + 1}] ({solution.sources[c.row]} → {solution.destinations[c.col]})
                    </td>
                    <td className="p-2 text-slate-700">${c.cost}</td>
                    <td className="p-2 text-slate-600">
                      ${c.uVal} + ${c.vVal} = ${c.uVal + c.vVal}
                    </td>
                    <td className="p-2 font-bold text-indigo-700">
                      {c.modiDelta > 0 ? `+${c.modiDelta}` : c.modiDelta}
                    </td>
                    <td className="p-2 font-bold text-purple-700">
                      {c.ssDelta > 0 ? `+${c.ssDelta}` : c.ssDelta}
                    </td>
                    <td className="p-2 text-center">
                      {c.match ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-2xs">
                          <CheckCircle2 className="w-3 h-3" /> Match
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-2xs">
                          <XCircle className="w-3 h-3" /> Discrepancy
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {isOptimalForCell ? (
                        <span className="text-2xs text-emerald-700 font-semibold">
                          Optimal ({isMax ? 'Δ ≤ 0' : 'Δ ≥ 0'})
                        </span>
                      ) : (
                        <span className="text-2xs text-amber-700 font-bold">
                          Can Improve ({isMax ? 'Δ > 0' : 'Δ < 0'})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
