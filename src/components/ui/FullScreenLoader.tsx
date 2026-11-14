import { Feather } from "lucide-react";

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-white dark:bg-[#16171d]">
      <div className="relative">
        <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-[0_8px_28px_rgba(124,58,237,0.4)]">
          <Feather className="w-6 h-6 text-white stroke-[2.2px]" />
        </div>
        <div className="absolute -inset-1.5 rounded-[20px] border-2 border-transparent border-t-accent animate-spin" />
      </div>

      <p className="text-sm text-gray-400 dark:text-gray-500 tracking-wide">
        Loading…
      </p>
    </div>
  );
}

export default FullScreenLoader;
