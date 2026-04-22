import { HeartIcon } from "./ui/Icons";
import { formatCompactNumber } from "../lib/ui";

export default function LikeButton({
  liked,
  count = 0,
  onToggle,
  disabled = false,
  showCount = true,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition duration-200 ${liked ? "bg-rose-500/15 text-rose-300" : "text-zinc-300 hover:bg-white/5 hover:text-white"} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <HeartIcon className="h-5 w-5" filled={liked} />
      {showCount ? <span>{formatCompactNumber(count)}</span> : null}
    </button>
  );
}
