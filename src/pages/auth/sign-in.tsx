import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function SignIn() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "github" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Signed in",
      description: "Welcome back!",
    });

    navigate("/");
  };

  const handleOAuth = async (provider: "google" | "github") => {
    if (oauthProvider) return;

    setOauthProvider(provider);

    const redirectTo = `${window.location.origin}/#/`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      toast({
        title: "OAuth sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setOauthProvider(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* LEFT FORM */}
      <div className="w-full lg:w-[38%] flex items-center justify-center px-12">

        <div className="w-full max-w-sm space-y-6">

          <div>
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <Label>Email</Label>
              <Input
                className="h-9"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                className="h-9"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <div className="flex items-center justify-between text-sm">

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.rememberMe}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, rememberMe: v as boolean })
                  }
                />
                <span>Remember me</span>
              </div>

              <Link to="/auth/forgot-password">
                <Button type="button" variant="secondary" size="sm">
                  Forgot?
                </Button>
              </Link>

            </div>

            <Button className="w-full h-9" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => handleOAuth("google")}>
              Google
            </Button>

            <Button variant="secondary" onClick={() => handleOAuth("github")}>
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm">
            Don’t have an account?{" "}
            <Link to="/auth/sign-up" className="text-primary">
              Sign up
            </Link>
          </p>

        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="hidden lg:block lg:w-[62%] relative">
        <img
          src="/images/signin-image.png"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <img
          src="/images/logo.png"
          className="absolute top-6 right-6 h-10"
        />
      </div>

    </div>
  );
}
