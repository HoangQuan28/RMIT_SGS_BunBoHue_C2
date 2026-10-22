'use client';

import React, { useState } from 'react';
import { Image, Upload, X, Users, Sparkles, Check, Globe, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { SupabaseGroup } from './SupabaseForumDiscovery';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: SupabaseGroup) => void;
}

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
];

const PRESET_COLORS = [
  { mark: 'bg-[#e5f3f0] text-[#0f4c5c]', label: 'Emerald' },
  { mark: 'bg-[#fbe8df] text-[#b64738]', label: 'Coral' },
  { mark: 'bg-[#eee8f7] text-[#68458f]', label: 'Violet' },
  { mark: 'bg-[#e5eef4] text-[#386a7e]', label: 'Ocean' },
  { mark: 'bg-[#f7edd4] text-[#8b5c19]', label: 'Amber' },
];

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mark, setMark] = useState('UG');
  const [color, setColor] = useState('bg-[#e5f3f0] text-[#0f4c5c]');
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0]);
  const [country, setCountry] = useState('Vietnam');
  const [university, setUniversity] = useState('All universities');
  const [major, setMajor] = useState('CS / IT');
  const [level, setLevel] = useState('Open to everyone');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['student-community', 'project-collab']);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (!tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBannerUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError('Group name and description are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newGroupPayload = {
        name: name.trim(),
        description: description.trim(),
        mark: (mark || name.slice(0, 2)).toUpperCase(),
        color,
        banner_url: bannerUrl,
        country,
        university,
        major,
        level,
        tags,
        members_count: 1,
      };

      const { data, error: insertError } = await supabase
        .from('groups')
        .insert([newGroupPayload])
        .select()
        .single();

      if (insertError) {
        // Fallback for local mock if RLS prevents client anon insert
        const fallbackGroup: SupabaseGroup = {
          id: 'grp-' + Date.now(),
          ...newGroupPayload,
        };
        onGroupCreated(fallbackGroup);
      } else if (data) {
        onGroupCreated(data as SupabaseGroup);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#173e49]/45 p-4 backdrop-blur-sm overflow-y-auto">
      <div 
        className="w-full max-w-xl my-8 rounded-3xl border border-stone-200/90 bg-white p-7 shadow-2xl text-[#263238]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-[#0f4c5c] text-white shadow-sm font-bold text-sm">
              +
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#173e49]">Create Your Community</h2>
              <p className="text-xs text-stone-500">Launch a student guild, study circle, or research team</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Banner Preview & Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              Community Banner & Appearance
            </label>
            <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-stone-200 shadow-inner group">
              <img 
                src={bannerUrl} 
                alt="Banner preview" 
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                <div className={`grid size-10 place-items-center rounded-xl font-bold text-xs shadow-md ${color}`}>
                  {mark || 'US'}
                </div>
                <div className="text-white text-xs font-semibold drop-shadow">
                  {name || 'Community Title'}
                </div>
              </div>
              <label className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/70 text-white text-[11px] font-medium backdrop-blur cursor-pointer transition">
                <Upload className="size-3" /> Change Banner
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
              </label>
            </div>

            {/* Banner Presets */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-stone-400 font-medium">Presets:</span>
              <div className="flex gap-1.5">
                {PRESET_BANNERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBannerUrl(preset)}
                    className={`h-6 w-10 rounded-md overflow-hidden border ${bannerUrl === preset ? 'ring-2 ring-[#0f4c5c]' : 'opacity-70'}`}
                  >
                    <img src={preset} alt="preset" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-stone-600 mb-1">Group Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!mark || mark.length <= 2) setMark(e.target.value.slice(0, 2).toUpperCase());
                }}
                placeholder="e.g. Distributed Systems Lab"
                className="w-full rounded-xl border border-stone-200 bg-[#faf8f5] px-3.5 py-2 text-sm outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Badge (2 Char)</label>
              <input
                type="text"
                maxLength={2}
                value={mark}
                onChange={(e) => setMark(e.target.value.toUpperCase())}
                placeholder="DS"
                className="w-full text-center font-bold rounded-xl border border-stone-200 bg-[#faf8f5] px-2 py-2 text-sm outline-none focus:border-[#0f4c5c]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Short Description</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this community special? Who is it for?"
              className="w-full rounded-xl border border-stone-200 bg-[#faf8f5] p-3 text-sm outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Campus / University</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#faf8f5] px-3 py-2 text-xs outline-none focus:border-[#0f4c5c]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Primary Discipline / Major</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#faf8f5] px-3 py-2 text-xs outline-none focus:border-[#0f4c5c]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Topic Tags (press Enter to add)</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-[#faf8f5] p-2 min-h-[42px]">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-md bg-[#e1f0ed] px-2 py-0.5 text-xs font-medium text-[#0f4c5c]">
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-600">×</button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "Add tags like #rust, #ai-agents..." : ""}
                className="flex-1 min-w-[120px] bg-transparent text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0f4c5c] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-[#0b3b48] flex items-center gap-2 transition"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <>Create Community <Sparkles className="size-3.5" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
