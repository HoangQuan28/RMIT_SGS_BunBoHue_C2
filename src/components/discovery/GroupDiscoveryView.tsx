import React, { useState, useEffect } from 'react';
import { RankedGroup } from '@/lib/search/semanticService';
import { Search, X, Users, BookOpen, Tag, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface GroupDiscoveryViewProps {
  onSelectGroup: (group: RankedGroup) => void;
}

export const GroupDiscoveryView: React.FC<GroupDiscoveryViewProps> = ({ onSelectGroup }) => {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<{ tag: string; occurrence_count: number }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [groups, setGroups] = useState<RankedGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async (searchQuery = query, tags = selectedTags) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (tags.length > 0) params.set('tags', tags.join(','));

      const res = await fetch(`/api/groups?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setGroups(data.groups);
        if (data.activeTags && activeTags.length === 0) {
          setActiveTags(data.activeTags);
        }
      } else {
        setError(data.error || 'Failed to fetch groups');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [selectedTags]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroups(query, selectedTags);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#faf8f5] text-[#263238] overflow-y-auto">
      {/* Hero Header */}
      <div className="py-10 px-6 max-w-4xl mx-auto w-full text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#edf7f4] border border-[#b8d8d2] text-[#0f4c5c] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Semantic Group & Forum Discovery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#173e49] tracking-tight">
          Find Your Academic Study Syndicate
        </h1>
        <p className="text-sm text-stone-600 max-w-xl mx-auto">
          Explore student-run study groups, capstone teams, and exam archive circles with genuine dense vector matching and zero surveillance.
        </p>

        {/* Hero Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mt-4">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, research areas, subjects (e.g. distributed robotics, kernel security)..."
              className="w-full bg-white border border-stone-300 hover:border-[#0f4c5c] focus:border-[#0f4c5c] rounded-2xl pl-12 pr-12 py-3.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-md focus:outline-none focus:ring-4 focus:ring-[#0f4c5c]/10 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  fetchGroups('', selectedTags);
                }}
                className="absolute right-4 text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Real Topic Tag Cloud */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs font-medium text-stone-500 mr-1">
            Active Topics:
          </span>
          {activeTags.map((t) => {
            const isSelected = selectedTags.includes(t.tag);
            return (
              <button
                key={t.tag}
                onClick={() => toggleTag(t.tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0f4c5c] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:text-[#0f4c5c] border border-stone-200'
                }`}
              >
                <span>#{t.tag}</span>
                <span className="text-[10px] opacity-70 bg-black/10 px-1.5 py-0.2 rounded-full">
                  {t.occurrence_count}
                </span>
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-[#c65b48] font-semibold hover:underline ml-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full px-6 pb-12 flex-1">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="text-xs">
              <strong className="block font-semibold">Discovery Service Error:</strong>
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f4c5c]" />
            <p className="text-xs font-medium">Computing dense semantic embeddings & ranking groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-stone-500">
            <p className="text-base font-semibold text-stone-800">No matching groups found</p>
            <p className="text-xs max-w-sm mx-auto">
              Try adjusting your query or deselecting topic tags to broaden your search across universities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => {
              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group)}
                  className="bg-white hover:border-[#0f4c5c] border border-stone-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-sm text-[#173e49] group-hover:text-[#0f4c5c] transition-colors leading-tight">
                        {group.name}
                      </h3>
                      <span className="text-[11px] bg-[#faf8f5] text-stone-600 px-2 py-0.5 rounded-lg border border-stone-200 flex-shrink-0 ml-2 font-medium">
                        {group.university}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>

                    {/* Tag Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {group.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-[#edf7f4] text-[#0f4c5c] text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      <span>{group.memberCount} members</span>
                    </div>
                    {group.semanticScore > 0 && (
                      <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                        Match: {(group.semanticScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
