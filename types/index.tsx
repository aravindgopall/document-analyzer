// types/index.ts
export interface RiskAnalysis {
  risks: Risk[];
}

export interface Risk {
  statement: string;
  factor: string;
  severity: "Low" | "Medium" | "High";
  suggestion: string;
  clause?: string; // Clause number from the rules
  clauseSection?: string; // Section title from the rules
  rewrite?: string; // Suggested rewrite for the statement
}
