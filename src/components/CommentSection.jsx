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
  const [expandedReplies, setExpandedReplies] = useState({});

  const commentTree = useMemo(() => {
    const map = {};
    const roots = [];
    comments.forEach(c => map[c.$id] = { ...c, replies: [] });
    comments.forEach(c => {
      if (c.parentId && map[c.parentId]) map[c.parentId].replies.push(map[c.$id]);
      else roots.push(map[c.$id]);
    });
    return roots.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
  }, [comments]);

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleReplySubmit = (parentId) => {
    if (!replyValue.trim()) return;
    onSubmit(replyValue, parentId);
    setReplyValue("");
    setReplyToId(null);
    setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const isEditing = editingId === comment.$id;
    const isReplying = replyToId === comment.$id;
    const hasReplies = comment.replies?.length > 0;
    const isExpanded = expandedReplies[comment.$id];

    return (
      <div className="group transition-all duration-300">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Avatar name={comment.userName} size={isReply ? "xs" : "sm"} />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* NAME & TIME */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-bold text-white hover:underline cursor-pointer">
                {getHandle(comment.userName)}
              </span>
              <span className="text-[12px] text-zinc-500">
                {formatRelativeTime(comment.$createdAt)}
              </span>
            </div>

            {/* CONTENT */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => onEditChange(e.target.value)}
                  className="w-full bg-transparent border-b border-zinc-700 py-1 text-[14px] text-white outline-none focus:border-white transition"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={onEditCancel} className="text-[12px] font-bold text-white px-3 py-1.5 hover:bg-white/10 rounded-full transition">Cancel</button>
                  <button onClick={onEditSave} className="text-[12px] font-bold text-black bg-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-300 transition">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] leading-[1.4] text-zinc-200 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {/* ACTIONS (Reply, Edit, Delete) */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => {
                  setReplyToId(isReplying ? null : comment.$id);
                  setReplyValue("");
                }}
                className="text-[12px] font-bold text-zinc-400 hover:text-white transition"
              >
                Reply
              </button>
              
              {(currentUserId === comment.userId || isAdmin) && (
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition duration-200">
                  <button onClick={() => onEditStart(comment)} className="text-[12px] font-bold text-zinc-500 hover:text-zinc-300">Edit</button>
                  <button onClick={() => onDelete(comment.$id)} className="text-[12px] font-bold text-zinc-500 hover:text-rose-400">Delete</button>
                </div>
              )}
            </div>

            {/* REPLY INPUT (INLINE) */}
            {isReplying && (
              <div className="mt-4 flex gap-4 animate-in slide-in-from-top-2 duration-200">
                <Avatar name="User" size="xs" />
                <div className="flex-1">
                  <input
                    autoFocus
                    value={replyValue}
                    onChange={(e) => setReplyValue(e.target.value)}
                    placeholder="Add a reply..."
                    className="w-full bg-transparent border-b border-zinc-700 py-1 text-[14px] text-white outline-none focus:border-white transition"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setReplyToId(null)} className="text-[12px] font-bold text-white px-3 py-1.5 hover:bg-white/10 rounded-full transition">Cancel</button>
                    <button 
                      onClick={() => handleReplySubmit(comment.$id)} 
                      disabled={!replyValue.trim()}
                      className="text-[12px] font-bold text-black bg-blue-500 px-3 py-1.5 rounded-full disabled:bg-zinc-800 disabled:text-zinc-500 transition"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* REPLIES TOGGLE & NESTED LIST */}
            {hasReplies && (
              <div className="mt-1">
                <button
                  onClick={() => toggleReplies(comment.$id)}
                  className="flex items-center gap-2 text-[14px] font-bold text-blue-400 hover:bg-blue-400/10 px-3 py-1.5 rounded-full transition -ml-3"
                >
                  <svg className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                  {isExpanded ? 'Hide' : `View ${comment.replies.length} replies`}
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-6">
                    {comment.replies.map(reply => (
                      <CommentItem key={reply.$id} comment={reply} isReply />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 mb-20 max-w-[800px]">
      <div className="mb-6 flex items-center gap-8">
        <h3 className="text-[20px] font-bold text-white">
          {comments.length} Comments
        </h3>
        <button className="flex items-center gap-2 text-[14px] font-bold text-white group">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
          </svg>
          Sort by
        </button>
      </div>

      {/* PRIMARY INPUT */}
      <div className="flex gap-4 mb-10">
        <Avatar name="User" size="sm" />
        <div className="flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-zinc-700 py-1 text-[14px] text-white outline-none focus:border-white transition"
          />
          <div className={`flex justify-end gap-2 mt-2 transition-all duration-200 ${value.trim() ? 'opacity-100' : 'opacity-0'}`}>
            <button onClick={() => onChange("")} className="text-[12px] font-bold text-white px-4 py-2 hover:bg-white/10 rounded-full transition">Cancel</button>
            <button 
              onClick={() => onSubmit(value)} 
              className="text-[12px] font-bold text-black bg-blue-400 px-4 py-2 rounded-full hover:bg-blue-300 transition"
            >
              Comment
            </button>
          </div>
        </div>
      </div>

      {/* MAIN LIST */}
      <div className="space-y-6 sm:space-y-8">
        {commentTree.length > 0 ? (
          commentTree.map((comment) => (
            <CommentItem key={comment.$id} comment={comment} />
          ))
        ) : (
          <p className="text-center text-zinc-500 py-12 text-sm">No comments yet. Start the conversation.</p>
        )}
      </div>
    </div>
  );
}
