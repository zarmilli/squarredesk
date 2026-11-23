'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/context/AppDataContext'

interface WorkspaceNameProps {
  profile: Profile
  user: User
  refreshAppData: () => Promise<void>
}

const WorkspaceName = ({ profile, user, refreshAppData }: WorkspaceNameProps) => {
  const { toast } = useToast()
  const [companyName, setCompanyName] = useState(profile.company_name ?? '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => setCompanyName(profile.company_name ?? ''), [profile.company_name])

  const saveWorkspaceName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ company_name: companyName.trim() || null, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (error) throw error
      await refreshAppData()
      toast({ title: 'Workspace updated', description: 'Your workspace name was saved.' })
    } catch (error) {
      toast({ title: 'Unable to save workspace', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Workspace Name</h3>
        <p className='text-muted-foreground text-sm'>Manage your workspace name.</p>
      </div>
      <form className='space-y-6 lg:col-span-2' onSubmit={saveWorkspaceName}>
        <div className='flex flex-col items-start gap-1'>
          <Label htmlFor='workspace-name'>Workspace Name</Label>
          <Input id='workspace-name' placeholder='Workspace name' value={companyName} onChange={event => setCompanyName(event.target.value)} />
        </div>
        <div className='flex justify-end'>
          <Button type='submit' className='max-sm:w-full' disabled={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

export default WorkspaceName
