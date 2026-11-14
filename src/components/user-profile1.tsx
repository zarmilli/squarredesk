import { Mail, MapPin } from "lucide-react";
import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const person8 = {
  name: "Kim Jihoon",
  firstName: "Kim",
  lastName: "Jihoon",
  initials: "KJ",
  email: "kim.jihoon@example.com",
  username: "kimjihoon",
  role: "Software Engineer",
  company: "Saehan Electronics",
  location: "Seoul, South Korea",
  avatar: "https://cdn.shadcnblocks.com/shadcnblocks/image-set/modern/avatars/avatar8.webp",
};
interface User {
  name: string;
  avatar?: string;
  role?: string;
  bio?: string;
  location?: string;
  email?: string;
  verified?: boolean;
}

interface UserProfile1Props {
  user?: User;
  className?: string;
}

const UserProfile1 = ({
  user = {
    name: person8.name,
    avatar: person8.avatar,
    role: "Senior Product Designer",
    bio: "Crafting intuitive digital experiences with a focus on accessibility and user delight. Previously at Figma and Stripe.",
    location: "San Francisco, CA",
    email: person8.email,
    verified: true,
  },
  className,
}: UserProfile1Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container flex justify-center">
        <Card className="w-full max-w-sm text-center">
          <CardHeader className="pb-0">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="size-24">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-semibold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  {user.verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                {user.role && (
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {user.bio && (
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            )}
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              {user.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button className="flex-1">Message</Button>
            <Button variant="outline" className="flex-1">
              Follow
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
};

export { UserProfile1 };
