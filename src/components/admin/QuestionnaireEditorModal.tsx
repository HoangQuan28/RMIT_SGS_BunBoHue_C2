import React, { useState } from 'react';
import { X, Plus, Trash2, Check, AlertCircle, Save } from 'lucide-react';
import { QuestionItem } from '@/lib/types';

interface QuestionnaireEditorModalProps {
  groupId: string;
  groupName: string;
  initialQuestions: QuestionItem[];
  currentVersion: number;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (newVersion: number) => void;
}

export const QuestionnaireEditorModal: React.FC<QuestionnaireEditorModalProps> = ({
  groupId,
  groupName,
  initialQuestions,
  currentVersion,
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>(
    initialQuestions.length > 0
      ? initialQuestions
      : [
          {
            id: `q_temp_1`,
            label: 'Why are you interested in joining this syndicate?',
            required: true,
            order_index: 0,
          },
        ]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: `q_new_${Date.now()}_${prev.length + 1}`,
        label: '',
        required: true,
        order_index: prev.length,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleLabelChange = (index: number, newLabel: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], label: newLabel };
      return copy;
    });
  };

  const handleToggleRequired = (index: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], required: !copy[index].required };
      return copy;
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    setQuestions(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((q, idx) => ({ ...q, order_index: idx }));
    });
  };

  const handleSave = async () => {
    // Client validate non-empty labels
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].label.trim().length === 0) {
        setErrorMessage(`Question #${i + 1} cannot have an empty label.`);
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/questionnaire`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-user-id': 'admin_rmit_lead', // simulate admin identity
        },
        body: JSON.stringify({
          questions: questions.map((q, idx) => ({
            id: q.id,
            label: q.label.trim(),
            required: q.required,
            order_index: idx,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save questionnaire.');
      }

      onSaveSuccess(data.version);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating questionnaire.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173e49]/35 backdrop-blur-sm p-4">
      <div className="bg-white border border-[#ded9d0] rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-[#263238] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#ded9d0] bg-[#faf8f5]">
          <div>
            <h3 className="font-bold text-base text-[#173e49]">⚙️ Group Questionnaire Editor</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Configuring admission form for: <span className="text-[#0f4c5c] font-semibold">{groupName}</span> (Current: v{currentVersion})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="text-xs text-[#0f4c5c] bg-[#edf7f4] border border-[#b8d8d2] p-3.5 rounded-2xl leading-relaxed">
            💡 <strong>Immutable Versioning</strong>: Publishing updates increments the questionnaire version. Existing applications retain snapshot copies of previous questions and answers.
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="bg-[#faf8f5] border border-stone-200/80 p-4 rounded-2xl space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-bold text-stone-700">Question #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="px-2 py-0.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 text-[10px] text-stone-600"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="px-2 py-0.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 text-[10px] text-stone-600"
                    >
                      ▼ Down
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={q.label}
                  onChange={(e) => handleLabelChange(idx, e.target.value)}
                  placeholder="e.g. Describe your experience with Linux and systems programming..."
                  className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10"
                />

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={() => handleToggleRequired(idx)}
                      className="rounded border-stone-300 text-[#0f4c5c] focus:ring-[#0f4c5c]/20"
                    />
                    <span>Mark as Required answer</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-2.5 border border-dashed border-stone-300 hover:border-[#0f4c5c] rounded-2xl text-xs font-semibold text-stone-600 hover:text-[#0f4c5c] flex items-center justify-center gap-1.5 transition-all bg-[#faf8f5] hover:bg-white"
          >
            <Plus className="w-3.5 h-3.5" /> Add Question Item
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#ded9d0] bg-[#faf8f5]">
          <span className="text-[11px] text-stone-500">
            {questions.length} total question{questions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/60 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#0f4c5c] hover:bg-[#0b3b48] text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> {isSaving ? 'Publishing...' : 'Publish Version'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
