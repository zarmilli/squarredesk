import { Suspense } from 'react'
import type { User } from '@supabase/supabase-js'

import UserSettingsTabs from '@/components/user-settings/user-settings-tabs'
import type { Profile } from '@/context/AppDataContext'

interface UserSettingsProps {
  profile: Profile
  user: User
  canManageWorkspace: boolean
  refreshAppData: () => Promise<void>
}

const UserSettings = ({ profile, user, canManageWorkspace, refreshAppData }: UserSettingsProps) => {
  return (
    <div>
      <div className='mb-4 md:mb-6 lg:mb-10'>
        <h1 className='text-xl font-bold'>Account & User Management</h1>
        <p className='text-muted-foreground'>Manage your account settings and user preferences.</p>
      </div>
      <Suspense>
        <UserSettingsTabs
          profile={profile}
          user={user}
          canManageWorkspace={canManageWorkspace}
          refreshAppData={refreshAppData}
        />
      </Suspense>
    </div>
  )
}

export default UserSettings
