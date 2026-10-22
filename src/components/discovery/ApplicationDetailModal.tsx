import React from 'react';
import { X, Calendar, User, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AnswerItem {
  questionId: string;
  questionLabel: string;
  answerText: string;
}

interface ApplicationData {
  id: string;
  groupId: string;
  groupName: string;
  applicantPseudonym: string;
  questionnaireVersion: number;
  submittedAt: string;
  answers: AnswerItem[];
}

interface ApplicationDetailModalProps {
  application: ApplicationData | null;
  onClose: () => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
}) => {
  if (!application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173e49]/35 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white border border-[#ded9d0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#263238]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 bg-[#faf8f5] border-b border-[#ded9d0] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="size-9 rounded-xl bg-[#edf7f4] text-[#0f4c5c] border border-[#b8d8d2] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#173e49]">Student Application</h3>
              <p className="text-xs text-stone-500">Target Group: {application.groupName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700 flex-1">
          {/* Metadata Card */}
          <div className="bg-[#faf8f5] p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-[#0f4c5c]" />
                <span className="font-bold text-stone-900">{application.applicantPseudonym}</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono bg-white px-2 py-0.5 rounded-md border border-stone-200">
                v{application.questionnaireVersion} Snapshot
              </span>
            </div>
            <div className="flex items-center text-[11px] text-stone-500 space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Submitted at: {new Date(application.submittedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Answer Snapshots */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Submitted Responses ({application.answers.length})
            </h4>

            {application.answers.map((ans, idx) => (
              <div
                key={ans.questionId || idx}
                className="bg-[#faf8f5] p-4 rounded-2xl border border-stone-200/80 space-y-2"
              >
                <p className="font-semibold text-stone-900 text-xs">
                  {idx + 1}. {ans.questionLabel}
                </p>
                <div className="p-3 rounded-xl bg-white border border-stone-200 text-stone-800 whitespace-pre-wrap leading-relaxed text-xs">
                  {ans.answerText || <span className="text-stone-400 italic">No answer provided</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf8f5] border-t border-[#ded9d0] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0f4c5c] hover:bg-[#0b3b48] text-white transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
