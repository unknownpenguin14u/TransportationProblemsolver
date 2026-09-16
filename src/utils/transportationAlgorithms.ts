import {
  TransportationProblem,
  MethodSolution,
  MethodType,
  ProblemObjective,
  StepLog,
  SteppingStoneIteration,
  LoopStep,
  CellEvaluation,
  CellCoord,
  DiagnosticsReport,
  DualVerification,
  InvariantCheck,
} from '../types/transportation';

export interface BalancedData {
  sources: string[];
  destinations: string[];
  costs: number[][];
  supply: number[];
  demand: number[];
  isBalanced: boolean;
  dummySourceIndex: number | null;
  dummyDestIndex: number | null;
}

/**
 * Balance the transportation problem by adding dummy rows or columns if necessary
 */
export function balanceProblem(problem: TransportationProblem): BalancedData {
  const sources = [...problem.sources];
  const destinations = [...problem.destinations];
  const costs = problem.costs.map((row) => [...row]);
  const supply = [...problem.supply];
  const demand = [...problem.demand];

  const totalSupply = supply.reduce((a, b) => a + b, 0);
  const totalDemand = demand.reduce((a, b) => a + b, 0);

  let dummySourceIndex: number | null = null;
  let dummyDestIndex: number | null = null;
  const isBalanced = totalSupply === totalDemand;

  if (totalSupply > totalDemand) {
    // Add Dummy Destination with 0 costs
    const diff = totalSupply - totalDemand;
    dummyDestIndex = destinations.length;
    destinations.push(`Dummy D${destinations.length + 1} (Unmet Demand)`);
    demand.push(diff);
    for (let i = 0; i < costs.length; i++) {
      costs[i].push(0);
    }
  } else if (totalDemand > totalSupply) {
    // Add Dummy Source with 0 costs
    const diff = totalDemand - totalSupply;
    dummySourceIndex = sources.length;
    sources.push(`Dummy S${sources.length + 1} (Unmet Supply)`);
    supply.push(diff);
    costs.push(new Array(destinations.length).fill(0));
  }

  return {
    sources,
    destinations,
    costs,
    supply,
    demand,
    isBalanced,
    dummySourceIndex,
    dummyDestIndex,
  };
}

/**
 * Calculate total transportation cost: Sum(cost[i][j] * allocation[i][j])
 */
export function calculateTotalCost(
  allocations: (number | null)[][],
  costs: number[][]
): number {
  let total = 0;
  for (let i = 0; i < allocations.length; i++) {
    for (let j = 0; j < allocations[i].length; j++) {
      const val = allocations[i][j];
      if (val !== null && val > 0) {
        total += val * costs[i][j];
      }
    }
  }
  return total;
}

/**
 * 1. North-West Corner Rule (NWCR)
 */
export function solveNWCR(problem: TransportationProblem): MethodSolution {
  const balanced = balanceProblem(problem);
  const m = balanced.sources.length;
  const n = balanced.destinations.length;

  const allocations: (number | null)[][] = Array.from({ length: m }, () =>
    new Array(n).fill(null)
  );
  const isEpsilon: boolean[][] = Array.from({ length: m }, () =>
    new Array(n).fill(false)
  );
  const remSupply = [...balanced.supply];
  const remDemand = [...balanced.demand];
  const steps: StepLog[] = [];

  let i = 0;
  let j = 0;
  let stepCount = 1;

  while (i < m && j < n) {
    const allocated = Math.min(remSupply[i], remDemand[j]);
    allocations[i][j] = allocated;
    remSupply[i] -= allocated;
    remDemand[j] -= allocated;

    steps.push({
      stepNumber: stepCount++,
      title: `Allocate at (${balanced.sources[i]}, ${balanced.destinations[j]})`,
      description: `Allocated min(Supply: ${remSupply[i] + allocated}, Demand: ${remDemand[j] + allocated}) = ${allocated} units at cell [${i + 1}, ${j + 1}]. Unit cost = $${balanced.costs[i][j]}.`,
      cell: { row: i, col: j },
      allocatedAmount: allocated,
      cost: balanced.costs[i][j],
      remainingSupply: [...remSupply],
      remainingDemand: [...remDemand],
    });

    if (remSupply[i] === 0 && remDemand[j] === 0) {
      // Degeneracy prevention: if both exhausted simultaneously and not at the bottom-right corner
      if (i + 1 < m) {
        i++;
        // If there are remaining steps, assign epsilon 0 to maintain m+n-1 basic variables
        if (j < n) {
          allocations[i][j] = 0;
          isEpsilon[i][j] = true;
          steps.push({
            stepNumber: stepCount++,
            title: `Degeneracy Resolution at (${balanced.sources[i]}, ${balanced.destinations[j]})`,
            description: `Simultaneous exhaustion of row ${i} and column ${j + 1}. Added ε (0) allocation to cell [${i + 1}, ${j + 1}] to ensure m + n - 1 basic variables.`,
            cell: { row: i, col: j },
            allocatedAmount: 0,
            cost: balanced.costs[i][j],
            remainingSupply: [...remSupply],
            remainingDemand: [...remDemand],
          });
          j++;
        }
      } else {
        j++;
      }
    } else if (remSupply[i] === 0) {
      i++;
    } else {
      j++;
    }
  }

  ensureNonDegenerate(allocations, isEpsilon, balanced.costs);

  const totalCost = calculateTotalCost(allocations, balanced.costs);

  return {
    method: 'nwcr',
    methodName: 'North-West Corner Rule',
    allocations,
    isEpsilon,
    totalCost,
    steps,
    isBalanced: balanced.isBalanced,
    dummySourceIndex: balanced.dummySourceIndex,
    dummyDestIndex: balanced.dummyDestIndex,
    sources: balanced.sources,
    destinations: balanced.destinations,
    costs: balanced.costs,
    supply: balanced.supply,
    demand: balanced.demand,
    isDegenerate: checkDegeneracy(allocations, m, n),
  };
}

