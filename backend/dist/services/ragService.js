import { supabase } from '../config/supabase.js';
import { ai, isGeminiConfigured, GEMINI_EMBEDDING_MODEL, GEMINI_EMBEDDING_DIMENSIONS } from '../config/gemini.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
// Industry Prompt Templates
export const INDUSTRY_PROMPT_TEMPLATES = {
    "Legal": `You are a virtual Legal Assistant for "{companyName}".
Your personality and tone is: "{aiTone}".
The business contact email is: "{supportEmail}".
The consultation hours are: {hours}.

YOUR CAPABILITIES & SCOPE:
- Legal Assistant duties
- Contract FAQs
- Consultation booking
- Legal policies

IMPORTANT CONSTRAINTS:
1. Answer the query using ONLY the provided Knowledge Base Sources.
2. If the answer cannot be found in the provided sources, or is ambiguous, reply EXACTLY with: "I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further."
3. Do not assume or extrapolate. Never provide unauthorized legal advice. Never speculate.
4. When you answer, cite the Source numbers you used at the end of sentences where appropriate, using [Source X] format.

---
KNOWLEDGE BASE SOURCES:
{contextString}

---
Customer: {customerQuery}
Assistant:`,
    "Manufacturing": `You are a virtual Manufacturing Assistant for "{companyName}".
Your personality and tone is: "{aiTone}".
The business contact email is: "{supportEmail}".
The operational hours are: {hours}.

YOUR CAPABILITIES & SCOPE:
- Product manuals
- Standard Operating Procedures (SOPs)
- Machine maintenance info
- Inventory support & specs
- Warranty query handling

IMPORTANT CONSTRAINTS:
1. Answer the query using ONLY the provided Knowledge Base Sources.
2. If the answer cannot be found in the provided sources, or is ambiguous, reply EXACTLY with: "I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further."
3. Do not assume or extrapolate. Never hallucinate procedures or safety instructions.
4. When you answer, cite the Source numbers you used at the end of sentences where appropriate, using [Source X] format.

---
KNOWLEDGE BASE SOURCES:
{contextString}

---
Customer: {customerQuery}
Assistant:`,
    "Sales": `You are a virtual Sales Assistant for "{companyName}".
Your personality and tone is: "{aiTone}".
The business contact email is: "{supportEmail}".
The sales operation hours are: {hours}.

YOUR CAPABILITIES & SCOPE:
- Lead qualification
- Product recommendations
- Pricing details
- Quote generation assistance
- CRM & account support

IMPORTANT CONSTRAINTS:
1. Answer the query using ONLY the provided Knowledge Base Sources.
2. If the answer cannot be found in the provided sources, or is ambiguous, reply EXACTLY with: "I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further."
3. Do not assume or extrapolate. Focus on converting leads and providing accurate price quotes.
4. When you answer, cite the Source numbers you used at the end of sentences where appropriate, using [Source X] format.

---
KNOWLEDGE BASE SOURCES:
{contextString}

---
Customer: {customerQuery}
Assistant:`,
    "Customer Support": `You are a virtual Customer Support Assistant for "{companyName}".
Your personality and tone is: "{aiTone}".
The business contact email is: "{supportEmail}".
The support hours are: {hours}.

YOUR CAPABILITIES & SCOPE:
- General FAQs
- Refunds processing support
- Customer complaints handling
- Order tracking assistance
- Escalate to human agents

IMPORTANT CONSTRAINTS:
1. Answer the query using ONLY the provided Knowledge Base Sources.
2. If the answer cannot be found in the provided sources, or is ambiguous, reply EXACTLY with: "I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further."
3. Do not assume or extrapolate. Never commit to refunds or actions not supported by the sources.
4. When you answer, cite the Source numbers you used at the end of sentences where appropriate, using [Source X] format.

---
KNOWLEDGE BASE SOURCES:
{contextString}

---
Customer: {customerQuery}
Assistant:`,
    "Retail": `You are a virtual Retail Assistant for "{companyName}".
Your personality and tone is: "{aiTone}".
The business contact email is: "{supportEmail}".
The retail hours are: {hours}.

YOUR CAPABILITIES & SCOPE:
- Product search & catalog lookup
- Stock availability checking
- Shipping info
- Returns handling
- Loyalty programs & membership

IMPORTANT CONSTRAINTS:
1. Answer the query using ONLY the provided Knowledge Base Sources.
2. If the answer cannot be found in the provided sources, or is ambiguous, reply EXACTLY with: "I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further."
3. Do not assume or extrapolate. Never guess stock levels.
4. When you answer, cite the Source numbers you used at the end of sentences where appropriate, using [Source X] format.

---
KNOWLEDGE BASE SOURCES:
{contextString}

---
Customer: {customerQuery}
Assistant:`
};
// Chunking function: splits text into overlapping chunks
export function chunkText(text, chunkSize = 800, overlap = 100) {
    if (!text || text.trim() === '')
        return [];
    const chunks = [];
    let currentIndex = 0;
    while (currentIndex < text.length) {
        let end = currentIndex + chunkSize;
        if (end < text.length) {
            const lastSpace = text.lastIndexOf(' ', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const boundary = Math.max(lastSpace, lastNewline);
            if (boundary > currentIndex + chunkSize - 150) {
                end = boundary + 1;
            }
        }
        else {
            end = text.length;
        }
        const chunk = text.slice(currentIndex, end).trim();
        if (chunk.length > 10) {
            chunks.push(chunk);
        }
        currentIndex = end - overlap;
        if (currentIndex >= text.length || end >= text.length) {
            break;
        }
    }
    return chunks;
}
// File parsing function based on MIME/Extension
export async function parseDocument(buffer, fileTypeOrName) {
    const normalizedType = fileTypeOrName.toLowerCase();
    try {
        if (normalizedType.includes('pdf')) {
            const data = await pdfParse(buffer);
            return data.text || '';
        }
        else if (normalizedType.includes('word') || normalizedType.includes('docx') || normalizedType.includes('officedocument')) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value || '';
        }
        else {
            return buffer.toString('utf-8');
        }
    }
    catch (error) {
        console.error(`[RAG Service] Error parsing file:`, error);
        throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// Generate single embedding vector
export async function getEmbedding(text) {
    if (!isGeminiConfigured()) {
        return generateMockEmbedding(text);
    }
    try {
        const response = await ai.models.embedContent({
            model: GEMINI_EMBEDDING_MODEL,
            contents: [text],
            config: { outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS }
        });
        if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
            return response.embeddings[0].values;
        }
        throw new Error('No embedding values returned');
    }
    catch (error) {
        console.error('[RAG Service] Single embedding failed, falling back to mock:', error);
        return generateMockEmbedding(text);
    }
}
// Generate batch embeddings for multiple chunks
export async function generateEmbeddings(chunks) {
    if (chunks.length === 0)
        return [];
    if (!isGeminiConfigured()) {
        return chunks.map(c => generateMockEmbedding(c));
    }
    try {
        const embeddings = [];
        const batchSize = 20; // Safe batch size limit
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const response = await ai.models.embedContent({
                model: GEMINI_EMBEDDING_MODEL,
                contents: batch,
                config: { outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS }
            });
            if (response.embeddings) {
                response.embeddings.forEach((e) => {
                    if (e.values) {
                        embeddings.push(e.values);
                    }
                });
            }
        }
        if (embeddings.length === chunks.length) {
            return embeddings;
        }
        // Gaps fallback
        while (embeddings.length < chunks.length) {
            embeddings.push(generateMockEmbedding(chunks[embeddings.length]));
        }
        return embeddings;
    }
    catch (error) {
        console.error('[RAG Service] Batch embedding generation failed, using mock fallbacks:', error);
        return chunks.map(c => generateMockEmbedding(c));
    }
}
// Deterministic mock embedding generator
function generateMockEmbedding(text) {
    const vector = new Array(768).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    for (let i = 0; i < 768; i++) {
        const scale = Math.sin(hash + i) * 10000;
        vector[i] = scale - Math.floor(scale) * 2 - 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let i = 0; i < 768; i++) {
            vector[i] /= magnitude;
        }
    }
    return vector;
}
// Store document chunks and embeddings in database
export async function storeDocumentInDb(companyId, filename, fileUrl, fileType, parsedText, chunks, embeddings, industry, category) {
    const { data: doc, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
        company_id: companyId,
        filename,
        file_url: fileUrl,
        file_type: fileType,
        char_count: parsedText.length,
        industry,
        category
    })
        .select('id')
        .single();
    if (docError || !doc) {
        throw new Error('Failed to store document metadata: ' + docError?.message);
    }
    const docId = doc.id;
    const chunkRows = chunks.map((chunk, index) => ({
        document_id: docId,
        content: chunk,
        embedding: embeddings[index] || null,
        metadata: { company_id: companyId, filename, industry, category }
    }));
    const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert(chunkRows);
    if (chunkError) {
        throw new Error('Failed to store document chunks: ' + chunkError.message);
    }
    return docId;
}
// Perform pgvector similarity search
export async function similaritySearch(query, companyId, limit = 5, threshold = 0.3) {
    try {
        // 1. Fetch company's industry to filter RAG scope
        const { data: company } = await supabase
            .from('companies')
            .select('industry')
            .eq('id', companyId)
            .maybeSingle();
        const industry = company?.industry || 'Customer Support';
        const queryEmbedding = await getEmbedding(query);
        const { data, error } = await supabase.rpc('match_document_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: limit,
            p_company_id: companyId,
            p_industry: industry
        });
        if (error) {
            console.error('[RAG Service] match_document_chunks failed:', error);
            throw error;
        }
        return data || [];
    }
    catch (error) {
        console.error('[RAG Service] Error in similaritySearch:', error);
        throw error;
    }
}
// Generate grounded answers referencing retrieved chunks
export async function generateGroundedAnswer(content, retrievedChunks, companyId, companyName, aiTone) {
    const { data: company } = await supabase
        .from('companies')
        .select('support_email, business_hours')
        .eq('id', companyId)
        .maybeSingle();
    const supportEmail = company?.support_email || 'support@example.com';
    const hours = company?.business_hours ? JSON.stringify(company.business_hours) : '9 AM - 5 PM';
    let answer = '';
    let confidence = 1.0;
    let shouldCreateTicket = false;
    const citations = [];
    if (retrievedChunks.length === 0) {
        return {
            answer: "I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further.",
            confidence: 0.0,
            shouldCreateTicket: true,
            citations: []
        };
    }
    if (isGeminiConfigured()) {
        try {
            const contextString = retrievedChunks
                .map((chunk, idx) => `[Source ${idx + 1} - File: ${chunk.filename}] ${chunk.content}`)
                .join('\n\n');
            const { data: compDetail } = await supabase
                .from('companies')
                .select('industry')
                .eq('id', companyId)
                .maybeSingle();
            const industry = compDetail?.industry || 'Customer Support';
            const template = INDUSTRY_PROMPT_TEMPLATES[industry] || INDUSTRY_PROMPT_TEMPLATES['Customer Support'];
            const systemPrompt = template
                .replace(/{companyName}/g, companyName)
                .replace(/{aiTone}/g, aiTone)
                .replace(/{supportEmail}/g, supportEmail)
                .replace(/{hours}/g, hours)
                .replace(/{contextString}/g, contextString)
                .replace(/{customerQuery}/g, content);
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
            });
            answer = response.text?.trim() || '';
            if (answer.includes("don't have that information") ||
                answer.includes("knowledge base") ||
                answer.includes("escalate this")) {
                shouldCreateTicket = true;
                confidence = 0.1;
            }
            retrievedChunks.forEach((chunk, idx) => {
                if (answer.includes(`[Source ${idx + 1}]`)) {
                    citations.push(chunk);
                }
            });
            if (citations.length === 0 && retrievedChunks.length > 0 && !shouldCreateTicket) {
                citations.push(retrievedChunks[0]);
            }
        }
        catch (error) {
            console.error('[AI Service] Gemini grounded answer generation failed:', error);
            shouldCreateTicket = true;
            confidence = 0.0;
            answer = `I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further.`;
        }
    }
    else {
        // Gemini not configured - Mock rules
        const lower = content.toLowerCase();
        if (lower.includes('hours') || lower.includes('time') || lower.includes('open')) {
            answer = `Our standard support hours for ${companyName} are Monday through Friday, 9:00 AM to 5:00 PM EST. If you need urgent assistance outside these hours, please email us at ${supportEmail}. [Source 1]`;
            citations.push(retrievedChunks[0]);
        }
        else {
            answer = `I'm sorry, I don't have that information in my knowledge base. I will escalate this to a support representative to help you further.`;
            shouldCreateTicket = true;
            confidence = 0.0;
        }
    }
    return {
        answer,
        confidence,
        shouldCreateTicket,
        citations
    };
}
