'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'

// Third-party Imports
import { ImageIcon, Trash2Icon, UploadCloudIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/context/AppDataContext'

interface PersonalInfoProps {
  profile: Profile
  user: User
  refreshAppData: () => Promise<void>
}

const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/avif'])
const maxImagePixels = 5_000_000

const PersonalInfo = ({ profile, user, refreshAppData }: PersonalInfoProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [firstName, setFirstName] = useState(profile.first_name ?? '')
  const [lastName, setLastName] = useState(profile.last_name ?? '')
  const [bio, setBio] = useState(profile.personal_bio ?? '')
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!file) {
      const t = window.setTimeout(() => setPreview(removeAvatar ? null : profile.avatar_url), 0)

      return () => clearTimeout(t)
    }

    const url = URL.createObjectURL(file)

    const t = window.setTimeout(() => setPreview(url), 0)

    return () => {
      clearTimeout(t)
      URL.revokeObjectURL(url)
    }
  }, [file, profile.avatar_url, removeAvatar])

  useEffect(() => {
    setFirstName(profile.first_name ?? '')
    setLastName(profile.last_name ?? '')
    setBio(profile.personal_bio ?? '')
    setRemoveAvatar(false)
  }, [profile.first_name, profile.last_name, profile.personal_bio, profile.avatar_url])

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]

    if (!f) return

    if (!acceptedImageTypes.has(f.type)) {
      toast({ title: 'Unsupported image', description: 'Use a JPG, JPEG, PNG, or AVIF image.', variant: 'destructive' })
      e.currentTarget.value = ''

      return
    }

    setFile(f)
    setRemoveAvatar(false)
  }

  const openPicker = () => inputRef.current?.click()

  const remove = () => {
    setFile(null)
    setRemoveAvatar(true)
    if (inputRef.current) inputRef.current.value = ''
  }

  const validateImageDimensions = async (image: File) => {
    const bitmap = await createImageBitmap(image)
    const pixels = bitmap.width * bitmap.height
    bitmap.close()

    return pixels <= maxImagePixels
  }

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      let avatarUrl = removeAvatar ? null : profile.avatar_url

      if (file) {
        if (!(await validateImageDimensions(file))) {
          throw new Error('Image must be 5 megapixels or smaller.')
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `avatars/${user.id}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('site-assets').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          personal_bio: bio.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      await refreshAppData()
      setFile(null)
      setRemoveAvatar(false)
      toast({ title: 'Profile updated', description: 'Your personal information was saved.' })
    } catch (error) {
      toast({
        title: 'Unable to save profile',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Personal Information</h3>
        <p className='text-muted-foreground text-sm'>Manage your personal information.</p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <form id='personal-info-form' className='mx-auto' onSubmit={saveProfile}>
          <div className='mb-6 w-full space-y-2'>
            <Label>Your Avatar</Label>
            <div className='flex items-center gap-4'>
              <div
                role='button'
                tabIndex={0}
                aria-label='Upload your avatar'
                onClick={openPicker}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openPicker()
                  }
                }}
                className='flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed hover:opacity-95'
              >
                {preview ? (
                  <img src={preview} alt='avatar preview' className='h-full w-full object-cover' />
                ) : (
                  <ImageIcon />
                )}
              </div>

              <div className='flex items-center gap-2'>
                <input
                  ref={inputRef}
                  type='file'
                  accept='.jpg,.jpeg,.png,.avif,image/jpeg,image/png,image/avif'
                  className='hidden'
                  onChange={onSelect}
                />
                <Button type='button' variant='outline' onClick={openPicker} className='flex items-center gap-2'>
                  <UploadCloudIcon />
                  Upload avatar
                </Button>
                <Button type='button' variant='ghost' onClick={remove} disabled={!file} className='text-destructive!'>
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <p className='text-muted-foreground text-sm'>JPG, JPEG, PNG, or AVIF. Maximum 5 megapixels.</p>
          </div>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='multi-step-personal-info-first-name'>First Name</Label>
              <Input id='multi-step-personal-info-first-name' placeholder='John' value={firstName} onChange={event => setFirstName(event.target.value)} />
            </div>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='multi-step-personal-info-last-name'>Last Name</Label>
              <Input id='multi-step-personal-info-last-name' placeholder='Doe' value={lastName} onChange={event => setLastName(event.target.value)} />
            </div>
            <div className='flex flex-col items-start gap-2 sm:col-span-2'>
              <Label htmlFor='personal-bio'>Personal Bio</Label>
              <Textarea
                id='personal-bio'
                placeholder='Tell us a little about yourself'
                rows={5}
                value={bio}
                onChange={event => setBio(event.target.value)}
              />
            </div>
          </div>
        </form>
        <div className='flex justify-end'>
          <Button type='submit' form='personal-info-form' className='max-sm:w-full' disabled={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfo
