import { supabase } from '../config/supabase.js';
import { ai, isGeminiConfigured } from '../config/gemini.js';
import { retrieveContext } from './ragService.js';
import { analyzeSentiment } from './sentimentService.js';
export async function processCustomerMessage(companyId, conversationId, customerEmail, userMessage, history) {
    // 1. Analyze sentiment of user message
    const sentiment = await analyzeSentiment(userMessage);
    // 2. Fetch company configuration
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
    if (companyError) {
        console.error('[AI Service] Error fetching company data:', companyError.message);
    }
    const companyName = company?.name || 'this business';
    const aiTone = company?.ai_tone || 'helpful';
    const supportEmail = company?.support_email || 'support@example.com';
    const hours = company?.business_hours ? JSON.stringify(company.business_hours) : '9 AM to 5 PM';
    // 3. Retrieve relevant context from Knowledge Base (RAG)
    const contextChunks = await retrieveContext(companyId, userMessage, 4);
    // 4. Generate AI response using Gemini or fallback
    let responseText = '';
    let citations = [];
    let isEscalated = false;
    // Escalation triggers: angry, frustrated, or urgent sentiment
    const isNegativeSentiment = ['angry', 'frustrated', 'urgent'].includes(sentiment);
    if (isGeminiConfigured()) {
        try {
            // Build context string from retrieved chunks
            const contextString = contextChunks
                .map((chunk, idx) => `[Source ${idx + 1} - File: ${chunk.filename}] ${chunk.content}`)
                .join('\n\n');
            // Build conversation history string
            const historyString = history
                .map(h => `${h.sender === 'customer' ? 'Customer' : 'Support Agent'}: ${h.content}`)
                .join('\n');
            const systemPrompt = `You are a virtual customer support assistant for "${companyName}".
Your personality and tone is: "${aiTone}".
The business support email is: "${supportEmail}".
The business hours are: ${hours}.

IMPORTANT CONSTRAINTS:
1. Answer the customer's question using ONLY the provided Knowledge Base Sources.
2. If the answer cannot be found in the provided sources, or is ambiguous, reply EXACTLY with: "I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further."
3. Do not assume or extrapolate. Never hallucinate information not present in the sources.
4. When you answer, cite the Source numbers you used at the end of sentences where appropriate, using [Source X] format.

---
KNOWLEDGE BASE SOURCES:
${contextString || 'NO RELEVANT SOURCES FOUND IN KNOWLEDGE BASE.'}

---
CONVERSATION HISTORY:
${historyString}
Customer: ${userMessage}
Assistant:`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
            });
            responseText = response.text?.trim() || '';
            // Check if response indicates unable to answer / escalation
            if (responseText.includes("don't have that information") ||
                responseText.includes("knowledge base") ||
                responseText.includes("escalate this")) {
                isEscalated = true;
            }
            // Match which sources were referenced in the text
            contextChunks.forEach((chunk, idx) => {
                if (responseText.includes(`[Source ${idx + 1}]`)) {
                    citations.push({
                        document_id: chunk.document_id,
                        filename: chunk.filename,
                        chunk_id: chunk.id
                    });
                }
            });
            // Fallback: If AI referenced them but without tags, or if there's context and it's positive,
            // and citations list is empty, we can link them if they are relevant
            if (citations.length === 0 && contextChunks.length > 0 && !isEscalated) {
                // add top chunk as citation
                citations.push({
                    document_id: contextChunks[0].document_id,
                    filename: contextChunks[0].filename,
                    chunk_id: contextChunks[0].id
                });
            }
        }
        catch (error) {
            console.error('[AI Service] Gemini content generation failed, using mock response:', error);
            const mock = getMockResponse(userMessage, contextChunks, companyName, supportEmail);
            responseText = mock.responseText;
            citations = mock.citations;
            isEscalated = mock.isEscalated;
        }
    }
    else {
        // Gemini not configured - mock responses
        const mock = getMockResponse(userMessage, contextChunks, companyName, supportEmail);
        responseText = mock.responseText;
        citations = mock.citations;
        isEscalated = mock.isEscalated;
    }
    // If negative sentiment, force escalation regardless of response
    if (isNegativeSentiment) {
        isEscalated = true;
    }
    // 5. If escalated, auto-create a support ticket
    if (isEscalated) {
        try {
            const ticketTitle = `Escalated Chat: ${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}`;
            const ticketDesc = `Customer Email: ${customerEmail}\nSentiment: ${sentiment.toUpperCase()}\n\nLast Customer Message: "${userMessage}"\n\nAI Response: "${responseText}"`;
            const { error: ticketError } = await supabase.from('tickets').insert({
                conversation_id: conversationId,
                company_id: companyId,
                title: ticketTitle,
                description: ticketDesc,
                priority: sentiment === 'urgent' ? 'critical' : sentiment === 'angry' ? 'high' : 'medium',
                status: 'open'
            });
            if (ticketError) {
                console.error('[AI Service] Error auto-creating ticket:', ticketError.message);
            }
            else {
                console.log(`[AI Service] Support ticket auto-created for conversation ${conversationId}`);
                // Log ticket creation event
                await supabase.from('analytics_events').insert({
                    company_id: companyId,
                    event_type: 'ticket_created',
                    metadata: { conversation_id: conversationId, sentiment }
                });
            }
        }
        catch (e) {
            console.error('[AI Service] Ticket creation exception:', e);
        }
    }
    return {
        responseText,
        citations,
        sentiment,
        isEscalated
    };
}
// Generates a mock response for simulation when Gemini is unavailable
function getMockResponse(query, chunks, companyName, supportEmail) {
    const lower = query.toLowerCase();
    if (chunks.length > 0) {
        // We have search results!
        const bestChunk = chunks[0];
        const text = `Thanks for asking. Based on ${bestChunk.filename}, we found the following information: "${bestChunk.content.slice(0, 150)}..." [Source 1] If you need further help, please email ${supportEmail}.`;
        return {
            responseText: text,
            citations: [{
                    document_id: bestChunk.document_id,
                    filename: bestChunk.filename,
                    chunk_id: bestChunk.id
                }],
            isEscalated: false
        };
    }
    // Standard replies based on keywords if no documents are uploaded/matched
    if (lower.includes('hours') || lower.includes('time') || lower.includes('open')) {
        return {
            responseText: `Our standard support hours for ${companyName} are Monday through Friday, 9:00 AM to 5:00 PM EST. If you need urgent assistance outside these hours, please email us at ${supportEmail}.`,
            citations: [],
            isEscalated: false
        };
    }
    if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) {
        return {
            responseText: `Hello! I am the support employee for ${companyName}. How can I assist you today?`,
            citations: [],
            isEscalated: false
        };
    }
    // Can't answer fallback
    return {
        responseText: `I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further.`,
        citations: [],
        isEscalated: true
    };
}
