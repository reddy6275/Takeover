import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { similaritySearch, generateGroundedAnswer } from '../services/ragService.js';
import { analyzeSentiment } from '../services/sentimentService.js';
import { ai, GEMINI_CHAT_MODEL } from '../config/gemini.js';
const router = Router();
/**
 * Helper to map user sentiment to ticket priority
 */
function mapSentimentToPriority(sentiment) {
    switch (sentiment) {
        case 'urgent': return 'critical';
        case 'angry': return 'high';
        case 'frustrated': return 'medium';
        case 'happy': return 'low';
        default: return 'medium';
    }
}
/**
 * POST /api/chat/message
 * Standard endpoint to send a message and receive a synchronous grounded AI answer
 */
router.post('/message', async (req, res) => {
    const { conversation_id, company_id, sender, content, customer_email, customer_name } = req.body;
    try {
        if (!company_id || !sender || !content) {
            res.status(400).json({ error: 'company_id, sender, and content are required' });
            return;
        }
        let activeConversationId = conversation_id;
        // 1. If conversation_id is not provided, find or create one
        if (!activeConversationId) {
            if (!customer_email) {
                res.status(400).json({ error: 'customer_email is required to start a conversation' });
                return;
            }
            // Check if open conversation already exists for this email and company
            const { data: existingConv } = await supabase
                .from('conversations')
                .select('id')
                .eq('company_id', company_id)
                .eq('customer_email', customer_email)
                .in('status', ['open', 'pending'])
                .limit(1)
                .maybeSingle();
            if (existingConv) {
                activeConversationId = existingConv.id;
            }
            else {
                // Fetch company industry
                const { data: compData } = await supabase
                    .from('companies')
                    .select('industry')
                    .eq('id', company_id)
                    .maybeSingle();
                const industry = compData?.industry || 'Customer Support';
                // Create new conversation
                const { data: newConv, error: convError } = await supabase
                    .from('conversations')
                    .insert({
                    company_id,
                    customer_email,
                    customer_name: customer_name || customer_email.split('@')[0],
                    status: 'open',
                    industry
                })
                    .select()
                    .single();
                if (convError || !newConv) {
                    throw new Error('Failed to create conversation: ' + convError?.message);
                }
                activeConversationId = newConv.id;
            }
        }
        // 2. Insert the sender's message
        const sentiment = sender === 'customer' ? await analyzeSentiment(content) : null;
        const { data: savedMessage, error: messageError } = await supabase
            .from('messages')
            .insert({
            conversation_id: activeConversationId,
            sender,
            content,
            sentiment
        })
            .select()
            .single();
        if (messageError || !savedMessage) {
            throw new Error('Failed to save message: ' + messageError?.message);
        }
        // Register analytics event for customer messages
        if (sender === 'customer') {
            const { data: compData } = await supabase
                .from('companies')
                .select('industry')
                .eq('id', company_id)
                .maybeSingle();
            const industry = compData?.industry || 'Customer Support';
            await supabase.from('analytics_events').insert({
                company_id,
                event_type: 'message_received',
                industry,
                metadata: { sentiment, conversation_id: activeConversationId }
            });
        }
        // 3. If sender is customer, run RAG pipeline to generate AI response
        if (sender === 'customer') {
            // Get company info for context
            const { data: company } = await supabase
                .from('companies')
                .select('name, ai_tone')
                .eq('id', company_id)
                .maybeSingle();
            const companyName = company?.name || 'our company';
            const aiTone = company?.ai_tone || 'helpful';
            // RAG Step A: Search similar vector chunks
            let retrievedChunks = [];
            try {
                retrievedChunks = await similaritySearch(content, company_id, 4);
            }
            catch (err) {
                console.error('Vector search failed, proceeding with empty context:', err);
            }
            // RAG Step B: Generate grounded response
            const aiResult = await generateGroundedAnswer(content, retrievedChunks, company_id, companyName, aiTone);
            // Handle ticket escalation if confidence is low
            let ticketId = null;
            if (aiResult.shouldCreateTicket) {
                // Create an escalation ticket automatically
                const priority = mapSentimentToPriority(sentiment || 'neutral');
                const { data: ticket } = await supabase
                    .from('tickets')
                    .insert({
                    conversation_id: activeConversationId,
                    company_id,
                    title: `Escalation: low AI confidence on query`,
                    description: `Auto-escalation ticket created due to low answer confidence (${Math.round((aiResult.confidence || 0) * 100)}%).\n\nCustomer query:\n"${content}"\n\nAI fallback answer:\n"${aiResult.answer}"`,
                    priority,
                    status: 'open'
                })
                    .select()
                    .single();
                ticketId = ticket?.id;
                // Update conversation status to pending
                await supabase
                    .from('conversations')
                    .update({ status: 'pending' })
                    .eq('id', activeConversationId);
                const { data: compData } = await supabase
                    .from('companies')
                    .select('industry')
                    .eq('id', company_id)
                    .maybeSingle();
                const industry = compData?.industry || 'Customer Support';
                await supabase.from('analytics_events').insert({
                    company_id,
                    event_type: 'ticket_created',
                    industry,
                    metadata: { ticket_id: ticketId, priority, conversation_id: activeConversationId }
                });
            }
            // Save AI's response
            const { data: aiMessage } = await supabase
                .from('messages')
                .insert({
                conversation_id: activeConversationId,
                sender: 'ai',
                content: aiResult.answer,
                citations: aiResult.citations.length > 0 ? aiResult.citations.map((c) => ({
                    chunk_id: c.id,
                    document_id: c.document_id,
                    filename: c.filename
                })) : null
            })
                .select()
                .single();
            res.status(201).json({
                conversation_id: activeConversationId,
                user_message: savedMessage,
                ai_message: aiMessage,
                escalated: aiResult.shouldCreateTicket,
                ticket_id: ticketId
            });
            return;
        }
        // If sender is agent/ai, just return the saved message
        res.status(201).json({
            conversation_id: activeConversationId,
            user_message: savedMessage
        });
    }
    catch (error) {
        console.error('Error in message endpoint:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// Lexical local sentiment analyzer helper
function analyzeSentimentLexicalLocal(text) {
    const lower = text.toLowerCase();
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('emergency'))
        return 'urgent';
    if (lower.includes('hate') || lower.includes('angry') || lower.includes('worst'))
        return 'angry';
    if (lower.includes('annoyed') || lower.includes('frustrated') || lower.includes('useless'))
        return 'frustrated';
    if (lower.includes('thank') || lower.includes('love') || lower.includes('great'))
        return 'happy';
    return 'neutral';
}
/**
 * POST /api/chat/stream
 * Server-Sent Events (SSE) streaming endpoint for AI answers
 */
router.post('/stream', async (req, res) => {
    const { conversation_id, company_id, content } = req.body;
    if (!company_id || !conversation_id || !content) {
        res.status(400).json({ error: 'company_id, conversation_id, and content are required' });
        return;
    }
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    let retrievedChunks = [];
    try {
        // 1. Get company details
        const { data: company } = await supabase
            .from('companies')
            .select('name, ai_tone')
            .eq('id', company_id)
            .maybeSingle();
        const companyName = company?.name || 'our company';
        const aiTone = company?.ai_tone || 'helpful';
        // 2. Perform vector search
        try {
            retrievedChunks = await similaritySearch(content, company_id, 4);
        }
        catch (err) {
            console.error('SSE vector search failed:', err);
        }
        // 3. Setup Gemini prompt for streaming (returns markdown)
        const contextBlock = retrievedChunks.length > 0
            ? retrievedChunks.map((chunk, index) => `[Source ${index} - Document: ${chunk.filename}]\n${chunk.content}`).join('\n\n---\n\n')
            : 'No knowledge context available.';
        const systemPrompt = `You are the AI customer support employee for the company "${companyName}".
Your tone should be "${aiTone}".
Your goal is to answer the customer's question using ONLY the provided knowledge context.

If you don't know the answer or the context doesn't support it, state clearly that you will escalate this to a human agent, and do not try to make up information.
Cite your sources in the text using [Source X] format.

Context:
${contextBlock}

Customer Question:
${content}`;
        // Send the citations metadata first, so the UI can render them
        const citationsMeta = retrievedChunks.map((c, index) => ({
            index,
            chunk_id: c.id,
            document_id: c.document_id,
            filename: c.filename
        }));
        res.write(`event: citations\ndata: ${JSON.stringify(citationsMeta)}\n\n`);
        // Stream text generation
        const responseStream = await ai.models.generateContentStream({
            model: GEMINI_CHAT_MODEL,
            contents: systemPrompt,
        });
        let fullAnswer = '';
        for await (const chunk of responseStream) {
            const text = chunk.text || '';
            fullAnswer += text;
            // SSE data format
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        // Analyze confidence on final answer to decide if ticket is needed
        const lowerAnswer = fullAnswer.toLowerCase();
        const indicatesEscalation = lowerAnswer.includes("don't know") ||
            lowerAnswer.includes("do not know") ||
            lowerAnswer.includes("unable to find") ||
            lowerAnswer.includes("escalate") ||
            lowerAnswer.includes("human agent") ||
            retrievedChunks.length === 0;
        let ticketId = null;
        if (indicatesEscalation) {
            // Automatically create escalation ticket
            const { data: ticket } = await supabase
                .from('tickets')
                .insert({
                conversation_id,
                company_id,
                title: 'Escalated Streamed Chat',
                description: `SSE auto-escalated ticket. Customer asked: "${content}"\n\nAI Streaming Fallback: "${fullAnswer}"`,
                priority: 'medium',
                status: 'open'
            })
                .select()
                .single();
            ticketId = ticket?.id;
            await supabase
                .from('conversations')
                .update({ status: 'pending' })
                .eq('id', conversation_id);
        }
        // Save final response in background database write
        await supabase.from('messages').insert({
            conversation_id,
            sender: 'ai',
            content: fullAnswer,
            citations: retrievedChunks.length > 0 ? retrievedChunks.map((c) => ({
                chunk_id: c.id,
                document_id: c.document_id,
                filename: c.filename
            })) : null
        });
        res.write(`event: done\ndata: ${JSON.stringify({ escalated: indicatesEscalation, ticket_id: ticketId })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error('SSE Streaming Error:', error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'Internal server error' })}\n\n`);
        res.end();
    }
});
/**
 * GET /api/chat/conversations
 * Retrieve all conversations for a company
 */
router.get('/conversations', async (req, res) => {
    try {
        const { company_id, status } = req.query;
        if (!company_id) {
            res.status(400).json({ error: 'company_id is required' });
            return;
        }
        let queryBuilder = supabase
            .from('conversations')
            .select('*, messages(content, created_at)')
            .eq('company_id', company_id);
        if (status) {
            queryBuilder = queryBuilder.eq('status', status);
        }
        const { data, error } = await queryBuilder.order('created_at', { ascending: false });
        if (error)
            throw error;
        // Format conversations with their latest message
        const formatted = (data || []).map((c) => {
            const msgs = c.messages || [];
            const latestMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
            return {
                ...c,
                messages: undefined,
                latest_message: latestMessage?.content || '',
                latest_message_time: latestMessage?.created_at || c.created_at
            };
        });
        res.json({ conversations: formatted });
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /api/chat/conversations/:id/messages
 * Fetch message history for a conversation
 */
router.get('/conversations/:id/messages', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        res.json({ messages: data || [] });
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * POST /api/chat/messages/:id/feedback
 * Log user thumbs up/down
 */
router.post('/messages/:id/feedback', async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    try {
        if (!feedback || !['thumb_up', 'thumb_down'].includes(feedback)) {
            res.status(400).json({ error: 'Valid feedback (thumb_up or thumb_down) is required' });
            return;
        }
        const { data, error } = await supabase
            .from('messages')
            .update({ feedback })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        res.json({ message: 'Feedback submitted', data });
    }
    catch (error) {
        console.error('Error writing message feedback:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
export default router;
