import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import PostSkeleton from "../components/PostSkeleton";
import favoriteService from "../appwrite/favorite";
import { fetchFeedPosts } from "../lib/posts";
import { formatCompactNumber, getFileUrl, getHandle } from "../lib/ui";

export default function Profile() {
  const user = useSelector((state) => state.auth.userData);
  const [posts, setPosts] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [feedPosts, favoriteRes] = await Promise.all([
          fetchFeedPosts(user),
          favoriteService.getUSerAllFavorites(user.$id),
        ]);

        if (active) {
          setPosts(feedPosts.filter((post) => post.authorID === user.$id));
          setSavedCount(favoriteRes?.documents?.length || 0);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return (
      <EmptyState
        eyebrow="Profile"
        title="Sign in to see your profile"
        description="Your avatar, saved posts, and personal grid all live here."
        actionLabel="Log in"
        actionTo="/login"
      />
    );
  }

  const bio = user.prefs?.bio || "Sharing everyday moments, music drops, and snapshots from the timeline.";
  const followers = user.prefs?.followersCount || 0;
  const following = user.prefs?.followingCount || 0;

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={user.name} size="xl" ring />
          <div className="flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-3xl text-white">{getHandle(user.name)}</p>
                <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/create"
                  className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold !text-zinc-950 transition hover:bg-zinc-200 hover:!text-zinc-950"
                >
                  New post
                </Link>
                <Link
                  to="/favorites"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
                >
                  Saved
                </Link>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">{bio}</p>

            <div className="mt-5 grid grid-cols-4 gap-3">
              <div className="rounded-[24px] border border-white/10 bg-black/35 px-4 py-3 text-center">
                <p className="font-display text-xl text-white">{formatCompactNumber(posts.length)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">Posts</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/35 px-4 py-3 text-center">
                <p className="font-display text-xl text-white">{formatCompactNumber(followers)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">Followers</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/35 px-4 py-3 text-center">
                <p className="font-display text-xl text-white">{formatCompactNumber(following)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">Following</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/35 px-4 py-3 text-center">
                <p className="font-display text-xl text-white">{formatCompactNumber(savedCount)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">Saved</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Posts</p>
            <h2 className="font-display text-2xl text-white">Your grid</h2>
          </div>
          <p className="text-sm text-zinc-500">{posts.length} uploads</p>
        </div>

        {loading ? (
          <PostSkeleton count={2} />
        ) : posts.length ? (
          <div className="grid grid-cols-3 gap-3">
            {posts.map((post) => {
              const imageSrc = getFileUrl(post.featuredImg);

              return (
                <Link
                  key={post.$id}
                  to={`/post/${post.slug}`}
                  className="group overflow-hidden rounded-[24px] border border-white/10 bg-black/35"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={post.title}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex aspect-square items-end bg-[radial-gradient(circle_at_top,_rgba(255,115,0,0.28),_transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-3">
                      <p className="font-display text-lg text-white">{post.title}</p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            eyebrow="Profile"
            title="Your grid is still empty"
            description="Create your first post and it will land here in a clean gallery layout."
            actionLabel="Create a post"
            actionTo="/create"
          />
        )}
      </section>
    </div>
  );
}
