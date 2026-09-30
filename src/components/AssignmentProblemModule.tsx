import { useMemo } from 'react';
import { Calculator, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { TransportationProblem } from '../types/transportation';

interface AssignmentCell {
  source: string;
  destination: string;
  row: number;
  col: number;
  cost: number;
}

interface AssignmentResult {
  assignments: AssignmentCell[];
  totalValue: number;
  paddedTo: number;
  isRectangular: boolean;
}

function getReducedMatrix(problem: TransportationProblem) {
  const matrix = problem.costs.map((row) => [...row]);
  const rowMins = matrix.map((row) => Math.min(...row));
  const reducedRows = matrix.map((row, i) => row.map((cell) => cell - rowMins[i]));
  const colMins = reducedRows[0].map((_, colIndex) =>
    Math.min(...reducedRows.map((row) => row[colIndex]))
  );

  return reducedRows.map((row, i) =>
    row.map((cell, j) => cell - colMins[j])
  );
}

function getZeroCoverRowsAndCols(matrix: number[][]) {
  const rowCount = matrix.length;
  const colCount = matrix[0]?.length ?? 0;
  const coveredRows = new Set<number>();
  const coveredCols = new Set<number>();

  const isZeroCell = (rowIndex: number, colIndex: number) => matrix[rowIndex]?.[colIndex] === 0;

  let progressed = true;

  while (progressed) {
    progressed = false;

    for (let r = 0; r < rowCount; r++) {
      if (coveredRows.has(r)) continue;
      const zeroCols = [] as number[];
      for (let c = 0; c < colCount; c++) {
        if (isZeroCell(r, c)) zeroCols.push(c);
      }

      if (zeroCols.length === 1) {
        coveredRows.add(r);
        coveredCols.add(zeroCols[0]);
        progressed = true;
      }
    }

    if (progressed) continue;

    for (let c = 0; c < colCount; c++) {
      if (coveredCols.has(c)) continue;
      const zeroRows = [] as number[];
      for (let r = 0; r < rowCount; r++) {
        if (isZeroCell(r, c)) zeroRows.push(r);
      }

      if (zeroRows.length === 1) {
        coveredCols.add(c);
        coveredRows.add(zeroRows[0]);
        progressed = true;
      }
    }

    if (progressed) continue;

    let bestRow = -1;
    let bestRowCount = -1;
    for (let r = 0; r < rowCount; r++) {
      if (coveredRows.has(r)) continue;
      let count = 0;
      for (let c = 0; c < colCount; c++) {
        if (isZeroCell(r, c)) count++;
      }
      if (count > bestRowCount) {
        bestRowCount = count;
        bestRow = r;
      }
    }

    if (bestRow >= 0) {
      coveredRows.add(bestRow);
      progressed = true;
    }

    if (!progressed) {
      let bestCol = -1;
      let bestColCount = -1;
      for (let c = 0; c < colCount; c++) {
        if (coveredCols.has(c)) continue;
        let count = 0;
        for (let r = 0; r < rowCount; r++) {
          if (isZeroCell(r, c)) count++;
        }
        if (count > bestColCount) {
          bestColCount = count;
          bestCol = c;
        }
      }

      if (bestCol >= 0) {
        coveredCols.add(bestCol);
        progressed = true;
      }
    }
  }

  return { coveredRows, coveredCols };
}

function getZeroScanState(matrix: number[][]) {
  const rowCount = matrix.length;
  const colCount = matrix[0]?.length ?? 0;
  const assigned = new Set<string>();
  const crossed = new Set<string>();

  const zeroAt = (rowIndex: number, colIndex: number) => matrix[rowIndex]?.[colIndex] === 0;
  const remainingZero = (rowIndex: number, colIndex: number) =>
    zeroAt(rowIndex, colIndex) &&
    !assigned.has(`${rowIndex}:${colIndex}`) &&
    !crossed.has(`${rowIndex}:${colIndex}`);

  const scanRows = () => {
    let progressed = false;
    for (let r = 0; r < rowCount; r++) {
      const zeroCols = Array.from({ length: colCount }, (_, c) => c).filter((c) => remainingZero(r, c));
      if (zeroCols.length !== 1) continue;

      const c = zeroCols[0];
      assigned.add(`${r}:${c}`);
      progressed = true;
      for (let rr = 0; rr < rowCount; rr++) {
        if (rr !== r && remainingZero(rr, c)) crossed.add(`${rr}:${c}`);
      }
    }
    return progressed;
  };

  const scanColumns = () => {
    let progressed = false;
    for (let c = 0; c < colCount; c++) {
      const zeroRows = Array.from({ length: rowCount }, (_, r) => r).filter((r) => remainingZero(r, c));
      if (zeroRows.length !== 1) continue;

      const r = zeroRows[0];
      assigned.add(`${r}:${c}`);
      progressed = true;
      for (let cc = 0; cc < colCount; cc++) {
        if (cc !== c && remainingZero(r, cc)) crossed.add(`${r}:${cc}`);
      }
    }
    return progressed;
  };

  while (scanRows()) {
    // Keep scanning rows until no new unique zero is exposed.
  }
  const rowStage = { assigned: new Set(assigned), crossed: new Set(crossed) };

  while (scanColumns()) {
    // Keep scanning columns until no new unique zero is exposed.
  }

  return {
    rowStage,
    columnStage: { assigned, crossed },
  };
}

function solveHungarianAssignment(problem: TransportationProblem): AssignmentResult {
  const rows = problem.sources.length;
  const cols = problem.destinations.length;
  const n = Math.max(rows, cols);
  const isMaximization = problem.objective === 'maximize';

  const maxValue = Math.max(...problem.costs.flat(), 0);
  const matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i < rows && j < cols) {
        const original = problem.costs[i][j];
        return isMaximization ? maxValue - original : original;
      }
      return 0;
    })
  );

  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Number.POSITIVE_INFINITY);
    const used = new Array(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Number.POSITIVE_INFINITY;
      let j1 = 0;

      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const current = matrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (current < minv[j]) {
            minv[j] = current;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const assignments: AssignmentCell[] = [];
  for (let j = 1; j <= n; j++) {
    const i = p[j];
    if (i !== 0 && i <= rows && j <= cols) {
      assignments.push({
        row: i - 1,
        col: j - 1,
        source: problem.sources[i - 1],
        destination: problem.destinations[j - 1],
        cost: problem.costs[i - 1][j - 1],
      });
    }
  }

  return {
    assignments,
    totalValue: assignments.reduce((sum, item) => sum + item.cost, 0),
    paddedTo: n,
    isRectangular: rows !== cols,
  };
}

export default function AssignmentProblemModule({
  problem,
  onBack,
}: {
  problem: TransportationProblem;
  onBack: () => void;
}) {
  const result = useMemo(() => solveHungarianAssignment(problem), [problem]);

  const selectedCells = new Set(
    result.assignments.map((item) => `${item.row}:${item.col}`)
  );
  const isMaximization = problem.objective === 'maximize';
  const objectiveLabel = isMaximization ? 'Maximum Profit Assignment' : 'Minimum Cost Assignment';
  const objectiveTag = isMaximization ? 'Maximum' : 'Minimum';
  const totalObjectiveLabel = isMaximization ? 'Optimal assignment profit' : 'Optimal assignment cost';

  const transformedMatrix = isMaximization
    ? problem.costs.map((row) => {
        const maxValue = Math.max(...row);
        return row.map((value) => maxValue - value);
      })
    : problem.costs;

  const originalRowMaxCells = isMaximization
    ? new Set(
        problem.costs.map((row, rowIndex) => {
          const maxValue = Math.max(...row);
          const maxCol = row.indexOf(maxValue);
          return `${rowIndex}:${maxCol}`;
        })
      )
    : new Set<string>();

  const rowReducedMatrix = transformedMatrix.map((row) => {
    const min = Math.min(...row);
    return row.map((value) => value - min);
  });

  const colReducedMatrix = rowReducedMatrix[0].map((_, colIndex) => {
    const min = Math.min(...rowReducedMatrix.map((row) => row[colIndex]));
    return min;
  });

  const columnReducedMatrix = rowReducedMatrix.map((row) =>
    row.map((value, colIndex) => value - colReducedMatrix[colIndex])
  );

  const reducedMatrix = getReducedMatrix({
    ...problem,
    costs: transformedMatrix,
  });
  const { coveredRows, coveredCols } = getZeroCoverRowsAndCols(reducedMatrix);
  const zeroScanState = getZeroScanState(reducedMatrix);
  const assignmentMarks = {
    assigned: zeroScanState.columnStage.assigned,
    crossed: new Set<string>(),
  };

  const renderTable = (
    title: string,
    matrix: number[][],
    variant: 'cost' | 'reduced' | 'final',
    scanMarks?: { assigned: Set<string>; crossed: Set<string> },
    showCoverLines = false
  ) => (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm sm:text-base">
          <thead>
            <tr>
              <th className="min-w-[110px] border border-slate-300 bg-slate-100 px-4 py-3 text-center text-[1rem] font-black text-slate-700">
                Jobs
              </th>
              {problem.destinations.map((dest) => (
                <th
                  key={`${title}-${dest}`}
                  className="min-w-[120px] border border-slate-300 bg-slate-100 px-4 py-3 text-center text-[1rem] font-black text-slate-700"
                >
                  {dest}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={`${title}-row-${rowIndex}`}>
                <th className="border border-slate-300 bg-slate-50 px-4 py-3 text-center text-[1rem] font-black text-slate-700">
                  {problem.sources[rowIndex]}
                </th>
                {row.map((value, colIndex) => {
                  const cellKey = `${rowIndex}:${colIndex}`;
                  const isSelected = selectedCells.has(cellKey) && variant === 'final';
                  const isCoveredRow = showCoverLines && coveredRows.has(rowIndex);
                  const isCoveredCol = showCoverLines && coveredCols.has(colIndex);
                  const isZero = value === 0 && variant === 'reduced';
                  const isRowMax = variant === 'cost' && isMaximization && originalRowMaxCells.has(cellKey);
                  const isAssignedZero = variant === 'reduced' && scanMarks?.assigned.has(cellKey);
                  const isCrossedZero = scanMarks?.crossed.has(cellKey);

                  return (
                    <td
                      key={`${title}-${rowIndex}-${colIndex}`}
                      className={`relative border px-3 py-3 text-center text-[1.15rem] font-black ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-100 text-indigo-900'
                          : variant === 'reduced'
                          ? 'border-slate-300 bg-slate-100 text-slate-700'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      {variant === 'reduced' && (scanMarks || showCoverLines) && (
                        <>
                          {isCoveredRow && (
                            <span className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[4px] w-[110%] -translate-x-1/2 -translate-y-1/2 bg-red-500/90" />
                          )}
                          {isCoveredCol && (
                            <span className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[110%] w-[4px] -translate-x-1/2 -translate-y-1/2 bg-blue-500/90" />
                          )}
                          {showCoverLines && isZero && (
                            <>
                              <span className="pointer-events-none absolute inset-[3px] z-10 rounded-sm border-[3px] border-red-600 bg-white/40" />
                              <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[135%] w-[3px] -translate-x-1/2 -translate-y-1/2 bg-blue-500/80" />
                            </>
                          )}
                          {isCrossedZero && (
                            <span className="pointer-events-none absolute inset-1 z-20 flex items-center justify-center text-lg font-black text-red-600">×</span>
                          )}
                        </>
                      )}
                      {isAssignedZero && (
                        <span className="pointer-events-none absolute inset-[3px] z-20 rounded-sm border-[3px] border-red-700 bg-red-100/70" />
                      )}
                      {variant === 'cost' && isRowMax && (
                        <span className="pointer-events-none absolute inset-1 z-0 rounded-full border-2 border-red-500 bg-transparent" />
                      )}
                      <span className="relative z-30">{value}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
              Assignment Problem
            </p>
            <h2 className="text-base font-black text-slate-900">Hungarian Method</h2>
          </div>
        </div>

        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
          isMaximization
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-indigo-200 bg-indigo-50 text-indigo-700'
        }`}>
          {objectiveTag}
        </span>

        <button
          onClick={onBack}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <div className="space-y-4 md:col-start-1 md:row-start-1">
          {renderTable(isMaximization ? 'Original profit matrix' : 'Original cost matrix', problem.costs, 'cost')}
          {renderTable('Row reduction', rowReducedMatrix, 'reduced')}
        </div>
        <div className="space-y-4 md:col-start-2 md:row-start-1">
          {renderTable('Column reduction', columnReducedMatrix, 'reduced', assignmentMarks)}
          {renderTable('Row scanning', columnReducedMatrix, 'reduced', zeroScanState.rowStage)}
          {renderTable('Column scanning', columnReducedMatrix, 'reduced', zeroScanState.columnStage)}
        </div>
        <div className="md:col-span-2">
          {renderTable('Zero-cover matrix after scanning', reducedMatrix, 'reduced', undefined, true)}
        </div>
        <div className="md:col-span-2">
          {renderTable('Final assignment matrix', problem.costs, 'final')}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            {totalObjectiveLabel}
          </p>
        </div>
        <div className="text-sm font-black text-emerald-800">
          ${result.totalValue.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">
          Selected assignments
        </p>
        <div className="flex flex-wrap gap-2">
          {result.assignments.length === 0 ? (
            <span className="text-[11px] text-slate-500">No assignments found.</span>
          ) : (
            result.assignments.map((assignment) => (
              <span
                key={`${assignment.source}-${assignment.destination}`}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-800"
              >
                {assignment.source} → {assignment.destination}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-indigo-700" />
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
            Explanation
          </p>
        </div>
        <div className="space-y-2 text-xs leading-6 text-slate-700">
          <p>
            <strong>1.</strong> Create the profit or cost matrix for all agents and tasks. For a maximization problem, first convert the original matrix into an equivalent form so it can be reduced correctly.
          </p>
          <p>
            <strong>2.</strong> Perform <strong>row reduction</strong> by subtracting the smallest value in each row from all entries in that row. This creates at least one zero in every row.
          </p>
          <p>
            <strong>3.</strong> Perform <strong>column reduction</strong> by subtracting the smallest value in each column from all entries in that column. This creates the zero pattern needed for the assignment step.
          </p>
          <p>
            <strong>4.</strong> <strong>Row scan:</strong> scan the matrix row by row and look for a row that contains <strong>exactly one unmarked zero</strong>. If a row has exactly one zero, make the assignment by boxing that zero, then cross out all other unmarked zeros in the same column because that destination is taken. If a row has no zero or more than one zero, skip it and move on.
          </p>
          <p>
            <strong>5.</strong> <strong>Column scan:</strong> after row scanning, move from left to right and look for a column that contains <strong>exactly one remaining unmarked zero</strong>. If a column has exactly one zero, box that zero and cross out all other unmarked zeros in the same row because that origin is taken. If a column has no zero or more than one zero, skip it.
          </p>
          <p>
            <strong>6.</strong> Repeat the row-and-column scan cycle until all zeroes are either boxed or crossed out. If the number of boxed assignments equals the number of rows or columns, the solution is optimal. If the number of assignments is smaller, draw the minimum number of lines that cover all remaining zeros, modify the matrix, and scan again.
          </p>
          <p>
            <strong>7.</strong> The selected boxed zeros form the optimal assignment and give the best overall {isMaximization ? 'profit' : 'total cost'}.
          </p>
        </div>
      </div>
    </div>
  );
}
