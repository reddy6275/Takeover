import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * Helper to map user sentiment to ticket priority
 */
function mapSentimentToPriority(sentiment: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (sentiment) {
    case 'urgent': return 'critical';
    case 'angry': return 'high';
    case 'frustrated': return 'medium';
    case 'happy': return 'low';
    default: return 'medium';
  }
}

/**
 * GET /api/tickets
 * Query params: company_id, status, priority
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { company_id, status, priority } = req.query;

    if (!company_id) {
       res.status(400).json({ error: 'company_id is required' });
       return;
    }

    let queryBuilder = supabase
      .from('tickets')
      .select('*, conversations(customer_email, customer_name)')
      .eq('company_id', company_id);

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }
    if (priority) {
      queryBuilder = queryBuilder.eq('priority', priority);
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ tickets: data || [] });
  } catch (error: any) {
    console.error('Error listing tickets:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/tickets/:id
 * Fetches ticket detail along with full conversation message logs
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, conversations(*)')
      .eq('id', id)
      .maybeSingle();

    if (ticketError) throw ticketError;
    if (!ticket) {
       res.status(404).json({ error: 'Ticket not found' });
       return;
    }

    // Fetch message logs for the linked conversation
    let messages = [];
    if (ticket.conversation_id) {
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', ticket.conversation_id)
        .order('created_at', { ascending: true });

      if (msgError) console.error('Error fetching ticket messages:', msgError);
      else messages = msgData || [];
    }

    res.json({ ticket, messages });
  } catch (error: any) {
    console.error('Error fetching ticket detail:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/tickets
 * Manually create a ticket
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { company_id, conversation_id, title, description, priority, assigned_to_user_id } = req.body;
  try {
    if (!company_id || !title) {
       res.status(400).json({ error: 'company_id and title are required' });
       return;
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        company_id,
        conversation_id: conversation_id || null,
        title,
        description: description || '',
        priority: priority || 'medium',
        status: 'open',
        assigned_to_user_id: assigned_to_user_id || null
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ticket: data });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/tickets/:id
 * Updates status, priority, or assignee
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, priority, assigned_to_user_id } = req.body;
  try {
    const updates: any = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assigned_to_user_id !== undefined) updates.assigned_to_user_id = assigned_to_user_id;

    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If ticket is resolved or closed, we can optionally resolve the conversation too
    if (data.conversation_id && (status === 'resolved' || status === 'closed')) {
      await supabase
        .from('conversations')
        .update({ status: status === 'resolved' ? 'resolved' : 'closed' })
        .eq('id', data.conversation_id);
    }

    res.json({ message: 'Ticket updated successfully', ticket: data });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
