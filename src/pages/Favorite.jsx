import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import EmptyState from "../components/EmptyState";
import PostSkeleton from "../components/PostSkeleton";
import favoriteService from "../appwrite/favorite";
import postService from "../appwrite/post";
import { getFileUrl, getHandle, formatCompactNumber } from "../lib/ui";
import { 
  HeartIcon, 
  CommentIcon, 
  PlayIcon, 
  ImageIcon,
  SearchIcon 
} from "../components/ui/Icons";

const PRESET_GRADIENTS = [
  "from-indigo-600 to-blue-500",
  "from-rose-500 to-orange-400",
  "from-emerald-500 to-teal-400",
  "from-blue-600 to-cyan-500",
  "from-amber-500 to-rose-500",
  "from-indigo-600 to-violet-500",
  "from-fuchsia-600 to-rose-500",
  "from-cyan-600 to-blue-500",
];

const getPostGradient = (id) => {
  const index = Math.abs(id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PRESET_GRADIENTS.length;
  return PRESET_GRADIENTS[index];
};

export default function Favorites() {
  const user = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;

    async function fetchFavorites() {
      if (!user) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const favoriteResponse = await favoriteService.getUSerAllFavorites(user.$id);
        const postIds = favoriteResponse?.documents?.map((item) => item.postId) || [];

        if (!postIds.length) {
          if (active) setPosts([]);
          return;
        }

        // Fetch posts in parallel
        const resolvedPosts = await Promise.all(postIds.map((id) => postService.getPostById(id)));
        
        if (active) {
          setPosts(resolvedPosts.filter(Boolean));
        }
      } catch (error) {
        console.error("Favorites load error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchFavorites();
    return () => (active = false);
  }, [user]);

  // 🔍 LOCAL SEARCH & FILTER
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = 
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter = 
        filter === "all" || 
        (filter === "images" && !!post.featuredImg) ||
        (filter === "audio" && !!post.audioId);

      return matchesSearch && matchesFilter;
    });
  }, [posts, searchQuery, filter]);

  if (!user) {
    return (
      <EmptyState
        eyebrow="Favorites"
        title="Sign in to see saved posts"
        description="Your personal collection is synced to your account."
        actionLabel="Log in"
        actionTo="/login"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER & SEARCH */}
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Private Collection</p>
            <h1 className="font-display mt-2 text-4xl text-white font-black tracking-tight">Saved</h1>
          </div>

          <div className="flex flex-1 max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 focus-within:border-white/20 transition">
            <SearchIcon className="h-5 w-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in saved..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* TABS */}
        <div className="mt-8 flex gap-1 rounded-full border border-white/5 bg-black/20 p-1 w-fit">
          {["all", "images", "audio"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-5 py-2 text-xs font-bold capitalize transition ${
                filter === f
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      {loading ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {filteredPosts.map((post) => {
            const imageSrc = getFileUrl(post.featuredImg);
            const gradient = getPostGradient(post.$id);

            return (
              <Link
                key={post.$id}
                to={`/post/${post.slug}`}
                className="group relative aspect-square overflow-hidden bg-zinc-900 transition hover:z-10"
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center p-4 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                     {/* Subtle Background Icon */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                       {post.audioId ? (
                         <PlayIcon className="h-24 w-24 text-white" />
                       ) : (
                         <div className="text-[80px] font-black text-white leading-none select-none">
                           {post.title.charAt(0).toUpperCase()}
                         </div>
                       )}
                     </div>
                    
                    <div className="relative z-10 text-center">
                      <h3 className="font-display text-[10px] sm:text-xs font-bold text-white leading-snug line-clamp-3 px-1">
                        {post.title}
                      </h3>
                    </div>
                  </div>
                )}

                {/* HOVER OVERLAY */}
                <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-1 text-white">
                    <HeartIcon className="h-5 w-5 fill-current" />
                    <span className="text-[10px] font-bold">{formatCompactNumber(post.likeCount || 0)}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-white">
                    <CommentIcon className="h-5 w-5 fill-current" />
                    <span className="text-[10px] font-bold">{formatCompactNumber(post.commentCount || 0)}</span>
                  </div>
                  
                  {post.audioId && (
                    <PlayIcon className="absolute top-2 right-2 h-3 w-3 text-white/50" />
                  )}
                  {post.featuredImg && (
                    <ImageIcon className="absolute top-2 right-2 h-3 w-3 text-white/50" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          eyebrow="Collection"
          title={searchQuery ? "No matches found" : "Your collection is empty"}
          description={searchQuery ? "Try searching for something else." : "Save posts to see them here."}
          actionLabel="Go to feed"
          actionTo="/"
        />
      )}
    </div>
  );
}
