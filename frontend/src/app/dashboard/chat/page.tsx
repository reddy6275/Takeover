'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  BookOpen, 
  Sparkles,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

interface Citation {
  index: number;
  chunk_id: string;
  document_id: string;
  filename: string;
}

interface Message {
  id: string;
  sender: 'customer' | 'ai' | 'agent';
  content: string;
  sentiment?: string;
  citations?: any[] | null;
  feedback?: 'thumb_up' | 'thumb_down' | null;
  created_at: string;
}

interface Conversation {
  id: string;
  customer_email: string;
  customer_name: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  latest_message?: string;
}

export default function AIChatWorkspace() {
  const { company, showToast } = useApp();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active inputs
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Streaming/generating flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [selectedCitationDetails, setSelectedCitationDetails] = useState<{ filename: string; content: string } | null>(null);
  
  // Speech & Voice State
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Suggested Prompts dynamic loader
  const getSuggestedPrompts = () => {
    const industry = company?.industry || 'Customer Support';
    switch (industry) {
      case 'Legal':
        return [
          "What documents are required for property registration?",
          "Can I terminate this contract?",
          "How do I schedule a legal consultation?",
          "What is your confidentiality policy?"
        ];
      case 'Manufacturing':
        return [
          "Show maintenance schedule",
          "Find machine manual",
          "What is the SOP for safety calibration?",
          "How do I file a hardware warranty request?"
        ];
      case 'Sales':
        return [
          "Generate quotation",
          "Compare pricing plans",
          "What are the benefits of the Enterprise tier?",
          "How do I route this lead in CRM?"
        ];
      case 'Retail':
        return [
          "Is this product available?",
          "What is your return policy?",
          "Do you ship internationally?",
          "How do I join the customer loyalty program?"
        ];
      default:
        return [
          "Track my order",
          "I need a refund",
          "Show me the pricing plans available.",
          "How can I contact support directly?"
        ];
    }
  };

  const suggestedPrompts = getSuggestedPrompts();

  // Load conversations list
  const loadConversations = async () => {
    if (!company) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/chat/conversations?company_id=${company.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        showToast('Failed to load conversations list', 'error');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      showToast('Connection to chat service failed', 'error');
    }
  };

  // Load message history for active conversation
  const loadMessages = async (convId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/chat/conversations/${convId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        showToast('Failed to load chat history', 'error');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      showToast('Could not sync chat messages', 'error');
    }
  };

  useEffect(() => {
    loadConversations();
  }, [company]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
    } else {
      setMessages([]);
    }
    setStreamText('');
    setActiveCitations([]);
    setSelectedCitationDetails(null);
  }, [selectedConv]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setInputMessage(prev => prev + ' ' + transcript);
          setIsListening(false);
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error', e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast("Voice input is not supported in this browser. Please try Chrome or Edge.", "error");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string, messageId: string) => {
    if (typeof window === 'undefined') return;

    if (isSpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean citation tokens from spoken text
    const cleanText = text.replace(/\[Source \d+\]/gi, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setIsSpeakingId(null);
    };
    
    setIsSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Create new conversation
  const createConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerEmail || !company) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          sender: 'customer',
          content: 'Hello! I need some information.',
          customer_email: newCustomerEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewCustomerEmail('');
        setIsCreatingConv(false);
        showToast('Created new chat session!', 'success');
        await loadConversations();
        
        // Find and select the newly created conversation
        const found = conversations.find(c => c.id === data.conversation_id);
        if (found) {
          setSelectedConv(found);
        } else {
          // If not in state list yet, load manually
          setSelectedConv({
            id: data.conversation_id,
            customer_email: newCustomerEmail,
            customer_name: newCustomerEmail.split('@')[0],
            status: 'open'
          });
        }
      } else {
        showToast('Failed to create chat session', 'error');
      }
    } catch (err) {
      console.error('Failed to create session:', err);
      showToast('Server connection failed', 'error');
    }
  };

  // Submit new customer message (streams the AI reply)
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !company || !selectedConv) return;

    setInputMessage('');
    setIsGenerating(true);
    setStreamText('');
    setActiveCitations([]);

    // 1. Instantly append customer message in UI
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'customer',
      content: textToSend,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Call first message endpoint to save user message in DB
      const saveResponse = await fetch(`${apiUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          company_id: company.id,
          sender: 'customer',
          content: textToSend
        })
      });

      if (!saveResponse.ok) throw new Error("Could not save message");

      // Set up streaming fetch call
      const streamResponse = await fetch(`${apiUrl}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          company_id: company.id,
          content: textToSend
        })
      });

      if (!streamResponse.ok) throw new Error("Failed to initialize stream");
      if (!streamResponse.body) throw new Error("Null stream body");

      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      let fullAnswerText = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          
          // Parse Server Sent Events format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: citations')) {
              const dataStr = line.replace('event: citations\ndata: ', '').trim();
              try {
                const parsedCitations = JSON.parse(dataStr);
                setActiveCitations(parsedCitations);
              } catch (_e) {
                // Occasional text splits, ignore parsing errors
              }
            } else if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim();
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  fullAnswerText += parsed.text;
                  setStreamText(fullAnswerText);
                }
              } catch (_e) {
                // Chunk boundary split
              }
            } else if (line.startsWith('event: done')) {
              // Finalizing stream
              setIsGenerating(false);
              loadMessages(selectedConv.id);
              loadConversations();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during chat stream:', error);
      setIsGenerating(false);
      // Append an error block
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        sender: 'ai',
        content: 'An error occurred while generating a response. I will automatically escalate this and create a support ticket.',
        created_at: new Date().toISOString()
      }]);
    }
  };

  // Submit Feedback Thumbs Up / Down
  const handleFeedback = async (messageId: string, feedback: 'thumb_up' | 'thumb_down') => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/chat/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      });
      if (response.ok) {
        // Toggle in state
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m));
        showToast('Feedback submitted!', 'success');
      } else {
        showToast('Failed to save feedback', 'error');
      }
    } catch (error) {
      console.error('Feedback save error:', error);
      showToast('Error saving feedback', 'error');
    }
  };

  // Regenerate Response
  const handleRegenerate = async (lastUserMessageContent: string) => {
    if (!lastUserMessageContent) return;
    await handleSendMessage(lastUserMessageContent);
  };

  // Copy Message to clipboard
  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    showToast('Message copied to clipboard!', 'success');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Search filtered conversations
  const filteredConversations = conversations.filter(c => 
    c.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lastUserMsg = [...messages].reverse().find(m => m.sender === 'customer');

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6 relative">
      
      {/* 1. Conversations Sidebar list */}
      <div className="w-80 h-full glass-card rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-white text-md">Customer Sessions</h2>
            <button 
              onClick={() => setIsCreatingConv(!isCreatingConv)}
              className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 text-white placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isCreatingConv && (
            <form onSubmit={createConversation} className="p-3 bg-white/5 border border-violet-500/20 rounded-xl space-y-3 mb-2">
              <span className="text-xs font-semibold text-violet-400">New Customer Session</span>
              <input
                type="email"
                required
                placeholder="customer@email.com"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-violet-500 text-white"
              />
              <div className="flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsCreatingConv(false)}
                  className="px-2.5 py-1 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs text-white font-medium cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">No sessions found.</div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const statusColors = {
                open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
                pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
                resolved: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
                closed: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
              };
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 cursor-pointer flex flex-col gap-1 border ${
                    isSelected 
                      ? 'bg-violet-600/10 border-violet-500/30 text-white' 
                      : 'bg-transparent border-transparent hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-semibold text-sm truncate max-w-[130px]">{conv.customer_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${statusColors[conv.status]}`}>
                      {conv.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 truncate">{conv.customer_email}</span>
                  {conv.latest_message && (
                    <p className="text-xs text-gray-400 truncate mt-1">{conv.latest_message}</p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 h-full glass-card rounded-2xl flex flex-col overflow-hidden relative">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Conversation with {selectedConv.customer_name}</h3>
                  <span className="text-xs text-gray-400">Status: <span className="capitalize">{selectedConv.status}</span></span>
                </div>
              </div>

              {selectedConv.status === 'pending' && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Escalated to Agent Ticket</span>
                </div>
              )}
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-md">Start grounding SupportAI</h4>
                    <p className="text-xs text-gray-400 mt-1">Select a sample prompt below or type a query. SupportAI replies using only knowledge base files.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p)}
                        className="p-3 text-left bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-600/5 rounded-xl text-xs text-gray-300 transition-all cursor-pointer font-medium"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                const isAI = m.sender === 'ai';
                const isCustomer = m.sender === 'customer';
                return (
                  <div key={m.id} className={`flex gap-4 ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                    
                    {!isCustomer && (
                      <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[70%]">
                      {/* Name/Sender badge */}
                      <span className="text-[10px] text-gray-500 font-bold mb-1 ml-1 uppercase tracking-wider">
                        {isCustomer ? selectedConv.customer_name : 'SupportAI'}
                      </span>

                      {/* Bubble */}
                      <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                        isCustomer 
                          ? 'bg-gradient-to-tr from-violet-600 to-blue-500 border-violet-500/20 text-white rounded-tr-none'
                          : 'bg-white/5 border-white/5 text-gray-200 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-line">{m.content}</p>

                        {/* Citations badges inside AI reply */}
                        {isAI && m.citations && m.citations.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
                            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>SOURCES USED:</span>
                            </span>
                            {m.citations.map((c: any, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => setSelectedCitationDetails({ filename: c.filename, content: c.content || 'Content chunk loaded.' })}
                                className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 border border-violet-500/20 rounded-md hover:bg-violet-500/25 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>{c.filename}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Time & Bubble Actions */}
                      <div className={`flex items-center gap-3 mt-1.5 text-gray-500 text-[10px] ${isCustomer ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        {isAI && (
                          <>
                            <button 
                              onClick={() => speakText(m.content, m.id)} 
                              title="Speak response"
                              className={`hover:text-white transition-colors cursor-pointer ${isSpeakingId === m.id ? 'text-violet-400' : ''}`}
                            >
                              {isSpeakingId === m.id ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>
                            
                            <button 
                              onClick={() => copyToClipboard(m.content, m.id)} 
                              title="Copy response"
                              className="hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedMessageId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            
                            <button 
                              onClick={() => handleFeedback(m.id, 'thumb_up')} 
                              title="Helpful"
                              className={`hover:text-emerald-400 transition-colors cursor-pointer ${m.feedback === 'thumb_up' ? 'text-emerald-400' : ''}`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            
                            <button 
                              onClick={() => handleFeedback(m.id, 'thumb_down')} 
                              title="Not helpful"
                              className={`hover:text-red-400 transition-colors cursor-pointer ${m.feedback === 'thumb_down' ? 'text-red-400' : ''}`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isCustomer && (
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-gray-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}

                  </div>
                );
              })}

              {/* Streaming UI */}
              {isGenerating && streamText && (
                <div className="flex gap-4 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col max-w-[70%]">
                    <span className="text-[10px] text-gray-500 font-bold mb-1 ml-1 uppercase">SupportAI</span>
                    <div className="p-4 rounded-2xl border border-white/5 bg-white/5 text-gray-200 rounded-tl-none">
                      <p className="whitespace-pre-line">{streamText}</p>
                      
                      {activeCitations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
                          <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>SOURCES USED:</span>
                          </span>
                          {activeCitations.map((c, cIdx) => (
                            <div key={cIdx} className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 border border-violet-500/20 rounded-md">
                              {c.filename}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading dots */}
              {isGenerating && !streamText && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold mb-1 uppercase">SupportAI</span>
                    <div className="p-4 rounded-2xl border border-white/5 bg-white/5 text-gray-400 rounded-tl-none flex items-center gap-1.5 w-16 justify-center">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-white/5 bg-black/40 flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <button
                  onClick={toggleVoiceInput}
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    isListening 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={isListening ? "Listening... click to stop" : "Start Voice Input"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  placeholder={isListening ? "Listening... speak now" : "Ask SupportAI something..."}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isGenerating) {
                      handleSendMessage(inputMessage);
                    }
                  }}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 text-white placeholder-gray-500"
                />

                <button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={isGenerating || !inputMessage.trim()}
                  className="w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>

                {lastUserMsg && !isGenerating && (
                  <button
                    onClick={() => handleRegenerate(lastUserMsg.content)}
                    title="Regenerate last answer"
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 hover:text-white flex items-center justify-center transition-all cursor-pointer text-gray-400"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-gray-500 self-center">SupportAI answers grounded exclusively in documents. Confidences below 0.6 auto-create tickets.</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center shadow-xl shadow-violet-500/20 text-white animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">SupportAI Live Console</h3>
              <p className="text-sm text-gray-400">Select an existing customer email thread from the left list or create a new session to test RAG grounding, citations, and ticket escalations.</p>
            </div>
            <button 
              onClick={() => setIsCreatingConv(true)}
              className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-violet-500/30 text-white hover:bg-violet-600/5 font-semibold rounded-xl text-sm transition-all cursor-pointer"
            >
              Start Customer Chat Session
            </button>
          </div>
        )}
      </div>

      {/* 3. Citations detail side drawer */}
      {selectedCitationDetails && (
        <div className="w-80 h-full glass-card rounded-2xl flex flex-col overflow-hidden animate-slide-left z-10 border-l border-violet-500/20">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-2 text-violet-400">
              <BookOpen className="w-4 h-4" />
              <span className="font-bold text-sm">Source Highlight</span>
            </div>
            <button 
              onClick={() => setSelectedCitationDetails(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Document Origin</span>
              <span className="text-sm font-semibold text-white">{selectedCitationDetails.filename}</span>
            </div>
            <div className="h-px bg-white/5 my-2" />
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Grounded Text Chunk</span>
              <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-3.5 border border-white/5 rounded-xl whitespace-pre-wrap">
                {selectedCitationDetails.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
