"use client";

import React, { useState, useEffect } from "react";
import { RankedGroup } from "@/lib/search/semanticService";
import { SupabaseForumDiscovery, SupabaseGroup } from "@/components/discovery/SupabaseForumDiscovery";
import { CreateGroupModal } from "@/components/discovery/CreateGroupModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { VerifyView } from "@/components/verify/VerifyView";
import { CommunityChatView } from "@/components/chat/CommunityChatView";
import { QuestionnaireModal } from "@/components/discovery/QuestionnaireModal";
import { NotificationDrawer, NotificationItem } from "@/components/notifications/NotificationDrawer";
import { ApplicationDetailModal } from "@/components/discovery/ApplicationDetailModal";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { TermsModal } from "@/components/legal/TermsModal";
import {
  clearSavedTideSession,
  createTideSession,
  loadSavedTideSession,
  TideCloakSession,
} from "@/lib/crypto/tideCloakService";

const MEMBERSHIP_STORAGE_KEY = 'unisign_memberships_v2';
const VERIFIED_STORAGE_KEY = 'unisign_verified_status_v2';

export default function Home() {
  // Modals & Application Flow
  const [selectedGroupForApply, setSelectedGroupForApply] = useState<RankedGroup | null>(null);
  const [applicationSuccessToast, setApplicationSuccessToast] = useState<string | null>(null);

  // Community Creation & TideCloak Auth State
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<TideCloakSession | null>(null);

  // Academic verification: strictly FALSE by default until OTP is verified
  const [isVerified, setIsVerified] = useState(false);

  // Membership map: groupId -> 'joined' | 'pending_approval' | 'none'
  const [membershipMap, setMembershipMap] = useState<Record<string, 'joined' | 'pending_approval' | 'none'>>({
    'grp-hcmut-dev': 'joined', // Initial joined demo group for HCMUT lead
  });

  // Group Chat state: distinct group chat ONLY accessible when membership status is 'joined'
  const [activeGroupChat, setActiveGroupChat] = useState<SupabaseGroup | null>(null);
  const [isVerifyViewOpen, setIsVerifyViewOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [activeApplicationDetail, setActiveApplicationDetail] = useState<any | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Load persisted membership records
    try {
      const savedMemberships = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
      if (savedMemberships) {
        setMembershipMap(JSON.parse(savedMemberships));
      }
      const savedVerified = localStorage.getItem(VERIFIED_STORAGE_KEY);
      if (savedVerified === 'true') {
        setIsVerified(true);
      } else {
        setIsVerified(false); // Strictly unverified until OTP check
      }
    } catch {
      // Ignore
    }

    const saved = loadSavedTideSession();
    if (saved) {
      setCurrentUser(saved);
    }
  }, []);

  const handleApplicationSubmitted = (groupId: string) => {
    setMembershipMap((prev) => {
      const updated: Record<string, 'joined' | 'pending_approval' | 'none'> = {
        ...prev,
        [groupId]: 'pending_approval',
      };
      try {
        localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
    setApplicationSuccessToast("Đơn tham gia đã gửi đến Admin nhóm! Vui lòng chờ phê duyệt để vào chat.");
  };

  const handleAdminApprove = (groupId: string) => {
    setMembershipMap((prev) => {
      const updated: Record<string, 'joined' | 'pending_approval' | 'none'> = {
        ...prev,
        [groupId]: 'joined',
      };
      try {
        localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
    setApplicationSuccessToast("Admin đã phê duyệt đơn! Group chat của nhóm đã được mở.");
  };

  const handleLogOut = () => {
    clearSavedTideSession();
    setCurrentUser(null);
    setIsVerified(false);
    setActiveGroupChat(null);
    try {
      localStorage.removeItem(VERIFIED_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setApplicationSuccessToast("Đã đăng xuất khỏi phiên TideCloak thành công.");
  };

  const handleOpenNotification = async (notif: NotificationItem) => {
    try {
      if (!notif.read) {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
        fetchNotifications();
      }
      const res = await fetch(`/api/applications/${notif.applicationId}`);
      const data = await res.json();
      if (data.success) {
        setActiveApplicationDetail(data.application);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#faf8f5] text-[#263238]">
      {/* Application Success Toast */}
      {applicationSuccessToast && (
        <div className="bg-[#e1f0ed] border-b border-[#0f4c5c]/20 px-4 py-2.5 text-xs text-[#0f4c5c] flex items-center justify-between">
          <span>
            <strong>UniSign:</strong> {applicationSuccessToast}
          </span>
          <button
            onClick={() => setApplicationSuccessToast(null)}
            className="text-xs font-semibold underline text-[#0f4c5c] hover:text-[#0b3b48]"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {isVerifyViewOpen ? (
          <VerifyView
            onVerified={async (email) => {
              const sess = await createTideSession({
                email,
                fullName: currentUser?.fullName || email.split("@")[0],
                tier: currentUser?.tier || "standard",
              });
              setCurrentUser(sess);
              setIsVerified(true);
              try {
                localStorage.setItem(VERIFIED_STORAGE_KEY, 'true');
              } catch {
                // Ignore
              }
              setIsVerifyViewOpen(false);
              setApplicationSuccessToast(
                `Đã xác thực thành công email sinh viên: ${email}`
              );
            }}
            onBackToApp={() => setIsVerifyViewOpen(false)}
          />
        ) : activeGroupChat ? (
          <CommunityChatView
            group={activeGroupChat}
            isVerified={isVerified}
            currentUser={currentUser}
            onOpenVerify={() => setIsVerifyViewOpen(true)}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onBackToDiscovery={() => setActiveGroupChat(null)}
          />
        ) : (
          <SupabaseForumDiscovery
            currentUser={currentUser}
            isVerified={isVerified}
            membershipMap={membershipMap}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenVerify={() => setIsVerifyViewOpen(true)}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onOpenTerms={() => setIsTermsOpen(true)}
            onLogOut={handleLogOut}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenGroupChat={(grp) => {
              // Access Gating Rule: Only approved/joined members can enter chat
              if (membershipMap[grp.id] === 'joined') {
                setActiveGroupChat(grp);
              } else if (membershipMap[grp.id] === 'pending_approval') {
                setApplicationSuccessToast("Đơn của bạn đang chờ Admin nhóm phê duyệt.");
              } else {
                setSelectedGroupForApply({
                  id: grp.id,
                  name: grp.name,
                  description: grp.description,
                  adminId: "admin-1",
                  tags: grp.tags,
                  university: grp.university,
                  memberCount: grp.members_count,
                  semanticScore: 1.0,
                  matchingTagCount: grp.tags?.length || 0,
                });
              }
            }}
            onApplyGroup={(supabaseGrp: SupabaseGroup) => {
              setSelectedGroupForApply({
                id: supabaseGrp.id,
                name: supabaseGrp.name,
                description: supabaseGrp.description,
                adminId: "admin-1",
                tags: supabaseGrp.tags,
                university: supabaseGrp.university,
                memberCount: supabaseGrp.members_count,
                semanticScore: 1.0,
                matchingTagCount: supabaseGrp.tags?.length || 0,
              });
            }}
            onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
            unreadNotificationsCount={unreadNotifsCount}
          />
        )}
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(session) => {
          setCurrentUser(session);
          setApplicationSuccessToast(
            `Đăng nhập thành công với TideCloak Password Authentication (${session.thresholdM}-of-${session.totalFragmentsN} shards)`
          );
        }}
      />

      {currentUser && (
        <SubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
          session={currentUser}
          onPlanUpdated={(updated) => {
            setCurrentUser(updated);
            setApplicationSuccessToast(
              updated.tier === 'premium'
                ? 'Đã xác nhận thanh toán 100.000 VNĐ! Kích hoạt TideCloak 5-of-7 ORK E2EE.'
                : 'Đã chuyển về gói Miễn Phí (Chỉ dùng TideCloak cho mật khẩu).'
            );
          }}
        />
      )}

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(newGrp) => {
          setApplicationSuccessToast(`Đã tạo nhóm ${newGrp.name} thành công! Bạn là Admin của nhóm này.`);
          // Creator is automatically approved admin
          handleAdminApprove(newGrp.id);
          setActiveGroupChat({
            id: newGrp.id,
            name: newGrp.name,
            description: newGrp.description || '',
            members_count: 1,
            tags: newGrp.tags || [],
            color: 'bg-[#e5f3f0] text-[#0f4c5c]',
            mark: newGrp.name.slice(0, 2).toUpperCase(),
            country: 'Vietnam',
            university: currentUser?.university || 'HCMUT',
            major: 'General',
            level: 'Undergraduate',
            banner_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
          });
        }}
      />

      <QuestionnaireModal
        group={selectedGroupForApply}
        currentUser={currentUser}
        onClose={() => setSelectedGroupForApply(null)}
        onSuccess={() => {
          if (selectedGroupForApply) {
            handleApplicationSubmitted(selectedGroupForApply.id);
          }
          setSelectedGroupForApply(null);
          fetchNotifications();
        }}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onSelectNotification={handleOpenNotification}
      />

      <ApplicationDetailModal
        application={activeApplicationDetail}
        onClose={() => setActiveApplicationDetail(null)}
      />

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAccept={() => {
          setApplicationSuccessToast("Đã ghi nhận sự đồng thuận với Điều khoản TideCloak!");
        }}
        onDecline={() => {
          clearSavedTideSession();
          setCurrentUser(null);
          setIsVerified(false);
          setActiveGroupChat(null);
          try {
            localStorage.removeItem(VERIFIED_STORAGE_KEY);
          } catch {
            // Ignore
          }
          setIsTermsOpen(false);
          setApplicationSuccessToast("Bạn đã từ chối Điều khoản dịch vụ. Phiên làm việc đã bị ngắt kết nối (Disconnected).");
        }}
      />
    </div>
  );
}
