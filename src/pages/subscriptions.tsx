import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Check, X, Download, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import squeakImage from "/images/squeakImage.png";
import happyImage from "/images/happy.png";
import speakingImage from "/images/speaking.png";

const subscriptionPlans = [
  {
    id: "free",
    name: "Free",
    price: "R0",
    period: "/month",
    description: "Perfect for testing the platform",
    features: [
      { name: "1 Website Build", included: true },
      { name: "Basic Hosting", included: true },
      { name: "Community Support", included: true },
      { name: "Analytics", included: false },
      { name: "Custom Domains", included: false },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: "R49",
    period: "/month",
    description: "Great for freelancers",
    features: [
      { name: "3 Website Builds", included: true },
      { name: "Basic Hosting", included: true },
      { name: "Community Support", included: true },
      { name: "Analytics", included: true },
      { name: "Custom Domains", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R199",
    period: "/month",
    description: "For agencies and professionals",
    features: [
      { name: "Unlimited Websites", included: true },
      { name: "Advanced Hosting", included: true },
      { name: "Priority Support", included: true },
      { name: "Analytics", included: true },
      { name: "Custom Domains", included: true },
    ],
  },
];

const planAmounts: Record<string, string> = {
  free: "R0/month",
  basic: "R49/month",
  pro: "R199/month",
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNextBillingDate(dateStr: string | null | undefined): string {
  if (dateStr) {
    return formatDate(dateStr);
  }
  const now = new Date();
  const firstNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return firstNextMonth.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Subscriptions() {
  const [profile, setProfile] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [latestBillingStatus, setLatestBillingStatus] = useState<string | null>(null);
  const [pauseModal, setPauseModal] = useState(false);
  const [downgradeModal, setDowngradeModal] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);

  const isPaused = profile?.membership_tier !== "free" &&
    profile?.subscription_ends_at &&
    new Date(profile.subscription_ends_at) <= new Date();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    setProfile(profileData);

    const { data: billingData } = await supabase
      .from("billing_history")
      .select("*")
      .eq("user_id", user.id)
      .order("paid_at", { ascending: false });

    const rows = billingData || [];
    setBillingHistory(rows);

    if (rows.length > 0 && rows[0].status) {
      setLatestBillingStatus(rows[0].status);
    } else {
      setLatestBillingStatus(null);
    }
  }

  async function pauseSubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.functions.invoke("pause-subscription", {
      body: { userId: user.id }
    });

    setPauseModal(false);
    loadData();
  }

  async function downgradeToFree() {
    await pauseSubscription();
    setDowngradeModal(false);
  }

  // ─── KEY FIX: submit a hidden form directly to PayFast instead of
  // using window.location.href, which causes the browser to re-encode
  // the URL and break the signature.
  async function redirectToPayfast(plan: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use first_name from profiles table, not auth metadata
    const firstName = profile?.first_name || "User";

    const { data, error } = await supabase.functions.invoke("create-subscription", {
      body: {
        plan,
        userId: user.id,
        email: user.email,
        firstName,
      },
    });

    if (error) {
      console.error(error);
      return;
    }

    if (data?.paymentUrl) {
      // Parse the URL and POST its params as a form directly to PayFast
      // This prevents browser re-encoding from corrupting the signature
      const url = new URL(data.paymentUrl);
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://www.payfast.co.za/eng/process";

      url.searchParams.forEach((value, key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    }
  }

  async function handleDowngradeToBasic() {
    await pauseSubscription();
    setDowngradeModal(false);
    await redirectToPayfast("basic");
  }

  async function handleUpgradeToPro() {
    await pauseSubscription();
    setUpgradeModal(false);
    await redirectToPayfast("pro");
  }

  async function handleUpgradeToBasic() {
    await pauseSubscription();
    setUpgradeModal(false);
    await redirectToPayfast("basic");
  }

  async function handlePricingPlanClick(planId: string) {
    if (planId === "free") {
      if (profile?.membership_tier !== "free") {
        await downgradeToFree();
      }
    } else {
      await redirectToPayfast(planId);
    }
  }

  const currentSubscription = {
    plan: profile?.membership_tier ?? "—",
    status: latestBillingStatus ?? "Active",
    nextBilling: getNextBillingDate(profile?.subscription_ends_at),
    amount: planAmounts[profile?.membership_tier] ?? "R0/month",
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* CURRENT SUBSCRIPTION */}
        <Card className="bg-white dark:bg-stone-800 border-0">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* PLAN DETAILS */}
              <div className="space-y-4">
                <div className="bg-stone-50 dark:bg-stone-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Plan Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Plan</span>
                      <Badge variant="default">
                        {currentSubscription.plan}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        {currentSubscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Next Billing</span>
                      <span className="text-sm text-stone-900 dark:text-white">{currentSubscription.nextBilling}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Amount</span>
                      <span className="text-sm font-semibold text-stone-900 dark:text-white">{currentSubscription.amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* USAGE */}
              <div className="bg-stone-50 dark:bg-stone-700/30 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Usage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Sites</span>
                    <span>3 / unlimited</span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Storage</span>
                      <span>45GB / 100GB</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="bg-stone-50 dark:bg-stone-700/30 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Settings & Actions</h3>
                <div className="space-y-4">

                  {/* PAUSE TOGGLE */}
                  <div className="flex justify-between items-center">
                    <span>Pause Subscription</span>
                    <Switch
                      checked={isPaused}
                      onCheckedChange={() => {
                        if (!isPaused) setPauseModal(true);
                      }}
                    />
                  </div>

                  {/* DOWNGRADE */}
                  <Button
                    variant={profile?.membership_tier === "basic" ? "ghost" : "secondary"}
                    className="w-full"
                    onClick={() => setDowngradeModal(true)}
                  >
                    Downgrade Plan
                  </Button>

                  {/* UPGRADE */}
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setUpgradeModal(true)}
                  >
                    Upgrade Plan
                  </Button>

                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* PRICING PLANS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => {
            const isCurrent = profile?.membership_tier === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative bg-white dark:bg-stone-800 border",
                  isCurrent && "ring-2 ring-primary"
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Current Plan</Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <div>
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span>{plan.period}</span>
                  </div>
                  <p className="text-sm text-stone-500 mt-2">{plan.description}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        {feature.included
                          ? <Check className="w-4 h-4 text-green-500 mr-3" />
                          : <X className="w-4 h-4 text-stone-400 mr-3" />
                        }
                        <span className={cn("text-sm", !feature.included && "text-stone-400")}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isCurrent ? "ghost" : "default"}
                    className="w-full mt-6"
                    disabled={isCurrent}
                    onClick={() => handlePricingPlanClick(plan.id)}
                  >
                    {isCurrent ? "Current Plan" : "Choose Plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* BILLING HISTORY */}
        <Card className="bg-white dark:bg-stone-800 border border-stone-200">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 dark:bg-stone-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <img src={squeakImage} className="w-32" alt="Squeak the parrot" />
                          <p className="text-lg font-medium">Squeak sees no payments yet</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    billingHistory.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4">{formatDate(invoice.paid_at)}</td>
                        <td className="px-6 py-4 capitalize">{invoice.plan}</td>
                        <td className="px-6 py-4">R{Number(invoice.amount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <Badge>{invoice.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* PAUSE MODAL */}
      {pauseModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-stone-800 p-8 rounded-lg w-[420px] flex flex-col items-center text-center space-y-6">
            <img src={speakingImage} className="w-24" alt="Squeak the parrot" />
            <p>
              Squeak wants to confirm if you're pausing your subscription.
              This will revert you back to the free plan.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="secondary" onClick={() => setPauseModal(false)}>
                Cancel
              </Button>
              <Button onClick={pauseSubscription}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DOWNGRADE MODAL */}
      {downgradeModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-stone-800 p-8 rounded-lg w-[420px] flex flex-col items-center text-center space-y-6 relative">
            <button
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
              onClick={() => setDowngradeModal(false)}
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <img src={speakingImage} className="w-24" alt="Squeak the parrot" />
            <p>
              Squeak wants to confirm your downgrade. Please select which plan you'd like to move to.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant={profile?.membership_tier === "free" ? "ghost" : "default"}
                disabled={profile?.membership_tier === "free"}
                onClick={downgradeToFree}
              >
                Free Plan
              </Button>
              <Button
                variant={profile?.membership_tier === "basic" ? "ghost" : "default"}
                disabled={profile?.membership_tier === "basic"}
                onClick={handleDowngradeToBasic}
              >
                Basic Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {upgradeModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-stone-800 p-8 rounded-lg w-[420px] flex flex-col items-center text-center space-y-6 relative">
            <button
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
              onClick={() => setUpgradeModal(false)}
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <img src={happyImage} className="w-24" alt="Squeak the parrot" />
            <p>
              Squeak is excited for your upgrade! Please select which plan you'd like to move to.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant={profile?.membership_tier === "basic" ? "ghost" : "default"}
                disabled={profile?.membership_tier === "basic"}
                onClick={handleUpgradeToBasic}
              >
                Basic Plan
              </Button>
              <Button
                variant={profile?.membership_tier === "pro" ? "ghost" : "default"}
                disabled={profile?.membership_tier === "pro"}
                onClick={handleUpgradeToPro}
              >
                Pro Plan
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}