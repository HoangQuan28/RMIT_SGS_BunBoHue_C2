import React from 'react';
import { UniversityTag, KnowledgeLevel } from '@/lib/types';
import { Filter, Sparkles, BookOpen, GraduationCap } from 'lucide-react';

interface FilterBarProps {
  selectedUni: UniversityTag;
  onChangeUni: (uni: UniversityTag) => void;
  selectedLevel: KnowledgeLevel | 'ALL';
  onChangeLevel: (lvl: KnowledgeLevel | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedUni,
  onChangeUni,
  selectedLevel,
  onChangeLevel,
  searchQuery,
  onSearchChange,
}) => {
  const universities: { id: UniversityTag; label: string }[] = [
    { id: 'ANY', label: 'All Universities (Any)' },
    { id: 'HCMUT', label: 'HCMUT (Bách Khoa)' },
    { id: 'RMIT', label: 'RMIT Vietnam' },
    { id: 'HUST', label: 'HUST (Bách Khoa HN)' },
    { id: 'VNU', label: 'VNU-HCM / UIT' },
    { id: 'NEU', label: 'NEU / FTU' },
  ];

  const levels = [
    { id: 'ALL', label: 'All Levels' },
    { id: 0, label: 'L0: Absolute Beginner' },
    { id: 1, label: 'L1: Novice' },
    { id: 2, label: 'L2: Intermediate' },
    { id: 3, label: 'L3: Advanced' },
    { id: 4, label: 'L4: Mastery' },
    { id: 5, label: 'L5: Expert' },
  ];

  return (
    <div className="bg-[#faf8f5] p-3 border-b border-[#ded9d0] space-y-2">
      {/* Search and Quick Summary */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search posts, course codes (e.g. COSC2759, Giải tích 2)..."
            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* University Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-stone-500 font-semibold flex items-center gap-1 mr-1">
            <GraduationCap className="w-3.5 h-3.5 text-[#0f4c5c]" /> Campus:
          </span>
          {universities.map((uni) => (
            <button
              key={uni.id}
              onClick={() => onChangeUni(uni.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedUni === uni.id
                  ? 'bg-[#0f4c5c] text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {uni.label}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Level Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
        <span className="text-stone-500 font-semibold flex items-center gap-1 mr-1 text-xs">
          <BookOpen className="w-3.5 h-3.5 text-[#0f4c5c]" /> Level:
        </span>
        {levels.map((lvl) => (
          <button
            key={String(lvl.id)}
            onClick={() => onChangeLevel(lvl.id as any)}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
              selectedLevel === lvl.id
                ? 'bg-[#0f4c5c] text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    </div>
  );
};
