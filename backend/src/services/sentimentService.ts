import { ai, isGeminiConfigured } from '../config/gemini.js';

export type SentimentType = 'happy' | 'neutral' | 'angry' | 'frustrated' | 'urgent';

// Lexical fallback for sentiment analysis if Gemini is not configured/fails
export function analyzeSentimentLexical(text: string): SentimentType {
  const lower = text.toLowerCase();
  
  // Urgent words
  if (
    lower.includes('urgent') ||
    lower.includes('asap') ||
    lower.includes('immediately') ||
    lower.includes('right now') ||
    lower.includes('emergency') ||
    lower.includes('broken') ||
    lower.includes('crash')
  ) {
    return 'urgent';
  }
  
  // Angry words
  if (
    lower.includes('hate') ||
    lower.includes('angry') ||
    lower.includes('terrible') ||
    lower.includes('awful') ||
    lower.includes('worst') ||
    lower.includes('sucks') ||
    lower.includes('stupid')
  ) {
    return 'angry';
  }
  
  // Frustrated words
  if (
    lower.includes('annoyed') ||
    lower.includes('frustrated') ||
    lower.includes('confused') ||
    lower.includes('useless') ||
    lower.includes('waste of time') ||
    lower.includes('cannot figure out') ||
    lower.includes('why doesn\'t')
  ) {
    return 'frustrated';
  }
  
  // Happy words
  if (
    lower.includes('thank') ||
    lower.includes('love') ||
    lower.includes('awesome') ||
    lower.includes('great') ||
    lower.includes('happy') ||
    lower.includes('glad') ||
    lower.includes('amazing') ||
    lower.includes('perfect')
  ) {
    return 'happy';
  }
  
  return 'neutral';
}

export async function analyzeSentiment(text: string): Promise<SentimentType> {
  if (!isGeminiConfigured()) {
    return analyzeSentimentLexical(text);
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the sentiment of the following customer support message. Classify it into exactly one of these categories: 'happy', 'neutral', 'angry', 'frustrated', 'urgent'.
      Return ONLY the lowercased word corresponding to the category (e.g. "neutral") and nothing else.
      
      Message: "${text}"`,
    });
    
    const sentimentStr = response.text?.trim().toLowerCase() || '';
    
    if (['happy', 'neutral', 'angry', 'frustrated', 'urgent'].includes(sentimentStr)) {
      return sentimentStr as SentimentType;
    }
    
    return analyzeSentimentLexical(text);
  } catch (error) {
    console.error('[Sentiment Service] Gemini sentiment analysis failed, using lexical fallback:', error);
    return analyzeSentimentLexical(text);
  }
}
