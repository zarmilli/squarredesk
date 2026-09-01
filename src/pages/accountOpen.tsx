import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/BackButton";
import SaveButton from "@/components/ui/SaveButton";

export default function AccountOpen() {
  const navigate = useNavigate();
  const [registeredBusiness, setRegisteredBusiness] = useState(false);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    idNumber: "",
    businessName: "",
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat text-foreground"
      style={{
        backgroundImage: "url('/images/capitec.png')",
      }}
    >
      <div className="bg-black/15 backdrop-blur-[1px]">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/15 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <BackButton onClick={() => navigate(-1)} />
          </div>

          <div className="flex items-center gap-2">
            <SaveButton onClick={() => undefined} />
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-950/65 p-5 text-white shadow-lg shadow-black/20 backdrop-blur-md sm:p-8"
          >
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Business account application
              </h1>
              <p className="mt-2 text-sm text-slate-200">
                Complete the details below to open your Capitec business account.
              </p>
            </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-100">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your name"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surname" className="text-slate-100">Surname</Label>
              <Input
                id="surname"
                value={form.surname}
                onChange={(e) => handleChange("surname", e.target.value)}
                placeholder="Enter your surname"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="idNumber" className="text-slate-100">ID number</Label>
              <Input
                id="idNumber"
                value={form.idNumber}
                onChange={(e) => handleChange("idNumber", e.target.value)}
                placeholder="Enter your ID number"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="businessName" className="text-slate-100">Business name</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="Enter your business name"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-300"
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <Checkbox
                id="registeredBusiness"
                checked={registeredBusiness}
                onCheckedChange={(checked) => setRegisteredBusiness(Boolean(checked))}
                className="border-white/30 bg-white/5 data-[state=checked]:bg-primary data-[state=checked]:text-white"
              />
              <Label htmlFor="registeredBusiness" className="cursor-pointer text-slate-100">
                Registered business
              </Label>
            </div>

            {registeredBusiness && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="businessRegistration" className="text-slate-100">Business registration document</Label>
                <Input
                  id="businessRegistration"
                  type="file"
                  className="h-auto border-white/15 bg-white/5 py-2 text-slate-100 file:text-slate-100"
                />
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="copyId" className="text-slate-100">Copy of ID</Label>
              <Input
                id="copyId"
                type="file"
                className="h-auto border-white/15 bg-white/5 py-2 text-slate-100 file:text-slate-100"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="proofAddress" className="text-slate-100">Proof of address</Label>
              <Input
                id="proofAddress"
                type="file"
                className="h-auto border-white/15 bg-white/5 py-2 text-slate-100 file:text-slate-100"
              />
            </div>
          </div>

            <Button type="submit" className="mt-8 w-full" size="lg">
              Submit
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
