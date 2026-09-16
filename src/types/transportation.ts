export type ProblemObjective = 'minimize' | 'maximize';

export type MethodType = 'nwcr' | 'least_cost' | 'max_profit' | 'vam' | 'stepping_stone';

export interface TransportationProblem {
  id: string;
  name: string;
  objective: ProblemObjective;
  sources: string[]; // Source names e.g., ["Factory S1", "Factory S2", "Factory S3"]
  destinations: string[]; // Destination names e.g., ["Warehouse D1", "Warehouse D2", "Warehouse D3", "Warehouse D4"]
  costs: number[][]; // costs[i][j] unit cost or profit from source i to destination j
  supply: number[]; // supply[i]
  demand: number[]; // demand[j]
}

export interface CellCoord {
  row: number;
  col: number;
}

export interface LoopStep {
  row: number;
  col: number;
  sign: '+' | '-';
  cost: number;
  allocation: number;
}

export interface CellEvaluation {
  row: number;
  col: number;
  loop: LoopStep[];
  delta: number; // Opportunity cost / Net evaluation index
  calculationFormula: string;
  isImproving: boolean;
}

export interface AllocationCell {
  row: number;
  col: number;
  amount: number;
  isEpsilon?: boolean; // For handling degeneracy (m + n - 1)
}

export interface StepLog {
  stepNumber: number;
  title: string;
  description: string;
  cell?: CellCoord;
  allocatedAmount?: number;
  cost?: number;
  remainingSupply: number[];
  remainingDemand: number[];
  penalties?: {
    rowPenalties: (number | null)[];
    colPenalties: (number | null)[];
    selectedRow?: number;
    selectedCol?: number;
  };
}

export interface SteppingStoneIteration {
  iterationNumber: number;
  allocations: (number | null)[][];
  isEpsilon: boolean[][];
  evaluations: CellEvaluation[];
  isOptimal: boolean;
  enteringCell: { row: number; col: number; delta: number } | null;
  leavingCell: { row: number; col: number; theta: number } | null;
  loop: LoopStep[] | null;
  theta: number;
  totalCost: number;
  explanation: string;
}

export interface DualVerification {
  u: (number | null)[];
  v: (number | null)[];
  isConsistent: boolean;
  comparisons: {
    row: number;
    col: number;
    ssDelta: number;
    modiDelta: number;
    match: boolean;
    cost: number;
    uVal: number;
    vVal: number;
  }[];
}

export interface InvariantCheck {
  id: string;
  name: string;
  category: 'feasibility' | 'basis' | 'optimality';
  passed: boolean;
  actual: string | number;
  expected: string | number;
  details: string;
}

export interface DiagnosticsReport {
  invariants: InvariantCheck[];
  dualVerification: DualVerification;
  allPassed: boolean;
}

export interface MethodSolution {
  method: MethodType;
  methodName: string;
  allocations: (number | null)[][];
  isEpsilon: boolean[][];
  totalCost: number;
  steps: StepLog[];
  isBalanced: boolean;
  dummySourceIndex: number | null;
  dummyDestIndex: number | null;
  sources: string[];
  destinations: string[];
  costs: number[][];
  supply: number[];
  demand: number[];
  isDegenerate: boolean;
  steppingStoneIterations?: SteppingStoneIteration[];
  optimalCost?: number;
  isOptimal?: boolean;
  diagnostics?: DiagnosticsReport;
}
