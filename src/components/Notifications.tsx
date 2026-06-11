import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Home, ArrowDown, Shield, Volume2, Heart, Check, Sparkles } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onNavigateToTab: (tab: 'home' | 'search' | 'favorites' | 'profile' | 'details' | 'comparison' | 'notifications' | 'auth') => void;
}

export default function Notifications({
  notifications,
  onMarkAllAsRead,
  onNavigateToTab,
}: NotificationsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'new_listing' | 'system'>('all');

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'new_listing') return notif.type === 'new_listing';
    if (activeTab === 'system') return notif.type === 'system' || notif.type === 'announcement';
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Top action and header */}
      <div className="flex justify-between items-center border-b border-purple-50 pb-3 sticky top-16 bg-[#fcf8ff] z-30">
        <div className="flex items-center gap-1.5 text-[#585595]">
          <Bell className="w-5 h-5" />
          <span className="text-xs font-bold text-slate-500">
            {notifications.filter((n) => n.unread).length} 條未讀訊息
          </span>
        </div>

        <button
          onClick={onMarkAllAsRead}
          className="text-xs font-bold text-[#585595] hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 transition-all flex items-center gap-1 active:scale-95"
        >
          <Check className="w-4 h-4" />
          全部標記為已讀
        </button>
      </div>

      {/* Tabs filter category */}
      <div className="flex gap-4 border-b border-slate-200 sticky top-[97px] bg-[#fcf8ff] z-25">
        {[
          { label: '全部', value: 'all' },
          { label: '新房源推薦', value: 'new_listing' },
          { label: '系統與公告', value: 'system' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as any)}
            className={`relative py-3 text-xs font-bold transition-all ${
              activeTab === tab.value ? 'text-[#585595]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>{tab.label}</span>
            {activeTab === tab.value && (
              <motion.div
                layoutId="activeNotifUnderline"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#585595] rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Notification items container */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <motion.div
                layout
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-4 rounded-xl border transition-all duration-200 flex gap-3 relative overflow-hidden group ${
                  notif.type === 'announcement'
                    ? 'bg-purple-50/30 border-purple-100'
                    : 'bg-white border-slate-200'
                } hover:border-[#585595]/30`}
              >
                {/* Active unread blue dot */}
                {notif.unread && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#585595] animate-pulse" />
                )}

                {/* Left side thumbnail or icon */}
                <div className="flex-shrink-0">
                  {notif.image ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={notif.image}
                        alt="物件預覽"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      notif.type === 'price_drop'
                        ? 'bg-amber-50 text-amber-600'
                        : notif.type === 'system'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      {notif.type === 'price_drop' && <ArrowDown className="w-5 h-5 animate-bounce-slow" />}
                      {notif.type === 'system' && <Shield className="w-5 h-5" />}
                      {notif.type === 'announcement' && <Volume2 className="w-5 h-5" />}
                    </div>
                  )}
                </div>

                {/* Right side textual body info */}
                <div className="flex-grow space-y-1 pr-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold ${
                      notif.type === 'new_listing'
                        ? 'text-emerald-600'
                        : notif.type === 'price_drop'
                        ? 'text-amber-600'
                        : 'text-[#585595]'
                    }`}>
                      {notif.type === 'new_listing' && '📢 新房源推薦'}
                      {notif.type === 'price_drop' && '📉 價格調降'}
                      {notif.type === 'system' && '🛡️ 系統認證'}
                      {notif.type === 'announcement' && '🔥 重要權益公告'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{notif.time}</span>
                  </div>

                  <h5 className="font-bold text-slate-900 text-xs leading-snug">
                    {notif.title}
                  </h5>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {notif.content}
                  </p>

                  {/* Context quick actionable triggers */}
                  {notif.type === 'new_listing' && (
                    <button
                      onClick={() => onNavigateToTab('search')}
                      className="text-xs font-bold text-[#585595] underline inline-flex items-center gap-0.5 pt-1.5"
                    >
                      <span>點此查看詳細列表</span> &gt;
                    </button>
                  )}
                  {notif.type === 'system' && (
                    <button
                      onClick={() => onNavigateToTab('auth')}
                      className="text-xs font-bold text-indigo-600 underline inline-flex items-center gap-0.5 pt-1.5"
                    >
                      <span>立即點此驗證</span> &gt;
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <p className="text-4xl text-slate-300">📭</p>
              <p className="text-xs font-medium">沒有找到此分類的最新通知。</p>
            </div>
          )}
        </div>
      </AnimatePresence>
    </motion.div>
  );
}
