import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import EmptyState from "../components/EmptyState";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import postService from "../appwrite/post";
import { syncFavorite, syncLike } from "../lib/engagement";
import { fetchFeedPosts, sortPosts } from "../lib/posts";

export default function Reels() {
  const user = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      setLoading(true);
      try {
        const data = await fetchFeedPosts(user);
        const ordered = sortPosts(data, "latest").sort(
          (a, b) => Number(Boolean(b.audioId)) - Number(Boolean(a.audioId)),
        );

        if (active) {
          setPosts(ordered);
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

  function updatePost(postId, updater) {
    setPosts((current) =>
      current.map((post) => (post.$id === postId ? updater(post) : post)),
    );
  }

  async function handleLikeToggle(post) {
    if (!user) {
      navigate("/login");
      return;
    }

    const nextLiked = !post.liked;
    updatePost(post.$id, (current) => ({
      ...current,
      liked: nextLiked,
      likeCount: Math.max((current.likeCount || 0) + (nextLiked ? 1 : -1), 0),
    }));

    try {
      await syncLike({
        postId: post.$id,
        userId: user.$id,
        currentlyLiked: post.liked,
      });
    } catch {
      updatePost(post.$id, (current) => ({
        ...current,
        liked: post.liked,
        likeCount: post.likeCount || 0,
      }));
    }
  }

  async function handleFavoriteToggle(post) {
    if (!user) {
      navigate("/login");
      return;
    }

    const nextSaved = !post.saved;
    updatePost(post.$id, (current) => ({
      ...current,
      saved: nextSaved,
      favoriteId: nextSaved ? current.favoriteId : null,
    }));

    try {
      const result = await syncFavorite({
        postId: post.$id,
        userId: user.$id,
        currentlySaved: post.saved,
        favoriteId: post.favoriteId,
      });

      updatePost(post.$id, (current) => ({
        ...current,
        saved: result.saved,
        favoriteId: result.favoriteId,
      }));
    } catch {
      updatePost(post.$id, (current) => ({
        ...current,
        saved: post.saved,
        favoriteId: post.favoriteId || null,
      }));
    }
  }

  async function handleDelete(post) {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    if (post.featuredImg) {
      await postService.deleteFile(post.featuredImg);
    }

    if (post.audioId) {
      await postService.deleteFile(post.audioId);
    }

    await postService.deletePost(post.$id);
    setPosts((current) => current.filter((item) => item.$id !== post.$id));
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/90 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Reels</p>
        <h1 className="font-display mt-3 text-3xl text-white">Sound on</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          A reel-inspired stream for richer posts, especially the ones carrying audio.
        </p>
      </section>

      {loading ? (
        <PostSkeleton count={2} />
      ) : posts.length ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.$id}
              post={post}
              currentUserId={user?.$id}
              onToggleLike={handleLikeToggle}
              onToggleFavorite={handleFavoriteToggle}
              onDelete={handleDelete}
              onEdit={(postId) => navigate(`/edit/${postId}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="Reels"
          title="Nothing to play yet"
          description="When new posts land, the most immersive ones will appear here first."
          actionLabel="Back to feed"
          actionTo="/"
        />
      )}
    </div>
  );
}
