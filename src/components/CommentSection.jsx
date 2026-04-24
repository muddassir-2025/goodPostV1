import { useState, useMemo } from "react";
import Avatar from "./Avatar";
import { useSelector } from "react-redux";
import { formatRelativeTime, getHandle } from "../lib/ui";

export default function CommentSection({
  comments = [],
  currentUserId,
  value,
  onChange,
  onSubmit,
  editingId,
  editValue,
  onEditChange,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
}) {
  const isAdmin = useSelector((state) => state.auth.isAdmin);
  const [replyToId, setReplyToId] = useState(null);
  const [replyValue, setReplyValue] = useState("");

  // 🌳 BUILD COMMENT TREE
  const commentTree = useMemo(() => {
    const map = {};
    const roots = [];

    comments.forEach(c => {
      map[c.$id] = { ...c, replies: [] };
    });

    comments.forEach(c => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c.$id]);
      } else {
        roots.push(map[c.$id]);
      }
    });

    return roots.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
  }, [comments]);

  const handleReplySubmit = (parentId) => {
    if (!replyValue.trim()) return;
    onSubmit(replyValue, parentId);
    setReplyValue("");
    setReplyToId(null);
  };

  const CommentItem = ({ comment, depth = 0 }) => {
    const isEditing = editingId === comment.$id;
    const isReplying = replyToId === comment.$id;

    return (
      <div className={`space-y-3 ${depth > 0 ? "ml-8 border-l-2 border-white/5 pl-4" : ""}`}>
        <div className="rounded-[24px] border border-white/8 bg-black/35 p-4 transition hover:border-white/20">
          <div className="flex items-start gap-3">
            <Avatar name={comment.userName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {getHandle(comment.userName)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {formatRelativeTime(comment.$createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                   {!isEditing && (
                    <button
                      onClick={() => {
                        setReplyToId(isReplying ? null : comment.$id);
                        setReplyValue("");
                      }}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                    >
                      {isReplying ? "Cancel" : "Reply"}
                    </button>
                  )}
                  {(currentUserId === comment.userId || isAdmin) && (
                    <div className="flex gap-2">
                      <button onClick={() => onEditStart(comment)} className="text-xs text-zinc-500 hover:text-white transition">Edit</button>
                      <button onClick={() => onDelete(comment.$id)} className="text-xs text-rose-400 hover:text-rose-300 transition">Delete</button>
                    </div>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-3">
                  <textarea
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                  />
                  <div className="flex gap-2">
                    <button onClick={onEditSave} className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black">Save</button>
                    <button onClick={onEditCancel} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-zinc-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{comment.content}</p>
              )}
            </div>
          </div>
        </div>

        {/* REPLY INPUT */}
        {isReplying && (
          <div className="ml-8 flex gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
             <textarea
              autoFocus
              value={replyValue}
              onChange={(e) => setReplyValue(e.target.value)}
              placeholder={`Reply to ${getHandle(comment.userName)}...`}
              className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none"
            />
            <button
              onClick={() => handleReplySubmit(comment.$id)}
              className="rounded-full bg-blue-500 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition"
            >
              Reply
            </button>
          </div>
        )}

        {/* RECURSIVE REPLIES */}
        {comment.replies?.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.$id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-5 shadow-2xl backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Discussion</p>
          <h2 className="font-display text-2xl text-white">Conversation</h2>
        </div>
        <div className="rounded-full bg-white/5 px-4 py-1 text-xs font-bold text-zinc-400">
          {comments.length} Thoughts
        </div>
      </div>

      {/* MAIN COMMENT INPUT */}
      <div className="mb-8 flex gap-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What are your thoughts?"
          className="min-h-[100px] flex-1 rounded-[28px] border border-white/10 bg-black/40 px-5 py-4 text-[15px] text-white outline-none transition focus:border-white/20 placeholder:text-zinc-600"
        />
        <button
          onClick={() => onSubmit(value)}
          className="self-end rounded-full bg-zinc-100 px-6 py-3.5 text-sm font-extrabold !text-black transition hover:scale-105 hover:bg-white"
        >
          Post
        </button>
      </div>

      <div className="space-y-6">
        {commentTree.length > 0 ? (
          commentTree.map((comment) => (
            <CommentItem key={comment.$id} comment={comment} />
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 py-12 text-center text-sm text-zinc-500">
            No thoughts yet. Be the first to share!
          </div>
        )}
      </div>
    </section>
  );
}