/**
 * 2. Least-Cost Method (LCM)
 */
export function solveLeastCost(problem: TransportationProblem): MethodSolution {
  const balanced = balanceProblem(problem);
  const m = balanced.sources.length;
  const n = balanced.destinations.length;

  const allocations: (number | null)[][] = Array.from({ length: m }, () =>
    new Array(n).fill(null)
  );
  const isEpsilon: boolean[][] = Array.from({ length: m }, () =>
    new Array(n).fill(false)
  );
  const remSupply = [...balanced.supply];
  const remDemand = [...balanced.demand];
  const steps: StepLog[] = [];

  const activeRows = new Set<number>(Array.from({ length: m }, (_, idx) => idx));
  const activeCols = new Set<number>(Array.from({ length: n }, (_, idx) => idx));

  let stepCount = 1;

  while (activeRows.size > 0 && activeCols.size > 0) {
    // Find cell with minimum cost among active rows & cols
    let minCost = Infinity;
    let bestRow = -1;
    let bestCol = -1;
    let maxPotentialAllocation = -1;

    for (const r of activeRows) {
      for (const c of activeCols) {
        const cost = balanced.costs[r][c];
        const potential = Math.min(remSupply[r], remDemand[c]);
        if (
          cost < minCost ||
          (cost === minCost && potential > maxPotentialAllocation)
        ) {
          minCost = cost;
          bestRow = r;
          bestCol = c;
          maxPotentialAllocation = potential;
        }
      }
    }

    if (bestRow === -1 || bestCol === -1) break;

    const allocated = Math.min(remSupply[bestRow], remDemand[bestCol]);
    allocations[bestRow][bestCol] = allocated;
    if (allocated === 0) {
      isEpsilon[bestRow][bestCol] = true;
    }
    remSupply[bestRow] -= allocated;
    remDemand[bestCol] -= allocated;

    steps.push({
      stepNumber: stepCount++,
      title: `Allocate minimum cost cell (${balanced.sources[bestRow]}, ${balanced.destinations[bestCol]})`,
      description: `Identified lowest unit cost $${minCost} at cell [${bestRow + 1}, ${bestCol + 1}]. Allocated min(Supply: ${remSupply[bestRow] + allocated}, Demand: ${remDemand[bestCol] + allocated}) = ${allocated} units${allocated === 0 ? ' (Degeneracy resolution ε)' : ''}.`,
      cell: { row: bestRow, col: bestCol },
      allocatedAmount: allocated,
      cost: minCost,
      remainingSupply: [...remSupply],
      remainingDemand: [...remDemand],
    });

    if (remSupply[bestRow] === 0 && remDemand[bestCol] === 0) {
      // If both zero and more remain, remove one and leave the other with 0 to allow epsilon allocation
      if (activeRows.size > 1) {
        activeRows.delete(bestRow);
      } else {
        activeCols.delete(bestCol);
      }
    } else if (remSupply[bestRow] === 0) {
      activeRows.delete(bestRow);
    } else {
      activeCols.delete(bestCol);
    }
  }

  ensureNonDegenerate(allocations, isEpsilon, balanced.costs);
  const totalCost = calculateTotalCost(allocations, balanced.costs);

  return {
    method: 'least_cost',
    methodName: 'Least-Cost Method (LCM)',
    allocations,
    isEpsilon,
    totalCost,
    steps,
    isBalanced: balanced.isBalanced,
    dummySourceIndex: balanced.dummySourceIndex,
    dummyDestIndex: balanced.dummyDestIndex,
    sources: balanced.sources,
    destinations: balanced.destinations,
    costs: balanced.costs,
    supply: balanced.supply,
    demand: balanced.demand,
    isDegenerate: checkDegeneracy(allocations, m, n),
  };
}

/**
 * 3. Maximum Cell Profit Method
 * Prioritizes cells with highest profit (or highest unit margin)
 */
