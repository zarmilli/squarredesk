import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

type Variant = {
  size: string;
  price: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  variants: Variant[];
};

function getStartingPrice(variants: Variant[]): string {
  if (!variants || variants.length === 0) return "—";
  const prices = variants.map((v) => v.price).filter((p) => p > 0);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  return `From R${min.toFixed(2)}`;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("marketplace_products")
      .select("id, name, description, image_url, variants")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">

      {/* BACK + HEADER */}
      <div className="mb-6">
        <BackButton onClick={() => navigate("/")} />

        <h1 className="text-2xl font-semibold text-stone-900">Marketplace</h1>
        <p className="text-sm text-stone-500 mt-1">
          Everything your business needs, branded and ready to go.
        </p>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="columns-2 md:columns-4 gap-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4">
              <Card className="p-3 space-y-3 animate-pulse">
                <Skeleton
                  className="w-full rounded-md"
                  style={{ height: `${180 + (i % 3) * 60}px` }}
                />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-full" />
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="columns-2 md:columns-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="break-inside-avoid mb-4">
              <Card className="flex flex-col overflow-hidden border border-stone-200 hover:shadow-md transition-shadow">

                {/* IMAGE — natural height, no cropping */}
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full object-contain"
                  />
                ) : (
                  <div className="w-full h-44 flex items-center justify-center bg-stone-100 text-stone-300 text-sm">
                    No image
                  </div>
                )}

                {/* DETAILS */}
                <div className="flex flex-col p-3 gap-1">
                  <p className="text-sm font-semibold text-stone-900 leading-tight">
                    {product.name}
                  </p>
                  <p className="text-sm text-stone-500">
                    {getStartingPrice(product.variants)}
                  </p>

                  <Button
                    className="w-full mt-2"
                    size="sm"
                    onClick={() => navigate(`/marketplace/${product.id}`)}
                  >
                    View Product
                  </Button>
                </div>

              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
