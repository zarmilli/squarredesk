import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function MarketplaceProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  useEffect(() => {
    if (id) loadProduct(id);
  }, [id]);

  async function loadProduct(productId: string) {
    const { data, error } = await supabase
      .from("marketplace_products")
      .select("id, name, description, image_url, variants")
      .eq("id", productId)
      .single();

    if (error) {
      console.error(error);
    } else if (data) {
      setProduct(data);
      // Pre-select the first variant
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-80 w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-5 w-1/4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24" />
                ))}
              </div>
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-stone-500">Product not found.</p>
          <Button variant="outline" onClick={() => navigate("/marketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-4xl mx-auto">

        {/* BACK */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => navigate("/marketplace")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* IMAGE */}
          <div className="w-full rounded-xl overflow-hidden bg-stone-100 h-80 md:h-full">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">
                No image
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="flex flex-col gap-4">

            {/* NAME + PRICE */}
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">
                {product.name}
              </h1>
              {selectedVariant && selectedVariant.price > 0 && (
                <p className="text-xl font-bold text-stone-800 mt-1">
                  R{selectedVariant.price.toFixed(2)}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            <p className="text-sm text-stone-500 leading-relaxed">
              {product.description}
            </p>

            {/* SIZE VARIANTS */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-stone-700 mb-2">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        "px-3 py-1.5 rounded-md border text-sm transition-colors",
                        selectedVariant?.size === variant.size
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
                      )}
                    >
                      {variant.size}
                      {variant.price > 0 && (
                        <span className="ml-1.5 text-xs opacity-70">
                          R{variant.price.toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ORDER BUTTON */}
            <Button
              className="w-full mt-auto"
              size="lg"
              disabled={!selectedVariant}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {selectedVariant
                ? `Order — R${selectedVariant.price.toFixed(2)}`
                : "Select a size to order"}
            </Button>

            {/* NOTE */}
            <p className="text-xs text-stone-400 text-center">
              Orders are fulfilled and delivered within 5–7 business days.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
