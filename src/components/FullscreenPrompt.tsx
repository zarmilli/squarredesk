import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFullscreen } from "@/hooks/useFullscreen";

export default function FullscreenPrompt() {
  const { isFullscreen, requestFullscreen } = useFullscreen();

  if (isFullscreen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 flex flex-col items-center text-center gap-4 max-w-xs shadow-xl">
        <div className="bg-stone-100 rounded-full p-4">
          <Maximize2 className="w-7 h-7 text-stone-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Best viewed fullscreen</h2>
          <p className="text-sm text-stone-500 mt-1">Click below for the best experience.</p>
        </div>
        <Button className="w-full" onClick={requestFullscreen}>
          Enter Fullscreen
        </Button>
        <button
          className="text-xs text-stone-400 hover:text-stone-600 underline"
          onClick={() => {/* just closes the overlay without going fullscreen */
            document.dispatchEvent(new Event("fullscreenchange"));
          }}
        >
          Continue without fullscreen
        </button>
      </div>
    </div>
  );
}