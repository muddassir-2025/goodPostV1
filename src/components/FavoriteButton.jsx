import { BookmarkIcon } from "./ui/Icons";

export default function FavoriteButton({
  saved,
  onToggle,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition duration-200 ${saved ? "bg-zinc-100 !text-zinc-950" : "text-zinc-300 hover:bg-white/5 hover:text-white"} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      aria-label={saved ? "Remove from favorites" : "Save post"}
    >
      <BookmarkIcon className="h-5 w-5" filled={saved} />
    </button>
  );
}
