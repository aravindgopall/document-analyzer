import React, { useState, useEffect, ReactElement, useRef } from 'react';
import RiskTooltip from './RiskTooltip';
import { Risk, RiskAnalysis } from '../types';

interface DocumentViewerProps {
  originalFile: File | null;
  originalText: string;
  analysisResults: RiskAnalysis;
}

export default function DocumentViewer({ originalFile, originalText, analysisResults }: DocumentViewerProps) {
  const [activeRisk, setActiveRisk] = useState<Risk | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'analyzed' | 'split'>('split');
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  
  // Use a ref to keep track of the current URL for cleanup
  const urlToCleanupRef = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup function that uses the ref instead of closure
    const cleanup = () => {
      if (urlToCleanupRef.current) {
        URL.revokeObjectURL(urlToCleanupRef.current);
        urlToCleanupRef.current = null;
      }
    };

    // Clean up previous URL
    cleanup();

    // Create new URL if we have a file
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setOriginalFileUrl(url);
      setFileType(originalFile.type);
      
      // Store the current URL in ref for later cleanup
      urlToCleanupRef.current = url;
    }
    
    // Return cleanup function
    return cleanup;
  }, [originalFile]); // Only depend on originalFile

  // Rest of the component remains the same...

  // Function to highlight risky statements in the document
  const renderAnalyzedDocument = () => {
    if (!analysisResults || !analysisResults.risks || analysisResults.risks.length === 0) {
      return <div className="document-content">{originalText}</div>;
    }

    let lastIndex = 0;
    const elements: ReactElement[] = [];
    
    // Sort risks by their position in the document
    const sortedRisks = [...analysisResults.risks].sort((a, b) => 
      originalText.indexOf(a.statement) - originalText.indexOf(b.statement)
    );
    
    sortedRisks.forEach((risk, idx) => {
      const statementIndex = originalText.indexOf(risk.statement, lastIndex);
      
      if (statementIndex === -1) return; // Skip if statement not found
      
      // Add text before the risky statement
      if (statementIndex > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {originalText.substring(lastIndex, statementIndex)}
          </span>
        );
      }
      
      // Add the risky statement with highlighting and tooltip
      elements.push(
        <span 
          key={`risk-${idx}`}
          className="risk-statement"
          onMouseEnter={() => setActiveRisk(risk)}
          onMouseLeave={() => setActiveRisk(null)}
        >
          {risk.statement}
          {activeRisk === risk && (
            <RiskTooltip risk={risk} />
          )}
        </span>
      );
      
      lastIndex = statementIndex + risk.statement.length;
    });
    
    // Add any remaining text
    if (lastIndex < originalText.length) {
      elements.push(
        <span key="text-final">
          {originalText.substring(lastIndex)}
        </span>
      );
    }
    
    return <div className="document-content">{elements}</div>;
  };

  // Function to render the original document
  const renderOriginalDocument = () => {
    if (!originalFileUrl) {
      return <div className="no-preview">Original document preview not available</div>;
    }

    const isPdf = fileType === 'application/pdf' || originalFile?.name.toLowerCase().endsWith('.pdf');
    const isWord = fileType.includes('word') || 
                  originalFile?.name.toLowerCase().endsWith('.docx') || 
                  originalFile?.name.toLowerCase().endsWith('.doc');

    if (isPdf) {
      return (
        <div className="pdf-container">
          <iframe 
            src={`${originalFileUrl}#toolbar=0`} 
            className="pdf-iframe"
            title="PDF Document"
          />
        </div>
      );
    } else if (isWord) {
      // For Word documents, we use an object tag which can sometimes render them
      return (
        <div className="word-container">
          <object
            data={originalFileUrl}
            type={fileType}
            className="word-object"
            title="Word Document"
          >
            <p>Unable to display Word document. You can <a href={originalFileUrl} download={originalFile?.name}>download it</a> instead.</p>
          </object>
        </div>
      );
    } else {
      // For other file types, offer a download link
      return (
        <div className="no-preview">
          <p>Preview not available for this file type.</p>
          <a href={originalFileUrl} download={originalFile?.name} className="download-link">
            Download the original file
          </a>
        </div>
      );
    }
  };

  return (
    <div className="document-viewer">
      <div className="toolbar">
        <h2>Document Analysis</h2>
        <div className="view-controls">
          <button 
            className={`view-control-btn ${viewMode === 'original' ? 'active' : ''}`}
            onClick={() => setViewMode('original')}
          >
            Original
          </button>
          <button 
            className={`view-control-btn ${viewMode === 'analyzed' ? 'active' : ''}`}
            onClick={() => setViewMode('analyzed')}
          >
            Analyzed
          </button>
          <button 
            className={`view-control-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            Split View
          </button>
        </div>
        <div className="stats">
          {analysisResults?.risks?.length || 0} potential risks identified
        </div>
      </div>

      <div className={`document-container ${viewMode}`}>
        {viewMode === 'original' && (
          <div className="original-panel">
            {renderOriginalDocument()}
          </div>
        )}
        
        {viewMode === 'analyzed' && (
          <div className="analyzed-panel">
            {renderAnalyzedDocument()}
          </div>
        )}
        
        {viewMode === 'split' && (
          <>
            <div className="original-panel">
              {renderOriginalDocument()}
            </div>
            <div className="analyzed-panel">
              {renderAnalyzedDocument()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
