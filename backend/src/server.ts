import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

// Routers
import chatRouter from './routes/chat.js';
import knowledgeRouter from './routes/knowledge.js';
import ticketsRouter from './routes/tickets.js';
import analyticsRouter from './routes/analytics.js';
import { generateEmbeddings } from './services/ragService.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Mounting
app.use('/api/chat', chatRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/analytics', analyticsRouter);

import { mockDb } from './config/mockDb.js';

// health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * POST /api/bootstrap
 * Bootstraps a demo company and profile for sandbox testing
 */
/**
 * POST /api/bootstrap
 * Bootstraps a demo company and profile for sandbox testing across all 5 industries
 */
app.post('/api/bootstrap', async (req: Request, res: Response): Promise<void> => {
  try {
    // Quick check if Supabase is reachable before looping over hundreds of records
    const { error: pingError } = await supabase.from('companies').select('id').limit(1);
    if (pingError) throw pingError;

    // 1. Seed all 5 companies if they don't exist
    for (const comp of mockDb.companies) {
      const { data: existingComp } = await supabase
        .from('companies')
        .select('*')
        .eq('id', comp.id)
        .maybeSingle();

      if (!existingComp) {
        const { error: insErr } = await supabase
          .from('companies')
          .insert({
            id: comp.id,
            name: comp.name,
            domain: comp.domain,
            brand_colors: comp.brand_colors,
            ai_tone: comp.ai_tone,
            business_hours: comp.business_hours,
            support_email: comp.support_email,
            industry: comp.industry
          });
        if (insErr) {
          console.error(`Failed to seed company ${comp.name}:`, insErr.message);
        } else {
          console.log(`Seeded company: ${comp.name}`);
        }
      }
    }

    // 2. Seed all mock users
    for (const u of mockDb.users) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (!existingUser) {
        const { error: insErr } = await supabase
          .from('users')
          .insert({
            id: u.id,
            clerk_id: u.clerk_id,
            email: u.email,
            role: u.role,
            company_id: u.company_id,
            name: u.name,
            avatar_url: u.avatar_url
          });
        if (insErr) {
          console.error(`Failed to seed user ${u.name}:`, insErr.message);
        } else {
          console.log(`Seeded user: ${u.name}`);
        }
      }
    }

    // 3. Seed knowledge documents & chunks
    for (const doc of mockDb.knowledge_documents) {
      const { data: existingDoc } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', doc.id)
        .maybeSingle();

      if (!existingDoc) {
        const { error: insErr } = await supabase
          .from('knowledge_documents')
          .insert({
            id: doc.id,
            company_id: doc.company_id,
            filename: doc.filename,
            file_url: doc.file_url,
            file_type: doc.file_type,
            char_count: doc.char_count,
            industry: doc.industry,
            category: doc.category
          });
        if (insErr) {
          console.error(`Failed to seed document ${doc.filename}:`, insErr.message);
        } else {
          console.log(`Seeded document: ${doc.filename}`);
          
          // Seed corresponding chunks
          const matchingChunks = mockDb.document_chunks.filter(c => c.document_id === doc.id);
          const chunkTexts = matchingChunks.map(c => c.content);
          let embeddings: number[][] = [];
          try {
            if (chunkTexts.length > 0) {
              embeddings = await generateEmbeddings(chunkTexts);
              console.log(`Generated ${embeddings.length} embeddings for doc ${doc.filename}`);
            }
          } catch (e: any) {
            console.error(`Failed to generate embeddings for doc ${doc.filename}:`, e.message || e);
          }

          for (let i = 0; i < matchingChunks.length; i++) {
            const chunk = matchingChunks[i];
            const embedding = embeddings[i] || null;
            const { error: chunkErr } = await supabase
              .from('document_chunks')
              .insert({
                id: chunk.id,
                document_id: chunk.document_id,
                content: chunk.content,
                embedding,
                metadata: { company_id: doc.company_id, filename: doc.filename, industry: doc.industry, category: doc.category }
              });
            if (chunkErr) console.error(`Failed to seed chunk for doc ${doc.filename}:`, chunkErr.message);
          }
        }
      }
    }

    // 4. Seed conversations & messages
    for (const conv of mockDb.conversations) {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conv.id)
        .maybeSingle();

      if (!existingConv) {
        const { error: insErr } = await supabase
          .from('conversations')
          .insert({
            id: conv.id,
            company_id: conv.company_id,
            customer_email: conv.customer_email,
            customer_name: conv.customer_name,
            status: conv.status,
            industry: conv.industry
          });
        if (insErr) {
          console.error(`Failed to seed conversation ${conv.id}:`, insErr.message);
        } else {
          console.log(`Seeded conversation: ${conv.id}`);
          
          // Seed corresponding messages
          const matchingMsgs = mockDb.messages.filter(m => m.conversation_id === conv.id);
          for (const msg of matchingMsgs) {
            const { error: msgErr } = await supabase
              .from('messages')
              .insert({
                id: msg.id,
                conversation_id: msg.conversation_id,
                sender: msg.sender,
                content: msg.content,
                sentiment: msg.sentiment
              });
            if (msgErr) console.error(`Failed to seed message ${msg.id}:`, msgErr.message);
          }
        }
      }
    }

    // 5. Seed tickets
    for (const ticket of mockDb.tickets) {
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticket.id)
        .maybeSingle();

      if (!existingTicket) {
        const { error: insErr } = await supabase
          .from('tickets')
          .insert({
            id: ticket.id,
            conversation_id: ticket.conversation_id,
            company_id: ticket.company_id,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            assigned_to_user_id: ticket.assigned_to_user_id
          });
        if (insErr) console.error(`Failed to seed ticket ${ticket.title}:`, insErr.message);
      }
    }

    const { data: seededComp } = await supabase
      .from('companies')
      .select('*')
      .eq('id', mockDb.companies[0].id)
      .single();

    const { data: seededUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', mockDb.users[0].id)
      .single();

    res.json({
      message: 'Bootstrap complete',
      company: seededComp || mockDb.companies[0],
      user: seededUser || mockDb.users[0]
    });
  } catch (error: any) {
    console.error('Error bootstrapping sandbox:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/companies/:id
 * Updates company profile configurations (AI tone, branding colors, business hours, industry)
 */
app.patch('/api/companies/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, domain, ai_tone, brand_colors, business_hours, support_email, industry } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (domain) updates.domain = domain;
    if (ai_tone) updates.ai_tone = ai_tone;
    if (brand_colors) updates.brand_colors = brand_colors;
    if (business_hours) updates.business_hours = business_hours;
    if (support_email) updates.support_email = support_email;
    if (industry) updates.industry = industry;

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Company settings updated successfully', company: data });
  } catch (error: any) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`SupportAI Backend server is running on http://localhost:${port}`);
  console.log('Ensure you run POST http://localhost:3001/api/bootstrap to seed the demo parameters if using a blank database.');
});
