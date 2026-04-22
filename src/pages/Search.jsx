import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import EmptyState from "../components/EmptyState";
import PostSkeleton from "../components/PostSkeleton";
import { SearchIcon } from "../components/ui/Icons";
import { fetchFeedPosts, filterPosts, sortPosts } from "../lib/posts";
import { getFileUrl, getHandle } from "../lib/ui";

export default function Search() {
  const user = useSelector((state) => state.auth.userData);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      setLoading(true);
      try {
        const data = await fetchFeedPosts(user);
        if (active) {
          setPosts(data);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPosts();
    return () => {
      active = false;
    };
  }, [user]);

  const results = sortPosts(filterPosts(posts, deferredQuery), "latest");

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/90 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Search</p>
        <h1 className="font-display mt-3 text-3xl text-white">Discover creators</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Browse the latest uploads, search by caption, and jump into any post in one tap.
        </p>

        <div className="mt-5 rounded-[26px] border border-white/10 bg-black/35 p-3">
          <label className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6 text-zinc-400">
              <SearchIcon className="h-5 w-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, caption, or creator"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
          </label>
        </div>
      </section>

      {loading ? (
        <PostSkeleton count={2} />
      ) : results.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((post) => {
            const imageSrc = getFileUrl(post.featuredImg);

            return (
              <Link
                key={post.$id}
                to={`/post/${post.slug}`}
                className="group overflow-hidden rounded-[26px] border border-white/10 bg-[#121212]/92 shadow-[0_24px_60px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-white/20"
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={post.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex aspect-square items-end bg-[radial-gradient(circle_at_top,_rgba(255,115,0,0.28),_transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Audio</p>
                      <h2 className="font-display mt-2 text-lg text-white">{post.title}</h2>
                    </div>
                  </div>
                )}
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-semibold text-white">{post.title}</p>
                  <p className="text-xs text-zinc-500">{getHandle(post.authorName)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          eyebrow="Search"
          title="No results yet"
          description="Try a broader phrase or clear the query to explore the full collection."
          actionLabel="Back to feed"
          actionTo="/"
        />
      )}
    </div>
  );
}
