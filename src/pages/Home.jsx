import { useDeferredValue, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import EmptyState from "../components/EmptyState";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import StoryBar from "../components/StoryBar";
import { SearchIcon } from "../components/ui/Icons";
import postService from "../appwrite/post";
import followService from "../appwrite/follow";
import { syncFavorite, syncLike } from "../lib/engagement";
import { confirm, toast } from "../confirmService";
import { fetchFeedPosts, filterPosts, sortPosts } from "../lib/posts";
import { buildStories } from "../lib/ui";
import { motion, AnimatePresence } from "framer-motion";

const FEED_FILTERS = [
  { id: "discovery", label: "For You"    },
  { id: "following", label: "Following"  },
  { id: "latest",    label: "Latest"     },
  { id: "likes",     label: "Popular"    },
];

const MEDIA_FILTERS = [
  { id: "all",    label: "All"    },
  { id: "images", label: "Images" },
  { id: "audio",  label: "Audio"  },
];

export default function Home() {
  const user     = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();

  const [posts,        setPosts]        = useState([]);
  const [stories,      setStories]      = useState([]);
  const [allowedUsers, setAllowedUsers] = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("discovery");
  const [mediaFilter,  setMediaFilter]  = useState("all");
  const [visibleCount, setVisibleCount] = useState(5);
  const loaderRef      = useRef(null);
  const deferredSearch = useDeferredValue(search);

  /* ── load feed ── */
  useEffect(() => {
    let active = true;
    async function loadFeed() {
      setLoading(true);
      setError("");
      try {
        const data         = await fetchFeedPosts(user);
        const followingIds = user ? await followService.getFollowing(user.$id) : [];
        const allowed      = user ? new Set([user.$id, ...followingIds]) : new Set();
        const storyPosts   = data.filter((post) => allowed.has(post.authorID));
        let builtStories   = buildStories(storyPosts, user)
          .sort((a, b) => Number(b.isOwn) - Number(a.isOwn));
        if (active) { setPosts(data); setStories(builtStories); setAllowedUsers(allowed); }
      } catch (err) {
        console.error(err);
        if (active) setError("Could not load the feed right now.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadFeed();
    return () => { active = false; };
  }, [user]);

  /* ── infinite scroll ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((prev) => prev + 5); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []);

  /* ── derived posts ── */
  const searchFiltered = filterPosts(posts, deferredSearch);
  const feedFiltered   = filter === "following"
    ? searchFiltered.filter((p) => allowedUsers.has(p.authorID) && p.authorID !== user?.$id)
    : searchFiltered;
  const mediaFiltered  = feedFiltered.filter((p) => {
    if (mediaFilter === "images") return !!p.featuredImg;
    if (mediaFilter === "audio")  return !!p.audioId;
    return true;
  });
  const visiblePosts = sortPosts(mediaFiltered, filter === "following" ? "latest" : filter);

  /* ── post actions ── */
  function updatePost(postId, updater) {
    setPosts((cur) => cur.map((p) => (p.$id === postId ? updater(p) : p)));
  }

  async function handleLikeToggle(post) {
    if (!user) { navigate("/login"); return; }
    const nextLiked = !post.liked;
    updatePost(post.$id, (cur) => ({ ...cur, liked: nextLiked, likeCount: Math.max((cur.likeCount || 0) + (nextLiked ? 1 : -1), 0) }));
    try {
      await syncLike({ postId: post.$id, userId: user.$id, userName: user.name, currentlyLiked: post.liked });
    } catch {
      updatePost(post.$id, (cur) => ({ ...cur, liked: post.liked, likeCount: post.likeCount || 0 }));
    }
  }

  async function handleFavoriteToggle(post) {
    if (!user) { navigate("/login"); return; }
    const nextSaved = !post.saved;
    updatePost(post.$id, (cur) => ({ ...cur, liked: nextSaved, favoriteId: nextSaved ? cur.favoriteId : null }));
    try {
      const result = await syncFavorite({ postId: post.$id, userId: user.$id, currentlySaved: post.saved, favoriteId: post.favoriteId });
      updatePost(post.$id, (cur) => ({ ...cur, saved: result.saved, favoriteId: result.favoriteId }));
    } catch {
      updatePost(post.$id, (cur) => ({ ...cur, saved: post.saved, favoriteId: post.favoriteId || null }));
    }
  }

  async function handleDelete(post) {
    try {
      if (post.featuredImg) await postService.deleteFile(post.featuredImg);
      if (post.audioId)     await postService.deleteFile(post.audioId);
      await postService.deletePost(post.$id);
      setPosts((cur) => cur.filter((item) => item.$id !== post.$id));
    } catch {
      setError("Delete failed. Please try again.");
    }
  }

  async function handleReport(postId) {
    if (!user) { navigate("/login"); return; }
    const ok = await confirm("Report this post for inappropriate content? If 5 users report it, it will be automatically removed.");
    if (!ok) return;
    try {
      const res = await postService.reportPost(postId, user.$id);
      if      (res.status === "deleted")          { setPosts((prev) => prev.filter((p) => p.$id !== postId)); toast("Post removed after multiple reports.", "warning"); }
      else if (res.status === "already_reported") { toast("You have already reported this post.", "info"); }
      else                                        { toast("Report submitted successfully.", "success"); }
    } catch {
      setError("Report failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">

        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }}
        />

        <div className="relative px-5 pt-7 pb-5 space-y-5">

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/25 mb-1.5">
                Home
              </p>
              <h1 className="text-[22px] font-extrabold text-white leading-snug max-w-xs">
                In the name of God —{" "}
                <span className="text-white/50">where good begins.</span>
              </h1>
              <p className="mt-2 text-[13px] text-white/35 leading-relaxed max-w-sm">
                Use the internet as a tool for good. What you share will count for or against you.
              </p>
            </div>

            <Link
              to={user ? "/create" : "/login"}
              className="flex-shrink-0 hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
            >
              + Share
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 py-2.5 transition-all duration-200 focus-within:bg-white/[0.08] focus-within:border-white/20 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]">
            <SearchIcon className="h-4 w-4 text-white/30 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts, captions, creators…"
              className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none caret-blue-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="flex-shrink-0 h-5 w-5 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white/60 text-[11px] font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Feed filter pills — animated with framer */}
          <div className="hide-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            {FEED_FILTERS.map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap ${
                  filter === item.id ? "text-black" : "text-white/40 hover:text-white/70"
                }`}
              >
                {filter === item.id && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: "spring", duration: 0.45, bounce: 0.2 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Media sub-filters */}
          <div className="flex gap-2 pt-1 border-t border-white/[0.05]">
            {MEDIA_FILTERS.map((item) => (
              <button
                key={item.id}
                onClick={() => setMediaFilter(item.id)}
                className={`relative px-3 py-1 rounded-full text-[12px] font-semibold transition-colors duration-150 ${
                  mediaFilter === item.id ? "text-black" : "text-white/35 hover:text-white/60"
                }`}
              >
                {mediaFilter === item.id && (
                  <motion.div
                    layoutId="activeMediaFilter"
                    className="absolute inset-0 rounded-full bg-white/80"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ── STORIES ── */}
      <StoryBar stories={stories} />

      {/* ── ERROR ── */}
      {error && (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
          <p className="text-[13px] text-rose-300">{error}</p>
        </div>
      )}

      {/* ── POSTS ── */}
      <div className="px-4 py-4">
        {loading ? (
          <PostSkeleton count={3} />
        ) : visiblePosts.length ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${mediaFilter}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {visiblePosts.slice(0, visibleCount).map((post, index) => (
                <PostCard
                  key={post.$id}
                  post={post}
                  currentUserId={user?.$id}
                  onToggleLike={handleLikeToggle}
                  onToggleFavorite={handleFavoriteToggle}
                  onDelete={handleDelete}
                  onEdit={(id) => navigate(`/edit/${id}`)}
                  onReport={handleReport}
                  isPriority={index === 0}
                />
              ))}

              {/* Infinite scroll sentinel */}
              {visibleCount < visiblePosts.length && (
                <div ref={loaderRef} className="py-6 flex justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
                </div>
              )}

              {/* End of feed */}
              {visibleCount >= visiblePosts.length && visiblePosts.length > 5 && (
                <p className="py-8 text-center text-[12px] text-white/20 tracking-wide">
                  You're all caught up ✦
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="pt-8">
            <EmptyState
              eyebrow="Nothing here"
              title={search ? `No results for "${search}"` : "Feed is quiet"}
              description={
                search
                  ? "Try a different keyword or clear your search."
                  : "Adjust your filters or follow more creators."
              }
              actionLabel={!user ? "Sign in" : "Create a post"}
              actionTo={!user ? "/login" : "/create"}
            />
          </div>
        )}
      </div>
    </div>
  );
}