"use client";

import { Camera, X } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";

import {
  FileUpload,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
interface ProfileFormData {
  name: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
}

interface SettingsProfile1Props {
  defaultValues?: Partial<ProfileFormData>;
  onSave?: (data: ProfileFormData) => void;
  className?: string;
}

const SettingsProfile1 = ({
  defaultValues = {
    name: person8.name,
    email: person8.email,
    username: person8.username,
    avatar: person8.avatar,
    bio: "Product designer with 8+ years of experience crafting intuitive digital experiences. Currently focused on design systems and accessibility.",
  },
  className,
}: SettingsProfile1Props) => {
  const [avatarFiles, setAvatarFiles] = useState<File[]>([]);

  const initials = defaultValues.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Get preview URL from uploaded file or use default avatar
  const avatarPreview =
    avatarFiles.length > 0
      ? URL.createObjectURL(avatarFiles[0])
      : defaultValues.avatar;

  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your personal information and profile picture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <FileUpload
          value={avatarFiles}
          onValueChange={setAvatarFiles}
          accept="image/*"
          maxFiles={1}
          maxSize={2 * 1024 * 1024}
        >
          <div className="flex items-center gap-4">
            <FileUploadTrigger asChild>
              <button
                type="button"
                className="group relative size-20 shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Avatar className="size-20">
                  <AvatarImage
                    src={avatarPreview}
                    alt={defaultValues.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-6 text-white" />
                </div>
              </button>
            </FileUploadTrigger>

            <div className="space-y-1">
              <p className="text-sm font-medium">Profile Photo</p>
              <p className="text-xs text-muted-foreground">
                Click the avatar to upload a new photo
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          {avatarFiles.length > 0 && (
            <FileUploadList className="mt-3">
              {avatarFiles.map((file, index) => (
                <FileUploadItem
                  key={index}
                  value={file}
                  className="rounded-lg border bg-muted/30 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <FileUploadItemDelete asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <X className="size-4" />
                    </Button>
                  </FileUploadItemDelete>
                </FileUploadItem>
              ))}
            </FileUploadList>
          )}
        </FileUpload>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              defaultValue={defaultValues.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              defaultValue={defaultValues.username}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            defaultValue={defaultValues.email}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself"
            rows={4}
            defaultValue={defaultValues.bio}
          />
          <p className="text-xs text-muted-foreground">
            Brief description for your profile. Max 160 characters.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
};

export { SettingsProfile1 };
