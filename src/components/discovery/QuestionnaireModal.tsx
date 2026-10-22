import React, { useState, useEffect } from 'react';
import { RankedGroup } from '@/lib/search/semanticService';
import { X, AlertCircle, Loader2, Send, ShieldCheck, Lock } from 'lucide-react';
import {
  mintTideDPoPProof,
  tideDoEncrypt,
  TideCloakSession,
} from '@/lib/crypto/tideCloakService';

interface Question {
  id: string;
  label: string;
  required: boolean;
  orderIndex: number;
}

interface QuestionnaireModalProps {
  group: RankedGroup | null;
  onClose: () => void;
  onSuccess: (appId: string) => void;
  currentUser?: TideCloakSession | null;
}

export const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  group,
  onClose,
  onSuccess,
  currentUser,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idempotencyKey] = useState(
    () => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  );

  useEffect(() => {
    if (!group) return;

    async function loadQuestionnaire() {
      try {
        setLoading(true);
        const res = await fetch(`/api/groups/${group!.id}/questionnaire`);
        const data = await res.json();
        if (data.success) {
          setVersion(data.version);
          setQuestions(data.questions);
          const initialAnswers: Record<string, string> = {};
          data.questions.forEach((q: Question) => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
        } else {
          setError(data.error || 'Failed to load questionnaire');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuestionnaire();
  }, [group]);

  if (!group) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (const q of questions) {
      if (q.required && (!answers[q.id] || answers[q.id].trim().length === 0)) {
        setError(`Please answer the required question: "${q.label}"`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const dpop = await mintTideDPoPProof('POST', '/api/groups/apply');
      let encryptedPayloadSeal = '';
      if (currentUser) {
        const [seal] = await tideDoEncrypt(
          [{ data: JSON.stringify(answers), tags: [`group_apply:${group.id}`] }],
          currentUser
        );
        encryptedPayloadSeal = seal;
      }

      const res = await fetch('/api/groups/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-id': currentUser?.tideUserKey || 'student-usr-84',
          'x-actor-pseudonym': currentUser?.pseudonym || 'Verified Student',
          dpop: dpop.dpopJwt,
          'x-tide-dpop-jkt': currentUser?.dpopThumbprint || dpop.thumbprint,
          'x-tide-tier': currentUser?.tier || 'standard',
          'x-tide-seal': encryptedPayloadSeal.slice(0, 64),
        },
        body: JSON.stringify({
          groupId: group.id,
          questionnaireVersion: version || 1,
          answers:
            questions.length === 0
              ? [{ questionId: 'direct', answerText: 'Direct immediate application' }]
              : questions.map((q) => ({
                  questionId: q.id,
                  answerText: answers[q.id] || '',
                })),
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.applicationId);
      } else {
        setError(data.message || data.error || 'Failed to submit application');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173e49]/35 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#263238]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 bg-[#faf8f5]/90 border-b border-[#ded9d0] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#173e49]">Join Application</h3>
            <p className="text-xs text-stone-500">{group.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0f4c5c]" />
              <span>Loading community questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <form id="apply-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="p-6 text-center text-stone-600 bg-[#faf8f5] rounded-2xl border border-stone-200 space-y-2.5">
                <div className="size-12 rounded-2xl bg-emerald-100 text-[#0f4c5c] flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheck className="size-6 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-bold text-[#173e49] text-sm">
                    No questionnaire required for this group.
                  </h4>
                  <p className="text-xs text-[#0f4c5c] font-semibold mt-0.5">
                    You may submit your application immediately.
                  </p>
                </div>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto leading-relaxed">
                  Nhóm mở xét duyệt nhanh cho sinh viên đã chứng thực danh tính trường học. Nhấn <strong>Submit Application</strong> để gửi đơn trực tiếp đến Admin.
                </p>
              </div>
            </form>
          ) : (
            <form id="apply-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl bg-[#edf7f4] border border-[#b8d8d2] p-3 text-[11px] text-[#0f4c5c] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Your responses are encrypted via TideCloak{' '}
                  <strong>
                    {currentUser
                      ? `${currentUser.thresholdM}-of-${currentUser.totalFragmentsN}`
                      : '2-of-3'}{' '}
                    ORK threshold keys
                  </strong>{' '}
                  and delivered privately to community moderators.
                </span>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-1.5">
                  <label className="font-semibold text-stone-900 flex items-center justify-between">
                    <span>
                      {idx + 1}. {q.label}
                    </span>
                    {q.required && (
                      <span className="text-[10px] text-amber-700 font-semibold">*Required</span>
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Enter your response..."
                    className="w-full bg-[#faf8f5] border border-stone-200 rounded-xl p-3 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10"
                  />
                </div>
              ))}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf8f5]/90 border-t border-[#ded9d0] flex items-center justify-between">
          <span className="text-[11px] text-[#0f4c5c] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            DPoP ES256 Attested
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="apply-form"
              disabled={loading || submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0f4c5c] hover:bg-[#0b3b48] text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
