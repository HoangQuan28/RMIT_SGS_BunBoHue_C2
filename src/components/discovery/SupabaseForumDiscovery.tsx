'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronDown, Layers3, Menu, Search, SlidersHorizontal, Sparkles, Users, X, Loader2, ShieldCheck, Lock, CheckCircle2, MessageSquare, Clock, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { TideCloakSession } from '@/lib/crypto/tideCloakService'
import { SUPPORTED_UNIVERSITIES, detectUniversityFromEmail } from '@/lib/constants/universities'
import { FALLBACK_UNI_GROUPS } from '@/lib/constants/fallbackGroups'

export type SupabaseGroup = {
  id: string
  name: string
  description: string
  members_count: number
  tags: string[]
  color: string
  mark: string
  country: string
  university: string
  major: string
  level: string
  banner_url?: string
}

const filterOptions = {
  country: ['All countries', 'Vietnam', 'United States', 'Singapore', 'Australia', 'Global'],
  university: [
    'All universities',
    ...SUPPORTED_UNIVERSITIES.map((u) => u.shortName.split(' ')[0]),
    'NUS',
    'UNSW',
    'RMIT',
  ],
  major: ['All majors', 'CS / IT', 'Business', 'Design', 'Engineering', 'Data Science'],
  level: ['All levels', 'Undergraduate', 'Grad / PhD', 'Freshman', 'Open to everyone'],
}

interface SupabaseForumDiscoveryProps {
  onApplyGroup?: (group: SupabaseGroup) => void
  onOpenNotifications?: () => void
  onOpenCreateGroup?: () => void
  onOpenAuth?: () => void
  onOpenVerify?: () => void
  onOpenSubscription?: () => void
  onOpenTerms?: () => void
  onLogOut?: () => void
  onOpenGroupChat?: (group: SupabaseGroup) => void
  currentUser?: TideCloakSession | null
  isVerified?: boolean
  unreadNotificationsCount?: number
  membershipMap: Record<string, 'joined' | 'pending_approval' | 'none'>
}

