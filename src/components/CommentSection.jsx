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

  return (
    <section className="rounded-[30px] border border-white/10 bg-[#121212]/92 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Comments</p>
          <h2 className="font-display text-xl text-white">Conversation</h2>
        </div>
        <p className="text-sm text-zinc-500">{comments.length} replies</p>
      </div>

      <div className="mb-5 flex gap-3">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          placeholder="Add a thoughtful reply..."
          className="min-h-[88px] flex-1 rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="self-end rounded-full bg-zinc-100 px-5 py-3 text-sm font-semibold !text-zinc-950 transition hover:scale-[1.01] hover:bg-zinc-200 hover:!text-zinc-950"
        >
          Send
        </button>
      </div>

      <div className="space-y-4">
        {comments.length ? (
          comments.map((comment) => (
            <div
              key={comment.$id}
              className="rounded-[24px] border border-white/8 bg-black/35 p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar name={comment.userName} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {getHandle(comment.userName)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatRelativeTime(comment.$createdAt)}
                      </p>
                    </div>

                    {currentUserId === comment.userId || isAdmin ? (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => onEditStart(comment)}
                          className="rounded-full px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(comment.$id)}
                          className="rounded-full px-3 py-1.5 text-rose-300 transition hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {editingId === comment.$id ? (
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={editValue}
                        onChange={(event) => onEditChange(event.target.value)}
                        rows={2}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={onEditSave}
                          className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold !text-zinc-950 transition hover:bg-zinc-200 hover:!text-zinc-950"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={onEditCancel}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-zinc-300">{comment.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
            No comments yet. Start the conversation.
          </div>
        )}
      </div>
    </section>
  );
}