export function solveMaxProfit(problem: TransportationProblem): MethodSolution {
  const balanced = balanceProblem(problem);
  const m = balanced.sources.length;
  const n = balanced.destinations.length;

  const allocations: (number | null)[][] = Array.from({ length: m }, () =>
    new Array(n).fill(null)
  );
  const isEpsilon: boolean[][] = Array.from({ length: m }, () =>
    new Array(n).fill(false)
  );
  const remSupply = [...balanced.supply];
  const remDemand = [...balanced.demand];
  const steps: StepLog[] = [];

  const activeRows = new Set<number>(Array.from({ length: m }, (_, idx) => idx));
  const activeCols = new Set<number>(Array.from({ length: n }, (_, idx) => idx));

  let stepCount = 1;

  while (activeRows.size > 0 && activeCols.size > 0) {
    // Find cell with maximum value/profit among active rows & cols
    let maxProfit = -Infinity;
    let bestRow = -1;
    let bestCol = -1;
    let maxPotentialAllocation = -1;

    for (const r of activeRows) {
      for (const c of activeCols) {
        const profit = balanced.costs[r][c];
        const potential = Math.min(remSupply[r], remDemand[c]);
        if (
          profit > maxProfit ||
          (profit === maxProfit && potential > maxPotentialAllocation)
        ) {
          maxProfit = profit;
          bestRow = r;
          bestCol = c;
          maxPotentialAllocation = potential;
        }
      }
    }

    if (bestRow === -1 || bestCol === -1) break;

    const allocated = Math.min(remSupply[bestRow], remDemand[bestCol]);
    allocations[bestRow][bestCol] = allocated;
    if (allocated === 0) {
      isEpsilon[bestRow][bestCol] = true;
    }
    remSupply[bestRow] -= allocated;
    remDemand[bestCol] -= allocated;

    steps.push({
      stepNumber: stepCount++,
      title: `Allocate highest profit cell (${balanced.sources[bestRow]}, ${balanced.destinations[bestCol]})`,
      description: `Identified maximum cell unit profit/value of $${maxProfit} at cell [${bestRow + 1}, ${bestCol + 1}]. Allocated min(Supply: ${remSupply[bestRow] + allocated}, Demand: ${remDemand[bestCol] + allocated}) = ${allocated} units${allocated === 0 ? ' (Degeneracy resolution ε)' : ''}.`,
      cell: { row: bestRow, col: bestCol },
      allocatedAmount: allocated,
      cost: maxProfit,
      remainingSupply: [...remSupply],
      remainingDemand: [...remDemand],
    });

    if (remSupply[bestRow] === 0 && remDemand[bestCol] === 0) {
      if (activeRows.size > 1) {
        activeRows.delete(bestRow);
      } else {
        activeCols.delete(bestCol);
      }
    } else if (remSupply[bestRow] === 0) {
      activeRows.delete(bestRow);
    } else {
      activeCols.delete(bestCol);
    }
  }

  ensureNonDegenerate(allocations, isEpsilon, balanced.costs);
  const totalCost = calculateTotalCost(allocations, balanced.costs);

  return {
    method: 'max_profit',
    methodName: 'Maximum Cell Profit Method',
    allocations,
    isEpsilon,
    totalCost,
    steps,
    isBalanced: balanced.isBalanced,
    dummySourceIndex: balanced.dummySourceIndex,
    dummyDestIndex: balanced.dummyDestIndex,
    sources: balanced.sources,
    destinations: balanced.destinations,
    costs: balanced.costs,
    supply: balanced.supply,
    demand: balanced.demand,
    isDegenerate: checkDegeneracy(allocations, m, n),
  };
}

/**
 * 4. Vogel's Approximation Method (VAM) - Penalty Method
 */
export function solveVAM(problem: TransportationProblem): MethodSolution {
  const balanced = balanceProblem(problem);
  const m = balanced.sources.length;
  const n = balanced.destinations.length;
  const isMax = problem.objective === 'maximize';

  const allocations: (number | null)[][] = Array.from({ length: m }, () =>
    new Array(n).fill(null)
  );
  const isEpsilon: boolean[][] = Array.from({ length: m }, () =>
    new Array(n).fill(false)
  );
  const remSupply = [...balanced.supply];
  const remDemand = [...balanced.demand];
  const steps: StepLog[] = [];

  const activeRows = new Set<number>(Array.from({ length: m }, (_, idx) => idx));
  const activeCols = new Set<number>(Array.from({ length: n }, (_, idx) => idx));

  let stepCount = 1;

  while (activeRows.size > 0 && activeCols.size > 0) {
    const rowPenalties: (number | null)[] = new Array(m).fill(null);
    const colPenalties: (number | null)[] = new Array(n).fill(null);

    // Compute Row Penalties
    for (const r of activeRows) {
      const activeValues: number[] = [];
      for (const c of activeCols) {
        activeValues.push(balanced.costs[r][c]);
      }
      activeValues.sort((a, b) => (isMax ? b - a : a - b));
      if (activeValues.length >= 2) {
        rowPenalties[r] = Math.abs(activeValues[0] - activeValues[1]);
      } else if (activeValues.length === 1) {
        rowPenalties[r] = activeValues[0];
      }
    }

    // Compute Column Penalties
    for (const c of activeCols) {
      const activeValues: number[] = [];
      for (const r of activeRows) {
        activeValues.push(balanced.costs[r][c]);
      }
      activeValues.sort((a, b) => (isMax ? b - a : a - b));
      if (activeValues.length >= 2) {
        colPenalties[c] = Math.abs(activeValues[0] - activeValues[1]);
      } else if (activeValues.length === 1) {
        colPenalties[c] = activeValues[0];
      }
    }

    // Find the maximum penalty
    let maxPenalty = -1;
    let selectedType: 'row' | 'col' = 'row';
    let selectedIdx = -1;

    for (const r of activeRows) {
      const p = rowPenalties[r];
      if (p !== null && p > maxPenalty) {
        maxPenalty = p;
        selectedType = 'row';
        selectedIdx = r;
      }
    }

    for (const c of activeCols) {
      const p = colPenalties[c];
      if (p !== null && p > maxPenalty) {
        maxPenalty = p;
        selectedType = 'col';
        selectedIdx = c;
      }
    }

    if (selectedIdx === -1) {
      // Fallback if only 1 cell remains
      const r = Array.from(activeRows)[0];
      const c = Array.from(activeCols)[0];
      selectedType = 'row';
      selectedIdx = r;
    }

    // Inside the selected row/col, find the cell with minimum cost (or max profit)
    let bestRow = -1;
    let bestCol = -1;

    if (selectedType === 'row') {
      bestRow = selectedIdx;
      let targetCost = isMax ? -Infinity : Infinity;
      for (const c of activeCols) {
        const cost = balanced.costs[bestRow][c];
        if (isMax ? cost > targetCost : cost < targetCost) {
          targetCost = cost;
          bestCol = c;
        }
      }
    } else {
      bestCol = selectedIdx;
      let targetCost = isMax ? -Infinity : Infinity;
      for (const r of activeRows) {
        const cost = balanced.costs[r][bestCol];
        if (isMax ? cost > targetCost : cost < targetCost) {
          targetCost = cost;
          bestRow = r;
        }
      }
    }

    if (bestRow === -1 || bestCol === -1) break;

    const allocated = Math.min(remSupply[bestRow], remDemand[bestCol]);
    allocations[bestRow][bestCol] = allocated;
    if (allocated === 0) {
      isEpsilon[bestRow][bestCol] = true;
    }
    remSupply[bestRow] -= allocated;
    remDemand[bestCol] -= allocated;

    steps.push({
      stepNumber: stepCount++,
      title: `VAM Penalty Step: Selected ${selectedType === 'row' ? `Row ${bestRow + 1}` : `Col ${bestCol + 1}`}`,
      description: `Maximum penalty was ${maxPenalty} in ${selectedType} ${selectedType === 'row' ? balanced.sources[bestRow] : balanced.destinations[bestCol]}. Allocated ${allocated} units${allocated === 0 ? ' (Degeneracy resolution ε)' : ''} to cell [${bestRow + 1}, ${bestCol + 1}] at unit cost $${balanced.costs[bestRow][bestCol]}.`,
      cell: { row: bestRow, col: bestCol },
      allocatedAmount: allocated,
      cost: balanced.costs[bestRow][bestCol],
      remainingSupply: [...remSupply],
      remainingDemand: [...remDemand],
      penalties: {
        rowPenalties,
        colPenalties,
        selectedRow: selectedType === 'row' ? bestRow : undefined,
        selectedCol: selectedType === 'col' ? bestCol : undefined,
      },
    });

    if (remSupply[bestRow] === 0 && remDemand[bestCol] === 0) {
      if (activeRows.size > 1) {
        activeRows.delete(bestRow);
      } else {
        activeCols.delete(bestCol);
      }
    } else if (remSupply[bestRow] === 0) {
      activeRows.delete(bestRow);
    } else {
      activeCols.delete(bestCol);
    }
  }

  ensureNonDegenerate(allocations, isEpsilon, balanced.costs);
  const totalCost = calculateTotalCost(allocations, balanced.costs);

  return {
    method: 'vam',
    methodName: "Vogel's Approximation Method (VAM)",
    allocations,
    isEpsilon,
    totalCost,
    steps,
    isBalanced: balanced.isBalanced,
    dummySourceIndex: balanced.dummySourceIndex,
    dummyDestIndex: balanced.dummyDestIndex,
    sources: balanced.sources,
    destinations: balanced.destinations,
    costs: balanced.costs,
    supply: balanced.supply,
    demand: balanced.demand,
    isDegenerate: checkDegeneracy(allocations, m, n),
  };
}

