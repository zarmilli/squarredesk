import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFullscreen } from "@/hooks/useFullscreen";

export default function FullscreenPrompt() {
  const { isFullscreen, requestFullscreen } = useFullscreen();
  const [dismissed, setDismissed] = useState(false);

  if (isFullscreen || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 flex flex-col items-center text-center gap-4 max-w-xs shadow-xl">
        <div className="bg-stone-100 rounded-full p-4">
          <Maximize2 className="w-7 h-7 text-stone-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Best viewed fullscreen or in landscape mode</h2>
          <p className="text-sm text-stone-500 mt-1">While we want to provide the best experience, some features may not display correctly in smaller windows. Rotate your device for the best view or open on a desktop.</p>
        </div>
        <Button className="w-full" onClick={requestFullscreen}>
          Enter Fullscreen
        </Button>
        <button
          className="text-xs text-stone-400 hover:text-stone-600 underline"
          onClick={() => setDismissed(true)}
        >
          Continue without fullscreen
        </button>
      </div>
    </div>
  );
}