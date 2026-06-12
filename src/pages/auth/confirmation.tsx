import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import squeakImage from "/images/happy.png";

export default function ConfirmEmail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      rotation: number;
      speedX: number;
      speedY: number;
      speedR: number;
      opacity: number;
    }[] = [];

    const colors = [
      "#f97316", // orange
      "#3b82f6", // blue
      "#22c55e", // green
      "#a855f7", // purple
      "#ec4899", // pink
      "#eab308", // yellow
      "#06b6d4", // cyan
    ];

    for (let i = 0; i < 160; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speedX: (Math.random() - 0.5) * 2,
        speedY: Math.random() * 3 + 1.5,
        speedR: (Math.random() - 0.5) * 4,
        opacity: 1,
      });
    }

    let animFrame: number;
    let elapsed = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      elapsed++;

      pieces.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.speedR;

        // Fade out after ~180 frames (3s at 60fps)
        if (elapsed > 180) {
          p.opacity = Math.max(0, p.opacity - 0.012);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      // Stop once all faded
      const allGone = pieces.every((p) => p.opacity <= 0);
      if (!allGone) {
        animFrame = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animFrame = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">

      {/* CONFETTI CANVAS */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10"
      />

      {/* LOGO */}
      <img
        src="/images/logo.png"
        className="absolute top-6 right-6 h-10"
        alt="Logo"
      />

      {/* CONTENT */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-md">
        <img
          src={squeakImage}
          className="w-36 mb-6"
          alt="Squeak the parrot"
        />

        <h1 className="text-2xl font-semibold text-stone-900 mb-2">
          Welcome aboard! 🎉
        </h1>

        <p className="text-stone-500 text-sm leading-relaxed mb-1">
          Squeak is thrilled to have you here.
        </p>

        <div className="flex items-center gap-2 text-stone-600 text-sm mt-3 mb-8">
          <Mail className="w-4 h-4 shrink-0" />
          <span>
            Before you get started, let's get your profile setup so you can have the best experience possible.
          </span>
        </div>

        <Link to="/#/onboarding">
          <Button variant="outline" size="sm">
            Complete Profile
          </Button>
        </Link>
      </div>

    </div>
  );
}