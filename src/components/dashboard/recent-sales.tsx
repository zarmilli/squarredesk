import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const sales = [
  ["/avatars/01.png", "OM", "Olivia Martin", "olivia.martin@email.com", "+$1,999.00"],
  ["/avatars/02.png", "JL", "Jackson Lee", "jackson.lee@email.com", "+$39.00"],
  ["/avatars/03.png", "IN", "Isabella Nguyen", "isabella.nguyen@email.com", "+$299.00"],
  ["/avatars/04.png", "WK", "William Kim", "will@email.com", "+$99.00"],
  ["/avatars/05.png", "SD", "Sofia Davis", "sofia.davis@email.com", "+$39.00"],
];

export function RecentSales() {
  return (
    <div className="space-y-8">
      {sales.map(([avatar, initials, name, email, amount]) => (
        <div key={email} className="flex items-center gap-4">
          <Avatar className="h-9 w-9"><AvatarImage src={avatar} alt="Avatar" /><AvatarFallback>{initials}</AvatarFallback></Avatar>
          <div className="flex flex-1 flex-wrap items-center justify-between">
            <div className="space-y-1"><p className="text-sm leading-none font-medium">{name}</p><p className="text-sm text-muted-foreground">{email}</p></div>
            <div className="font-medium">{amount}</div>
          </div>
        </div>
      ))}
    </div>
  );
}