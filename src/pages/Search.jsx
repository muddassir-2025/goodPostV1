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
  UserIcon,
  DotsIcon
} from "../components/ui/Icons";

import postService from "../appwrite/post";
import { fetchFeedPosts, sortPosts, rankPostsForYou } from "../lib/posts";
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
  const initialQuery = searchParams.get("q") || "";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("for-you");
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

  // 📈 TRENDING TOPICS (X STYLE)
  const trendingData = useMemo(() => {
    const topicMap = {};
    posts.forEach(p => {
      p.tags?.forEach(tag => {
        if (!topicMap[tag]) {
          topicMap[tag] = { 
            name: tag, 
            count: 0, 
            latestPost: p, 
            authors: new Set() 
          };
        }
        topicMap[tag].count++;
        topicMap[tag].authors.add(p.authorName);
      });
    });

    return Object.values(topicMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [posts]);

  // 🔍 SUGGESTIONS LOGIC
  const suggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return null;
    const lower = debouncedQuery.toLowerCase();
    
    return {
      tags: trendingData.filter(t => t.name.toLowerCase().includes(lower)).slice(0, 3),
      posts: posts.filter(p => p.title?.toLowerCase().includes(lower)).slice(0, 3),
      users: Array.from(new Set(posts.map(p => p.authorName)))
        .filter(u => u.toLowerCase().includes(lower))
        .slice(0, 3)
    };
  }, [debouncedQuery, posts, trendingData]);

  // 🎯 RESULT FILTERING
  const results = useMemo(() => {
    let filtered = posts;
    const lowerQuery = debouncedQuery.toLowerCase();

    // 1. If searching, return matched posts
    if (debouncedQuery) {
      filtered = posts.filter(p => {
        const text = `${p.title} ${p.content} ${p.authorName} ${p.tags?.join(" ")}`.toLowerCase();
        return text.includes(lowerQuery);
      });
      return rankPostsForYou(filtered);
    }

    // 2. Tab filtering logic
    if (activeCategory === "for-you") return rankPostsForYou(posts);
    if (activeCategory === "trending") return []; // Trending shows topic list, not posts
    
    // Exact tag match for category tabs
    const tabFiltered = posts.filter(p => 
      p.tags?.some(t => t.toLowerCase() === activeCategory.toLowerCase())
    );
    
    return rankPostsForYou(tabFiltered);
  }, [posts, debouncedQuery, activeCategory]);

  const handleSearchSelect = (val, type = "query") => {
    setQuery(val);
    setShowDropdown(false);
    if (type === "tag") {
       navigate(`/search?q=${val}&type=tag`);
    }
  };

  const isDiscoveryMode = !debouncedQuery && (activeCategory === "for-you" || activeCategory === "trending");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 🔍 TOP NAV (Twitter Style) */}
      <header className="sticky top-16 z-40 bg-black/80 backdrop-blur-md md:top-20">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="relative flex-1" ref={dropdownRef}>
            <div className="flex items-center gap-3 rounded-full bg-[#202327] px-4 py-2 transition-focus-within:bg-black transition-focus-within:ring-1 transition-focus-within:ring-blue-500">
              <SearchIcon className="h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={query}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Search"
                className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            {/* DROP-DOWN SUGGESTIONS */}
            {showDropdown && suggestions && (
              <div className="absolute top-full mt-1 w-full overflow-hidden rounded-2xl bg-black shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/10">
                {suggestions.tags.map(t => (
                  <button key={t.name} onClick={() => handleSearchSelect(t.name, "tag")} className="flex w-full items-center gap-3 p-4 hover:bg-white/5">
                    <SearchIcon className="h-4 w-4 text-zinc-500" />
                    <span className="font-bold">#{t.name}</span>
                  </button>
                ))}
                {suggestions.users.map(u => (
                  <button key={u} onClick={() => handleSearchSelect(u)} className="flex w-full items-center gap-3 p-4 hover:bg-white/5">
                    <Avatar name={u} size="xs" />
                    <div className="text-left">
                      <p className="text-sm font-bold">{u}</p>
                      <p className="text-xs text-zinc-500">{getHandle(u)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
            <DotsIcon className="h-5 w-5" />
          </button>
        </div>

        {/* 📑 HORIZONTAL SCROLL TABS */}
        <div className="hide-scrollbar flex overflow-x-auto border-b border-white/10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setQuery("");
              }}
              className={`relative min-w-[100px] py-4 text-sm font-medium transition whitespace-nowrap px-4 ${
                activeCategory === cat.id && !query ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {cat.label}
              {activeCategory === cat.id && !query && (
                <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="divide-y divide-white/10">
        {loading ? (
          <div className="p-10 text-center"><PostSkeleton count={5} /></div>
        ) : isDiscoveryMode && activeCategory === "trending" ? (
          /* TRENDING TOPICS LIST (ONLY for Trending tab) */
          trendingData.map((topic) => (
            <button
              key={topic.name}
              onClick={() => handleSearchSelect(topic.name, "tag")}
              className="flex w-full items-start justify-between p-4 text-left transition hover:bg-white/[0.03]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-[13px] text-zinc-500">
                  <span>Trending</span>
                  <span>·</span>
                  <span>#{topic.name}</span>
                </div>
                <h2 className="mt-1 text-[15px] font-extrabold text-white">#{topic.name}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {Array.from(topic.authors).slice(0, 3).map((auth, i) => (
                      <div key={i} className="ring-2 ring-black rounded-full">
                        <Avatar name={auth} size="xs" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[13px] text-zinc-500">
                    {topic.count > 1000 ? `${(topic.count / 1000).toFixed(1)}K` : topic.count} posts
                  </p>
                </div>
              </div>
              <button className="text-zinc-600">
                <DotsIcon className="h-5 w-5" />
              </button>
            </button>
          ))
        ) : results.length > 0 ? (
          /* POST LIST (For all tags and For You) */
          results.map((post) => (
            <button
              key={post.$id}
              onClick={() => navigate(`/post/${post.slug}`)}
              className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-white/[0.03]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-[13px] text-zinc-500">
                  <span className="font-bold text-white">{post.authorName}</span>
                  <span>{getHandle(post.authorName)}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(post.$createdAt)}</span>
                </div>
                <p className="mt-1 text-[15px] font-bold text-white leading-snug">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-[15px] text-zinc-400 leading-normal">{post.content}</p>
                <div className="mt-3 flex items-center gap-5 text-zinc-500">
                  <span className="flex items-center gap-1.5 text-xs"><CommentIcon className="h-4 w-4" /> {post.commentCount}</span>
                  <span className="flex items-center gap-1.5 text-xs text-rose-500/80"><HeartIcon className="h-4 w-4" /> {post.likeCount}</span>
                </div>
              </div>
              {post.featuredImg && (
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-white/10">
                  <img src={getFileUrl(post.featuredImg)} className="h-full w-full object-cover" />
                </div>
              )}
            </button>
          ))
        ) : (
          /* EMPTY STATE */
          <div className="p-10 text-center animate-in fade-in duration-700">
            <EmptyState 
              title={debouncedQuery ? "No search results" : `No posts in ${activeCategory}`}
              description={debouncedQuery ? "Try different keywords" : "Browse other categories or share your own!"}
              actionLabel="Browse For You"
              onClickAction={() => {
                setQuery("");
                setActiveCategory("for-you");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}