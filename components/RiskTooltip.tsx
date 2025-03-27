import React from 'react';
import { Risk } from '../types';

interface RiskTooltipProps {
  risk: Risk;
  onApplyRewrite?: () => void;
}

export default function RiskTooltip({ risk, onApplyRewrite }: RiskTooltipProps) {
  return (
    <div className="risk-tooltip">
      <div className="risk-level">
        Risk Level: <span className={`level-${risk.severity.toLowerCase()}`}>
          {risk.severity}
        </span>
      </div>
      
      {(risk.clause || risk.clauseSection) && (
        <div className="clause-info">
          <h4>Related Clause:</h4>
          <p>
            {risk.clause && `Clause ${risk.clause}: `}
            {risk.clauseSection || 'General'}
          </p>
        </div>
      )}
      
      <div className="risk-factor">
        <h4>Risk Factor:</h4>
        <p>{risk.factor}</p>
      </div>
      
      <div className="suggestion">
        <h4>Suggestion:</h4>
        <p>{risk.suggestion}</p>
      </div>
      
      {risk.rewrite && (
        <div className="rewrite">
          <h4>Suggested Rewrite:</h4>
          <p className="rewrite-text">{risk.rewrite}</p>
          <button 
            className="apply-rewrite-btn"
            onClick={onApplyRewrite}
          >
            Apply Rewrite
          </button>
        </div>
      )}
    </div>
  );
}
