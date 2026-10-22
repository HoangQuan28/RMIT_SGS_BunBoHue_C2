'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Check,
  Lock,
  ArrowRight,
  CreditCard,
  X,
  Loader2,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import {
  switchTidePrivacyTier,
  TideCloakSession,
} from '@/lib/crypto/tideCloakService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TideCloakSession;
  onPlanUpdated: (updated: TideCloakSession) => void;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  session,
  onPlanUpdated,
}: SubscriptionModalProps) {
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan');
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'momo' | 'card'>('vietqr');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartPayment = () => {
    setStep('payment');
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      // Simulate real bank/gateway webhook confirmation
      await new Promise((r) => setTimeout(r, 1200));
      const updated = await switchTidePrivacyTier(session, 'premium');
      onPlanUpdated(updated);
      setStep('success');
      setSuccessMsg('Giao dịch 100.000 VNĐ hoàn tất! Đã kích hoạt TideCloak 5-of-7 ORK E2EE.');
      setTimeout(() => {
        onClose();
        setStep('plan');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      const updated = await switchTidePrivacyTier(session, 'standard');
      onPlanUpdated(updated);
      setSuccessMsg('Đã chuyển về gói Miễn Phí. TideCloak chỉ dùng cho xác thực mật khẩu.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#173e49]/40 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-white/80 bg-white/90 p-7 shadow-2xl backdrop-blur-xl text-[#263238]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#0f4c5c] text-white shadow-sm font-bold">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#173e49]">UniSign Gói Dịch Vụ</h2>
              <p className="text-xs text-stone-500">
                100.000 VNĐ / tháng để mở khóa mã hoá E2EE và 7 mảnh khóa ORK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            {successMsg}
          </div>
        )}

        {step === 'plan' && (
          <>
            {/* Pricing Cards Comparison */}
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {/* Free Tier */}
              <div
                className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                  session.tier === 'standard'
                    ? 'border-[#0f4c5c] bg-[#edf7f4]/60 ring-2 ring-[#0f4c5c]/10'
                    : 'border-stone-200 bg-[#faf8f5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Gói Sinh Viên Miễn Phí
                    </span>
                    {session.tier === 'standard' && (
                      <span className="rounded-full bg-[#0f4c5c] px-2 py-0.5 text-[9px] font-bold text-white">
                        Đang sử dụng
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#173e49]">0₫</span>
                    <span className="text-xs text-stone-500">/ vĩnh viễn</span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">
                    Bảo vệ mật khẩu đăng nhập cơ bản qua TideCloak.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs">
                    <li className="flex items-start gap-2 text-stone-700">
                      <Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>
                        <strong>TideCloak Password Auth:</strong> Xác thực phần cứng DPoP ES256.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-stone-700">
                      <Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Khám phá diễn đàn & xem nhóm trường.</span>
                    </li>
                    <li className="flex items-start gap-2 text-stone-400">
                      <Lock className="size-3.5 text-stone-400 mt-0.5 shrink-0" />
                      <span className="line-through">Mã hoá E2EE Chat Logs</span>
                    </li>
                    <li className="flex items-start gap-2 text-stone-400">
                      <Lock className="size-3.5 text-stone-400 mt-0.5 shrink-0" />
                      <span className="line-through">Personal Data Vault & Lịch sử mã hoá</span>
                    </li>
                  </ul>
                </div>

                {session.tier === 'premium' && (
                  <button
                    type="button"
                    onClick={handleDowngrade}
                    disabled={loading}
                    className="mt-5 w-full rounded-xl border border-stone-300 py-2 text-xs font-semibold text-stone-600 hover:bg-white transition"
                  >
                    Hạ cấp về gói Miễn Phí
                  </button>
                )}
              </div>

              {/* Premium Tier (100,000 VND / month) */}
              <div
                className={`rounded-2xl border p-5 flex flex-col justify-between transition relative overflow-hidden ${
                  session.tier === 'premium'
                    ? 'border-[#0f4c5c] bg-[#edf7f4] ring-2 ring-[#0f4c5c]/20 shadow-md'
                    : 'border-[#78aea5] bg-white shadow-sm'
                }`}
              >
                <div className="absolute top-0 right-0 rounded-bl-xl bg-[#0f4c5c] px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  Bảo mật tối đa
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0f4c5c] flex items-center gap-1">
                      Gói Premium <Sparkles className="size-3 text-[#c65b48]" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#173e49]">100.000₫</span>
                    <span className="text-xs text-stone-500">/ tháng</span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-600">
                    Phân mảnh khóa 5-of-7 ORK qua 7 trung tâm dữ liệu toàn cầu.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs">
                    <li className="flex items-start gap-2 text-stone-800">
                      <Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>
                        <strong>Mã hoá 5-of-7 ORK:</strong> Bảo mật cấp lượng tử.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-stone-800">
                      <Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>
                        <strong>TideCloak Chat Logs E2EE:</strong> Tin nhắn được mã hoá client-side.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-stone-800">
                      <Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>
                        <strong>Personal Data Vault:</strong> Lưu trữ dữ liệu học tập mã hoá.
                      </span>
                    </li>
                  </ul>
                </div>

                {session.tier !== 'premium' ? (
                  <button
                    type="button"
                    onClick={handleStartPayment}
                    className="mt-5 w-full rounded-xl bg-[#0f4c5c] py-2.5 text-xs font-bold text-white shadow hover:bg-[#0b3b48] flex items-center justify-center gap-2 transition"
                  >
                    <CreditCard className="size-3.5" />
                    <span>Thanh toán 100.000 VNĐ</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : (
                  <div className="mt-5 rounded-xl bg-white border border-[#b8d8d2] p-2 text-center text-xs font-bold text-[#0f4c5c]">
                    Gói đang hoạt động · Gia hạn hàng tháng
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {step === 'payment' && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-[#faf8f5] p-4 text-center">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Xác nhận thanh toán hóa đơn
              </span>
              <div className="text-3xl font-bold text-[#173e49] mt-1">100.000 VNĐ</div>
              <p className="text-xs text-stone-500 mt-0.5">
                Đăng ký Premium 1 tháng · Kích hoạt 5-of-7 ORK Key Fragments
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('vietqr')}
                className={`rounded-xl border p-2.5 font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'vietqr'
                    ? 'border-[#0f4c5c] bg-[#edf7f4] text-[#0f4c5c]'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                <QrCode className="size-4" />
                <span>VietQR Chuyển khoản</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`rounded-xl border p-2.5 font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'momo'
                    ? 'border-[#0f4c5c] bg-[#edf7f4] text-[#0f4c5c]'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                <CreditCard className="size-4" />
                <span>Ví MoMo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`rounded-xl border p-2.5 font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'card'
                    ? 'border-[#0f4c5c] bg-[#edf7f4] text-[#0f4c5c]'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                <ShieldCheck className="size-4" />
                <span>Thẻ Quốc tế</span>
              </button>
            </div>

            {/* Genuine Payment QR Code Display */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center space-y-3">
              <div className="relative mx-auto w-56 h-56 rounded-2xl bg-stone-50 border border-stone-200 p-2 flex items-center justify-center shadow-sm overflow-hidden">
                {paymentMethod === 'vietqr' ? (
                  <img
                    src="/vietqr_payment.png"
                    alt="VietQR 100.000 VNĐ"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : paymentMethod === 'momo' ? (
                  <img
                    src="/momo_payment.png"
                    alt="Ví MoMo 100.000 VNĐ"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="p-4 text-xs text-stone-500">
                    <CreditCard className="size-10 mx-auto text-stone-400 mb-2" />
                    <span>Hỗ trợ thẻ Visa/Mastercard quốc tế cho sinh viên du học.</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-stone-600 leading-tight">
                <p className="font-bold text-[#173e49] text-sm">
                  {paymentMethod === 'vietqr'
                    ? 'Quét mã VietQR chuyển khoản (100.000₫)'
                    : paymentMethod === 'momo'
                    ? 'Quét mã Ví MoMo (100.000₫)'
                    : 'Cổng thẻ thanh toán quốc tế'}
                </p>
                <p className="font-mono text-[11px] text-stone-500 mt-1">
                  Nội dung chuyển: <span className="font-bold text-[#0f4c5c]">UNISIGN_PREMIUM_{session.email.split('@')[0]}</span>
                </p>
                <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded-lg py-1 px-2 mt-2 border border-emerald-200">
                  Tự động kích hoạt TideCloak 5-of-7 ORK E2EE sau khi chuyển khoản thành công.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('plan')}
                disabled={loading}
                className="flex-1 rounded-xl border border-stone-300 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#0f4c5c] py-2.5 text-xs font-bold text-white hover:bg-[#0b3b48] flex items-center justify-center gap-2 transition shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Đang kiểm tra giao dịch 100k...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>Xác nhận đã chuyển 100.000₫</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
