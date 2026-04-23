import { useSelector } from "react-redux";
import { confirmYes, confirmNo } from "../confirmService";

export default function ConfirmPopup() {
  const { open, message } = useSelector((state) => state.confirm);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      
      <div className="
        relative w-[320px] rounded-[26px] 
        border border-white/10 
        bg-white/5 
        backdrop-blur-xl 
        p-6 
        shadow-[0_20px_80px_rgba(0,0,0,0.6)]
      ">
        
        {/* subtle glow */}
        <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />

        <h2 className="text-sm font-semibold text-white tracking-wide">
          Confirm Action
        </h2>

        <p className="mt-3 text-xs text-gray-300 leading-relaxed">
          {message}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          
          <button
            onClick={confirmNo}
            className="
              px-4 py-1.5 text-xs rounded-full 
              border border-white/10 
              bg-white/5 
              text-gray-200 
              backdrop-blur-md 
              hover:bg-white/10 
              transition
            "
          >
            Cancel
          </button>

          <button
            onClick={confirmYes}
            className="
              px-4 py-1.5 text-xs rounded-full 
              bg-gradient-to-br from-rose-500 to-rose-600 
              text-white 
              shadow-md 
              hover:scale-[1.03] 
              active:scale-[0.97] 
              transition
            "
          >
            Confirm
          </button>

        </div>
      </div>
    </div>
  );
}