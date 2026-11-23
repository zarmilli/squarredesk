import { Suspense } from 'react'

import UserSettingsTabs from '@/views/pages/user-settings/user-settings-tabs'

const UserSettings = () => {
  return (
    <div>
      <div className='mb-4 md:mb-6 lg:mb-10'>
        <h1 className='text-xl font-bold'>Account & User Management</h1>
        <p className='text-muted-foreground'>Manage your account settings and user preferences.</p>
      </div>
      <Suspense>
        <UserSettingsTabs />
      </Suspense>
    </div>
  )
}

export default UserSettings
