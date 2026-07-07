'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Ticket as TicketIcon, 
  Clock, 
  MessageSquare, 
  Sparkles,
  CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Ticket {
  id: string;
  conversation_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  created_at: string;
  conversations?: {
    customer_email: string;
    customer_name: string;
  };
}

interface Message {
  id: string;
  sender: 'customer' | 'ai' | 'agent';
  content: string;
  created_at: string;
}

export default function TicketsDashboard() {
  const { company, showToast } = useApp();
  
  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const loadTickets = async () => {
    if (!company) return;
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/tickets?company_id=${company.id}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (priorityFilter !== 'all') url += `&priority=${priorityFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      } else {
        showToast('Failed to load tickets', 'error');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      showToast('Connection to server failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: string) => {
    setLoadingDetails(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
        setMessages(data.messages || []);
      } else {
        showToast('Failed to load ticket details', 'error');
      }
    } catch (err) {
      console.error('Error loading ticket details:', err);
      showToast('Could not load ticket chat history', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [company, statusFilter, priorityFilter]);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update ticket in main list and active pane
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: data.ticket.status } : t));
        setSelectedTicket(prev => prev ? { ...prev, status: data.ticket.status } : null);
        
        showToast(`Ticket status marked as ${newStatus}`, 'success');

        if (newStatus === 'resolved') {
          // Celebrate resolution!
          confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#10B981', '#3B82F6', '#8B5CF6']
          });
        }
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      showToast('Server update error', 'error');
    }
  };

  const updateTicketPriority = async (ticketId: string, newPriority: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority: data.ticket.priority } : t));
        setSelectedTicket(prev => prev ? { ...prev, priority: data.ticket.priority } : null);
        showToast(`Ticket priority updated to ${newPriority}`, 'success');
      } else {
        showToast('Failed to update priority', 'error');
      }
    } catch (err) {
      console.error('Failed to update ticket priority:', err);
      showToast('Server priority update error', 'error');
    }
  };

  const priorityColors = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    low: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  };

  const statusColors = {
    open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    resolved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Escalation Center</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Support Tickets</h1>
        <p className="text-sm text-gray-400">Review human support escalations triggered automatically by low-confidence AI matches.</p>
      </div>

      {/* Main Dual Pane Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[calc(100vh-14rem)]">
        
        {/* Left Pane: Ticket List */}
        <div className="lg:col-span-2 glass-card rounded-2xl flex flex-col overflow-hidden h-full">
          {/* Filters Bar */}
          <div className="p-4 border-b border-white/5 bg-black/20 flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all" className="bg-[#0f121e]">All Statuses</option>
              <option value="open" className="bg-[#0f121e]">Open</option>
              <option value="pending" className="bg-[#0f121e]">Pending</option>
              <option value="resolved" className="bg-[#0f121e]">Resolved</option>
              <option value="closed" className="bg-[#0f121e]">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all" className="bg-[#0f121e]">All Priorities</option>
              <option value="critical" className="bg-[#0f121e]">Critical</option>
              <option value="high" className="bg-[#0f121e]">High</option>
              <option value="medium" className="bg-[#0f121e]">Medium</option>
              <option value="low" className="bg-[#0f121e]">Low</option>
            </select>
          </div>

          {/* List Scroll Feed */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {loading ? (
              <div className="space-y-3 p-2 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 rounded-xl bg-white/5" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500">No matching escalated tickets found.</div>
            ) : (
              tickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => loadTicketDetails(ticket.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-violet-600/10 border-violet-500/30 text-white' 
                        : 'bg-transparent border-transparent hover:bg-white/5 text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <h4 className="font-bold text-sm truncate max-w-[190px]">{ticket.title}</h4>
                      <span className={`text-[8px] px-1.5 py-0.5 border rounded-full uppercase font-bold tracking-wider ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-1">{ticket.description}</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
                      <span className="truncate">{ticket.conversations?.customer_email || 'No customer linked'}</span>
                      <span className={`px-1.5 py-0.5 rounded border uppercase text-[8px] font-bold ${statusColors[ticket.status]}`}>{ticket.status}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Ticket Detail Workspace */}
        <div className="lg:col-span-3 glass-card rounded-2xl flex flex-col overflow-hidden h-full">
          {loadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
              <span className="text-xs text-gray-500">Loading ticket details...</span>
            </div>
          ) : selectedTicket ? (
            <>
              {/* Workspace Header */}

              <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                <div className="min-w-0">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Currently Reviewing Ticket</span>
                  <h3 className="font-bold text-white text-md truncate pr-4">{selectedTicket.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status Toggle Buttons */}
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                    <button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolve Ticket</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'open')}
                      className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:border-violet-500/30 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      <span>Reopen Ticket</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Detail Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Meta Panel Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Customer Email</span>
                    <span className="text-sm font-semibold text-white truncate block mt-0.5">{selectedTicket.conversations?.customer_email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Update Priority</span>
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => updateTicketPriority(selectedTicket.id, e.target.value)}
                      className="text-xs bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-violet-400 focus:outline-none focus:border-violet-500 mt-1 cursor-pointer font-bold capitalize"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Operational Status</span>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full font-bold uppercase tracking-wider inline-block mt-1 ${statusColors[selectedTicket.status]}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* Ticket Description */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Escalation Context / Diagnostics</span>
                  <p className="text-xs text-gray-300 leading-relaxed bg-black/40 border border-white/5 rounded-xl p-4 whitespace-pre-line font-mono">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Linked Chat History */}
                <div className="space-y-4">
                  <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-violet-400" />
                    <span>Customer Chat Log (Grounded conversation)</span>
                  </span>

                  <div className="border border-white/5 rounded-xl bg-black/20 p-4 space-y-4 max-h-60 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="text-center py-4 text-xs text-gray-500">No chat history logged for this ticket.</div>
                    ) : (
                      messages.map((m) => {
                        const isAI = m.sender === 'ai';
                        const isCustomer = m.sender === 'customer';
                        return (
                          <div key={m.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold uppercase ${isCustomer ? 'text-blue-400' : 'text-violet-400'}`}>
                                {isCustomer ? 'Customer' : isAI ? 'SupportAI' : 'Agent'}
                              </span>
                              <span className="text-[8px] text-gray-600">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-gray-300 pl-1 leading-relaxed border-l border-white/10 ml-0.5">{m.content}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                <TicketIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Select a support ticket</h4>
                <p className="text-xs text-gray-400 mt-1">Pick an automated escalation item from the left pane to audit AI logs, adjust priorities, or resolve issues.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
