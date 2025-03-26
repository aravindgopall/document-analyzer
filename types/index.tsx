export interface RiskAnalysis {
  risks: Risk[];
}

export interface Risk {
  statement: string;
  factor: string;
  severity: "Low" | "Medium" | "High";
  suggestion: string;
  clause: string;
}