/**
 * Check if the allocation matrix has m + n - 1 basic variables
 */
export function checkDegeneracy(
  allocations: (number | null)[][],
  m: number,
  n: number
): boolean {
  let basicCount = 0;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (allocations[r][c] !== null) {
        basicCount++;
      }
    }
  }
  return basicCount < m + n - 1;
}

/**
 * Ensure non-degeneracy by introducing epsilon = 0 into independent cells
 */
export function ensureNonDegenerate(
  allocations: (number | null)[][],
  isEpsilon: boolean[][],
  costs: number[][]
): void {
  const m = allocations.length;
  const n = allocations[0].length;
  const targetCount = m + n - 1;

  let basicCount = 0;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (allocations[r][c] !== null) basicCount++;
    }
  }

  if (basicCount >= targetCount) return;

  // We need to add (targetCount - basicCount) cells
  // Collect candidate empty cells sorted by lowest cost
  const candidates: { r: number; c: number; cost: number }[] = [];
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (allocations[r][c] === null) {
        candidates.push({ r, c, cost: costs[r][c] });
      }
    }
  }
  candidates.sort((a, b) => a.cost - b.cost);

  for (const cand of candidates) {
    if (basicCount >= targetCount) break;
    // Check if cand forms a cycle with existing basic cells
    const loop = findClosedLoop(allocations, cand.r, cand.c, costs);
    if (!loop || loop.length === 0) {
      // Independent cell! Safe to add as epsilon
      allocations[cand.r][cand.c] = 0;
      isEpsilon[cand.r][cand.c] = true;
      basicCount++;
    }
  }

  // Ensure any 0 allocation is flagged as epsilon
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (allocations[r][c] === 0) {
        isEpsilon[r][c] = true;
      }
    }
  }
}

/**
 * Find closed loop for cell (startR, startC) among existing basic cells
 * A stepping-stone loop alternates horizontal and vertical moves.
 */
