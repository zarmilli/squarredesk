import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "github" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Sign up failed",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Sign up failed",
        description: "You must agree to the terms.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error || !data.user) {
      toast({
        title: "Sign up failed",
        description: error?.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      membership_tier: "free",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      toast({
        title: "Profile creation failed",
        description: profileError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Account created",
      description: "Check your email.",
    });

    navigate("/auth/sign-in");
  };

  const handleOAuth = async (provider: "google" | "github") => {
    if (oauthProvider) return;

    setOauthProvider(provider);

    const redirectTo = `${window.location.origin}/#/onboarding`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      toast({
        title: "OAuth failed",
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
            <h1 className="text-2xl font-semibold">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">Start building today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First</Label>
                <Input className="h-9" required value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>

              <div>
                <Label>Last</Label>
                <Input className="h-9" required value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input className="h-9" type="email" required value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div>
              <Label>Password</Label>
              <Input className="h-9" type="password" required value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>

            <div>
              <Label>Confirm</Label>
              <Input className="h-9" type="password" required value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
            </div>

            {/* TERMS */}
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.agreeToTerms}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, agreeToTerms: v as boolean })
                }
              />

              <span>I agree to the</span>

              <Link to="/terms">
                <Button type="button" variant="secondary" size="sm">
                  Terms
                </Button>
              </Link>
            </div>

            <Button className="w-full h-9" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Account"}
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
            Already have an account?{" "}
            <Link to="/#/auth/sign-in" className="text-primary">
              Sign in
            </Link>
          </p>

        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="hidden lg:block lg:w-[62%] relative">
        <img src="/images/signup-image.png" className="absolute inset-0 w-full h-full object-cover" />
        <img src="/images/logo.png" className="absolute top-6 right-6 h-10" />
      </div>

    </div>
  );
}
