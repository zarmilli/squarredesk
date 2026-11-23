// Third-party Imports
import { Trash2Icon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const DangerZone = () => {
  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Danger Zone</h3>
        <p className='text-muted-foreground text-sm'>
          Delete your account permanently. This action will remove all your data and cannot be undone{' '}
          <a href='#' className='text-card-foreground font-medium hover:underline'>
            Learn more
          </a>
        </p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <Card>
          <CardContent>
            <div className='flex justify-between gap-4 max-lg:flex-col lg:items-center'>
              <div className='space-y-1'>
                <h3 className='text-sm font-medium'>Delete account</h3>
                <p className='text-muted-foreground text-sm'>
                  Delete your account permanently. This action will remove all your data and cannot be undone.
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
                  Delete
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader className='space-y-2'>
                    <DialogTitle>Delete account</DialogTitle>
                    <div className='text-muted-foreground text-sm'>
                      Delete your account permanently. This action will remove all your data and cannot be undone.
                    </div>
                  </DialogHeader>
                  <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end'>
                    <DialogClose render={<Button variant='outline' />}>Cancel</DialogClose>
                    <DialogClose render={<Button variant='destructive' />}>Delete</DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DangerZone
