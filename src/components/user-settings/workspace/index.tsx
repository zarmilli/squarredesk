// Component Import
import { Separator } from '@/components/ui/separator'
import type { User } from '@supabase/supabase-js'

import WorkspaceDetail from '@/components/user-settings/workspace/workspace-detail'
import WorkspaceName from '@/components/user-settings/workspace/workspace-name'
import type { Profile } from '@/context/AppDataContext'

interface WorkspaceProps {
  profile: Profile
  user: User
  refreshAppData: () => Promise<void>
}

const Workspace = ({ profile, user, refreshAppData }: WorkspaceProps) => {
  return (
    <section className='py-3'>
      <WorkspaceName profile={profile} user={user} refreshAppData={refreshAppData} />
      <Separator className='my-10' />
      <WorkspaceDetail profile={profile} user={user} refreshAppData={refreshAppData} />
    </section>
  )
}

export default Workspace
