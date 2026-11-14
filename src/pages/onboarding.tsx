
import { useEffect, useState } from "react";
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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Building2,
  BriefcaseBusiness,
  Laptop,
  Check,
  ChevronDown,
  ArrowLeft,
  Clock3,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type AccountType = "business_owner" | "employee" | "freelancer";
type Screen = "selection" | "details" | "pending";

interface Business {
  id: string;
  company_name: string;
}

const departments = [
  "Human Resources",
  "Information Technology",
  "Marketing",
  "Finance & Accounting",
  "Sales",
  "Operations",
  "Administration",
  "Customer Support",
  "Legal",
  "Research & Development",
  "Design & Creative",
  "Production",
  "Other",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [screen, setScreen] = useState<Screen>("selection");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const [businessOpen, setBusinessOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);

  const [department, setDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [serviceInput, setServiceInput] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    companySize: "",
    heardAboutUs: "",
    companyBio: "",
    businessField: "",
    businessLocation: "",
    services: [] as string[],
  });

  // --------------------------------------------------
  // CHECK FOR AN EXISTING PENDING EMPLOYEE REQUEST
  // --------------------------------------------------

  useEffect(() => {
    async function checkExistingRequest() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data: request } = await supabase
        .from("business_members")
        .select("id, business_id, status")
        .eq("user_id", session.user.id)
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!request) return;

      if (request.status === "active") {
        navigate("/");
        return;
      }

      if (request.status === "pending") {
        setAccountType("employee");

        const { data: business } = await supabase
          .from("businesses")
          .select("id, company_name")
          .eq("id", request.business_id)
          .single();

        if (business) setSelectedBusiness(business);

        setScreen("pending");
      }
    }

    checkExistingRequest();
  }, [navigate]);

  // --------------------------------------------------
  // LOAD REGISTERED BUSINESSES
  // --------------------------------------------------

  async function loadBusinesses() {
    setIsLoadingBusinesses(true);

    const { data, error } = await supabase
      .from("businesses")
      .select("id, company_name")
      .order("company_name", { ascending: true });

    if (error) {
      console.error("BUSINESS DIRECTORY ERROR:", error);

      toast({
        title: "Unable to load businesses",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } else {
      setBusinesses(data || []);
    }

    setIsLoadingBusinesses(false);
  }

  // --------------------------------------------------
  // SELECT ACCOUNT TYPE
  // --------------------------------------------------

  function continueWithAccountType() {
    if (!accountType) return;

    if (accountType === "employee") {
      loadBusinesses();
    }

    setScreen("details");
  }

  // --------------------------------------------------
  // SERVICE MANAGEMENT
  // --------------------------------------------------

  function addService() {
    const value = serviceInput.trim();

    if (!value || form.services.includes(value)) return;

    setForm({
      ...form,
      services: [...form.services, value],
    });

    setServiceInput("");
  }

  function removeService(value: string) {
    setForm({
      ...form,
      services: form.services.filter((s) => s !== value),
    });
  }

  // --------------------------------------------------
  // SUBMIT ONBOARDING
  // --------------------------------------------------

  async function finishOnboarding() {
    if (isSubmitting || !accountType) return;

    setIsSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user.email) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const userId = session.user.id;
      const email = session.user.email;

      // ----------------------------------------------
      // EMPLOYEE REGISTRATION
      // ----------------------------------------------

      if (accountType === "employee") {
        if (!selectedBusiness) {
          throw new Error("Please select the business you work for.");
        }

        const finalDepartment =
          department === "Other"
            ? customDepartment.trim()
            : department;

        if (!finalDepartment || !jobTitle.trim()) {
          throw new Error("Please provide your department and job title.");
        }

        // Save employee profile.
        // Onboarding remains incomplete until approval.

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            user_id: userId,
            email,
            account_type: "employee",
            onboarding_complete: false,
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;

        // Submit secured membership request.

        const { error: requestError } = await supabase.rpc(
          "request_business_access",
          {
            p_business_id: selectedBusiness.id,
            p_department: finalDepartment,
            p_job_title: jobTitle.trim(),
          }
        );

        if (requestError) throw requestError;

        setScreen("pending");

        toast({
          title: "Request submitted",
          description: "Your organisation has been notified.",
        });

        return;
      }

      // ----------------------------------------------
      // BUSINESS OWNER REGISTRATION
      // ----------------------------------------------

      if (accountType === "business_owner") {
        if (!form.companyName.trim()) {
          throw new Error("Please enter your business name.");
        }

        // Save profile first.

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            user_id: userId,
            email,
            account_type: "business_owner",
            company_name: form.companyName.trim(),
            company_size: form.companySize,
            referral_source: form.heardAboutUs,
            company_bio: form.companyBio,
            business_field: form.businessField,
            business_location: form.businessLocation,
            services_offered: form.services,
            onboarding_complete: false,
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;

        // Create registered business.
        // Database trigger automatically creates owner membership.

        const { error: businessError } = await supabase
          .from("businesses")
          .insert({
            owner_user_id: userId,
            company_name: form.companyName.trim(),
            company_size: form.companySize || null,
            business_field: form.businessField || null,
            business_location: form.businessLocation || null,
            company_bio: form.companyBio || null,
            services_offered: form.services,
          });

        if (businessError) throw businessError;

        // Complete onboarding.

        const { error: completionError } = await supabase
          .from("profiles")
          .update({
            onboarding_complete: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (completionError) throw completionError;
      }

      // ----------------------------------------------
      // FREELANCER REGISTRATION
      // ----------------------------------------------

      if (accountType === "freelancer") {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            user_id: userId,
            email,
            account_type: "freelancer",
            company_name: form.companyName.trim() || null,
            company_size: form.companySize || null,
            referral_source: form.heardAboutUs,
            company_bio: form.companyBio,
            business_field: form.businessField,
            business_location: form.businessLocation,
            services_offered: form.services,
            onboarding_complete: true,
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;
      }

      // ----------------------------------------------
      // FINISH
      // ----------------------------------------------

      toast({
        title: "Welcome aboard!",
        description: "Your profile has been set up successfully.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("ONBOARDING ERROR:", error);

      toast({
        title: "Onboarding failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // --------------------------------------------------
  // SHARED BUSINESS / PROFESSIONAL DETAILS FORM
  // --------------------------------------------------

  function renderBusinessDetails() {
    const isOwner = accountType === "business_owner";

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">
            {isOwner ? "Business name" : "Professional / brand name"}
          </label>
          <Input
            placeholder={isOwner ? "Your company name" : "Your brand or professional name"}
            value={form.companyName}
            onChange={(e) =>
              setForm({ ...form, companyName: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            {isOwner ? "Company size" : "Team size"}
          </label>
          <Select
            value={form.companySize}
            onValueChange={(v) => setForm({ ...form, companySize: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-5">1–5</SelectItem>
              <SelectItem value="6-20">6–20</SelectItem>
              <SelectItem value="21-50">21–50</SelectItem>
              <SelectItem value="50+">50+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Where did you hear about us?</label>
          <Select
            value={form.heardAboutUs}
            onValueChange={(v) => setForm({ ...form, heardAboutUs: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
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
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Business sector</label>
          <Select
            value={form.businessField}
            onValueChange={(v) => setForm({ ...form, businessField: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your sector" />
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
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Location</label>
          <Input
            placeholder="City, country"
            value={form.businessLocation}
            onChange={(e) =>
              setForm({ ...form, businessLocation: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            {isOwner ? "About your business" : "Professional / brand description"}
          </label>
          <Input
            placeholder="Briefly describe what you do"
            value={form.companyBio}
            onChange={(e) =>
              setForm({ ...form, companyBio: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {isOwner ? "Products and services offered" : "Services offered"}
          </label>

          <div className="flex gap-2">
            <Input
              placeholder="Add a service"
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addService();
                }
              }}
            />
            <Button type="button" onClick={addService}>
              Add
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {form.services.map((service) => (
              <Badge
                key={service}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeService(service)}
              >
                {service} ×
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ACCOUNT SELECTION SCREEN
  // --------------------------------------------------

  if (screen === "selection") {
    const accountOptions = [
      {
        id: "business_owner" as AccountType,
        title: "I own a business",
        description:
          "For entrepreneurs starting or already running a business, company or side hustle.",
        icon: Building2,
      },
      {
        id: "employee" as AccountType,
        title: "I work for a business",
        description:
          "For employees and staff members joining an organisation already registered on Squarredesk.",
        icon: BriefcaseBusiness,
      },
      {
        id: "freelancer" as AccountType,
        title: "I am just freelancing",
        description:
          "For independent professionals creating a personal presence, portfolio or blog.",
        icon: Laptop,
      },
    ];

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              WELCOME TO SQUARREDESK
            </p>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              How will you use Squarredesk?
            </h1>

            <p className="text-muted-foreground mt-3">
              Let's get your workspace set up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {accountOptions.map((option) => {
              const Icon = option.icon;
              const selected = accountType === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAccountType(option.id)}
                  className={`relative text-left rounded-2xl border p-6 min-h-[230px] transition-all hover:border-primary/60 hover:shadow-md ${
                    selected
                      ? "border-primary bg-primary/[0.03] ring-1 ring-primary"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {selected && (
                    <div className="absolute top-5 right-5 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check size={14} />
                    </div>
                  )}

                  <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mb-7">
                    <Icon size={23} className="text-gray-800" />
                  </div>

                  <h2 className="font-semibold text-lg mb-2">
                    {option.title}
                  </h2>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="max-w-sm mx-auto mt-10">
            <Button
              className="w-full"
              size="lg"
              disabled={!accountType}
              onClick={continueWithAccountType}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // EMPLOYEE PENDING APPROVAL SCREEN
  // --------------------------------------------------

  if (screen === "pending") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-7">
            <Clock3 className="h-8 w-8 text-amber-600" />
          </div>

          <p className="text-sm font-medium text-muted-foreground mb-3">
            ACCESS REQUEST SUBMITTED
          </p>

          <h1 className="text-3xl font-semibold tracking-tight mb-4">
            You're almost there.
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-6">
            Your organisation has been notified of your request to join its
            Squarredesk workspace. A business administrator must approve your
            access before you can continue.
          </p>

          {selectedBusiness && (
            <div className="border rounded-xl p-4 flex items-center gap-3 text-left mb-6">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Building2 size={20} />
              </div>

              <div className="min-w-0">
                <p className="font-medium truncate">
                  {selectedBusiness.company_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Awaiting organisation approval
                </p>
              </div>

              <Badge variant="secondary" className="ml-auto">
                Pending
              </Badge>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-7">
            Please check back later. You'll be able to access your workspace
            once your request has been approved.
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Return to home
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ONBOARDING DETAILS SCREEN
  // --------------------------------------------------

  const isEmployee = accountType === "employee";
  const isOwner = accountType === "business_owner";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LEFT CONTENT */}

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24">
        <div className="w-full max-w-xl mx-auto">
          <Button
            variant="ghost"
            className="mb-8 -ml-3 w-fit"
            onClick={() => {
              setScreen("selection");
              setAccountType(null);
            }}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>

          <Progress value={50} className="mb-8" />

          <div className="mb-8">
            <p className="text-sm text-muted-foreground font-medium mb-2">
              {isEmployee
                ? "EMPLOYEE REGISTRATION"
                : isOwner
                ? "BUSINESS REGISTRATION"
                : "FREELANCER REGISTRATION"}
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              {isEmployee
                ? "Where do you work?"
                : isOwner
                ? "Tell us about your business"
                : "Tell us about your work"}
            </h1>

            <p className="text-muted-foreground mt-2">
              {isEmployee
                ? "Provide your professional details and select your organisation."
                : isOwner
                ? "Let's get your business workspace ready."
                : "Tell us a little about your professional services."}
            </p>
          </div>

          {/* ---------------------------------------- */}
          {/* EMPLOYEE DETAILS */}
          {/* ---------------------------------------- */}

          {isEmployee && (
            <div className="space-y-5">
              {/* Department popover */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Department
                </label>

                <Popover
                  open={departmentOpen}
                  onOpenChange={setDepartmentOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {department || "Select your department"}
                      <ChevronDown size={16} className="opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search departments..." />
                      <CommandList>
                        <CommandEmpty>No department found.</CommandEmpty>
                        <CommandGroup>
                          {departments.map((item) => (
                            <CommandItem
                              key={item}
                              value={item}
                              onSelect={() => {
                                setDepartment(item);
                                setDepartmentOpen(false);
                                if (item !== "Other") {
                                  setCustomDepartment("");
                                }
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  department === item
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {item}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {department === "Other" && (
                  <Input
                    placeholder="Enter your department"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                  />
                )}
              </div>

              {/* Job title */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Job title / Position
                </label>

                <Input
                  placeholder="e.g. Marketing Manager"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              {/* Business selection popover */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Company / Organisation
                </label>

                <Popover
                  open={businessOpen}
                  onOpenChange={setBusinessOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedBusiness?.company_name ||
                          "Select your organisation"}
                      </span>
                      <ChevronDown size={16} className="opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search businesses..." />
                      <CommandList>
                        <CommandEmpty>
                          No registered businesses found.
                        </CommandEmpty>

                        <CommandGroup>
                          {businesses.map((business) => (
                            <CommandItem
                              key={business.id}
                              value={business.company_name}
                              onSelect={() => {
                                setSelectedBusiness(business);
                                setBusinessOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedBusiness?.id === business.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {business.company_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {isLoadingBusinesses && (
                  <p className="text-xs text-muted-foreground">
                    Loading registered businesses...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------- */}
          {/* OWNER / FREELANCER DETAILS */}
          {/* ---------------------------------------- */}

          {!isEmployee && renderBusinessDetails()}

          {/* ---------------------------------------- */}
          {/* CONTINUE */}
          {/* ---------------------------------------- */}

          <Button
            className="w-full mt-8"
            size="lg"
            onClick={finishOnboarding}
            disabled={
              isSubmitting ||
              (isEmployee &&
                (!selectedBusiness ||
                  !department ||
                  (department === "Other" && !customDepartment.trim()) ||
                  !jobTitle.trim() ||
                  isLoadingBusinesses))
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : isEmployee ? (
              "Submit access request"
            ) : (
              "Complete onboarding"
            )}
          </Button>
        </div>
      </div>

      {/* RIGHT IMAGE */}

      <div className="hidden lg:block h-full min-h-screen">
        <img
          src="/images/signup-image.png"
          alt="Squarredesk workspace"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
