import * as mammoth from 'mammoth';

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  // Plain text files
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return readTextFile(file);
  }
  
  // PDF files
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return extractTextFromPdf(file);
  }
  
  // Word documents
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')) {
    return extractTextFromDocx(file);
  }
  
  if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
    return extractTextFromDoc(file);
  }
  
  throw new Error(`Unsupported file type: ${fileType || fileName}`);
}

// Read plain text files
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = (e) => {
      reject(new Error('Failed to read text file with error: ' + e));
    };
    reader.readAsText(file);
  });
}

// Extract text from PDF files
async function extractTextFromPdf(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing can only be done in the browser');
  }

  try {
    // Simplified approach - send the PDF to a browser-based text extraction
    // For production, consider server-side extraction with proper PDF.js configuration
    
    // For now, we'll use a simpler approach to read potential text content
    const arrayBuffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8');
    const fileContent = textDecoder.decode(arrayBuffer);
    
    // Basic text extraction that looks for readable strings
    let extractedText = '';
    const regex = /[\x20-\x7E\n\r\t]{4,}/g; // Look for readable ASCII strings
    const matches = fileContent.match(regex);
    
    if (matches && matches.length > 0) {
      extractedText = matches.join(' ');
    }
    
    if (extractedText.length > 100) { // If we found a reasonable amount of text
      return extractedText;
    }
    
    // If we couldn't extract meaningful text, inform the user
    throw new Error('Could not extract text from PDF. Consider converting it to text first.');
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF file. Please try a plain text or Word document.');
  }
}

// Extract text from DOCX files using mammoth.js
async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  const result = await mammoth.extractRawText({
    arrayBuffer: arrayBuffer
  });
  
  return result.value;
}

// For older DOC files, we can convert to text but with less formatting fidelity
async function extractTextFromDoc(file: File): Promise<string> {
  // For DOC files, we'll use a simple extraction approach
  // Note: This is a simplified approach, production code might want to use a server-side conversion
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // This is a simplified approach - DOC parsing is complex
        // For production, you might want to use a server-side conversion service
        const arrayBuffer = e.target?.result as ArrayBuffer;
        let text = '';
        
        // Extract text by looking for readable strings in the binary data
        const uint8Array = new Uint8Array(arrayBuffer);
        let currentString = '';
        
        for (let i = 0; i < uint8Array.length; i++) {
          const charCode = uint8Array[i];
          if (charCode >= 32 && charCode <= 126) { // ASCII printable characters
            currentString += String.fromCharCode(charCode);
          } else if (currentString.length > 20) { // Minimum string length to consider
            text += currentString + ' ';
            currentString = '';
          } else {
            currentString = '';
          }
        }
        
        if (text.trim().length > 0) {
          resolve(text);
        } else {
          throw new Error('No readable text found in DOC file');
        }
      } catch (error) {
        reject(new Error('Failed to parse DOC file with error: ' + error));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read DOC file'));
    };
    reader.readAsArrayBuffer(file);
  });
}