export function SupabaseForumDiscovery({
  onApplyGroup,
  onOpenNotifications,
  onOpenCreateGroup,
  onOpenAuth,
  onOpenVerify,
  onOpenSubscription,
  onOpenTerms,
  onLogOut,
  onOpenGroupChat,
  currentUser,
  isVerified = false,
  unreadNotificationsCount = 0,
  membershipMap = {},
}: SupabaseForumDiscoveryProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userStatus, setUserStatus] = useState<'online' | 'away'>('online')
  const [groups, setGroups] = useState<SupabaseGroup[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filters, setFilters] = useState({
    country: 'All countries',
    university: 'All universities',
    major: 'All majors',
    level: 'All levels',
  })
  const [mobileNav, setMobileNav] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<SupabaseGroup | null>(null)

  // Detect user's affiliated university from verified email
  const userUni = useMemo(() => {
    if (!currentUser?.email) return null
    return detectUniversityFromEmail(currentUser.email)
  }, [currentUser])

  // Fetch live from Supabase & combine with comprehensive university groups
  const loadData = async () => {
    try {
      setLoading(true)
      const [groupsRes, topicsRes] = await Promise.all([
        supabase.from('groups').select('*').order('members_count', { ascending: false }),
        supabase.from('discussion_topics').select('tag').order('occurrence_count', { ascending: false }),
      ])

      const fetchedGroups = (groupsRes.data as SupabaseGroup[]) || []
      const mergedMap = new Map<string, SupabaseGroup>()

      // Add database groups
      for (const g of fetchedGroups) {
        mergedMap.set(g.name.toLowerCase().trim(), g)
      }
      // Add supported Vietnamese university groups with high-resolution forum images
      for (const g of FALLBACK_UNI_GROUPS) {
        mergedMap.set(g.name.toLowerCase().trim(), g)
      }

      const combined = Array.from(mergedMap.values())
      setGroups(combined)

      if (topicsRes.data && topicsRes.data.length > 0) {
        setAvailableTags(topicsRes.data.map((t) => t.tag))
      } else {
        const tagSet = new Set<string>()
        combined.forEach((g) => (g.tags || []).forEach((t) => tagSet.add(t)))
        setAvailableTags(Array.from(tagSet).slice(0, 12))
      }
    } catch (err) {
      console.error('Failed to load groups from Supabase:', err)
      setGroups(FALLBACK_UNI_GROUPS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Smart University Recommendation Engine (FatMan recommendation pattern)
  const recommendedGroups = useMemo(() => {
    if (!userUni) return []
    const uniCode = userUni.code.toLowerCase()
    return groups.filter((g) => {
      const text = `${g.name} ${g.description} ${g.university} ${(g.tags || []).join(' ')}`.toLowerCase()
      return text.includes(uniCode) || text.includes(userUni.shortName.toLowerCase())
    })
  }, [groups, userUni])

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const text = `${group.name} ${group.description} ${(group.tags || []).join(' ')} ${group.country} ${group.university} ${group.major}`.toLowerCase()
      return (
        (!query || text.includes(query.toLowerCase())) &&
        (!selectedTags.length || selectedTags.every((tag) => (group.tags || []).includes(tag))) &&
        (filters.country === 'All countries' || group.country === filters.country) &&
        (filters.university === 'All universities' ||
          group.university.toLowerCase().includes(filters.university.toLowerCase())) &&
        (filters.major === 'All majors' || group.major === filters.major) &&
        (filters.level === 'All levels' || group.level === filters.level)
      )
    })
  }, [groups, query, selectedTags, filters])

  const activeFilters =
    Object.values(filters).filter((value) => !value.startsWith('All')).length +
    selectedTags.length +
    (query ? 1 : 0)

  const resetFilters = () => {
    setQuery('')
    setSelectedTags([])
    setFilters({ country: 'All countries', university: 'All universities', major: 'All majors', level: 'All levels' })
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#faf8f5] text-[#263238] overflow-y-auto">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#faf8f5]/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#0f4c5c] text-white shadow-sm font-bold">
              <Layers3 className="size-5" />
            </div>
            <div>
              <span className="font-semibold tracking-[-0.02em] text-[#173e49]">UniSign Forum</span>
              <p className="text-[10px] text-stone-500 font-medium hidden sm:block">
                Diễn đàn sinh viên & Nhóm chat bảo mật qua TideCloak
              </p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Toggle navigation"
          >
            <Menu />
          </button>
          <nav
            className={cn(
              'absolute left-0 top-[68px] w-full border-b border-stone-200 bg-[#faf8f5] p-4 md:static md:flex md:w-auto md:items-center md:gap-3.5 md:border-0 md:p-0',
              mobileNav ? 'flex flex-col gap-4' : 'hidden'
            )}
          >
            <button className="font-semibold text-[#0f4c5c]">Khám phá nhóm</button>
            <button
              onClick={onOpenTerms}
              className="text-stone-600 hover:text-[#0f4c5c] font-medium text-xs transition"
            >
              Điều khoản
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-[#0f4c5c] hover:text-[#0f4c5c] transition"
            >
              + Tạo nhóm mới
            </button>
            {isVerified ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 className="size-3.5" /> {userUni?.code.toUpperCase()} Đã xác thực
              </span>
            ) : (
              <button
                onClick={onOpenVerify}
                className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition"
              >
                Xác thực thẻ SV (.edu)
              </button>
            )}
            <div className="h-5 w-px bg-stone-300 hidden md:block" />
            {currentUser && currentUser.tier !== 'premium' && (
              <button
                onClick={onOpenSubscription}
                className="flex items-center gap-1.5 rounded-xl bg-[#c65b48] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#b04f3d] transition"
              >
                <Sparkles className="size-3.5" />
                <span>Nâng cấp 100k</span>
              </button>
            )}
            <button
              onClick={onOpenNotifications}
              className="relative rounded-lg p-2 text-stone-500 hover:bg-white transition"
              aria-label="Notifications"
            >
              <Bell className="size-[19px]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500" />
              )}
            </button>
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-1 group"
                  title={`Đã đăng nhập: ${currentUser.email}`}
                >
                  <div className="relative">
                    <div className="grid size-8 place-items-center rounded-xl bg-[#0f4c5c] font-bold text-xs text-white shadow-sm">
                      {currentUser.email ? currentUser.email.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white ${
                        userStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <ChevronDown className="size-3 text-stone-400 group-hover:text-stone-600 transition" />
                </button>

                {/* Profile & Log Out Dropdown (Telegram/Discord inspired) */}
                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-2xl border border-stone-200 bg-white p-2.5 shadow-xl text-xs z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2 py-1.5 border-b border-stone-100">
                      <p className="font-bold text-[#173e49] truncate">{currentUser.pseudonym}</p>
                      <p className="text-[10px] text-stone-400 truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="rounded bg-[#edf7f4] border border-[#b8d8d2] px-1.5 py-0.5 text-[9px] font-bold text-[#0f4c5c]">
                          {currentUser.tier === 'premium' ? '★ Premium (100k)' : 'Free Tier'}
                        </span>
                        <span className="text-[10px] text-stone-500">{currentUser.university}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <div className="px-2 py-1 flex items-center justify-between text-[11px] text-stone-500">
                        <span>Trạng thái:</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setUserStatus('online')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                              userStatus === 'online'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-stone-400 hover:text-stone-600'
                            }`}
                          >
                            Online
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserStatus('away')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                              userStatus === 'away'
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-stone-400 hover:text-stone-600'
                            }`}
                          >
                            Away
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false)
                          if (onLogOut) onLogOut()
                        }}
                        className="w-full rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                      >
                        <LogOut className="size-3.5" />
                        <span>Đăng xuất (Log Out)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="rounded-xl bg-[#0f4c5c] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0b3b48] transition"
              >
                Đăng nhập TideCloak
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <section className="border-b border-stone-200/80 bg-gradient-to-b from-[#f5f0e9]/50 to-transparent">
          <div className="mx-auto max-w-[1020px] px-5 pb-8 pt-10 text-center sm:pt-12">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#b8d8d2] bg-[#edf7f4] px-3 py-1.5 text-[11px] font-semibold text-[#0f4c5c]">
              <Sparkles className="size-3.5" /> Phê duyệt bởi Admin nhóm & Bảo vệ bởi TideCloak
            </div>
            <h1 className="mx-auto max-w-[720px] text-4xl font-semibold tracking-[-0.055em] text-[#173e49] sm:text-5xl">
              UniSign - <span className="font-serif italic text-[#c65b48]">Chúng ta cùng tiến</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[580px] text-[15px] leading-6 text-stone-600">
              Mỗi diễn đàn là một nhóm chat riêng biệt. Thành viên cần nộp đơn tham gia và được Admin duyệt hoặc đạt biểu quyết trước khi mở khóa kênh chat.
            </p>

            {/* Search Input */}
            <div className="mx-auto mt-6 flex max-w-[720px] items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-left shadow-[0_8px_24px_rgba(77,57,35,0.09)] focus-within:border-[#0f4c5c] focus-within:ring-4 focus-within:ring-[#dceeea]">
              <Search className="size-5 shrink-0 text-[#0f4c5c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kiếm nhóm theo trường (HCMUT, UIT, HUST, NEU, FTU, UEH...)"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-stone-400"
                aria-label="Search groups"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search">
                  <X className="size-4 text-stone-400" />
                </button>
              )}
              <button className="hidden rounded-xl bg-[#0f4c5c] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0b3b48] sm:block">
                Tìm kiếm
              </button>
            </div>

            {/* Clickable Topics Tag Cloud */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 text-xs font-medium text-stone-500">Chủ đề phổ biến:</span>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTags((current) =>
                      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
                    )
                  }
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    selectedTags.includes(tag)
                      ? 'border-[#0f4c5c] bg-[#e1f0ed] text-[#0f4c5c]'
                      : 'border-stone-300 bg-white/70 text-stone-600 hover:border-[#d97a68] hover:text-[#b64738]'
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* University Recommendations Section */}
        {recommendedGroups.length > 0 && (
          <section className="mx-auto max-w-[1240px] px-5 pt-7 lg:px-8">
            <div className="rounded-2xl border border-[#b8d8d2] bg-[#edf7f4]/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-xl bg-[#0f4c5c] text-white shadow-sm font-bold text-xs">
                    ★
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#173e49]">
                      Đề xuất cho trường của bạn ({userUni?.shortName})
                    </h3>
                    <p className="text-xs text-stone-600">
                      Các nhóm học tập, đồ án và nghiên cứu sinh viên {userUni?.name}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#0f4c5c] px-2.5 py-0.5 text-xs font-bold text-white">
                  {recommendedGroups.length} nhóm liên quan
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedGroups.slice(0, 3).map((grp) => {
                  const status = membershipMap[grp.id] || 'none'
                  return (
                    <div
                      key={grp.id}
                      className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn('grid size-8 place-items-center rounded-lg text-xs font-bold', grp.color)}>
                            {grp.mark}
                          </span>
                          <span className="text-[11px] font-bold text-[#0f4c5c]">
                            {grp.members_count.toLocaleString()} thành viên
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#173e49]">{grp.name}</h4>
                        <p className="mt-1 line-clamp-2 text-xs text-stone-600 leading-relaxed">
                          {grp.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        {status === 'joined' ? (
                          <button
                            type="button"
                            onClick={() => onOpenGroupChat && onOpenGroupChat(grp)}
                            className="w-full rounded-xl bg-[#0f4c5c] py-2 text-xs font-bold text-white hover:bg-[#0b3b48] flex items-center justify-center gap-1.5 transition"
                          >
                            <MessageSquare className="size-3.5" />
                            <span>Vào Group Chat</span>
                          </button>
                        ) : status === 'pending_approval' ? (
                          <div className="w-full rounded-xl bg-amber-50 border border-amber-200 py-2 text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5">
                            <Clock className="size-3.5 text-amber-600" />
                            <span>Đang chờ Admin duyệt</span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onApplyGroup && onApplyGroup(grp)}
                              className="flex-1 rounded-xl bg-[#0f4c5c] py-2 text-xs font-semibold text-white hover:bg-[#0b3b48] transition"
                            >
                              Nộp đơn gia nhập
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedGroup(grp)}
                              className="rounded-xl border border-stone-300 py-2 px-3 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
                            >
                              Xem
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Filter Section */}
        <section className="mx-auto max-w-[1240px] px-5 py-7 lg:px-8">
          <div className="mb-7 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_5px_18px_rgba(77,57,35,0.05)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-[#0f4c5c]" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Lọc theo trường đại học & chuyên ngành
                </p>
                {activeFilters > 0 && (
                  <span className="rounded-full bg-[#e1f0ed] px-2 py-0.5 text-[10px] font-bold text-[#0f4c5c]">
                    {activeFilters} đang áp dụng
                  </span>
                )}
              </div>
              {activeFilters > 0 && (
                <button onClick={resetFilters} className="text-xs font-semibold text-[#b64738] hover:underline">
                  Đặt lại bộ lọc
                </button>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(filterOptions) as Array<keyof typeof filterOptions>).map((key) => (
                <label key={key} className="relative">
                  <span className="sr-only">{key}</span>
                  <select
                    value={filters[key]}
                    onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}
                    className={cn(
                      'w-full appearance-none rounded-xl border bg-[#faf8f5] px-3 py-2.5 pr-9 text-sm outline-none transition focus:border-[#0f4c5c]',
                      filters[key] !== filterOptions[key][0]
                        ? 'border-[#78aea5] bg-[#edf7f4] font-semibold text-[#0f4c5c]'
                        : 'border-stone-200 text-stone-600'
                    )}
                  >
                    <option disabled={false}>{filterOptions[key][0]}</option>
                    {filterOptions[key].slice(1).map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-stone-400" />
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold tracking-[-0.035em] text-[#173e49]">
                  {query || activeFilters ? 'Nhóm phù hợp' : 'Tất cả các diễn đàn sinh viên'}
                </h2>
                <span className="rounded-full bg-[#e8e2d9] px-2.5 py-1 text-xs font-semibold text-stone-600">
                  {filteredGroups.length} nhóm
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                Nộp đơn tham gia để được Admin duyệt và mở khóa Group Chat riêng
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-stone-500 gap-3">
              <Loader2 className="size-6 animate-spin text-[#0f4c5c]" />
              <p className="text-sm font-medium">Đang tải danh sách nhóm...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
              <Search className="mx-auto size-8 text-stone-400" />
              <h3 className="mt-3 font-semibold text-[#173e49]">Không tìm thấy nhóm</h3>
              <p className="mt-1 text-sm text-stone-500">Vui lòng thử chọn trường khác hoặc xóa bộ lọc tìm kiếm.</p>
              <button
                onClick={resetFilters}
                className="mt-5 rounded-xl bg-[#0f4c5c] px-4 py-2 text-sm font-semibold text-white"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => {
                const status = membershipMap[group.id] || 'none'
                return (
                  <div
                    key={group.id}
                    className="group flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md text-left shadow-[0_8px_24px_rgba(77,57,35,0.06)] transition hover:-translate-y-1 hover:border-[#78aea5] hover:bg-white/85 hover:shadow-[0_16px_32px_rgba(15,76,92,0.14)]"
                  >
                    {/* Realistic Discord/Campus Group Banner Image */}
                    <div className="relative h-24 w-full overflow-hidden bg-stone-100">
                      <img
                        src={
                          group.banner_url ||
                          'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80'
                        }
                        alt={group.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                      <span className="absolute top-2 right-2.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                        <Users className="size-3" /> {group.members_count.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col flex-1 bg-white/60 backdrop-blur-md">
                      <div className="flex items-start justify-between -mt-8 mb-2">
                        <div
                          className={cn(
                            'grid size-11 place-items-center rounded-xl text-xs font-bold border-2 border-white/90 shadow-md backdrop-blur-sm',
                            group.color
                          )}
                        >
                          {group.mark}
                        </div>
                        {status === 'joined' ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Thành viên chính thức
                          </span>
                        ) : status === 'pending_approval' ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                            <Clock className="size-3" /> Chờ Admin duyệt
                          </span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 flex items-center gap-1">
                            <Lock className="size-3" /> Cần nộp đơn
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.025em] text-[#173e49]">
                        {group.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-600">
                        {group.description}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-[#0f4c5c]">
                        {group.country} · {group.university} · {group.major}
                      </p>

                      <div className="mt-auto pt-3 flex items-center gap-2">
                        {status === 'joined' ? (
                          <button
                            type="button"
                            onClick={() => onOpenGroupChat && onOpenGroupChat(group)}
                            className="flex-1 rounded-xl bg-[#0f4c5c] py-2 text-xs font-bold text-white hover:bg-[#0b3b48] flex items-center justify-center gap-1.5 transition shadow-sm"
                          >
                            <MessageSquare className="size-3.5" />
                            <span>Mở Group Chat</span>
                          </button>
                        ) : status === 'pending_approval' ? (
                          <div className="w-full rounded-xl bg-amber-50 border border-amber-200 py-2 text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5">
                            <Clock className="size-3.5 text-amber-600" />
                            <span>Đã nộp đơn (Đang chờ duyệt)</span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onApplyGroup && onApplyGroup(group)}
                              className="flex-1 rounded-xl bg-[#0f4c5c] py-2 text-xs font-bold text-white hover:bg-[#0b3b48] transition shadow-sm"
                            >
                              Nộp đơn vào nhóm
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedGroup(group)}
                              className="rounded-xl border border-stone-300 py-2 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                            >
                              Xem
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Accessible Detail Modal */}
      {selectedGroup && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#173e49]/35 p-4 backdrop-blur-md"
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="w-full max-w-[520px] overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-2xl backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Banner */}
            <div className="relative h-28 w-full bg-stone-200">
              <img
                src={
                  selectedGroup.banner_url ||
                  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80'
                }
                alt={selectedGroup.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button
                onClick={() => setSelectedGroup(null)}
                aria-label="Close"
                className="absolute top-3 right-3 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-7 pt-0 bg-white/70 backdrop-blur-lg">
              <div className="flex items-start justify-between -mt-8 mb-4">
                <div
                  className={cn(
                    'grid size-14 place-items-center rounded-2xl text-sm font-bold border-4 border-white/90 shadow-lg backdrop-blur-sm',
                    selectedGroup.color
                  )}
                >
                  {selectedGroup.mark}
                </div>
              </div>

              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#173e49]">
                {selectedGroup.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{selectedGroup.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-[#e1f0ed] px-2.5 py-1 text-xs font-medium text-[#0f4c5c]">
                  {selectedGroup.country}
                </span>
                <span className="rounded-lg bg-[#f6f1eb] px-2.5 py-1 text-xs text-stone-600">
                  {selectedGroup.university}
                </span>
                <span className="rounded-lg bg-[#fbe8df] px-2.5 py-1 text-xs text-[#a34537]">
                  {selectedGroup.major}
                </span>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl bg-[#faf8f5] px-4 py-3 text-xs text-stone-600">
                <span className="flex items-center gap-2">
                  <Users className="size-4 text-[#0f4c5c]" /> {selectedGroup.members_count.toLocaleString()} thành viên
                </span>
                <span>Yêu cầu Admin phê duyệt</span>
              </div>
              <div className="mt-6 flex gap-2">
                {membershipMap[selectedGroup.id] === 'joined' ? (
                  <button
                    onClick={() => {
                      const grp = selectedGroup
                      setSelectedGroup(null)
                      if (onOpenGroupChat) onOpenGroupChat(grp)
                    }}
                    className="flex-1 rounded-xl bg-[#0f4c5c] py-3 text-xs font-semibold text-white transition hover:bg-[#0b3b48] flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="size-4" />
                    <span>Mở Group Chat</span>
                  </button>
                ) : membershipMap[selectedGroup.id] === 'pending_approval' ? (
                  <div className="flex-1 rounded-xl bg-amber-50 border border-amber-200 py-3 text-xs font-semibold text-amber-800 text-center">
                    Đã nộp đơn — Đang chờ Admin xét duyệt
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const grp = selectedGroup
                      setSelectedGroup(null)
                      if (onApplyGroup) onApplyGroup(grp)
                    }}
                    className="flex-1 rounded-xl bg-[#0f4c5c] py-3 text-xs font-semibold text-white transition hover:bg-[#0b3b48]"
                  >
                    Nộp đơn xét duyệt vào nhóm
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
