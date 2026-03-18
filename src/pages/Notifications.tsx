import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Bell, ShieldAlert, TrendingUp, ArrowDownRight, CheckCircle2, Info, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';

const initialNotifications = [];

export default function Notifications({ session }: { session: any }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('sender', 'admin')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const adminNotifications = data.map((msg: any) => ({
          id: msg.id,
          type: 'info',
          title: 'System Notification',
          message: msg.text,
          details: msg.text,
          time: new Date(msg.created_at).toLocaleString(),
          read: msg.status === 'read',
          icon: Info,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          isDb: true
        }));
        setNotifications(adminNotifications);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications_page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `user_id=eq.${session.user.id}`
      }, (payload) => {
        if (payload.new.sender === 'admin') {
          const newNotif = {
            id: payload.new.id,
            type: 'info',
            title: 'System Notification',
            message: payload.new.text,
            details: payload.new.text,
            time: new Date(payload.new.created_at).toLocaleString(),
            read: false,
            icon: Info,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            isDb: true
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session?.user?.id]);

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    
    // Update DB for admin messages
    const dbIds = notifications.filter(n => n.isDb && !n.read).map(n => n.id);
    if (dbIds.length > 0) {
      await supabase
        .from('support_messages')
        .update({ status: 'read' })
        .in('id', dbIds);
    }
  };

  const toggleNotification = async (id: number | string) => {
    setExpandedId(expandedId === id ? null : id);
    
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      // Mark as read locally
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      
      // Update DB if it's a DB message
      if (notification.isDb) {
        await supabase
          .from('support_messages')
          .update({ status: 'read' })
          .eq('id', id);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout session={session}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight flex items-center">
              <Bell className="w-8 h-8 mr-3 text-emerald-500" />
              Notifications
            </h2>
            <p className="text-gray-400 mt-2">View your recent alerts, updates, and system logs.</p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2 px-4 rounded-lg border border-white/10 transition-all"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                const isExpanded = expandedId === notification.id;
                
                return (
                  <div 
                    key={notification.id} 
                    onClick={() => toggleNotification(notification.id)}
                    className={`p-6 flex items-start space-x-4 transition-colors cursor-pointer hover:bg-white/[0.04] ${!notification.read ? 'bg-emerald-500/[0.02]' : ''} ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.bg} ${notification.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-lg font-bold ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500 whitespace-nowrap">{notification.time}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      
                      {!isExpanded ? (
                        <p className={`text-sm truncate ${!notification.read ? 'text-gray-300' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                      ) : (
                        <div className="mt-3">
                          <p className="text-sm text-gray-300 mb-4">{notification.message}</p>
                          <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                            <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                              {notification.details}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {!notification.read && !isExpanded && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No notifications</h3>
              <p className="text-gray-400">You're all caught up! Check back later for updates.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
