'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, CheckCircle2, ArrowRight, Sparkles, Building, Lock, FileCheck } from 'lucide-react';

interface VerifyViewProps {
  onVerified: (email: string) => void;
  onBackToApp: () => void;
}

export function VerifyView({ onVerified, onBackToApp }: VerifyViewProps) {
  const [eduEmail, setEduEmail] = useState('');
  const [step, setStep] = useState<'input' | 'code' | 'success'>('input');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [verifyMethod, setVerifyMethod] = useState<'email' | 'tidecloak'>('email');
  const [tideCloakConnecting, setTideCloakConnecting] = useState(false);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduEmail.includes('@') || (!eduEmail.includes('.edu') && !eduEmail.includes('.ac.'))) {
      alert('Please enter a valid academic email address (.edu / .edu.vn)');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('code');
    }, 800);
  };

  const handleTideCloakConnect = () => {
    setTideCloakConnecting(true);
    setTimeout(() => {
      setTideCloakConnecting(false);
      setStep('success');
      setTimeout(() => {
        onVerified('tidecloak:student-credential@rmit.edu.vn');
      }, 1200);
    }, 1000);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      setTimeout(() => {
        onVerified(eduEmail);
      }, 1200);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#faf8f5] text-[#263337] overflow-y-auto">
      <div className="max-w-xl mx-auto my-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#0f4c5c] text-white shadow-md mb-4">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173e49]">
            Campus Student Verification
          </h1>
          <p className="mt-2 text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
            Verify your university identity or TideCloak credential to unlock academic syndicate channels, exam archives, and peer research groups.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-stone-200/90 bg-white/80 p-8 shadow-xl backdrop-blur-md">
          {step === 'input' && (
            <div className="space-y-5">
              {/* Method Switcher */}
              <div className="flex rounded-xl bg-[#faf8f5] p-1 border border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => setVerifyMethod('email')}
                  className={`flex-1 py-1.5 font-semibold rounded-lg transition ${
                    verifyMethod === 'email'
                      ? 'bg-white text-[#0f4c5c] shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Academic Email (.edu)
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyMethod('tidecloak')}
                  className={`flex-1 py-1.5 font-semibold rounded-lg transition ${
                    verifyMethod === 'tidecloak'
                      ? 'bg-white text-[#0f4c5c] shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  TideCloak Credential
                </button>
              </div>

              {verifyMethod === 'email' ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Academic Institution Email (.edu.vn / .edu)
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 size-4 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={eduEmail}
                        onChange={(e) => setEduEmail(e.target.value)}
                        placeholder="student.name@hcmut.edu.vn"
                        className="w-full rounded-xl border border-stone-200 bg-[#faf8f5] py-2.5 pl-10 pr-3 text-xs outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#edf7f4] border border-[#b8d8d2] p-3 text-[11px] text-[#0f4c5c] flex items-start gap-2">
                    <Lock className="size-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Guaranteed</strong>: Your email is used only to issue a cryptographic zero-knowledge proof. University admins cannot monitor your channel posts or peer votes.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#0f4c5c] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0b3b48] flex items-center justify-center gap-2 transition"
                  >
                    {loading ? 'Sending verification key...' : <>Send Verification Code <ArrowRight className="size-4" /></>}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#b8d8d2] bg-[#edf7f4] p-4 text-xs text-[#0f4c5c] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Sparkles className="size-4" /> TideCloak Emergent Identity
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-600">
                      Connect your decentralized student wallet or TideCloak DPoP proof. Your academic credentials will be verified through threshold zero-knowledge attestations.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTideCloakConnect}
                    disabled={tideCloakConnecting}
                    className="w-full rounded-xl bg-[#0f4c5c] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#0b3b48] flex items-center justify-center gap-2 transition"
                  >
                    {tideCloakConnecting ? (
                      'Attesting with TideCloak ZK-Proof...'
                    ) : (
                      <>
                        <ShieldCheck className="size-4" />
                        Verify via TideCloak Credential
                      </>
                    )}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onBackToApp}
                className="w-full text-center text-xs text-stone-400 hover:text-stone-600 transition pt-2"
              >
                Skip for now and return to communities
              </button>
            </div>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Enter 6-Digit One-Time Passcode
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full tracking-widest text-center text-lg font-bold rounded-xl border border-stone-200 bg-[#faf8f5] py-2.5 outline-none focus:border-[#0f4c5c]"
                />
                <p className="mt-1 text-[11px] text-stone-400 text-center">
                  Code sent to <span className="font-semibold text-stone-600">{eduEmail}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0f4c5c] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0b3b48] flex items-center justify-center gap-2 transition"
              >
                {loading ? 'Confirming...' : 'Verify Academic Proof'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="size-12 text-emerald-600 mx-auto animate-bounce" />
              <h2 className="text-lg font-bold text-[#173e49]">University Badge Verified!</h2>
              <p className="text-xs text-stone-500">
                You now hold verified student privileges on UniSign. Redirecting...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
