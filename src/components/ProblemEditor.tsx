import { useState } from 'react';
import {
  TransportationProblem,
  ProblemObjective,
} from '../types/transportation';
import { SAMPLE_PROBLEMS } from '../utils/transportationAlgorithms';
import {
  Plus,
  Trash2,
  Shuffle,
  RotateCcw,
  BookOpen,
  ArrowDownUp,
  Scale,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ProblemEditorProps {
  problem: TransportationProblem;
  onUpdateProblem: (problem: TransportationProblem) => void;
}

export default function ProblemEditor({
  problem,
  onUpdateProblem,
}: ProblemEditorProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(problem.id);

  const totalSupply = problem.supply.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const totalDemand = problem.demand.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const isBalanced = totalSupply === totalDemand;
  const isMax = problem.objective === 'maximize';

  const handleObjectiveToggle = (obj: ProblemObjective) => {
    onUpdateProblem({
      ...problem,
      objective: obj,
    });
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = SAMPLE_PROBLEMS.find((p) => p.id === presetId);
    if (found) {
      onUpdateProblem(JSON.parse(JSON.stringify(found)));
    }
  };

  const handleCostChange = (row: number, col: number, value: string) => {
    const num = value === '' ? 0 : parseFloat(value) || 0;
    const newCosts = problem.costs.map((r, rIdx) =>
      rIdx === row
        ? r.map((c, cIdx) => (cIdx === col ? Math.max(0, num) : c))
        : [...r]
    );
    onUpdateProblem({
      ...problem,
      costs: newCosts,
    });
  };

  const handleSupplyChange = (index: number, value: string) => {
    const num = value === '' ? 0 : parseFloat(value) || 0;
    const newSupply = [...problem.supply];
    newSupply[index] = Math.max(0, num);
    onUpdateProblem({
      ...problem,
      supply: newSupply,
    });
  };

  const handleDemandChange = (index: number, value: string) => {
    const num = value === '' ? 0 : parseFloat(value) || 0;
    const newDemand = [...problem.demand];
    newDemand[index] = Math.max(0, num);
    onUpdateProblem({
      ...problem,
      demand: newDemand,
    });
  };

  const handleSourceNameChange = (index: number, name: string) => {
    const newSources = [...problem.sources];
    newSources[index] = name;
    onUpdateProblem({
      ...problem,
      sources: newSources,
    });
  };

  const handleDestNameChange = (index: number, name: string) => {
    const newDests = [...problem.destinations];
    newDests[index] = name;
    onUpdateProblem({
      ...problem,
      destinations: newDests,
    });
  };

  const addSource = () => {
    if (problem.sources.length >= 8) return;
    const idx = problem.sources.length + 1;
    const newSources = [...problem.sources, `Source S${idx}`];
    const newSupply = [...problem.supply, 20];
    const newRow = new Array(problem.destinations.length).fill(5);
    const newCosts = [...problem.costs.map((r) => [...r]), newRow];

    onUpdateProblem({
      ...problem,
      sources: newSources,
      supply: newSupply,
      costs: newCosts,
    });
  };

  const removeSource = (index: number) => {
    if (problem.sources.length <= 2) return;
    const newSources = problem.sources.filter((_, i) => i !== index);
    const newSupply = problem.supply.filter((_, i) => i !== index);
    const newCosts = problem.costs.filter((_, i) => i !== index);

    onUpdateProblem({
      ...problem,
      sources: newSources,
      supply: newSupply,
      costs: newCosts,
    });
  };

  const addDestination = () => {
    if (problem.destinations.length >= 8) return;
    const idx = problem.destinations.length + 1;
    const newDests = [...problem.destinations, `Destination D${idx}`];
    const newDemand = [...problem.demand, 20];
    const newCosts = problem.costs.map((row) => [...row, 5]);

    onUpdateProblem({
      ...problem,
      destinations: newDests,
      demand: newDemand,
      costs: newCosts,
    });
  };

  const removeDestination = (index: number) => {
    if (problem.destinations.length <= 2) return;
    const newDests = problem.destinations.filter((_, i) => i !== index);
    const newDemand = problem.demand.filter((_, i) => i !== index);
    const newCosts = problem.costs.map((row) => row.filter((_, i) => i !== index));

    onUpdateProblem({
      ...problem,
      destinations: newDests,
      demand: newDemand,
      costs: newCosts,
    });
  };

  const handleRandomize = () => {
    const m = problem.sources.length;
    const n = problem.destinations.length;
    const newCosts = Array.from({ length: m }, () =>
      Array.from({ length: n }, () => Math.floor(Math.random() * 25) + 1)
    );
    const newSupply = Array.from({ length: m }, () => (Math.floor(Math.random() * 8) + 2) * 5);
    const sumS = newSupply.reduce((a, b) => a + b, 0);

    // Make demand roughly balanced
    const newDemand = Array.from({ length: n }, () => Math.floor(sumS / n));
    const remainder = sumS - newDemand.reduce((a, b) => a + b, 0);
    newDemand[0] += remainder;

    onUpdateProblem({
      ...problem,
      costs: newCosts,
      supply: newSupply,
      demand: newDemand,
    });
  };

  const handleMakeBalanced = () => {
    if (isBalanced) return;
    if (totalSupply > totalDemand) {
      const diff = totalSupply - totalDemand;
      const newDemand = [...problem.demand];
      newDemand[newDemand.length - 1] += diff;
      onUpdateProblem({
        ...problem,
        demand: newDemand,
      });
    } else {
      const diff = totalDemand - totalSupply;
      const newSupply = [...problem.supply];
      newSupply[newSupply.length - 1] += diff;
      onUpdateProblem({
        ...problem,
        supply: newSupply,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Top Controls Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <label htmlFor="preset-select" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Load Preset:
            </label>
            <select
              id="preset-select"
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="text-sm bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              {SAMPLE_PROBLEMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Objective Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              id="btn-minimize-cost"
              onClick={() => handleObjectiveToggle('minimize')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                !isMax
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Minimization (Cost)
            </button>
            <button
              id="btn-maximize-profit"
              onClick={() => handleObjectiveToggle('maximize')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isMax
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Maximization (Profit)
            </button>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-2">
          <button
            id="btn-randomize-problem"
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            title="Generate random costs & supplies"
          >
            <Shuffle className="w-3.5 h-3.5 text-slate-500" />
            Randomize
          </button>
          <button
            id="btn-reset-preset"
            onClick={() => handlePresetSelect(selectedPresetId)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            title="Reset to current preset default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset
          </button>
        </div>
      </div>

      {/* Balance Status Banner */}
      <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">Problem Balance:</span>
          <span className="font-semibold text-slate-800">
            Total Supply = {totalSupply} units
          </span>
          <span className="text-slate-400">|</span>
          <span className="font-semibold text-slate-800">
            Total Demand = {totalDemand} units
          </span>
          {isBalanced ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Balanced (No dummy needed)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-amber-800 bg-amber-50 border border-amber-200 font-medium">
              <AlertTriangle className="w-3 h-3" />
              Unbalanced (Diff: {Math.abs(totalSupply - totalDemand)} units — Auto dummy will be added)
            </span>
          )}
        </div>

        {!isBalanced && (
          <button
            id="btn-auto-balance-inputs"
            onClick={handleMakeBalanced}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
          >
            Balance inputs directly
          </button>
        )}
      </div>

      {/* Grid Matrix Editor */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-fit">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 border border-slate-200 bg-slate-100 text-slate-700 text-left font-semibold w-40">
                  <div className="text-xs text-slate-500 font-normal">Origins \ Markets</div>
                  {isMax ? 'Unit Profit' : 'Unit Cost ($)'}
                </th>
                {problem.destinations.map((dest, cIdx) => (
                  <th
                    key={`dest-${cIdx}`}
                    className="p-2 border border-slate-200 bg-slate-50 min-w-32 text-center"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <input
                        type="text"
                        value={dest}
                        onChange={(e) => handleDestNameChange(cIdx, e.target.value)}
                        className="text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full text-center truncate"
                        title="Click to rename destination"
                      />
                      {problem.destinations.length > 2 && (
                        <button
                          onClick={() => removeDestination(cIdx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="Remove column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-2 border border-slate-200 bg-indigo-50/70 text-indigo-900 font-semibold text-center min-w-24">
                  Supply (aᵢ)
                </th>
              </tr>
            </thead>
            <tbody>
              {problem.sources.map((source, rIdx) => (
                <tr key={`source-${rIdx}`}>
                  {/* Source Header */}
                  <td className="p-2 border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={source}
                        onChange={(e) => handleSourceNameChange(rIdx, e.target.value)}
                        className="text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full truncate"
                        title="Click to rename source"
                      />
                      {problem.sources.length > 2 && (
                        <button
                          onClick={() => removeSource(rIdx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Cost/Profit Cells */}
                  {problem.destinations.map((_, cIdx) => (
                    <td
                      key={`cell-${rIdx}-${cIdx}`}
                      className="p-1.5 border border-slate-200 text-center bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="text-xs text-slate-400 mr-1">
                          {isMax ? 'P' : '$'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={problem.costs[rIdx]?.[cIdx] ?? 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleCostChange(rIdx, cIdx, e.target.value)}
                          className="w-16 text-center text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </td>
                  ))}

                  {/* Supply Cell */}
                  <td className="p-1.5 border border-slate-200 text-center bg-indigo-50/40">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={problem.supply[rIdx] ?? 0}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleSupplyChange(rIdx, e.target.value)}
                      className="w-18 text-center text-sm font-bold text-indigo-700 bg-white border border-indigo-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </td>
                </tr>
              ))}

              {/* Demand Row */}
              <tr>
                <td className="p-2 border border-slate-200 bg-emerald-50/70 text-emerald-900 font-semibold text-left">
                  Demand (bⱼ)
                </td>
                {problem.destinations.map((_, cIdx) => (
                  <td
                    key={`demand-${cIdx}`}
                    className="p-1.5 border border-slate-200 text-center bg-emerald-50/40"
                  >
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={problem.demand[cIdx] ?? 0}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleDemandChange(cIdx, e.target.value)}
                      className="w-18 text-center text-sm font-bold text-emerald-700 bg-white border border-emerald-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                    />
                  </td>
                ))}
                {/* Total Balance Cell */}
                <td className="p-2 border border-slate-200 bg-slate-100 text-center font-bold text-xs text-slate-700">
                  {totalSupply} / {totalDemand}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Row & Col Buttons */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            id="btn-add-source"
            onClick={addSource}
            disabled={problem.sources.length >= 8}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            Add Origin / Source (Row)
          </button>
          <button
            id="btn-add-destination"
            onClick={addDestination}
            disabled={problem.destinations.length >= 8}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            Add Market / Destination (Col)
          </button>
        </div>

        <span className="text-slate-500">
          Grid: {problem.sources.length} sources × {problem.destinations.length} destinations
        </span>
      </div>
    </div>
  );
}
