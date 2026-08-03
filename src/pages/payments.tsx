const transactionsGif = "/images/transactions.gif";

export default function Payments() {
  return (
    <div className="flex h-full items-center justify-center overflow-hidden bg-transparent p-6 pb-12">
      <div className="flex w-full max-w-5xl flex-col items-center justify-center text-center">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-stone-100">
            transactions are coming soon
          </h2>
          <p className="mt-3 text-sm text-stone-400">
            The payments experience is being polished for you right now.
          </p>
        </div>

        <div className="mt-10 w-full max-w-[680px] overflow-hidden rounded-2xl border-0 bg-transparent">
          <div className="inset-x-0 bottom-0 h-[calc(100%-40px)] overflow-hidden"
          style={{ aspectRatio: "1920 / 1080", clipPath: "inset(0 0 22px 0)" }}>
            <img
              src={transactionsGif}
              alt="Transactions preview"
              className="h-auto w-full object-contain object-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
