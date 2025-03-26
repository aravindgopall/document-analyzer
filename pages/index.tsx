import { useState } from 'react';
import Head from 'next/head';
import DocumentViewer from '../components/DocumentViewer';
import { RiskAnalysis } from '../types';
import { extractTextFromFile } from '../lib/document-parser';

export default function Home() {
  const [document, setDocument] = useState<string>('');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analyzedContent, setAnalyzedContent] = useState<RiskAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add supported file formats display
  const supportedFormats = [
    { type: 'Text', extensions: '.txt' },
    { type: 'PDF', extensions: '.pdf' },
    { type: 'Word', extensions: '.docx, .doc' }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setOriginalFile(file); // Store the original file for display
    
    try {
      // Extract text from various file formats (PDF, DOCX, TXT)
      const text = await extractTextFromFile(file);
      setDocument(text);
      
      // Send the extracted text for analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data: RiskAnalysis = await response.json();
      setAnalyzedContent(data);
    } catch (err) {
      console.error('Error processing document:', err);
      setError(err instanceof Error ? err.message : 'Failed to process document');
      setDocument('');
      setAnalyzedContent(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Document Risk Analyzer</title>
        <meta name="description" content="Analyze documents for potential risks using AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1 className="title">Document Risk Analyzer</h1>
        
        <div className="upload-section">
          <label htmlFor="document-upload" className="file-input-label">
            Upload Document
            <input
              id="document-upload"
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="file-input"
            />
          </label>
          
          <div className="supported-formats">
            <p>Supported formats:</p>
            <ul>
              {supportedFormats.map((format, index) => (
                <li key={index}>
                  <strong>{format.type}:</strong> {format.extensions}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading">Analyzing document...</div>
        ) : error ? (
          <div className="error-state">
            <p>Error: {error}</p>
            <button 
              className="retry-button"
              onClick={() => setError(null)}
            >
              Try Again
            </button>
          </div>
        ) : analyzedContent ? (
          <DocumentViewer 
            originalFile={originalFile}
            originalText={document} 
            analysisResults={analyzedContent} 
          />
        ) : (
          <div className="empty-state">
            Upload a document to analyze potential risks and receive suggestions
          </div>
        )}
      </main>
    </div>
  );
}
