// Next Imports
import Link from 'next/link'

// Third-party Imports
import { Trash2Icon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const DangerZone = () => {
  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Danger zone</h3>
        <p className='text-muted-foreground text-sm'>
          Manage general workspace. Contact system admin for more information{' '}
          <Link href='#' className='text-card-foreground font-medium hover:underline'>
            Learn more
          </Link>
        </p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <Card>
          <CardContent>
            <div className='flex justify-between gap-4 max-lg:flex-col lg:items-center'>
              <div className='space-y-1'>
                <h3 className='text-sm font-medium'>Leave workspace</h3>
                <p className='text-muted-foreground text-sm'>
                  Revoke your access to this team. Other people you have added to the workspace will remain.
                </p>
              </div>
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      variant='outline'
                      className='border-destructive! text-destructive! hover:bg-destructive/10! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 max-lg:w-full'
                    />
                  }
                >
                  <Trash2Icon />
                  Leave
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader className='space-y-2'>
                    <DialogTitle>Leave workspace</DialogTitle>
                    <div className='text-muted-foreground text-sm'>
                      Revoke your access to this team. Other people you have added to the workspace will remain.
                    </div>
                  </DialogHeader>
                  <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end'>
                    <DialogClose render={<Button variant='outline' />}>Cancel</DialogClose>
                    <DialogClose render={<Button variant='destructive' />}>Leave</DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        <Card className='cursor-not-allowed opacity-60'>
          <CardContent>
            <div className='flex justify-between gap-4 max-lg:flex-col lg:items-center'>
              <div className='space-y-1'>
                <h3 className='text-sm font-medium'>Delete workspace</h3>
                <p className='text-muted-foreground text-sm'>
                  Delete your workspace permanently. This action will remove all data and cannot be undone.
                </p>
              </div>
              <Button
                variant='outline'
                className='hover:bg-destructive/10! text-destructive! border-destructive! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 max-lg:w-full'
                disabled
              >
                <Trash2Icon />
                Delete workspace
              </Button>
            </div>
            <Separator className='my-4' />
            <p className='text-muted-foreground text-sm'>
              You cannot delete the workspace because you are not the system admin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DangerZone
