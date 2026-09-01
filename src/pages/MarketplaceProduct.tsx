import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProductDetail1 } from "@/components/product-detail1";

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
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <p className="text-stone-500">Product not found.</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 lg:p-6 custom-scrollbar">
      <ProductDetail1
        product={product}
        selectedVariant={selectedVariant}
        onSelectVariant={setSelectedVariant}
      />
    </div>
  );
}
