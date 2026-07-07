import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('[WARNING] GEMINI_API_KEY is not defined in the environment variables. AI operations will fail or run in mock mode.');
}

// Initialize the SDK client
export const ai = new GoogleGenAI({ apiKey: apiKey || 'MOCK_KEY' });

export const isGeminiConfigured = (): boolean => {
  return !!apiKey && apiKey !== 'MOCK_KEY';
};

// Model Constants
export const GEMINI_CHAT_MODEL = 'gemini-2.5-flash';
export const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';
export const GEMINI_EMBEDDING_DIMENSIONS = 768; // Match schema vector(768)
