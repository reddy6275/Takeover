import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { parseDocument, indexDocument } from '../services/ragService.js';
import { processCustomerMessage } from '../services/aiService.js';
export const apiRouter = Router();
// Setup Multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // limit 10MB
});
// Helper: Ensure at least one company exists and return it
async function getOrCreateDefaultCompany() {
    const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
    if (error) {
        console.error('Error fetching companies:', error.message);
        throw error;
    }
    if (companies && companies.length > 0) {
        return companies[0];
    }
    // Create a default company
    const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
        name: 'Acme Corp',
        domain: 'acme.com',
        brand_colors: { primary: '#8B5CF6', secondary: '#3B82F6', background: '#0B0F19' },
        ai_tone: 'helpful',
        business_hours: { weekday: '9 AM - 5 PM', weekend: 'Closed' },
        support_email: 'support@acme.com'
    })
        .select()
        .single();
    if (createError) {
        console.error('Error creating default company:', createError.message);
        throw createError;
    }
    return newCompany;
}
// ----------------------------------------------------
// Company Profiles Endpoints
// ----------------------------------------------------
apiRouter.get('/company', async (req, res) => {
    try {
        const company = await getOrCreateDefaultCompany();
        res.json(company);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve company settings' });
    }
});
apiRouter.post('/company', async (req, res) => {
    try {
        const { id, name, domain, brand_colors, ai_tone, business_hours, support_email } = req.body;
        let targetId = id;
        if (!targetId) {
            const defaultCompany = await getOrCreateDefaultCompany();
            targetId = defaultCompany.id;
        }
        const { data, error } = await supabase
            .from('companies')
            .update({
            name,
            domain,
            brand_colors,
            ai_tone,
            business_hours,
            support_email
        })
            .eq('id', targetId)
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ----------------------------------------------------
// Knowledge Management Endpoints
// ----------------------------------------------------
apiRouter.get('/knowledge/documents', async (req, res) => {
    try {
        const company = await getOrCreateDefaultCompany();
        const { data, error } = await supabase
            .from('knowledge_documents')
            .select('*')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
apiRouter.post('/knowledge/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }
        const company = await getOrCreateDefaultCompany();
        const file = req.file;
        const filename = file.originalname;
        const fileType = file.mimetype;
        console.log(`[Backend API] File received: "${filename}" (${fileType}), size: ${file.size} bytes`);
        // 1. Parse content of file to plain text
        const textContent = await parseDocument(fileType, file.buffer);
        if (!textContent || textContent.trim() === '') {
            res.status(400).json({ error: 'File appears to be empty or could not be parsed.' });
            return;
        }
        // 2. Upload document representation into Supabase Storage / mock url
        // For this MVP hackathon setup, we can use a mock URL or real Supabase Storage if configured.
        // We will save to a base64 or mock URL path.
        const mockFileUrl = `https://supabase.storage/v1/object/public/knowledge/${company.id}/${Date.now()}-${filename}`;
        // 3. Create document record in database
        const { data: doc, error: docError } = await supabase
            .from('knowledge_documents')
            .insert({
            company_id: company.id,
            filename,
            file_url: mockFileUrl,
            file_type: fileType,
            char_count: textContent.length
        })
            .select()
            .single();
        if (docError)
            throw docError;
        // 4. Index chunks in background or wait for it
        await indexDocument(company.id, doc.id, filename, textContent);
        // Log analytics event
        await supabase.from('analytics_events').insert({
            company_id: company.id,
            event_type: 'document_uploaded',
            metadata: { document_id: doc.id, filename, char_count: textContent.length }
        });
        res.status(201).json({
            message: 'Document successfully parsed and indexed.',
            document: doc
        });
    }
    catch (error) {
        console.error('[Backend API] File upload failed:', error);
        res.status(500).json({ error: error.message || 'Failed to index file.' });
    }
});
apiRouter.delete('/knowledge/documents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Cascade delete is handled by database schema definitions in Supabase
        const { error } = await supabase
            .from('knowledge_documents')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        res.json({ message: 'Document and associated vector chunks deleted successfully.' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ----------------------------------------------------
// Chat & AI Assistant Endpoints
// ----------------------------------------------------
apiRouter.get('/chat/conversations', async (req, res) => {
    try {
        const company = await getOrCreateDefaultCompany();
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
apiRouter.get('/chat/conversations/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
apiRouter.post('/chat/message', async (req, res) => {
    try {
        const { conversationId, customerEmail, customerName, content } = req.body;
        if (!content || !customerEmail) {
            res.status(400).json({ error: 'Message content and customerEmail are required.' });
            return;
        }
        const company = await getOrCreateDefaultCompany();
        // 1. Create or retrieve active conversation
        let activeConversationId = conversationId;
        if (!activeConversationId) {
            const { data: newConv, error: convError } = await supabase
                .from('conversations')
                .insert({
                company_id: company.id,
                customer_email: customerEmail,
                customer_name: customerName || customerEmail.split('@')[0],
                status: 'open'
            })
                .select()
                .single();
            if (convError)
                throw convError;
            activeConversationId = newConv.id;
            // Log event
            await supabase.from('analytics_events').insert({
                company_id: company.id,
                event_type: 'chat_started',
                metadata: { conversation_id: activeConversationId }
            });
        }
        // 2. Fetch conversation message history (to feed into LLM chat context)
        const { data: messageHistory, error: historyError } = await supabase
            .from('messages')
            .select('sender, content')
            .eq('conversation_id', activeConversationId)
            .order('created_at', { ascending: true });
        const historyFormatted = (messageHistory || []).map(m => ({
            sender: m.sender,
            content: m.content
        }));
        // 3. Process message (analyzes sentiment, queries RAG, calls Gemini, triggers escalation tickets)
        const result = await processCustomerMessage(company.id, activeConversationId, customerEmail, content, historyFormatted);
        // 4. Save Customer Message
        const { error: customerMsgError } = await supabase.from('messages').insert({
            conversation_id: activeConversationId,
            sender: 'customer',
            content: content,
            sentiment: result.sentiment
        });
        if (customerMsgError)
            throw customerMsgError;
        // 5. Save AI Message
        const { data: aiMsg, error: aiMsgError } = await supabase
            .from('messages')
            .insert({
            conversation_id: activeConversationId,
            sender: 'ai',
            content: result.responseText,
            citations: result.citations
        })
            .select()
            .single();
        if (aiMsgError)
            throw aiMsgError;
        // Log message events
        await supabase.from('analytics_events').insert({
            company_id: company.id,
            event_type: 'feedback_received', // placeholder logs
            metadata: { sentiment: result.sentiment, has_citations: result.citations.length > 0 }
        });
        res.json({
            conversationId: activeConversationId,
            userMessageSentiment: result.sentiment,
            aiResponse: aiMsg,
            isEscalated: result.isEscalated
        });
    }
    catch (error) {
        console.error('[Backend API] Error posting message:', error);
        res.status(500).json({ error: error.message });
    }
});
// ----------------------------------------------------
// Tickets Endpoints
// ----------------------------------------------------
apiRouter.get('/tickets', async (req, res) => {
    try {
        const company = await getOrCreateDefaultCompany();
        const { data, error } = await supabase
            .from('tickets')
            .select('*, conversations(customer_email, customer_name)')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
apiRouter.patch('/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, assigned_to_user_id } = req.body;
        const { data, error } = await supabase
            .from('tickets')
            .update({ status, priority, assigned_to_user_id })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ----------------------------------------------------
// Analytics Endpoints
// ----------------------------------------------------
apiRouter.get('/analytics/metrics', async (req, res) => {
    try {
        const company = await getOrCreateDefaultCompany();
        // 1. Total count of conversations
        const { count: totalConversations, error: convErr } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
        if (convErr)
            throw convErr;
        // 2. Open vs Resolved tickets
        const { data: tickets, error: ticketErr } = await supabase
            .from('tickets')
            .select('status, priority')
            .eq('company_id', company.id);
        if (ticketErr)
            throw ticketErr;
        const openTicketsCount = tickets?.filter(t => t.status === 'open' || t.status === 'pending').length || 0;
        const resolvedTicketsCount = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;
        // 3. Document count
        const { count: docCount, error: docErr } = await supabase
            .from('knowledge_documents')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
        if (docErr)
            throw docErr;
        // 4. Fetch sentiment distributions from user messages
        const { data: messages, error: msgErr } = await supabase
            .from('messages')
            .select('sentiment')
            .eq('sender', 'customer');
        if (msgErr)
            throw msgErr;
        const sentimentCounts = {
            happy: 0,
            neutral: 0,
            frustrated: 0,
            angry: 0,
            urgent: 0
        };
        messages?.forEach(m => {
            if (m.sentiment && sentimentCounts[m.sentiment] !== undefined) {
                sentimentCounts[m.sentiment]++;
            }
        });
        // 5. Volume over time data (mock/aggregation structure)
        // Gather timestamps from messages to build a quick daily volume chart
        const { data: dates, error: dateErr } = await supabase
            .from('conversations')
            .select('created_at')
            .eq('company_id', company.id);
        if (dateErr)
            throw dateErr;
        const dateCounts = {};
        dates?.forEach(d => {
            const formattedDate = new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dateCounts[formattedDate] = (dateCounts[formattedDate] || 0) + 1;
        });
        const volumeData = Object.keys(dateCounts).map(date => ({
            date,
            chats: dateCounts[date]
        })).slice(-7); // take last 7 days
        if (volumeData.length === 0) {
            // populate placeholder data for beautiful dashboards
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                volumeData.push({
                    date: formattedDate,
                    chats: Math.floor(Math.random() * 5) + 2
                });
            }
        }
        res.json({
            totalConversations: totalConversations || 0,
            openTickets: openTicketsCount,
            resolvedTickets: resolvedTicketsCount,
            documentCount: docCount || 0,
            sentimentDistribution: sentimentCounts,
            volumeData: volumeData
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
