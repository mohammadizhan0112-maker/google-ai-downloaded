import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Headset, MessageSquare, Ticket, Clock, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Support({ session }: { session?: any }) {
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets'>('chat');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .in('sender', ['user', 'admin'])
        .order('created_at', { ascending: true });

      if (!error && data) {
        setChatMessages(data);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('support_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          if (payload.new.sender === 'user' || payload.new.sender === 'admin') {
            setChatMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('user_id', session.user.id)
          .neq('sender', 'trade_log')
          .neq('sender', 'system_settings')
          .neq('status', 'document_pending')
          .neq('status', 'document_approved')
          .neq('status', 'document_rejected')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Group by user_id or just show all messages as tickets
          // For simplicity, we'll just show the unique conversations or all messages
          setTickets(data);
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
      }
    };

    fetchTickets();
  }, [session?.user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !session?.user?.id) return;
    
    const newMessage = message;
    setMessage('');
    
    try {
      await supabase.from('support_messages').insert([
        {
          user_id: session.user.id,
          text: newMessage,
          sender: 'user',
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const content = (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Headset className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-main">Live Support</h1>
          <p className="text-muted">Chat with our agents or manage your support tickets.</p>
        </div>
      </div>

      <div className="bg-card border border-main rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-main p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-muted hover:text-main hover:bg-muted'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Live Chat</span>
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'tickets' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-muted hover:text-main hover:bg-muted'}`}
          >
            <Ticket className="w-5 h-5" />
            <span className="font-medium">My Tickets</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'chat' ? (
            <>
              <div className="p-6 border-b border-main flex items-center justify-between bg-muted">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold">
                      CS
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-main">Customer Support</h3>
                    <p className="text-xs text-emerald-500">Online</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-main">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted py-10">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                )}
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender === 'user' ? 'bg-emerald-500 text-black rounded-tr-sm' : 'bg-muted text-main rounded-tl-sm border border-main'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-black/60' : 'text-muted'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-main bg-card">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black p-3 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-main">Support Tickets</h3>
                <button className="bg-muted hover:bg-hover text-main px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-main">
                  Open New Ticket
                </button>
              </div>
              
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center text-muted py-10">
                    <p>No tickets found.</p>
                  </div>
                ) : tickets.map(ticket => (
                  <div key={ticket.id} className="bg-muted border border-main rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-hover transition-colors cursor-pointer">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-mono text-muted">{ticket.id.substring(0, 8).toUpperCase()}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {ticket.status || 'open'}
                        </span>
                      </div>
                      <h4 className="font-medium text-main truncate max-w-md">{ticket.text}</h4>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (session) {
    return <DashboardLayout session={session}>{content}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen bg-main text-main font-sans selection:bg-emerald-500/30">
      <Header />
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {content}
      </main>
      <Footer />
    </div>
  );
}
