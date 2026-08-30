import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "@/components/ui/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Wishlist1 } from "@/components/wishlist1";
import { supabase } from "@/lib/supabase";

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

function getStartingPrice(variants: Variant[] = []): number {
  const prices = variants.map((v) => v.price).filter((price) => price > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
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

  const wishlistItems = products.map((product) => {
    const startingPrice = getStartingPrice(product.variants);
    const maxPrice =
      product.variants && product.variants.length > 0
        ? Math.max(...product.variants.map((variant) => variant.price).filter((price) => price > 0))
        : undefined;

    return {
      id: product.id,
      name: product.name,
      image:
        product.image_url ||
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
      price: startingPrice,
      originalPrice: maxPrice && maxPrice > startingPrice ? maxPrice : undefined,
      inStock: true,
      priceDrop: maxPrice !== undefined && maxPrice > startingPrice,
    };
  });

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="mb-6">
          <BackButton onClick={() => navigate("/")} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3 animate-pulse">
              <div className="h-72 rounded-xl bg-muted" />
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-5 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="mb-6">
        <BackButton onClick={() => navigate("/")} />
      </div>

      <Wishlist1
        items={wishlistItems}
        title="Marketplace"
        description="Everything your business needs, branded and ready to go."
        showActionButton={false}
        onViewProduct={(item) => navigate(`/marketplace/${item.id}`)}
        onRemoveItem={() => undefined}
        className="py-0"
      />
    </div>
  );
}
