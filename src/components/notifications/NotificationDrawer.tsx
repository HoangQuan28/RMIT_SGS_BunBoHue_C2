import React from 'react';
import { X, Bell, User, CheckCircle2, ChevronRight, Inbox } from 'lucide-react';

export interface NotificationItem {
  id: string;
  groupId: string;
  groupName: string;
  applicationId: string;
  applicantPseudonym: string;
  read: boolean;
  createdAt: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onSelectNotification: (item: NotificationItem) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#173e49]/35 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#faf8f5] border-l border-[#ded9d0] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#ded9d0] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="grid size-7 place-items-center rounded-lg bg-[#0f4c5c] text-white">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#173e49]">Group Applications</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 space-y-2">
              <Inbox className="w-8 h-8 stroke-1 text-stone-300" />
              <p className="text-xs font-medium">No pending applications</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-white/60 border-stone-200/70 opacity-75 hover:opacity-100 hover:border-stone-300'
                    : 'bg-white border-[#0f4c5c]/40 shadow-[0_4px_12px_rgba(15,76,92,0.08)] hover:border-[#0f4c5c]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-xs text-[#173e49]">
                        {item.applicantPseudonym}
                      </span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-[#0f4c5c] inline-block" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-tight">
                      Applied to join <strong className="text-stone-900">{item.groupName}</strong>
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 mt-1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
