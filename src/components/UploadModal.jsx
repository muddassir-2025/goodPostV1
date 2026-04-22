import { CloseIcon } from "./ui/Icons";

export default function UploadModal({
  title,
  description,
  onClose,
  children,
}) {
  return (
    <div className="relative isolate mx-auto w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/10 bg-[#121212]/95 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,110,64,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,0,128,0.12),_transparent_35%)]" />
      <div className="relative border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Studio</p>
            <h1 className="font-display mt-2 text-2xl text-white">{title}</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">{description}</p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-white/20 hover:text-white"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </div>
  );
}