export function findClosedLoop(
  allocations: (number | null)[][],
  startR: number,
  startC: number,
  costs: number[][]
): LoopStep[] | null {
  const m = allocations.length;
  const n = allocations[0].length;

  // Set of basic cells
  const isBasic = (r: number, c: number) => {
    if (r === startR && c === startC) return true;
    return allocations[r][c] !== null;
  };

  const path: CellCoord[] = [{ row: startR, col: startC }];
  const visited = new Set<string>();
  visited.add(`${startR},${startC}`);

  function dfs(currentR: number, currentC: number, mustMoveHorizontal: boolean): boolean {
    if (mustMoveHorizontal) {
      // Search all basic cells in current row `currentR` with col !== currentC
      for (let c = 0; c < n; c++) {
        if (c === currentC) continue;
        if (!isBasic(currentR, c)) continue;

        // Check if this closes the loop back to start
        if (currentR === startR && c === startC && path.length >= 4 && path.length % 2 === 0) {
          return true;
        }

        const key = `${currentR},${c}`;
        if (!visited.has(key)) {
          visited.add(key);
          path.push({ row: currentR, col: c });
          if (dfs(currentR, c, false)) {
            return true;
          }
          path.pop();
          visited.delete(key);
        }
      }
    } else {
      // Search all basic cells in current col `currentC` with row !== currentR
      for (let r = 0; r < m; r++) {
        if (r === currentR) continue;
        if (!isBasic(r, currentC)) continue;

        // Check if this closes the loop back to start
        if (r === startR && currentC === startC && path.length >= 4 && path.length % 2 === 0) {
          return true;
        }

        const key = `${r},${currentC}`;
        if (!visited.has(key)) {
          visited.add(key);
          path.push({ row: r, col: currentC });
          if (dfs(r, currentC, true)) {
            return true;
          }
          path.pop();
          visited.delete(key);
        }
      }
    }

    return false;
  }

  // Try starting with horizontal move first
  if (dfs(startR, startC, true)) {
    return buildLoopSteps(path, allocations, costs);
  }

  // Try starting with vertical move
  path.length = 1;
  visited.clear();
  visited.add(`${startR},${startC}`);
  if (dfs(startR, startC, false)) {
    return buildLoopSteps(path, allocations, costs);
  }

  return null;
}

function buildLoopSteps(
  path: CellCoord[],
  allocations: (number | null)[][],
  costs: number[][]
): LoopStep[] {
  return path.map((cell, idx) => ({
    row: cell.row,
    col: cell.col,
    sign: idx % 2 === 0 ? '+' : '-',
    cost: costs[cell.row][cell.col],
    allocation: allocations[cell.row][cell.col] ?? 0,
  }));
}

/**
 * 5. Stepping Stone Method: Optimality test & iterative improvement
 */
export function solveSteppingStone(
  initialSolution: MethodSolution,
  objective: ProblemObjective = 'minimize'
): MethodSolution {
  const m = initialSolution.sources.length;
  const n = initialSolution.destinations.length;
  const costs = initialSolution.costs;

  // Deep clone allocations and epsilon flags
  let currentAllocations: (number | null)[][] = initialSolution.allocations.map(
    (row) => [...row]
  );
  let currentEpsilon: boolean[][] = initialSolution.isEpsilon.map((row) => [
    ...row,
  ]);

  ensureNonDegenerate(currentAllocations, currentEpsilon, costs);

  const iterations: SteppingStoneIteration[] = [];
  const maxIterations = 20;
  let iterationNum = 1;
  let isOptimal = false;

  while (iterationNum <= maxIterations && !isOptimal) {
    // 1. Evaluate all non-basic cells
    const evaluations: CellEvaluation[] = [];

    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        if (currentAllocations[r][c] === null) {
          const loop = findClosedLoop(currentAllocations, r, c, costs);
          if (loop && loop.length >= 4) {
            // Calculate opportunity cost delta
            let delta = 0;
            const formulaParts: string[] = [];

            for (const step of loop) {
              const signMultiplier = step.sign === '+' ? 1 : -1;
              delta += signMultiplier * step.cost;
              formulaParts.push(
                `${step.sign}C[${step.row + 1},${step.col + 1}] (${step.sign}$${step.cost})`
              );
            }

            const isImproving =
              objective === 'minimize' ? delta < 0 : delta > 0;

            evaluations.push({
              row: r,
              col: c,
              loop,
              delta,
              calculationFormula: `${formulaParts.join(' ')} = ${delta >= 0 ? '+' : ''}${delta}`,
              isImproving,
            });
          }
        }
      }
    }

    // 2. Check for optimality
    const improvingEvaluations = evaluations.filter((e) => e.isImproving);

    if (improvingEvaluations.length === 0) {
      // Optimal solution found!
      isOptimal = true;
      iterations.push({
        iterationNumber: iterationNum,
        allocations: currentAllocations.map((row) => [...row]),
        isEpsilon: currentEpsilon.map((row) => [...row]),
        evaluations,
        isOptimal: true,
        enteringCell: null,
        leavingCell: null,
        loop: null,
        theta: 0,
        totalCost: calculateTotalCost(currentAllocations, costs),
        explanation: `Optimality verified! All non-basic cell evaluation indices (opportunity costs) are ${
          objective === 'minimize' ? 'non-negative (Δ ≥ 0)' : 'non-positive (Δ ≤ 0)'
        }. No further cost improvement is possible.`,
      });
      break;
    }

    // 3. Select entering cell
    // In minimization: most negative delta
    // In maximization: most positive delta
    let enteringEvaluation: CellEvaluation = improvingEvaluations[0];
    for (const ev of improvingEvaluations) {
      if (objective === 'minimize') {
        if (ev.delta < enteringEvaluation.delta) {
          enteringEvaluation = ev;
        }
      } else {
        if (ev.delta > enteringEvaluation.delta) {
          enteringEvaluation = ev;
        }
      }
    }

    const loop = enteringEvaluation.loop;

    // 4. Determine theta = min allocation among negative cells in the loop
    const donorSteps = loop.filter((step) => step.sign === '-');
    let theta = Infinity;
    let leavingCellCoord: CellCoord | null = null;

    for (const step of donorSteps) {
      const alloc = currentAllocations[step.row][step.col] ?? 0;
      if (alloc < theta) {
        theta = alloc;
        leavingCellCoord = { row: step.row, col: step.col };
      }
    }

    if (theta === Infinity || !leavingCellCoord) {
      // Safeguard against invalid loops
      break;
    }

    // Record the current state before reallocation
    iterations.push({
      iterationNumber: iterationNum,
      allocations: currentAllocations.map((row) => [...row]),
      isEpsilon: currentEpsilon.map((row) => [...row]),
      evaluations,
      isOptimal: false,
      enteringCell: {
        row: enteringEvaluation.row,
        col: enteringEvaluation.col,
        delta: enteringEvaluation.delta,
      },
      leavingCell: {
        row: leavingCellCoord.row,
        col: leavingCellCoord.col,
        theta,
      },
      loop,
      theta,
      totalCost: calculateTotalCost(currentAllocations, costs),
      explanation: `Selected entering cell [${enteringEvaluation.row + 1}, ${
        enteringEvaluation.col + 1
      }] with opportunity cost Δ = ${enteringEvaluation.delta}. Reallocating θ = ${theta} units along the stepping-stone loop. Cell [${
        leavingCellCoord.row + 1
      }, ${leavingCellCoord.col + 1}] departs the basis.`,
    });

    // 5. Reallocate along the loop
    const newAllocations = currentAllocations.map((row) => [...row]);
    const newEpsilon = currentEpsilon.map((row) => [...row]);

    for (const step of loop) {
      const currentVal = newAllocations[step.row][step.col] ?? 0;
      if (step.sign === '+') {
        const newVal = currentVal + theta;
        newAllocations[step.row][step.col] = newVal;
        newEpsilon[step.row][step.col] = newVal === 0;
      } else {
        const nextVal = currentVal - theta;
        if (step.row === leavingCellCoord.row && step.col === leavingCellCoord.col) {
          // Exactly this cell leaves basis
          newAllocations[step.row][step.col] = null;
          newEpsilon[step.row][step.col] = false;
        } else {
          newAllocations[step.row][step.col] = nextVal;
          newEpsilon[step.row][step.col] = nextVal === 0;
        }
      }
    }

    currentAllocations = newAllocations;
    currentEpsilon = newEpsilon;
    ensureNonDegenerate(currentAllocations, currentEpsilon, costs);

    iterationNum++;
  }

  const finalTotalCost = calculateTotalCost(currentAllocations, costs);

  return {
    method: 'stepping_stone',
    methodName: 'Stepping Stone Method (Optimal Solution)',
    allocations: currentAllocations,
    isEpsilon: currentEpsilon,
    totalCost: finalTotalCost,
    steps: initialSolution.steps,
    isBalanced: initialSolution.isBalanced,
    dummySourceIndex: initialSolution.dummySourceIndex,
    dummyDestIndex: initialSolution.dummyDestIndex,
    sources: initialSolution.sources,
    destinations: initialSolution.destinations,
    costs: initialSolution.costs,
    supply: initialSolution.supply,
    demand: initialSolution.demand,
    isDegenerate: checkDegeneracy(currentAllocations, m, n),
    steppingStoneIterations: iterations,
    optimalCost: finalTotalCost,
    isOptimal,
  };
}

