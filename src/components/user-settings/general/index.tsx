// Component Imports
import { Separator } from '@/components/ui/separator'
import type { User } from '@supabase/supabase-js'

import EmailPass from '@/components/user-settings/general/email-password'
import PersonalInfo from '@/components/user-settings/general/personal-info'
import type { Profile } from '@/context/AppDataContext'

interface UserGeneralProps {
  profile: Profile
  user: User
  refreshAppData: () => Promise<void>
}

const UserGeneral = ({ profile, user, refreshAppData }: UserGeneralProps) => {
  return (
    <section className='py-3'>
      <PersonalInfo profile={profile} user={user} refreshAppData={refreshAppData} />
      <Separator className='my-10' />
      <EmailPass email={user.email ?? profile.email} />
    </section>
  )
}

export default UserGeneral
