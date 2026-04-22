import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import PostSkeleton from "../components/PostSkeleton";
import postService from "../appwrite/post";
import { formatRelativeTime, getHandle } from "../lib/ui";

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadThreads() {
      setLoading(true);

      try {
        const response = await postService.getPosts();
        const uniqueThreads = [];
        const seen = new Set();

        for (const post of response?.documents || []) {
          if (seen.has(post.authorID)) {
            continue;
          }

          seen.add(post.authorID);
          uniqueThreads.push(post);
        }

        if (active) {
          setThreads(uniqueThreads.slice(0, 6));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadThreads();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Messages</p>
        <h1 className="font-display mt-3 text-3xl text-white">Inbox preview</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          This UI is ready for a future messaging backend. For now, it showcases a polished inbox surface.
        </p>
      </section>

      {loading ? (
        <PostSkeleton count={2} />
      ) : threads.length ? (
        <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
          <div className="space-y-3">
            {threads.map((thread, index) => (
              <Link
                key={thread.$id}
                to={`/post/${thread.slug}`}
                className="flex items-center gap-4 rounded-[24px] border border-white/8 bg-black/30 px-4 py-3 transition hover:border-white/20 hover:bg-white/5"
              >
                <Avatar name={thread.authorName} size="md" ring={index < 2} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate text-sm font-semibold text-white">
                      {getHandle(thread.authorName)}
                    </p>
                    <span className="text-xs text-zinc-500">
                      {formatRelativeTime(thread.$createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-400">
                    {thread.content || "Shared a new post with you."}
                  </p>
                </div>
                {index < 2 ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-black">
                    New
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          eyebrow="Messages"
          title="No conversations yet"
          description="Once messaging is connected, this inbox layout is ready for real threads."
          actionLabel="Explore posts"
          actionTo="/"
        />
      )}
    </div>
  );
}
