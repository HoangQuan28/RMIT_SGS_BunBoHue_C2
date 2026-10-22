'use client';

import React, { FormEvent, useState } from 'react';
import {
  Hash,
  Headphones,
  Send,
  Users,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Pin,
  Smile,
  Reply,
  Search,
  X,
} from 'lucide-react';
import {
  tideDoDecrypt,
  tideDoEncrypt,
  TideCloakSession,
} from '@/lib/crypto/tideCloakService';
import { SupabaseGroup } from '@/components/discovery/SupabaseForumDiscovery';

interface CommunityChatProps {
  onBackToDiscovery: () => void;
  group: SupabaseGroup;
  onOpenVerify?: () => void;
  onOpenSubscription?: () => void;
  isVerified?: boolean;
  currentUser?: TideCloakSession | null;
}

interface ChatMessage {
  id: string;
  user: string;
  initials: string;
  tag: string;
  text: string;
  ciphertext?: string;
  shardBadge?: string;
  time: string;
  color: string;
  replyTo?: { id: string; user: string; text: string };
  reactions?: Record<string, number>;
}

export function CommunityChatView({
  onBackToDiscovery,
  group,
  onOpenVerify,
  onOpenSubscription,
  isVerified = false,
  currentUser,
}: CommunityChatProps) {
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [channels] = useState<string[]>(['general', 'study-sprint', 'resources']);
  const [pinnedMessage, setPinnedMessage] = useState<string | null>(
    `Chào mừng bạn đến với kênh thảo luận chính thức của ${group.name} (${group.university}). Vui lòng giữ văn minh học thuật.`
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [e2eeModalOpen, setE2eeModalOpen] = useState(false);

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    general: [
      {
        id: '1',
        user: 'Minh Quân',
        initials: 'MQ',
        tag: `${group.university} · Mod`,
        text: `Chào mừng bạn đến với nhóm chat của ${group.name}! Mọi người giới thiệu bản thân nhé.`,
        shardBadge: 'TideCloak 5-of-7 E2EE',
        time: '9:00 AM',
        color: 'bg-[#0f4c5c]',
        reactions: { '👍': 4, '🔥': 2 },
      },
      {
        id: '2',
        user: 'Thu Hà',
        initials: 'TH',
        tag: `${group.major} · Lead`,
        text: 'Nhóm mình chuẩn bị ôn tập và chia sẻ tài liệu đồ án tuần tới nha.',
        shardBadge: 'TideCloak 5-of-7 E2EE',
        time: '9:30 AM',
        color: 'bg-[#b85c38]',
        reactions: { '❤️': 3 },
      },
    ],
    'study-sprint': [
      {
        id: '3',
        user: 'Đức Anh',
        initials: 'DA',
        tag: `${group.university} · Sprint`,
        text: 'Hôm nay sprint học nhóm từ 19h - 22h tại Quiet Hall nhé.',
        shardBadge: 'TideCloak 5-of-7 E2EE',
        time: 'Yesterday',
        color: 'bg-[#7d8a68]',
        reactions: { '👏': 5 },
      },
    ],
    resources: [
      {
        id: '4',
        user: 'Bảo Nam',
        initials: 'BN',
        tag: `${group.major} · Mentor`,
        text: `Đã upload tài liệu và slide tham khảo của nhóm ${group.name} lên drive nội bộ.`,
        shardBadge: 'TideCloak 5-of-7 E2EE',
        time: 'Yesterday',
        color: 'bg-[#896b9b]',
      },
    ],
  });

  const [draft, setDraft] = useState('');
  const [membersOpen, setMembersOpen] = useState(true);
  const [showCipherPreview, setShowCipherPreview] = useState(false);

  const isPremium = currentUser?.tier === 'premium';
  const rawMessages = messages[activeChannel] || [];

  const filteredMessages = searchQuery.trim()
    ? rawMessages.filter(
        (m) =>
          m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.user.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rawMessages;

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages((prev) => ({
      ...prev,
      [activeChannel]: prev[activeChannel].map((m) => {
        if (m.id !== msgId) return m;
        const currentCount = m.reactions?.[emoji] || 0;
        return {
          ...m,
          reactions: {
            ...m.reactions,
            [emoji]: currentCount + 1,
          },
        };
      }),
    }));
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const plainText = draft.trim();
    setDraft('');
    const currentReply = replyTarget;
    setReplyTarget(null);

    let ciphertext: string | undefined;
    let decryptedText = plainText;
    let shardBadge: string | undefined;

    // Enforce Rule: Only Premium subscribers unlock TideCloak Chat Logs E2EE
    if (isPremium && currentUser) {
      const [enc] = await tideDoEncrypt(
        [{ data: plainText, tags: [`group:${group.id}:ch:${activeChannel}`] }],
        currentUser
      );
      ciphertext = enc;
      const [dec] = await tideDoDecrypt(
        [{ encrypted: enc, tags: [`group:${group.id}:ch:${activeChannel}`] }],
        currentUser
      );
      decryptedText = dec;
      shardBadge = 'TideCloak 5-of-7 E2EE';
    }

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      user: currentUser?.pseudonym || (isVerified ? 'You (Verified Member)' : 'You (Member)'),
      initials: currentUser?.email ? currentUser.email.slice(0, 2).toUpperCase() : 'US',
      tag: isPremium
        ? `${group.university} · 5-of-7 Premium`
        : 'Free Tier · Password Auth Only',
      text: decryptedText,
      ciphertext,
      shardBadge,
      time: 'Vừa xong',
      color: 'bg-[#0f4c5c]',
      replyTo: currentReply
        ? { id: currentReply.id, user: currentReply.user, text: currentReply.text }
        : undefined,
    };

    setMessages((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg],
    }));
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#faf8f5] text-[#263337]">
      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#ded9d0] bg-[#fffdfa] px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDiscovery}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#f6f4ef] px-3 py-1.5 text-xs font-semibold text-[#0f4c5c] hover:bg-stone-200 transition"
          >
            <ChevronLeft className="size-4" />
            <span>Tất cả nhóm</span>
          </button>
          <div className="h-4 w-px bg-stone-300" />
          <div className="flex items-center gap-2.5">
            <div className={`grid size-9 place-items-center rounded-xl text-xs font-bold ${group.color}`}>
              {group.mark}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold text-[#173e49] tracking-tight">
                  {group.name}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {group.university} Group Chat
                </span>
              </div>
              <p className="text-[11px] text-stone-500 line-clamp-1">
                {group.members_count.toLocaleString()} thành viên đã tham gia
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-stone-500">
          {/* Channel Message Search Input (Telegram inspired) */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tin nhắn..."
              className="rounded-xl border border-stone-200 bg-[#faf8f5] py-1.5 pl-8 pr-7 text-xs outline-none focus:border-[#0f4c5c] w-36 focus:w-52 transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-stone-400 hover:text-stone-600"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {!isPremium && (
            <button
              onClick={onOpenSubscription}
              className="flex items-center gap-1.5 rounded-xl bg-[#c65b48] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#b04f3d] transition"
            >
              <Sparkles className="size-3.5" />
              <span>Nâng cấp 100k</span>
            </button>
          )}

          <button
            onClick={() => setShowCipherPreview(!showCipherPreview)}
            className="flex items-center gap-1 rounded-xl border border-stone-200 bg-[#faf8f5] px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:border-[#0f4c5c] hover:text-[#0f4c5c] transition"
            title="Toggle viewing decrypted text vs zero-knowledge ciphertext"
          >
            {showCipherPreview ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <span>{showCipherPreview ? 'Xem Plaintext' : 'Kiểm tra E2EE'}</span>
          </button>
          <button
            onClick={() => setMembersOpen(!membersOpen)}
            className="rounded-lg p-2 hover:bg-[#f1eee7] transition"
            title="Toggle Members"
          >
            <Users className="size-4 text-stone-600" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex min-h-0 flex-1">
        {/* Left Sub-channels Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#ded9d0] bg-[#f7f5f0] p-4 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Kênh thảo luận nhóm
              </p>
              <div className="mt-2 space-y-1">
                {channels.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setActiveChannel(ch)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeChannel === ch
                        ? 'bg-[#0f4c5c] text-white shadow-sm'
                        : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                    }`}
                  >
                    <Hash className="size-3.5 opacity-70" />
                    <span>#{ch}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Phòng học trực tuyến
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-stone-600 bg-white/60 border border-stone-200/70">
                  <Headphones className="size-3.5 text-emerald-600" />
                  <span>{group.university} Study Hall</span>
                  <span className="ml-auto text-[10px] font-bold text-emerald-600">4 online</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ded9d0] bg-[#fffdfa] p-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-xl bg-[#0f4c5c] text-xs font-bold text-white shadow-sm">
                {currentUser?.email ? currentUser.email.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-xs font-bold text-[#173e49] truncate">
                  {currentUser?.pseudonym || 'Thành viên nhóm'}
                </p>
                <p className="text-[10px] font-medium truncate text-stone-500">
                  {isPremium ? (
                    <span className="text-[#0f4c5c] font-bold">★ Premium (E2EE Chat)</span>
                  ) : (
                    <span>Free Plan (Tide Password Only)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Chat Feed */}
        <section className="flex min-w-0 flex-1 flex-col justify-between bg-white">
          {/* Channel Description & Pinned Bar */}
          <div>
            <div className="flex h-12 items-center justify-between border-b border-stone-100 px-6 text-xs text-stone-500">
              <div className="flex items-center min-w-0">
                <Hash className="size-4 mr-1 text-stone-400 shrink-0" />
                <span className="font-bold text-stone-700 mr-2 text-sm">#{activeChannel}</span>
                <span className="text-stone-400 truncate">— Thảo luận riêng tư cho {group.name}</span>
              </div>

              {isPremium ? (
                <button
                  type="button"
                  onClick={() => setE2eeModalOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold bg-[#edf7f4] text-[#0f4c5c] border border-[#b8d8d2] hover:bg-[#dceeea] transition cursor-pointer shadow-sm"
                  title="Nhấn để xem giải thích bảo mật 5-of-7 ORK"
                >
                  <Lock className="size-3" />
                  <span>TideCloak 5-of-7 E2EE Active</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenSubscription}
                  className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-sm"
                >
                  <Lock className="size-3 text-amber-600" />
                  <span>Chat Logs E2EE Locked (Gói Free)</span>
                  <ArrowRight className="size-3" />
                </button>
              )}
            </div>

            {/* Telegram/Discord-inspired Pinned Message Bar */}
            {pinnedMessage && (
              <div className="bg-[#faf8f5] border-b border-stone-100 px-6 py-2 text-[11px] text-stone-600 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Pin className="size-3.5 text-[#0f4c5c] shrink-0" />
                  <span className="font-bold text-[#173e49] shrink-0">Ghim:</span>
                  <span className="truncate">{pinnedMessage}</span>
                </div>
                <button
                  onClick={() => setPinnedMessage(null)}
                  className="text-stone-400 hover:text-stone-600 ml-2"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredMessages.map((m) => (
              <div key={m.id} className="flex items-start gap-3.5 group">
                <div
                  className={`grid size-10 shrink-0 place-items-center rounded-xl font-bold text-xs text-white shadow-sm ${m.color}`}
                >
                  {m.initials}
                </div>
                <div className="min-w-0 flex-1">
                  {/* Quoted Reply Preview */}
                  {m.replyTo && (
                    <div className="mb-1 text-[11px] text-stone-500 border-l-2 border-[#0f4c5c] pl-2 flex items-center gap-1">
                      <Reply className="size-3 text-[#0f4c5c]" />
                      <span className="font-semibold text-stone-700">{m.replyTo.user}:</span>
                      <span className="truncate">{m.replyTo.text}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs font-bold text-[#173e49]">{m.user}</span>
                    <span className="text-[10px] font-medium text-stone-400">{m.tag}</span>
                    {m.shardBadge && (
                      <span className="rounded-md bg-[#edf7f4] border border-[#b8d8d2] px-1.5 py-0.5 text-[9px] font-bold text-[#0f4c5c]">
                        {m.shardBadge}
                      </span>
                    )}
                    <span className="text-[10px] text-stone-400">{m.time}</span>
                  </div>

                  <div className="mt-1 text-xs leading-5 text-stone-700 bg-[#faf8f5] p-3 rounded-2xl border border-stone-100 max-w-2xl relative group/msg">
                    <p>{m.text}</p>
                    {showCipherPreview && m.ciphertext && (
                      <p className="mt-2 pt-2 border-t border-stone-200/70 font-mono text-[10px] text-stone-400 break-all">
                        Ciphertext: {m.ciphertext}
                      </p>
                    )}

                    {/* Discord/Telegram Action Floating Toolbar (Reactions & Reply) */}
                    <div className="absolute right-2 -top-3 hidden group-hover/msg:flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-1.5 py-0.5 shadow-sm">
                      {['👍', '❤️', '🔥', '👏'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddReaction(m.id, emoji)}
                          className="text-xs hover:scale-125 transition px-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                      <div className="h-3 w-px bg-stone-200 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => setReplyTarget(m)}
                        className="text-stone-500 hover:text-[#0f4c5c] p-0.5"
                        title="Trả lời"
                      >
                        <Reply className="size-3" />
                      </button>
                    </div>

                    {/* Reaction Badges */}
                    {m.reactions && Object.keys(m.reactions).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(m.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleAddReaction(m.id, emoji)}
                            className="rounded-full bg-white border border-stone-200 px-2 py-0.5 text-[10px] text-stone-600 font-semibold flex items-center gap-1 hover:border-[#0f4c5c] transition"
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Banner Preview */}
          {replyTarget && (
            <div className="bg-[#edf7f4] border-t border-[#b8d8d2] px-6 py-2 text-xs text-[#0f4c5c] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="size-3.5 shrink-0" />
                <span>
                  Đang trả lời <strong>{replyTarget.user}</strong>: &ldquo;{replyTarget.text}&rdquo;
                </span>
              </div>
              <button onClick={() => setReplyTarget(null)} className="text-[#0f4c5c] hover:text-[#0b3b48]">
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 sm:p-6 border-t border-stone-100">
            <div className="flex items-center gap-3 rounded-2xl border border-stone-300 bg-[#faf8f5] px-4 py-2.5 focus-within:border-[#0f4c5c] focus-within:ring-4 focus-within:ring-[#dceeea] transition">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  isPremium
                    ? `Nhắn tin trong #${activeChannel} (${group.name} - E2EE 5-of-7 ORK)...`
                    : `Nhắn tin trong #${activeChannel} (Gói Free - Mật khẩu Tide)...`
                }
                className="flex-1 bg-transparent text-xs outline-none text-stone-800 placeholder:text-stone-400"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="grid size-8 place-items-center rounded-xl bg-[#0f4c5c] text-white disabled:opacity-30 hover:bg-[#0b3b48] transition shadow-sm"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </section>

        {/* Right Members Drawer */}
        {membersOpen && (
          <aside className="w-56 shrink-0 border-l border-[#ded9d0] bg-[#fbf9f6] p-4 overflow-y-auto">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">
              Thành viên ({group.university})
            </p>
            <div className="space-y-1.5">
              {[
                { name: 'Minh Quân', note: `${group.university} · Mod`, inits: 'MQ', col: 'bg-[#0f4c5c]' },
                { name: 'Thu Hà', note: `${group.major} · Premium`, inits: 'TH', col: 'bg-[#b85c38]' },
                { name: 'Đức Anh', note: `${group.university} · Student`, inits: 'DA', col: 'bg-[#7d8a68]' },
                { name: 'Bảo Nam', note: `${group.university} · Member`, inits: 'BN', col: 'bg-[#896b9b]' },
              ].map((member, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-stone-200/50 transition"
                >
                  <div
                    className={`grid size-8 place-items-center rounded-xl text-xs font-bold text-white shadow-sm ${member.col}`}
                  >
                    {member.inits}
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-xs font-semibold text-[#173e49] truncate">{member.name}</p>
                    <p className="text-[10px] text-stone-400 truncate">{member.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* 5-of-7 ORK E2EE Detailed Explanation Modal for Premium Users */}
      {e2eeModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#173e49]/40 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setE2eeModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl text-[#263238]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-[#0f4c5c] text-white">
                  <Lock className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#173e49] text-base">TideCloak 5-of-7 E2EE Active</h3>
                  <p className="text-[11px] text-stone-500">Bảo vệ dữ liệu hội thoại cấp lượng tử cho Premium</p>
                </div>
              </div>
              <button
                onClick={() => setE2eeModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-stone-600">
              <div className="p-3.5 rounded-2xl bg-[#edf7f4] border border-[#b8d8d2] text-[#0f4c5c] leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="size-4" />
                  <span>Tính năng này làm gì cho bạn?</span>
                </p>
                <p>
                  Mọi tin nhắn của bạn trong nhóm được <strong>mã hoá đầu cuối (E2EE)</strong> trực tiếp trong trình duyệt trước khi gửi. Máy chủ WhisperSync hay bất kỳ ai ở giữa đều <strong>hoàn toàn không thể đọc lén</strong> nội dung trò chuyện.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                  Cơ chế phân mảnh 5-of-7 ORK Nodes:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-bold text-stone-800 block mb-0.5">7 Nút mạng toàn cầu</span>
                    <span className="text-stone-500">Khóa giải mã chia thành 7 mảnh: Singapore, Tokyo, Frankfurt, Stockholm, Virginia, Oregon, Sydney.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-bold text-stone-800 block mb-0.5">Ngưỡng 5/7 đồng thuận</span>
                    <span className="text-stone-500">Cần tối thiểu 5 mảnh xác thực phần cứng DPoP để giải mã. Dù 2 nút bị hack vẫn an toàn 100%.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>So sánh với Gói Free:</strong> Người dùng Free không có tính năng này (tin nhắn lưu dạng nhật ký thông thường để trường học kiểm duyệt nội dung vi phạm). Premium mở khóa hoàn toàn quyền riêng tư tuyệt đối này.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setE2eeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0f4c5c] text-white text-xs font-bold hover:bg-[#0b3b48] transition shadow-sm"
              >
                Đã hiểu & Tiếp tục trò chuyện
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