/**
 * Standard preset textbook problems
 */
export const SAMPLE_PROBLEMS: TransportationProblem[] = [
  {
    id: 'classic_3x4',
    name: 'Textbook 3×4 Distribution (Minimization)',
    objective: 'minimize',
    sources: ['Plant 1 (Detroit)', 'Plant 2 (Cleveland)', 'Plant 3 (Boston)'],
    destinations: ['Market A (New York)', 'Market B (Philadelphia)', 'Market C (Baltimore)', 'Market D (Washington)'],
    costs: [
      [10, 2, 20, 11],
      [12, 7, 9, 20],
      [4, 14, 16, 18],
    ],
    supply: [15, 25, 10],
    demand: [5, 15, 15, 15],
  },
  {
    id: 'unbalanced_3x3',
    name: 'Unbalanced Supply & Demand (Auto-Dummy)',
    objective: 'minimize',
    sources: ['Factory Alpha', 'Factory Beta', 'Factory Gamma'],
    destinations: ['Depot East', 'Depot Central', 'Depot West'],
    costs: [
      [8, 4, 7],
      [6, 9, 3],
      [5, 8, 6],
    ],
    supply: [60, 40, 50], // Total 150
    demand: [45, 55, 30], // Total 130 -> Dummy destination needed for 20 units!
  },
  {
    id: 'maximization_3x3',
    name: 'Maximum Cell Profit Problem (Maximization)',
    objective: 'maximize',
    sources: ['Warehouse 1', 'Warehouse 2', 'Warehouse 3'],
    destinations: ['Retailer X', 'Retailer Y', 'Retailer Z'],
    costs: [
      [40, 25, 30],
      [35, 50, 45],
      [20, 30, 40],
    ],
    supply: [100, 120, 80],
    demand: [90, 110, 100],
  },
  {
    id: 'degenerate_case_3x3',
    name: 'Degeneracy Handling Case (3×3)',
    objective: 'minimize',
    sources: ['Origin 1', 'Origin 2', 'Origin 3'],
    destinations: ['Destination 1', 'Destination 2', 'Destination 3'],
    costs: [
      [2, 3, 11],
      [1, 0, 6],
      [5, 8, 15],
    ],
    supply: [6, 1, 10],
    demand: [7, 5, 5],
  },
];

