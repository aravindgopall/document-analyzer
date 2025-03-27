import React, { useState, useEffect, ReactElement, useRef } from 'react';
import RiskTooltip from './RiskTooltip';
import { Risk, RiskAnalysis } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [documentText, setDocumentText] = useState<string>(originalText);
  const [rewrittenRisks, setRewrittenRisks] = useState<Set<string>>(new Set());
  const [isGeneratingDownload, setIsGeneratingDownload] = useState<boolean>(false);
  
  // Use a ref to keep track of the current URL for cleanup
  const urlToCleanupRef = useRef<string | null>(null);
  const documentContentRef = useRef<HTMLDivElement>(null);

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
  }, [originalFile]);

  // Reset document text when original text changes
  useEffect(() => {
    setDocumentText(originalText);
    setRewrittenRisks(new Set());
  }, [originalText]);

  // Function to apply a rewrite to the document
  const applyRewrite = (risk: Risk) => {
    if (!risk.rewrite) return;
    
    const newText = documentText.replace(risk.statement, risk.rewrite);
    setDocumentText(newText);
    
    // Track which risks have been rewritten
    const newRewrittenRisks = new Set(rewrittenRisks);
    newRewrittenRisks.add(risk.statement);
    setRewrittenRisks(newRewrittenRisks);
    
    // Clear active risk after applying rewrite
    setActiveRisk(null);
  };

  // Function to create and download the document
  const downloadDocument = async () => {
    if (!originalFile) return;
    
    setIsGeneratingDownload(true);
    
    try {
      const fileName = originalFile.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const newFileName = fileName.replace(`.${fileExtension}`, `-revised.${fileExtension}`);
      
      if (fileExtension === 'txt' || fileType === 'text/plain') {
        // For text files, just create a text blob
        const blob = new Blob([documentText], { type: 'text/plain' });
        downloadBlob(blob, newFileName);
      } 
      else if (fileExtension === 'pdf' || fileType === 'application/pdf') {
        // For PDF files, create a new PDF
        await generatePDF(newFileName);
      }
      else if (fileExtension === 'docx' || fileExtension === 'doc' || 
               fileType.includes('word')) {
        // For Word files, create a text file (since we can't easily create Word files in the browser)
        // We'll add a message to the user about this limitation
        const textBlob = new Blob([
          "Note: Original document was a Word file. Browser limitations prevent direct Word file creation.\n\n",
          "REVISED DOCUMENT CONTENT:\n\n",
          documentText
        ], { type: 'text/plain' });
        
        downloadBlob(textBlob, newFileName.replace(`.${fileExtension}`, '.txt'));
      }
      else {
        // For other file types, default to text
        const blob = new Blob([documentText], { type: 'text/plain' });
        downloadBlob(blob, `${newFileName}.txt`);
      }
    } catch (error) {
      console.error('Error generating download:', error);
      alert('Failed to generate downloadable file. Please try again.');
    } finally {
      setIsGeneratingDownload(false);
    }
  };
  
  // Helper function to download a blob
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Helper function to generate PDF
  const generatePDF = async (fileName: string) => {
    if (!documentContentRef.current) return;
    
    // Create a temporary div with proper styling for better PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12pt';
    tempDiv.style.lineHeight = '1.5';
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.innerHTML = documentText.replace(/\n/g, '<br>');
    document.body.appendChild(tempDiv);
    
    try {
      // Render to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download the PDF
      pdf.save(fileName);
    } finally {
      // Clean up the temporary div
      document.body.removeChild(tempDiv);
    }
  };

  // Function to highlight risky statements in the document
  const renderAnalyzedDocument = () => {
    if (!analysisResults || !analysisResults.risks || analysisResults.risks.length === 0) {
      return <div className="document-content" ref={documentContentRef}>{documentText}</div>;
    }

    let lastIndex = 0;
    const elements: ReactElement[] = [];
    
    // Filter out risks that have already been rewritten
    const activeRisks = analysisResults.risks.filter(
      risk => !rewrittenRisks.has(risk.statement)
    );
    
    // Sort risks by their position in the document
    const sortedRisks = [...activeRisks].sort((a, b) => 
      documentText.indexOf(a.statement) - documentText.indexOf(b.statement)
    );
    
    sortedRisks.forEach((risk, idx) => {
      const statementIndex = documentText.indexOf(risk.statement, lastIndex);
      
      if (statementIndex === -1) return; // Skip if statement not found
      
      // Add text before the risky statement
      if (statementIndex > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {documentText.substring(lastIndex, statementIndex)}
          </span>
        );
      }
      
      // Add the risky statement with highlighting and tooltip
      elements.push(
        <span 
          key={`risk-${idx}`}
          className={`risk-statement ${risk.clause ? 'has-clause' : ''}`}
          onMouseEnter={() => setActiveRisk(risk)}
          onMouseLeave={() => setActiveRisk(null)}
        >
          {risk.statement}
          {activeRisk === risk && (
            <RiskTooltip 
              risk={risk} 
              onApplyRewrite={() => risk.rewrite && applyRewrite(risk)}
            />
          )}
        </span>
      );
      
      lastIndex = statementIndex + risk.statement.length;
    });
    
    // Add any remaining text
    if (lastIndex < documentText.length) {
      elements.push(
        <span key="text-final">
          {documentText.substring(lastIndex)}
        </span>
      );
    }
    
    // Add a section showing rewritten statements
    if (rewrittenRisks.size > 0) {
      elements.push(
        <div key="rewritten-section" className="rewritten-section">
          <h3>Applied Rewrites ({rewrittenRisks.size})</h3>
          <ul>
            {Array.from(rewrittenRisks).map((statement, idx) => {
              const risk = analysisResults.risks.find(r => r.statement === statement);
              return (
                <li key={idx} className="rewritten-item">
                  <div className="original">
                    <strong>Original:</strong> {statement}
                  </div>
                  {risk?.rewrite && (
                    <div className="new-text">
                      <strong>New:</strong> {risk.rewrite}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    
    return <div className="document-content" ref={documentContentRef}>{elements}</div>;
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

  // Calculate if download button should be enabled
  const isDownloadEnabled = rewrittenRisks.size > 0 && !isGeneratingDownload;

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
        <div className="controls-section">
          <div className="stats">
            {analysisResults?.risks?.length || 0} potential risks identified
            {rewrittenRisks.size > 0 && ` • ${rewrittenRisks.size} fixed`}
          </div>
          
          {rewrittenRisks.size > 0 && (
            <button 
              className={`download-btn ${!isDownloadEnabled ? 'disabled' : ''}`}
              onClick={downloadDocument}
              disabled={!isDownloadEnabled}
            >
              {isGeneratingDownload ? 'Generating...' : 'Download Revised Document'}
            </button>
          )}
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
