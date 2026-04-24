import { useEffect, useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";

import EmptyState from "../components/EmptyState";
import PostSkeleton from "../components/PostSkeleton";
import Avatar from "../components/Avatar";
import { 
  SearchIcon, 
  TrendingIcon, 
  HeartIcon, 
  CommentIcon, 
  ImageIcon, 
  AudioIcon,
  PlayIcon,
  UserIcon
} from "../components/ui/Icons";

import postService from "../appwrite/post";
import { fetchFeedPosts, sortPosts, rankPostsForYou } from "../lib/posts";
import { getFileUrl, getHandle } from "../lib/ui";

const TAGS = [
  { name: "Islamic", emoji: "📿" },
  { name: "Quran", emoji: "📖" },
  { name: "Quote", emoji: "💬" },
  { name: "memes", emoji: "😂" },
  { name: "art", emoji: "🎨" },
  { name: "Nasheed", emoji: "🎶" },
  { name: "News", emoji: "📰" },
  { name: "Travel", emoji: "✈️" },
  { name: "Education", emoji: "📚" },
  { name: "Tech", emoji: "💻" },
  { name: "Health", emoji: "🧠" },
  { name: "Other", emoji: "✨" },
];

export default function Search() {
  const user = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("top"); // top, latest, media, people
  const [showDropdown, setShowDropdown] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPosts() {
      setLoading(true);
      try {
        const data = await fetchFeedPosts(user);
        if (active) setPosts(data);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPosts();
    return () => { active = false; };
  }, [user]);

  // 📈 TRENDING LOGIC
  const trendingTags = useMemo(() => {
    const counts = {};
    posts.forEach(p => {
      p.tags?.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [posts]);

  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => ((b.likeCount || 0) + (b.commentCount || 0)) - ((a.likeCount || 0) + (a.commentCount || 0)))
      .slice(0, 3);
  }, [posts]);

  // 🔍 SUGGESTIONS LOGIC
  const suggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return null;
    const lower = debouncedQuery.toLowerCase();
    
    return {
      tags: TAGS.filter(t => t.name.toLowerCase().includes(lower)).slice(0, 3),
      posts: posts.filter(p => p.title?.toLowerCase().includes(lower)).slice(0, 3),
      users: Array.from(new Set(posts.map(p => p.authorName)))
        .filter(u => u.toLowerCase().includes(lower))
        .slice(0, 3)
    };
  }, [debouncedQuery, posts]);

  // 🎯 RESULT FILTERING
  const results = useMemo(() => {
    let filtered = posts;
    const lowerQuery = debouncedQuery.toLowerCase();

    if (debouncedQuery) {
      filtered = posts.filter(p => {
        const text = `${p.title} ${p.content} ${p.authorName} ${p.tags?.join(" ")}`.toLowerCase();
        return text.includes(lowerQuery);
      });
    }

    if (activeTab === "top") {
      return rankPostsForYou(filtered);
    } else if (activeTab === "latest") {
      return [...filtered].sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    } else if (activeTab === "media") {
      return filtered.filter(p => p.featuredImg || p.audioId);
    } else if (activeTab === "people") {
      // Group by user
      const users = {};
      filtered.forEach(p => {
        if (!users[p.authorID]) {
          users[p.authorID] = { 
            id: p.authorID, 
            name: p.authorName, 
            postCount: 0,
            avatar: p.authorName
          };
        }
        users[p.authorID].postCount++;
      });
      return Object.values(users).sort((a, b) => b.postCount - a.postCount);
    }
    return filtered;
  }, [posts, debouncedQuery, activeTab]);

  const handleSearchSelect = (val, type = "query") => {
    setQuery(val);
    setShowDropdown(false);
    if (type === "tag") {
       navigate(`/search?q=${val}&type=tag`);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* 🔍 STICKY SEARCH HEADER */}
      <div className="sticky top-16 z-30 -mx-4 bg-black/80 px-4 pb-4 pt-2 backdrop-blur-xl md:top-20">
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1.5 pl-4 transition-focus-within focus-within:border-white/20 focus-within:bg-white/10">
            <SearchIcon className="h-5 w-5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              placeholder="Search GoodPost..."
              className="flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-zinc-500"
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs text-zinc-400 hover:bg-white/20"
              >
                ✕
              </button>
            )}
          </div>

          {/* 💡 SUGGESTIONS DROPDOWN */}
          {showDropdown && suggestions && (
            <div className="absolute top-full mt-2 w-full overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              {suggestions.tags.length > 0 && (
                <div className="border-b border-white/5 p-2">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Topics</p>
                  {suggestions.tags.map(t => (
                    <button key={t.name} onClick={() => handleSearchSelect(t.name, "tag")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-white hover:bg-white/5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">{t.emoji}</span>
                      #{t.name}
                    </button>
                  ))}
                </div>
              )}
              {suggestions.users.length > 0 && (
                <div className="border-b border-white/5 p-2">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">People</p>
                  {suggestions.users.map(u => (
                    <button key={u} onClick={() => handleSearchSelect(u)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-white hover:bg-white/5">
                      <Avatar name={u} size="xs" />
                      {getHandle(u)}
                    </button>
                  ))}
                </div>
              )}
              {suggestions.posts.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Posts</p>
                  {suggestions.posts.map(p => (
                    <button key={p.$id} onClick={() => navigate(`/post/${p.slug}`)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-white hover:bg-white/5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                        {p.featuredImg ? <ImageIcon className="h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
                      </div>
                      <span className="truncate">{p.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 📑 TABS (Only show if query exists) */}
        {debouncedQuery && (
          <div className="mt-4 flex border-b border-white/5">
            {["top", "latest", "media", "people"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`relative flex-1 py-3 text-sm font-medium capitalize transition ${
                  activeTab === t ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t}
                {activeTab === t && (
                  <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        {/* 📊 DISCOVERY VIEW (If no search query) */}
        {!debouncedQuery ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 🔥 TRENDING TAGS */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <TrendingIcon className="h-5 w-5 text-rose-500" />
                <h2 className="font-display text-xl text-white">Trending Topics</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.length ? trendingTags.map(t => (
                  <button
                    key={t.name}
                    onClick={() => handleSearchSelect(t.name, "tag")}
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  >
                    <span className="text-zinc-500">#</span>
                    {t.name}
                    <span className="text-[10px] text-zinc-600">{t.count} posts</span>
                  </button>
                )) : (
                  <p className="text-sm text-zinc-500 italic">No trends yet. Start posting!</p>
                )}
              </div>
            </section>

            {/* 🏷️ CATEGORY GRID */}
            <section>
              <h2 className="mb-4 font-display text-xl text-white">Categories</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TAGS.map(tag => (
                  <button
                    key={tag.name}
                    onClick={() => handleSearchSelect(tag.name, "tag")}
                    className="group flex flex-col items-center justify-center rounded-[24px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-black p-5 transition hover:border-white/20"
                  >
                    <span className="text-3xl transition group-hover:scale-110">{tag.emoji}</span>
                    <span className="mt-3 text-sm font-medium text-white">{tag.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 📈 POPULAR NOW */}
            <section>
              <h2 className="mb-4 font-display text-xl text-white">Popular Posts</h2>
              <div className="space-y-3">
                {trendingPosts.map(p => (
                  <button
                    key={p.$id}
                    onClick={() => navigate(`/post/${p.slug}`)}
                    className="flex w-full items-center gap-4 rounded-[28px] border border-white/10 bg-[#121212] p-3 text-left transition hover:bg-white/5"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-zinc-800">
                      {p.featuredImg ? (
                        <img src={getFileUrl(p.featuredImg)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
                          {p.audioId ? <AudioIcon className="h-6 w-6 text-white/50" /> : <SearchIcon className="h-6 w-6 text-white/50" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-white">{p.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{getHandle(p.authorName)}</p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-600">
                        <span className="flex items-center gap-1"><HeartIcon className="h-3 w-3" /> {p.likeCount}</span>
                        <span className="flex items-center gap-1"><CommentIcon className="h-3 w-3" /> {p.commentCount}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* 🏁 SEARCH RESULTS VIEW */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
              <PostSkeleton count={3} />
            ) : results.length ? (
              <div className={activeTab === "people" ? "space-y-3" : "grid grid-cols-1 gap-4"}>
                {results.map((item) => {
                  if (activeTab === "people") {
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/profile/${item.id}`)}
                        className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                      >
                        <Avatar name={item.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="text-xs text-zinc-500">{getHandle(item.name)} • {item.postCount} posts</p>
                        </div>
                        <UserIcon className="h-5 w-5 text-zinc-500" />
                      </button>
                    );
                  }

                  // Compact Post Card for Results
                  return (
                    <button
                      key={item.$id}
                      onClick={() => navigate(`/post/${item.slug}`)}
                      className="group flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#121212]/90 transition hover:border-white/20"
                    >
                      <div className="flex items-center gap-4 p-4">
                         <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
                            {item.featuredImg ? (
                              <img src={getFileUrl(item.featuredImg)} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                                {item.audioId ? <AudioIcon className="h-8 w-8 text-white/20" /> : <ImageIcon className="h-8 w-8 text-white/20" />}
                              </div>
                            )}
                            {item.audioId && (
                               <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <PlayIcon className="h-6 w-6 text-white" />
                               </div>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                               <p className="truncate text-base font-bold text-white">{item.title}</p>
                               {item.reportCount > 3 && <div className="h-2 w-2 rounded-full bg-rose-500" title="Reported" />}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{item.content}</p>
                            <div className="mt-3 flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <Avatar name={item.authorName} size="xs" />
                                  <span className="text-[11px] text-zinc-500 font-medium">{getHandle(item.authorName)}</span>
                               </div>
                               <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                  <span className="flex items-center gap-1"><HeartIcon className="h-3 w-3" /> {item.likeCount}</span>
                                  <span className="flex items-center gap-1"><CommentIcon className="h-3 w-3" /> {item.commentCount}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                eyebrow="No results"
                title={`No ${activeTab} found`}
                description={`We couldn't find any results matching "${debouncedQuery}" in this category.`}
                actionLabel="Explore Trends"
                onClickAction={() => setQuery("")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}