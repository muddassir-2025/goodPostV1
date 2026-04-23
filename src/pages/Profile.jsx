import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import PostSkeleton from "../components/PostSkeleton";
import favoriteService from "../appwrite/favorite";
import { fetchFeedPosts } from "../lib/posts";
import { formatCompactNumber, getFileUrl, getHandle } from "../lib/ui";

export default function Profile() {
  const currentUser = useSelector((state) => state.auth.userData);
  const { id } = useParams();

  const isOwnProfile = !id || id === currentUser?.$id;

  const [posts, setPosts] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [feedPosts, favoriteRes] = await Promise.all([
          fetchFeedPosts(currentUser),
          favoriteService.getUSerAllFavorites(currentUser.$id),
        ]);

        const targetUserId = isOwnProfile ? currentUser.$id : id;

        const userPosts = feedPosts.filter(
          (post) => post.authorID === targetUserId
        );

        if (active) {
          setPosts(userPosts);

          if (isOwnProfile) {
            setSavedCount(favoriteRes?.documents?.length || 0);
          } else {
            setSavedCount(0);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [id, currentUser, isOwnProfile]);

  if (!currentUser) {
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

  const profileName = isOwnProfile
    ? currentUser.name
    : posts[0]?.authorName || "User";

  const bio =
    isOwnProfile
      ? currentUser.prefs?.bio
      : "Exploring and sharing moments."
      || "Sharing everyday moments, music drops, and snapshots.";

  const followers = currentUser.prefs?.followersCount || 0;
  const following = currentUser.prefs?.followingCount || 0;

  return (
    <div className="space-y-5">
      {/* PROFILE HEADER */}
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={profileName} size="xl" ring />

          <div className="flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-3xl text-white">
                  {getHandle(profileName)}
                </p>

                {isOwnProfile && (
                  <p className="mt-1 text-sm text-zinc-500">
                    {currentUser.email}
                  </p>
                )}
              </div>

              {/* ACTION BUTTONS */}
              {isOwnProfile && (
                <div className="flex gap-2">
                  <Link
                    to="/create"
                    className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold !text-zinc-950 transition hover:bg-zinc-200"
                  >
                    New post
                  </Link>
                  <Link
                    to="/favorites"
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
                  >
                    Saved
                  </Link>
                </div>
              )}
            </div>

            <p className="mt-4 max-w-xl text-sm text-zinc-400">
              {bio}
            </p>

            {/* STATS */}
            <div className="mt-5 flex items-center rounded-[24px] border border-white/10 bg-black/35 py-4">
              <div className="flex-1 text-center">
                <p className="font-display text-lg text-white">
                  {formatCompactNumber(posts.length)}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase">
                  Posts
                </p>
              </div>

              <div className="w-px bg-white/10"></div>

              <div className="flex-1 text-center">
                <p className="font-display text-lg text-white">
                  {formatCompactNumber(followers)}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase">
                  Followers
                </p>
              </div>

              <div className="w-px bg-white/10"></div>

              <div className="flex-1 text-center">
                <p className="font-display text-lg text-white">
                  {formatCompactNumber(following)}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase">
                  Following
                </p>
              </div>

              {isOwnProfile && (
                <>
                  <div className="w-px bg-white/10"></div>
                  <div className="flex-1 text-center">
                    <p className="font-display text-lg text-white">
                      {formatCompactNumber(savedCount)}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase">
                      Saved
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <div className="mb-4 flex justify-between">
          <h2 className="text-2xl text-white">
            {isOwnProfile ? "Your grid" : `${profileName}'s posts`}
          </h2>
          <p className="text-sm text-zinc-500">
            {posts.length} uploads
          </p>
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
                  className="group rounded-[24px] overflow-hidden border border-white/10"
                >
                  <div className="aspect-square relative overflow-hidden">
                    {imageSrc ? (
                      <>
                        <img
                          src={imageSrc}
                          alt={post.title}
                          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                        />

                        {/* 🔥 Overlay */}
                        <div className="absolute inset-0 flex items-end p-3
        bg-[linear-gradient(to_top,rgba(0,0,0,0.75),rgba(0,0,0,0.15),transparent)]
      ">
                          <p className="text-white text-sm font-semibold line-clamp-2">
                            {post.title}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-end p-3
      bg-[radial-gradient(circle_at_top,_rgba(255,115,0,0.25),_transparent_50%),linear-gradient(to_top,rgba(0,0,0,0.7),rgba(0,0,0,0.1))]
      backdrop-blur-md
    ">
                        <p className="text-white text-sm font-semibold">
                          {post.title}
                        </p>
                      </div>
                    )}
                  </div>
                  
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            eyebrow="Profile"
            title="No posts yet"
            description="Nothing to show here."
          />
        )}
      </section>
    </div>
  );
}