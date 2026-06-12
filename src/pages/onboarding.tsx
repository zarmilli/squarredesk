import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [serviceInput, setServiceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    personalBio: "",
    companyName: "",
    companySize: "",
    heardAboutUs: "",
    companyBio: "",
    businessField: "",
    businessLocation: "",
    services: [] as string[],
  });

  const progress = step === 1 ? 50 : 100;

  function addService() {
    if (!serviceInput.trim()) return;

    setForm({
      ...form,
      services: [...form.services, serviceInput.trim()],
    });

    setServiceInput("");
  }

  function removeService(value: string) {
    setForm({
      ...form,
      services: form.services.filter((s) => s !== value),
    });
  }

  async function finishOnboarding() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user.email) return;

    const { error } = await supabase.from("profiles").upsert({
      user_id: session.user.id,
      email: session.user.email,

      personal_bio: form.personalBio,
      company_name: form.companyName,
      company_size: form.companySize,
      referral_source: form.heardAboutUs,
      company_bio: form.companyBio,
      business_field: form.businessField,
      business_location: form.businessLocation,
      services_offered: form.services,

      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("ONBOARDING SAVE ERROR:", error);

      toast({
        title: "Onboarding failed",
        description: error.message,
        variant: "destructive",
      });

      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Welcome aboard 🎉",
      description: "Your profile has been set up successfully.",
    });

    navigate("/");
  }

  return (
    <div className="h-screen grid grid-cols-2 bg-white">
      {/* LEFT */}
      <div className="flex flex-col justify-center px-24">
        <Progress value={progress} className="mb-8" />

        <h1 className="text-3xl font-semibold mb-6">
          {step === 1
            ? "Tell us about yourself"
            : "Tell us about your business"}
        </h1>

        {step === 1 && (
          <div className="space-y-4">
            <Input
              placeholder="Personal bio"
              value={form.personalBio}
              onChange={(e) =>
                setForm({ ...form, personalBio: e.target.value })
              }
            />

            <Button className="w-full mt-4" onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Input
              placeholder="Company name"
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
            />

            <Select onValueChange={(v) => setForm({ ...form, companySize: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1–5</SelectItem>
                <SelectItem value="6-20">6–20</SelectItem>
                <SelectItem value="21-50">21–50</SelectItem>
                <SelectItem value="50+">50+</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => setForm({ ...form, heardAboutUs: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Where did you hear about us?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="X">X (Twitter)</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Google">Google Search</SelectItem>
                <SelectItem value="Bing">Bing</SelectItem>
                <SelectItem value="Referral">Friend / Referral</SelectItem>
                <SelectItem value="Event">Event / Conference</SelectItem>
                <SelectItem value="Flyer">Flyer / Poster</SelectItem>
                <SelectItem value="Billboard">Billboard</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => setForm({ ...form, businessField: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Business sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Marketing">Marketing & Advertising</SelectItem>
                <SelectItem value="Finance">Finance & Accounting</SelectItem>
                <SelectItem value="Fashion">Fashion & Apparel</SelectItem>
                <SelectItem value="Ecommerce">E-commerce</SelectItem>
                <SelectItem value="RealEstate">Real Estate</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Hospitality">Hospitality</SelectItem>
                <SelectItem value="Food">Food & Beverage</SelectItem>
                <SelectItem value="Logistics">Logistics & Transport</SelectItem>
                <SelectItem value="Creative">Creative / Design</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Business location"
              value={form.businessLocation}
              onChange={(e) =>
                setForm({ ...form, businessLocation: e.target.value })
              }
            />

            <Input
              placeholder="Company bio"
              value={form.companyBio}
              onChange={(e) =>
                setForm({ ...form, companyBio: e.target.value })
              }
            />

            <div className="flex gap-2">
              <Input
                placeholder="Add service"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
              />
              <Button onClick={addService}>Add</Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {form.services.map((s) => (
                <Badge
                  key={s}
                  className="cursor-pointer"
                  onClick={() => removeService(s)}
                >
                  {s} ✕
                </Badge>
              ))}
            </div>

            <Button
              className="w-full mt-4"
              onClick={finishOnboarding}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Finish"}
            </Button>
          </div>
        )}
      </div>

      {/* RIGHT IMAGE */}
      <div className="h-full w-full">
        <img
          src="/images/signup-image.png"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
