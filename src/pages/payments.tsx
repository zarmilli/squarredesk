import { Card, CardContent } from "@/components/ui/card";

const transactionsGif = "/images/transactions.gif";

export default function Payments() {
  return (
    <div className="flex h-full items-center justify-center overflow-hidden p-6">
      <Card className="w-full max-w-6xl border-stone-800 bg-[#0f0f0f] shadow-2xl">
        <CardContent className="flex flex-col items-center justify-center px-8 py-12 text-center sm:px-12 lg:px-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-stone-100">
              transactions are coming soon
            </h2>
            <p className="mt-3 text-sm text-stone-400">
              The payments experience is being polished for you right now.
            </p>
          </div>

          <div className="mt-10 w-full max-w-[1200px] overflow-hidden rounded-2xl border border-stone-800 bg-black/70">
            <div className="h-[695px] overflow-hidden">
              <img
                src={transactionsGif}
                alt="Transactions preview"
                className="h-[715px] w-full object-cover object-center"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
