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
  const [isFullList, setIsFullList] = useState(false); // New state for "See all" flow
  
  const debouncedQuery = useDebounce(query, 300);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setIsFullList(true);
    }
  }, [initialQuery]);

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

  // 📈 TRENDING DATA
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

    return Object.values(topicMap).sort((a, b) => b.count - a.count);
  }, [posts]);

  // 🎯 RESULT FILTERING
  const results = useMemo(() => {
    let filtered = posts;
    const lowerQuery = debouncedQuery.toLowerCase();

    if (debouncedQuery) {
      filtered = posts.filter(p => {
        const text = `${p.title} ${p.content} ${p.authorName} ${p.tags?.join(" ")}`.toLowerCase();
        return text.includes(lowerQuery);
      });
      return rankPostsForYou(filtered);
    }

    if (activeCategory === "for-you") return rankPostsForYou(posts);
    if (activeCategory === "trending") return [];
    
    // Category filtering
    return posts.filter(p => 
      p.tags?.some(t => t.toLowerCase() === activeCategory.toLowerCase())
    );
  }, [posts, debouncedQuery, activeCategory]);

  const categoryTrendingTopics = useMemo(() => {
    if (activeCategory === "for-you" || activeCategory === "trending") return trendingData.slice(0, 10);
    
    // Filter trending topics that belong to this category
    return trendingData.filter(t => t.name.toLowerCase() === activeCategory.toLowerCase());
  }, [trendingData, activeCategory]);

  const handleSearchSelect = (val, type = "query") => {
    setQuery(val);
    setShowDropdown(false);
    setIsFullList(true);
  };

  const handleTabChange = (id) => {
    setActiveCategory(id);
    setQuery("");
    setIsFullList(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 🔍 TOP NAV */}
      <header className="sticky top-16 z-40 bg-black/80 backdrop-blur-md md:top-20">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="relative flex-1" ref={dropdownRef}>
            <div className="flex items-center gap-3 rounded-full bg-[#202327] px-4 py-2">
              <SearchIcon className="h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={query}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                  if (e.target.value) setIsFullList(true);
                }}
                placeholder="Search"
                className="w-full bg-transparent text-[15px] text-white outline-none"
              />
            </div>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
            <DotsIcon className="h-5 w-5" />
          </button>
        </div>

        {/* 📑 TABS */}
        <div className="hide-scrollbar flex overflow-x-auto border-b border-white/10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleTabChange(cat.id)}
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
        ) : (
          <>
            {/* 1. TOP HIGHLIGHTS / TRENDING (Only if not in full list mode) */}
            {!isFullList && !debouncedQuery && activeCategory !== "for-you" && (
              <div className="divide-y divide-white/10">
                {categoryTrendingTopics.length > 0 ? categoryTrendingTopics.map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => setIsFullList(true)}
                    className="flex w-full flex-col p-4 text-left transition hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-1 text-[13px] text-zinc-500">
                      <span>Trending in {activeCategory}</span>
                      <span>·</span>
                      <span>Trending</span>
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
                      <p className="text-[13px] text-zinc-500">{topic.count} posts</p>
                    </div>
                    <p className="mt-3 text-[14px] text-blue-400 font-medium">Click to see all {activeCategory} posts</p>
                  </button>
                )) : (
                   /* EMPTY STATE for Categories with no posts */
                   activeCategory !== "trending" && (
                    <div className="p-10 text-center">
                      <EmptyState 
                        title={`No posts in ${activeCategory}`} 
                        description="Be the first to share something!"
                        actionLabel="Go to For You"
                        onClickAction={() => handleTabChange("for-you")}
                      />
                    </div>
                   )
                )}

                {/* Specific Trending Tab View */}
                {activeCategory === "trending" && trendingData.map(topic => (
                   <button
                    key={topic.name}
                    onClick={() => {
                      setActiveCategory(topic.name);
                      setIsFullList(true);
                    }}
                    className="flex w-full items-start justify-between p-4 text-left transition hover:bg-white/[0.03]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-zinc-500">Trending</p>
                      <h2 className="mt-1 text-[15px] font-extrabold text-white">#{topic.name}</h2>
                      <p className="text-[13px] text-zinc-500 mt-1">{topic.count} posts</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 2. FULL POST LIST (Shows for "For You", or when "See all" is clicked, or when searching) */}
            {(isFullList || debouncedQuery || activeCategory === "for-you") && (
              <div className="divide-y divide-white/10 animate-in fade-in duration-500">
                {results.length > 0 ? results.map((post) => (
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
                )) : (
                  <div className="p-10 text-center">
                    <EmptyState title="No posts found" description="Try another category" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}