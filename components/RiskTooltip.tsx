import { Risk } from "../types";

interface RiskTooltipProps {
  risk: Risk;
}

export default function RiskTooltip({ risk }: RiskTooltipProps) {
  return (
    <div className="risk-tooltip">
      <div className="risk-level">
        Risk Level:{" "}
        <span className={`level-${risk.severity.toLowerCase()}`}>
          {risk.severity}
        </span>
      </div>
      <div className="risk-clause">
        <h4>Clause:</h4>
        <p>{risk.clause}</p>
      </div>
      <div className="risk-factor">
        <h4>Risk Factor:</h4>
        <p>{risk.factor}</p>
      </div>
      <div className="suggestion">
        <h4>Suggestion:</h4>
        <p>{risk.suggestion}</p>
      </div>
    </div>
  );
}