/**
 * Compute MODI Dual Variables (u_i, v_j) where u_i + v_j = c_ij for all basic cells
 * and cross-verify with Stepping Stone loop evaluation (opportunity cost delta).
 */
export function computeDualVariables(
  allocations: (number | null)[][],
  costs: number[][],
  _objective: ProblemObjective = 'minimize'
): DualVerification {
  const m = allocations.length;
  const n = allocations[0].length;

  const u: (number | null)[] = new Array(m).fill(null);
  const v: (number | null)[] = new Array(n).fill(null);

  // Reference variable u_0 = 0
  u[0] = 0;

  let changed = true;
  let guard = 0;
  while (changed && guard < 100) {
    guard++;
    changed = false;
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        if (allocations[r][c] !== null) {
          if (u[r] !== null && v[c] === null) {
            v[c] = costs[r][c] - u[r]!;
            changed = true;
          } else if (v[c] !== null && u[r] === null) {
            u[r] = costs[r][c] - v[c]!;
            changed = true;
          }
        }
      }
    }

    if (!changed) {
      for (let r = 0; r < m; r++) {
        if (u[r] === null) {
          const hasBasic = allocations[r].some((val) => val !== null);
          if (hasBasic) {
            u[r] = 0;
            changed = true;
            break;
          }
        }
      }
    }
  }

  const comparisons: DualVerification['comparisons'] = [];
  let isConsistent = true;

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (allocations[r][c] === null) {
        const loop = findClosedLoop(allocations, r, c, costs);
        let ssDelta = 0;
        if (loop) {
          for (const step of loop) {
            const multiplier = step.sign === '+' ? 1 : -1;
            ssDelta += multiplier * step.cost;
          }
        }

        const uVal = u[r] ?? 0;
        const vVal = v[c] ?? 0;
        const modiDelta = costs[r][c] - (uVal + vVal);
        const match = ssDelta === modiDelta;
        if (!match) {
          isConsistent = false;
        }

        comparisons.push({
          row: r,
          col: c,
          ssDelta,
          modiDelta,
          match,
          cost: costs[r][c],
          uVal,
          vVal,
        });
      }
    }
  }

  return {
    u,
    v,
    isConsistent,
    comparisons,
  };
}

/**
 * Generate a comprehensive Diagnostics Report verifying mathematical invariants
 * and algorithm correctness for a given solution.
 */
export function generateDiagnosticsReport(
  solution: MethodSolution,
  objective: ProblemObjective = 'minimize'
): DiagnosticsReport {
  const m = solution.sources.length;
  const n = solution.destinations.length;
  const invariants: InvariantCheck[] = [];

  // 1. Supply Feasibility
  let allSupplyPassed = true;
  for (let r = 0; r < m; r++) {
    const rowSum = solution.allocations[r].reduce((acc, val) => acc + (val ?? 0), 0);
    const expected = solution.supply[r];
    if (rowSum !== expected) {
      allSupplyPassed = false;
      invariants.push({
        id: `supply-${r}`,
        name: `Row ${r + 1} Supply (${solution.sources[r]})`,
        category: 'feasibility',
        passed: false,
        actual: `${rowSum} units`,
        expected: `${expected} units`,
        details: `Allocation sum (${rowSum}) does not equal supply (${expected})`,
      });
    }
  }
  if (allSupplyPassed) {
    invariants.push({
      id: 'supply-conservation',
      name: 'Supply Conservation (∑ⱼ xᵢⱼ = aᵢ)',
      category: 'feasibility',
      passed: true,
      actual: 'All rows satisfied',
      expected: 'Exact supply match',
      details: 'Every source shipped its exact available supply amount.',
    });
  }

  // 2. Demand Feasibility
  let allDemandPassed = true;
  for (let c = 0; c < n; c++) {
    let colSum = 0;
    for (let r = 0; r < m; r++) {
      colSum += solution.allocations[r][c] ?? 0;
    }
    const expected = solution.demand[c];
    if (colSum !== expected) {
      allDemandPassed = false;
      invariants.push({
        id: `demand-${c}`,
        name: `Col ${c + 1} Demand (${solution.destinations[c]})`,
        category: 'feasibility',
        passed: false,
        actual: `${colSum} units`,
        expected: `${expected} units`,
        details: `Allocation sum (${colSum}) does not equal demand (${expected})`,
      });
    }
  }
  if (allDemandPassed) {
    invariants.push({
      id: 'demand-conservation',
      name: 'Demand Conservation (∑ᵢ xᵢⱼ = bⱼ)',
      category: 'feasibility',
      passed: true,
      actual: 'All cols satisfied',
      expected: 'Exact demand match',
      details: 'Every destination received its exact demanded quota.',
    });
  }

  // 3. Non-negativity
  let nonNegativityPassed = true;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const val = solution.allocations[r][c];
      if (val !== null && val < 0) {
        nonNegativityPassed = false;
      }
    }
  }
  invariants.push({
    id: 'non-negativity',
    name: 'Non-Negativity Constraint (xᵢⱼ ≥ 0)',
    category: 'feasibility',
    passed: nonNegativityPassed,
    actual: nonNegativityPassed ? 'xᵢⱼ ≥ 0 for all cells' : 'Negative allocation detected',
    expected: 'xᵢⱼ ≥ 0',
    details: nonNegativityPassed
      ? 'All basic and non-basic allocations are strictly non-negative.'
      : 'Violation: negative allocation found.',
  });

  // 4. Basis Cardinality (m + n - 1)
  let basicCount = 0;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (solution.allocations[r][c] !== null) {
        basicCount++;
      }
    }
  }
  const requiredBasicCount = m + n - 1;
  const basisPassed = basicCount === requiredBasicCount;
  invariants.push({
    id: 'basis-cardinality',
    name: 'Basis Cardinality (m + n - 1)',
    category: 'basis',
    passed: basisPassed,
    actual: `${basicCount} basic cells`,
    expected: `${requiredBasicCount} basic cells`,
    details: basisPassed
      ? `Exactly m + n - 1 (${m} + ${n} - 1 = ${requiredBasicCount}) basic variables are maintained.`
      : `Degenerate state: ${basicCount} basic cells instead of ${requiredBasicCount}.`,
  });

  // 5. Cost Computation Verification
  const recomputedCost = calculateTotalCost(solution.allocations, solution.costs);
  const costMatch = recomputedCost === solution.totalCost;
  invariants.push({
    id: 'cost-integrity',
    name: 'Objective Function Value Integrity',
    category: 'optimality',
    passed: costMatch,
    actual: `$${solution.totalCost.toLocaleString()}`,
    expected: `$${recomputedCost.toLocaleString()}`,
    details: costMatch
      ? 'Direct sum ∑ (cᵢⱼ × xᵢⱼ) matches the reported total objective value perfectly.'
      : 'Mismatch between reported total cost and direct matrix dot product.',
  });

  // 6. Dual Variables & Loop Equivalence
  const dualVerification = computeDualVariables(solution.allocations, solution.costs, objective);
  invariants.push({
    id: 'dual-equivalence',
    name: 'MODI (u-v) vs Stepping Stone Equivalence',
    category: 'optimality',
    passed: dualVerification.isConsistent,
    actual: dualVerification.isConsistent ? '100% Match on all Δᵢⱼ' : 'Mismatch found',
    expected: 'Δᵢⱼ ≡ cᵢⱼ - (uᵢ + vⱼ)',
    details: dualVerification.isConsistent
      ? `Every non-basic opportunity cost Δᵢⱼ calculated via closed loops matches dual shadow prices cᵢⱼ - (uᵢ + vⱼ) identically.`
      : 'One or more empty cells had differing closed loop and MODI multipliers.',
  });

  const allPassed = invariants.every((inv) => inv.passed);

  return {
    invariants,
    dualVerification,
    allPassed,
  };
}

