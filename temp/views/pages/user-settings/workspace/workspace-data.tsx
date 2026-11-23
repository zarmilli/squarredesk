'use client'

// Third-party Imports
import { toast } from 'sonner'

import { CheckCircle2Icon, DownloadIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const WorkspaceData = () => {
  const promise = () =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve('success')
      }, 2000)
    )

  const exports = [
    {
      id: 1,
      type: 'CSV Export',
      date: 'Mar 12, 2023',
      status: 'progress',
      progress: 25
    },
    {
      id: 2,
      type: 'CSV Export',
      date: 'Jan 12, 2023',
      status: 'completed',
      progress: 100
    }
  ]

  return (
    <div>
      <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
        {/* Workspace Data */}
        <div className='flex flex-col space-y-1'>
          <h3 className='text-base font-semibold'>Export Workspace data</h3>
          <p className='text-muted-foreground text-sm'>Export your workspace data for backup or migration purposes.</p>
        </div>
        {/* Content */}
        <div className='space-y-6 lg:col-span-2'>
          <Button
            variant='outline'
            onClick={() =>
              toast.promise(promise, {
                loading: 'Loading...',
                success: 'Download successfully!',
                position: 'top-right'
              })
            }
          >
            <DownloadIcon />
            Get started
          </Button>

          <div className='overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted'>
                  <TableHead className='px-6'>TYPE</TableHead>
                  <TableHead className='px-6'>DATE</TableHead>
                  <TableHead className='px-6'></TableHead>
                  <TableHead className='w-[50px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className='px-6 font-medium'>{item.type}</TableCell>
                    <TableCell className='px-6'>{item.date}</TableCell>
                    <TableCell className='px-6'>
                      {item.status === 'progress' ? (
                        <div className='flex flex-col items-start gap-1'>
                          <span className='text-xs'>Progress {item.progress}%</span>
                          <Progress
                            value={item.progress}
                            className='**:data-[slot=progress-track]:bg-primary/20 w-20 **:data-[slot=progress-track]:h-2 md:w-60'
                          />
                        </div>
                      ) : (
                        <div className='flex items-center gap-2'>
                          <span className='text-sm'>Completed</span>
                          <CheckCircle2Icon className='h-4 w-4 text-green-600 dark:text-green-400' />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() =>
                          toast.promise(promise, {
                            loading: 'Loading...',
                            success: 'Download successfully!',
                            position: 'top-right'
                          })
                        }
                      >
                        <DownloadIcon className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkspaceData
