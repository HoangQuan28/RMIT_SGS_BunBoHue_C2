'use client';

import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept, onDecline }: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#173e49]/40 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-7 shadow-2xl backdrop-blur-xl text-[#263238] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-xl bg-[#0f4c5c] text-white font-bold">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#173e49]">
                UniSign Terms of Service & Data Privacy Policy
              </h2>
              <p className="text-xs text-stone-500">
                Thỏa thuận người dùng, Chính sách giám sát dữ liệu nhật ký & Giao thức TideCloak
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

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#faf8f5] p-1 border border-stone-200 text-xs mt-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition ${
              activeTab === 'terms'
                ? 'bg-white text-[#0f4c5c] shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            1. Điều Khoản Dịch Vụ (Terms of Service)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition ${
              activeTab === 'privacy'
                ? 'bg-white text-[#0f4c5c] shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            2. Chính Sách Thu Thập & Xem Nhật Ký (Logging Policy)
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4 text-xs text-stone-700 leading-relaxed overflow-y-auto flex-1 pr-2">
          {activeTab === 'terms' ? (
            <>
              {/* Critical Legal Disclaimer */}
              <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                  <AlertTriangle className="size-4 shrink-0 text-amber-700" />
                  <span>Điều Khoản Giới Hạn Trách Nhiệm & Chấp Thuận Thu Thập Nhật Ký (Liability Waiver)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Bằng việc đăng ký tài khoản, đăng nhập hoặc sử dụng UniSign, bạn xác nhận và đồng ý vô điều kiện rằng nền tảng được quyền thu thập, kiểm toán và xem xét các dữ liệu nhật ký kỹ thuật, lịch sử thao tác và tin nhắn theo quy định tại Chính sách Bảo mật nhằm phục vụ mục đích kiểm duyệt, an toàn hệ thống và tuân thủ pháp luật. Bạn từ bỏ mọi quyền khiếu nại hoặc khởi kiện đối với UniSign liên quan đến việc giám sát này.
                </p>
              </div>

              <section className="space-y-1.5">
                <h3 className="font-bold text-[#173e49] text-sm">1. Xác thực Mật khẩu qua TideCloak DPoP (Zero-Knowledge)</h3>
                <p>
                  UniSign sử dụng giao thức <strong>TideCloak (Skycloak Realm)</strong>. Mật khẩu của bạn được tạo và xác thực thông qua chữ ký phần cứng ECDSA P-256 (DPoP ES256). Hệ thống không bao giờ lưu trữ mật khẩu văn bản rõ (plaintext).
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-bold text-[#173e49] text-sm">2. Quy Định Phân Hạng Gói Người Dùng</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Gói Miễn Phí (Free Tier):</strong> Sử dụng TideCloak để bảo vệ mật khẩu. Người dùng chấp nhận rằng nội dung trao đổi không được mã hoá đầu-cuối (E2EE) và hệ thống lưu trữ nhật ký văn bản để phục vụ kiểm duyệt và đối soát vi phạm học thuật.
                  </li>
                  <li>
                    <strong>Gói Premium (100.000 VNĐ / tháng):</strong> Kích hoạt sơ đồ phân mảnh khóa 5-of-7 ORK trên 7 nút mạng toàn cầu và mã hoá client-side tin nhắn. Người dùng thừa nhận siêu dữ liệu mạng (IP, dấu thời gian, danh tính người gửi) vẫn được ghi nhận để đảm bảo an ninh mạng.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-bold text-[#173e49] text-sm">3. Phê Duyệt Tham Gia Nhóm Chat Bởi Quản Trị Viên</h3>
                <p>
                  Mọi nhóm chat/diễn đàn đều có tính bảo mật độc lập. Người dùng phải nộp đơn tham gia và được Quản trị viên (Admin) phê duyệt trước khi được cấp quyền đọc và gửi tin nhắn trong nhóm.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* Detailed Data Logging Policy Section */}
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3.5 text-red-950 space-y-1.5">
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-red-900">
                  <Lock className="size-4 text-red-700" />
                  Thông Báo Minh Bạch: Thu Thập & Xem Xét Nhật Ký Hoạt Động (Data Logs Disclosure)
                </h4>
                <p className="text-[11px] leading-relaxed text-red-900">
                  Nhằm bảo vệ môi trường học tập lành mạnh và tuân thủ các quy định pháp luật về an ninh mạng, UniSign duy trì cơ chế ghi nhận và xem xét dữ liệu hoạt động của người dùng như sau:
                </p>
              </div>

              <section className="space-y-1.5">
                <h3 className="font-bold text-[#173e49] text-sm">A. Đối với Người dùng Gói Miễn Phí (Free Tier Logs)</h3>
                <p>
                  Đối với tài khoản miễn phí, tin nhắn tại các phòng chat công khai và hồ sơ nhóm được lưu trữ dưới dạng bản ghi có thể kiểm tra (auditable logs). Đội ngũ quản trị viên và hệ thống tự động có quyền:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Xem lại nhật ký tin nhắn (chat logs) để xử lý các báo cáo vi phạm, quấy rối hoặc gian lận thi cử.</li>
                  <li>Lưu vết địa chỉ IP, định danh thiết bị, thời gian truy cập và thao tác nhóm.</li>
                  <li>Cung cấp dữ liệu theo yêu cầu hợp pháp của các cơ quan có thẩm quyền hoặc ban quản lý nhà trường.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-bold text-[#173e49] text-sm">B. Đối với Người dùng Gói Premium (Premium Tier Telemetry)</h3>
                <p>
                  Mặc dù nội dung tin nhắn được mã hoá client-side thông qua 5-of-7 ORK fragments, nền tảng vẫn lưu trữ và có thể kiểm tra:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nhật ký phiên kết nối, dấu vết thời gian gửi (timestamps) và dung lượng payload.</li>
                  <li>Nhật ký xác thực DPoP thumbprint nhằm phát hiện các hành vi tấn công giả mạo hoặc chiếm quyền tài khoản.</li>
                  <li>Bản ghi các nội dung bị thành viên khác gắn cờ báo cáo vi phạm (Reported Content).</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-bold text-[#173e49] text-sm">C. Cam Kết Miễn Trừ Trách Nhiệm Pháp Lý (Hold Harmless)</h3>
                <p>
                  Người dùng cam kết không khởi kiện, khiếu nại đòi bồi thường thiệt hại đối với UniSign, nhà phát triển hoặc đối tác vận hành liên quan đến bất kỳ hoạt động thu thập, trích xuất, hoặc xem xét dữ liệu nhật ký hợp lệ nào được quy định tại chính sách này.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[#0f4c5c] font-semibold">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Chấp thuận điều khoản là điều kiện bắt buộc để duy trì phiên kết nối</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (onDecline) {
                  onDecline();
                } else {
                  onClose();
                }
              }}
              className="flex-1 sm:flex-none rounded-xl border border-red-300 bg-red-50/60 px-3.5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-sm"
            >
              Từ chối & Ngắt kết nối
            </button>
            <button
              type="button"
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="flex-1 sm:flex-none rounded-xl bg-[#0f4c5c] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0b3b48] transition shadow-sm"
            >
              Tôi đã đọc & Hoàn toàn đồng ý
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
