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
  AudioIcon,
  PlayIcon,
} from "../components/ui/Icons";

import { fetchFeedPosts, rankPostsForYou } from "../lib/posts";
import { getFileUrl, getHandle, formatRelativeTime } from "../lib/ui";

const CATEGORIES = [
  { id: "for-you", label: "For You" },
  { id: "trending", label: "Trending" },
  { id: "Islamic", label: "Islamic" },
  { id: "Quran", label: "Quran" },
  { id: "memes", label: "Memes" },
  { id: "Nasheed", label: "Nasheed" },
  { id: "art", label: "Art" },
  { id: "Quote", label: "Quotes" },
];

export default function Search() {
  const user = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState("for-you");
  const [isFullList, setIsFullList] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

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

  // 🎯 RESULT FILTERING
  const results = useMemo(() => {
    let filtered = posts;
    if (debouncedQuery) {
      filtered = posts.filter(p => {
        const text = `${p.title} ${p.content} ${p.authorName} ${p.tags?.join(" ")}`.toLowerCase();
        return text.includes(debouncedQuery.toLowerCase());
      });
      return rankPostsForYou(filtered);
    }
    if (activeCategory === "for-you") return rankPostsForYou(posts);
    if (activeCategory === "trending") return [];
    return posts.filter(p => p.tags?.some(t => t.toLowerCase() === activeCategory.toLowerCase()));
  }, [posts, debouncedQuery, activeCategory]);

  const trendingTopics = useMemo(() => {
    const topicMap = {};
    posts.forEach(p => p.tags?.forEach(tag => {
      if (!topicMap[tag]) topicMap[tag] = { name: tag, count: 0 };
      topicMap[tag].count++;
    }));
    return Object.values(topicMap).sort((a, b) => b.count - a.count);
  }, [posts]);

  const handleTabChange = (id) => {
    setActiveCategory(id);
    setQuery("");
    setIsFullList(false);
  };

  // 🍱 HYBRID CARD (Instagram Visual + Twitter Text)
  const renderHybridCard = (post, featured = false) => (
    <div
      key={post.$id}
      onClick={() => navigate(`/post/${post.slug}`)}
      className={`group relative flex w-full cursor-pointer overflow-hidden transition duration-300 hover:bg-white/[0.04] ${
        featured ? "flex-col p-0" : "items-center gap-4 p-4"
      }`}
    >
      {/* Visual Content (Instagram Vibe) */}
      <div className={`relative flex-shrink-0 overflow-hidden bg-zinc-900 ${
        featured ? "aspect-[16/9] w-full" : "h-20 w-20 rounded-2xl border border-white/10"
      }`}>
        {post.featuredImg ? (
          <img src={getFileUrl(post.featuredImg)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
             {post.audioId ? <AudioIcon className="h-8 w-8 text-white/20" /> : <TrendingIcon className="h-8 w-8 text-white/20" />}
          </div>
        )}
        {post.audioId && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                    <PlayIcon className="h-5 w-5 text-white" />
                </div>
            </div>
        )}
      </div>

      {/* Text Content (Twitter/X Vibe) */}
      <div className={featured ? "p-5" : "flex-1 min-w-0"}>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
          <Avatar name={post.authorName} size="xs" />
          <span className="font-semibold text-zinc-400 group-hover:text-white transition">{getHandle(post.authorName)}</span>
          <span>·</span>
          <span>{formatRelativeTime(post.$createdAt)}</span>
        </div>
        
        <h3 className={`font-display font-bold text-white leading-snug group-hover:text-blue-400 transition-colors ${
          featured ? "text-xl" : "text-[15px] truncate"
        }`}>
          {post.title}
        </h3>
        
        {featured && post.content && (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{post.content}</p>
        )}

        <div className="mt-3 flex items-center gap-4 text-zinc-500">
           <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider"><CommentIcon className="h-3.5 w-3.5" /> {post.commentCount}</span>
           <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-500/80"><HeartIcon className="h-3.5 w-3.5" /> {post.likeCount}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen space-y-5 pb-24">
      {/* 🔍 SEARCH BAR */}
      <section className="sticky top-16 z-40 -mx-4 bg-black/60 px-4 pb-3 pt-2 backdrop-blur-xl md:top-20 md:mx-0 md:px-0">
        <div className="relative mb-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:bg-white/10 transition-all">
                <SearchIcon className="h-5 w-5 text-zinc-500" />
                <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value) setIsFullList(true);
                }}
                placeholder="Search GoodPost"
                className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-zinc-500"
                />
            </div>
        </div>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleTabChange(cat.id)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id && !query
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        {loading ? (
          <PostSkeleton count={3} />
        ) : (
          <>
            {/* 🎯 DISCOVERY (1 Featured + 3 List) */}
            {!isFullList && !debouncedQuery && activeCategory !== "for-you" && activeCategory !== "trending" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#121212]/90 shadow-2xl backdrop-blur-xl">
                  {results.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {/* Instagram Vibe Header */}
                      {renderHybridCard(results[0], true)}
                      
                      {/* Twitter Vibe List */}
                      {results.slice(1, 4).map((post) => renderHybridCard(post, false))}
                      
                      <button 
                        onClick={() => setIsFullList(true)}
                        className="w-full py-4 text-center text-sm font-bold text-blue-400 hover:bg-white/5 transition"
                      >
                        See more in {activeCategory}
                      </button>
                    </div>
                  ) : (
                    <div className="p-10 text-center"><EmptyState title={`No ${activeCategory} yet`} description="Start the trend!" /></div>
                  )}
                </div>
              </div>
            )}

            {/* 📈 TRENDING (Clean Directory) */}
            {!isFullList && !debouncedQuery && activeCategory === "trending" && (
              <div className="rounded-[32px] border border-white/10 bg-[#121212]/90 p-2 shadow-2xl backdrop-blur-xl divide-y divide-white/5">
                {trendingTopics.map(topic => (
                  <button
                    key={topic.name}
                    onClick={() => { setActiveCategory(topic.name); setIsFullList(true); }}
                    className="flex w-full items-center justify-between p-5 text-left hover:bg-white/[0.04] transition"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Trending</p>
                      <h2 className="font-display text-lg text-white">#{topic.name}</h2>
                      <p className="text-xs text-zinc-500">{topic.count} posts</p>
                    </div>
                    <TrendingIcon className="h-5 w-5 text-zinc-700" />
                  </button>
                ))}
              </div>
            )}

            {/* 🏁 FEED VIEW (Simple List) */}
            {(isFullList || debouncedQuery || activeCategory === "for-you") && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {results.length > 0 ? results.map((p) => (
                   <div key={p.$id} className="overflow-hidden rounded-[32px] border border-white/10 bg-[#121212]/90 p-1 shadow-md">
                      {renderHybridCard(p, false)}
                   </div>
                )) : (
                  <EmptyState title="No results found" description="Try another search" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}