export interface SelfTestResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  details: {
    problemName: string;
    method: string;
    passed: boolean;
    cost: number;
    error?: string;
  }[];
}

/**
 * Execute automated test battery directly in browser/runtime
 */
export function runAlgorithmSelfTest(): SelfTestResult {
  const startTime = Date.now();
  const details: SelfTestResult['details'] = [];
  let passedTests = 0;
  let failedTests = 0;

  // Run on sample problems and synthetic random tests
  const testProblems = [...SAMPLE_PROBLEMS];

  // Add 3 random problems
  for (let i = 1; i <= 3; i++) {
    testProblems.push({
      id: `synthetic_${i}`,
      name: `Automated Test Case #${i} (Random 3×3)`,
      objective: 'minimize',
      sources: ['Source A', 'Source B', 'Source C'],
      destinations: ['Dest 1', 'Dest 2', 'Dest 3'],
      costs: [
        [Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1],
        [Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1],
        [Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1],
      ],
      supply: [25, 35, 40],
      demand: [30, 30, 40],
    });
  }

  for (const prob of testProblems) {
    const solvers = [
      { name: 'NWCR', fn: solveNWCR },
      { name: 'Least-Cost', fn: solveLeastCost },
      { name: 'Max Profit', fn: solveMaxProfit },
      { name: 'VAM', fn: solveVAM },
    ];

    let vamSol: MethodSolution | null = null;
    for (const s of solvers) {
      try {
        const sol = s.fn(prob);
        if (s.name === 'VAM') vamSol = sol;
        const report = generateDiagnosticsReport(sol, prob.objective);
        if (report.allPassed) {
          passedTests++;
          details.push({
            problemName: prob.name,
            method: s.name,
            passed: true,
            cost: sol.totalCost,
          });
        } else {
          failedTests++;
          details.push({
            problemName: prob.name,
            method: s.name,
            passed: false,
            cost: sol.totalCost,
            error: 'Invariant check failed',
          });
        }
      } catch (err) {
        failedTests++;
        details.push({
          problemName: prob.name,
          method: s.name,
          passed: false,
          cost: 0,
          error: String(err),
        });
      }
    }

    // Test Stepping Stone
    if (vamSol) {
      try {
        const ss = solveSteppingStone(vamSol, prob.objective);
        const ssReport = generateDiagnosticsReport(ss, prob.objective);
        if (ssReport.allPassed) {
          passedTests++;
          details.push({
            problemName: prob.name,
            method: 'Stepping Stone (Opt)',
            passed: true,
            cost: ss.totalCost,
          });
        } else {
          failedTests++;
          details.push({
            problemName: prob.name,
            method: 'Stepping Stone (Opt)',
            passed: false,
            cost: ss.totalCost,
            error: 'Stepping Stone invariant failed',
          });
        }
      } catch (err) {
        failedTests++;
        details.push({
          problemName: prob.name,
          method: 'Stepping Stone (Opt)',
          passed: false,
          cost: 0,
          error: String(err),
        });
      }
    }
  }

  return {
    totalTests: passedTests + failedTests,
    passedTests,
    failedTests,
    durationMs: Date.now() - startTime,
    details,
  };
}

