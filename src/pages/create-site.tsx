import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function CreateSite() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [progress, setProgress] = useState(0);
  const progressTarget = 50;
  const progressAnimMs = 500;

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(progressTarget));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleNext() {
    if (!name.trim()) return;
    localStorage.setItem("site_name_draft", name.trim());
    navigate("/template-picker");
  }

  function handleBack() {
    setProgress(0);
    setTimeout(() => navigate(-1), progressAnimMs);
  }

  return (
    <div className="min-h-screen bg-[--background] flex flex-col">

      {/* Top bar */}
      <div className="p-4 border-b bg-[--card] flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <Progress value={progress} />
          <div className="text-xs text-stone-500 mt-1">Step 1 / 2</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">

          <h1 className="text-2xl font-semibold">Name your site</h1>

          <p className="text-stone-600 text-sm">
            Choose a name to get started. You can change this later.
          </p>

          <div className="w-full overflow-hidden rounded-none border-0 bg-[--background]">
            <div
              className="relative w-full bg-stone-200"
              style={{ aspectRatio: "1920 / 1080", clipPath: "inset(0 0 22px 0)" }}
            >
              <img
                src="/images/namesite.gif"
                alt="Site naming preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <Input
            placeholder="My awesome website"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Button className="w-full bg-[#121212] border-0 shadow-none ring-0" onClick={handleNext} disabled={!name.trim()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
