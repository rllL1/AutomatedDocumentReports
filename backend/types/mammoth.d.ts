declare module 'mammoth' {
  export interface ConversionResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export function extractRawText(options: { buffer: Buffer }): Promise<ConversionResult>;
}
