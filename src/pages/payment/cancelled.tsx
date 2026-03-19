import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import squeakImage from "/images/speaking.png";

export default function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">

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
          Payment Incomplete
        </h1>

        <p className="text-stone-500 text-sm leading-relaxed mb-1">
          Squeak couldn't complete your payment — no charges were made.
        </p>

        <div className="flex items-center gap-2 text-stone-600 text-sm mt-3 mb-8">
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>
            This could be due to a cancellation or a payment issue. You can try
            again from the subscriptions page whenever you're ready.
          </span>
        </div>

        <Button onClick={() => navigate("/subscriptions")}>
          Back to Subscriptions
        </Button>
      </div>

    </div>
  );
}