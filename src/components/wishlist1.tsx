"use client";

import { Heart, ShoppingCart, Trash2, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface WishlistItem {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  priceDrop?: boolean;
}

const DEFAULT_ITEMS: WishlistItem[] = [
  {
    id: "1",
    name: "Wireless Noise-Canceling Headphones",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/electronics/Modern-White-Headphones-1.png",
    price: 249.99,
    originalPrice: 299.99,
    inStock: true,
    priceDrop: true,
  },
  {
    id: "2",
    name: "Premium Leather Crossbody Bag",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/maroon-leather-handbag.png",
    price: 189.0,
    inStock: true,
  },
  {
    id: "3",
    name: "Classic Wool Blend Coat",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/Young-Man-in-White-Hoodie-1.png",
    price: 329.0,
    inStock: false,
  },
  {
    id: "4",
    name: "Gold Hoop Earrings",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/accessories/Elegant-Gold-Earrings-1.png",
    price: 79.0,
    originalPrice: 99.0,
    inStock: true,
    priceDrop: true,
  },
  {
    id: "5",
    name: "Oversized Cotton Hoodie",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/black-hoodie-against-light-background.png",
    price: 65.0,
    inStock: true,
  },
  {
    id: "6",
    name: "Minimalist Watch",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/accessories/Elegant-Watch-on-Womans-Wrist-1.png",
    price: 195.0,
    inStock: true,
  },
];

interface Wishlist1Props {
  items?: WishlistItem[];
  className?: string;
  title?: string;
  description?: string;
  showActionButton?: boolean;
  onViewProduct?: (item: WishlistItem) => void;
  onRemoveItem?: (id: string) => void;
}

const Wishlist1 = ({
  items = DEFAULT_ITEMS,
  className,
  title = "My Wishlist",
  description,
  showActionButton = true,
  onViewProduct,
  onRemoveItem,
}: Wishlist1Props) => {
  const [wishlistItems, setWishlistItems] = useState(items);

  useEffect(() => {
    setWishlistItems(items);
  }, [items]);

  const removeItem = (id: string) => {
    onRemoveItem?.(id);
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(price);
  };

  const handleAction = (item: WishlistItem) => {
    if (onViewProduct) {
      onViewProduct(item);
      return;
    }

    if (!item.inStock) {
      return;
    }
  };

  return (
    <section className={cn("py-6 md:py-8", className)}>
      <div className="container max-w-[1600px] px-2 md:px-4">
        <div className="mb-8 flex items-center justify-between">
          {showActionButton && wishlistItems.length > 0 && (
            <Button variant="outline">
              <ShoppingCart className="mr-2 size-4" />
              Add All to Cart
            </Button>
          )}
        </div>

        {wishlistItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="group gap-0 overflow-hidden p-0">
                <div className="relative">
                  <AspectRatio ratio={1} className="bg-muted">
                    <img
                      src={item.image}
                      alt={item.name}
                      className={cn(
                        "size-full object-cover",
                        !item.inStock && "opacity-50",
                      )}
                    />
                  </AspectRatio>

                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {item.priceDrop && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">
                        <TrendingDown className="mr-1 size-3" />
                        Price Drop
                      </Badge>
                    )}
                    {!item.inStock && (
                      <Badge variant="secondary">Out of Stock</Badge>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <CardContent className="p-4">
                  <h3 className="leading-tight font-medium">{item.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      {formatPrice(item.price)}
                    </span>
                    {item.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(item.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Button
                    className="mt-4 w-full"
                    disabled={!item.inStock}
                    variant={item.inStock ? "default" : "secondary"}
                    onClick={() => handleAction(item)}
                  >
                    {onViewProduct
                      ? "View Product"
                      : item.inStock
                        ? "Add to Cart"
                        : "Notify When Available"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-0">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                <Heart className="size-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Save items you love by clicking the heart icon on any product
              </p>
              <Button className="mt-6">Continue Shopping</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export { Wishlist1 };
