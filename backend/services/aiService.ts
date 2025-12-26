import { AIReportResponse } from '../types';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { pdfToPng } from 'pdf-to-png-converter';

export const generateDocumentSummary = async (
  extractedText: string
): Promise<AIReportResponse> => {
  try {
    const prompt = `Analyze this document and return a JSON object with these fields:
- purposeAndScope: Main purpose and scope (1-2 sentences)
- summary: Comprehensive summary (3-4 sentences)
- highlights: Array of 4-6 key points
- issues: Problems or concerns identified. Format as numbered list (1-5) where each item has the issue description followed by "Basis:" with specific section references and explanations. Include line breaks between items.
- recommendations: Actionable next steps. Format as numbered list (1-5) where each item has the recommendation followed by "Basis:" with specific justification and section references. Include line breaks between items.

Document:
${extractedText.substring(0, 15000)}

IMPORTANT: For issues and recommendations, format each item as:
1. [Issue/Recommendation description]
Basis: [Detailed explanation with section references]

2. [Next item description]
Basis: [Detailed explanation with section references]

Return only valid JSON with the exact field names above.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {  
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Raw API response:', JSON.stringify(result).substring(0, 500));
    
    let content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    const aiReport: AIReportResponse = JSON.parse(content);

    // Validate response structure
    if (!aiReport.purposeAndScope || !aiReport.summary || !aiReport.highlights || !aiReport.issues || !aiReport.recommendations) {
      throw new Error('Invalid AI response structure');
    }

    return aiReport;
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate AI summary');
  }
};

export const extractTextFromBuffer = async (
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> => {
  try {
    let extractedText = '';

    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      extractedText = data.text;

      // If PDF has minimal text, it might be scanned - use OCR
      if (extractedText.trim().length < 100) {
        console.log('PDF has minimal text, applying OCR...');
        extractedText = await performOCR(buffer, mimetype);
      }
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (mimetype === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } else if (mimetype.startsWith('image/')) {
      // Handle image files with OCR
      console.log('Image file detected, applying OCR...');
      extractedText = await performOCR(buffer, mimetype);
    } else {
      throw new Error(`Unsupported file type: ${mimetype}`);
    }

    // Fallback to OCR if no text was extracted
    if (extractedText.trim().length < 50 && (mimetype === 'application/pdf' || mimetype.startsWith('image/'))) {
      console.log('Minimal text extracted, retrying with OCR...');
      extractedText = await performOCR(buffer, mimetype);
    }

    return extractedText;
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from document');
  }
};

const performOCR = async (buffer: Buffer, mimetype: string): Promise<string> => {
  try {
    let imageBuffer = buffer;

    // Convert PDF pages to images if needed
    if (mimetype === 'application/pdf') {
      console.log('Converting PDF pages to images for OCR...');
      try {
        // Convert Buffer to ArrayBuffer
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );
        
        // Convert PDF to PNG images
        const pngPages = await pdfToPng(arrayBuffer, {
          disableFontFace: false,
          useSystemFonts: false,
          viewportScale: 2.0,
        });

        if (!pngPages || pngPages.length === 0) {
          console.log('Warning: Could not convert PDF to images');
          return 'No text could be extracted from this PDF document.';
        }

        // Perform OCR on each page
        let allText = '';
        for (let i = 0; i < Math.min(pngPages.length, 10); i++) { // Limit to first 10 pages
          console.log(`Processing page ${i + 1} of ${pngPages.length}...`);
          
          // Enhance image for better OCR
          const enhancedImage = await sharp(pngPages[i].content)
            .greyscale()
            .normalize()
            .sharpen()
            .toBuffer();

          // Perform OCR on the page
          const { data: { text } } = await Tesseract.recognize(
            enhancedImage,
            'eng',
            {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  console.log(`Page ${i + 1} OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
              }
            }
          );

          if (text && text.trim().length > 0) {
            allText += `\n\n=== Page ${i + 1} ===\n${text}`;
          }
        }

        if (allText.trim().length < 10) {
          throw new Error('OCR failed to extract meaningful text from PDF');
        }

        console.log(`PDF OCR completed: extracted ${allText.length} characters from ${Math.min(pngPages.length, 10)} pages`);
        return allText;
      } catch (pdfError) {
        console.error('PDF to image conversion error:', pdfError);
        // Fallback to basic text extraction
        const pdfData = await pdfParse(buffer);
        return pdfData.text || 'No text could be extracted from this PDF document.';
      }
    }

    // Convert image to format Tesseract can handle
    if (mimetype.startsWith('image/')) {
      imageBuffer = await sharp(buffer)
        .greyscale()
        .normalize()
        .sharpen()
        .toBuffer();
    }

    console.log('Performing OCR text recognition...');
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    if (!text || text.trim().length < 10) {
      throw new Error('OCR failed to extract meaningful text from image');
    }

    console.log(`OCR completed: extracted ${text.length} characters`);
    return text;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to perform OCR on document');
  }
};
