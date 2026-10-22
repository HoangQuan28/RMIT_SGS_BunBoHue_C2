import React from 'react';
import { RankedGroup } from '@/lib/search/semanticService';
import { X, Users, Tag, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

interface GroupDetailModalProps {
  group: RankedGroup | null;
  onClose: () => void;
  onApply: (group: RankedGroup) => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  group,
  onClose,
  onApply,
}) => {
  if (!group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173e49]/35 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white border border-[#ded9d0] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#263238]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 bg-[#faf8f5] border-b border-[#ded9d0] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="size-9 rounded-xl bg-[#0f4c5c] flex items-center justify-center font-bold text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#173e49]">{group.name}</h3>
              <p className="text-xs text-stone-500">Campus: {group.university}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-stone-700">
          <div>
            <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              About this Group
            </h4>
            <p className="leading-relaxed bg-[#faf8f5] p-3.5 rounded-2xl border border-stone-200/80 text-stone-800">
              {group.description}
            </p>
          </div>

          <div className="flex items-center justify-between bg-[#faf8f5] p-3.5 rounded-2xl border border-stone-200/80">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#0f4c5c]" />
              <span className="font-semibold text-stone-900">{group.memberCount} Verified Members</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-700 font-mono text-[11px] font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin: {group.adminId}</span>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Topic Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {group.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-[#e1f0ed] text-[#0f4c5c] font-medium text-[11px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf8f5] border-t border-[#ded9d0] flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/60 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(group)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0f4c5c] hover:bg-[#0b3b48] text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <span>Apply to Join</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
