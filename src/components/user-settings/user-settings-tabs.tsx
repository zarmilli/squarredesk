'use client'

// React Imports
import { useSearchParams } from 'react-router-dom'
import { Building2, UserRound } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

// Third-party Imports
// Component Imports
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserGeneral from '@/components/user-settings/general'
import Workspace from '@/components/user-settings/workspace'
import type { Profile } from '@/context/AppDataContext'

interface UserSettingsTabsProps {
  profile: Profile
  user: User
  canManageWorkspace: boolean
  refreshAppData: () => Promise<void>
}

const UserSettingsTabs = ({ profile, user, canManageWorkspace, refreshAppData }: UserSettingsTabsProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSetting = searchParams.get('setting') ?? 'general'

  const setActiveSetting = (value: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('setting', value)
    setSearchParams(nextParams)
  }

  const tabs = [
    {
      name: 'General',
      value: 'general',
      icon: UserRound,
      content: <UserGeneral profile={profile} user={user} refreshAppData={refreshAppData} />
    },
    ...(canManageWorkspace
      ? [
          {
            name: 'Workspace',
            value: 'workspace',
            icon: Building2,
            content: <Workspace profile={profile} user={user} refreshAppData={refreshAppData} />
          }
        ]
      : [])
  ]

  const selectedSetting = tabs.some(tab => tab.value === activeSetting) ? activeSetting : 'general'

  return (
    <div className='w-full'>
      <Tabs
        value={selectedSetting}
        onValueChange={value => {
          setActiveSetting(value)
        }}
      >
        <TabsList className='h-auto w-full justify-start gap-2 rounded-none border-0 bg-transparent p-0'>
          {tabs.map(tab => {
            const Icon = tab.icon

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='h-auto gap-2 rounded-none bg-transparent px-3 py-2 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none'
              >
                <Icon className='size-4' aria-hidden='true' />
                {tab.name}
              </TabsTrigger>
            )
          })}
        </TabsList>
        <Separator className='mt-2' />

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default UserSettingsTabs
