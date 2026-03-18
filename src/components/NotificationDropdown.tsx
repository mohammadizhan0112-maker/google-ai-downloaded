import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, ArrowDownRight, ArrowUpRight, Zap, Info, ExternalLink } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  action_url?: string;
  expires_at?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDropdown({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
            if (payload.old.is_read === false && payload.new.is_read === true) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      setIsOpen(false);
      navigate(notification.action_url);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit_approved':
        return <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
      case 'deposit_rejected':
        return <Info className="w-4 h-4 text-red-500" />;
      case 'withdrawal_processed':
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      case 'withdrawal_rejected':
        return <Info className="w-4 h-4 text-red-500" />;
      case 'profit_added':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted hover:text-main hover:bg-hover rounded-xl transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-main"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-main rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-main flex items-center justify-between bg-hover/50">
              <h3 className="font-semibold text-main flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-muted hover:text-main transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-main">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 hover:bg-hover transition-colors cursor-pointer ${!notification.is_read ? 'bg-emerald-500/5' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          !notification.is_read ? 'bg-card border border-emerald-500/30' : 'bg-hover'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-main' : 'text-muted'}`}>
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-muted whitespace-nowrap flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.action_url && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 uppercase tracking-wider">
                              <span>View Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-main bg-hover/30 text-center">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/history'); // Or a dedicated notifications page if it exists
                }}
                className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
