'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { PlusIcon, XIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ConnectedAccount {
  id: string
  name: string
  iconUrl: string
}

const initialAccounts: ConnectedAccount[] = [
  {
    id: 'google',
    name: 'Google',
    iconUrl: '/images/brands/google-icon.webp'
  },
  {
    id: 'slack',
    name: 'Slack',
    iconUrl: '/images/brands/slack-icon.webp'
  }
]

const ConnectedAccount = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(initialAccounts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [appName, setAppName] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [appIconUrl, setAppIconUrl] = useState('')
  const [description, setDescription] = useState('')

  const handleRemoveAccount = (accountId: string) => {
    setConnectedAccounts(prev => prev.filter(account => account.id !== accountId))
  }

  const resetForm = () => {
    setAppName('')
    setAppUrl('')
    setAppIconUrl('')
    setDescription('')
  }

  const handleConnect = () => {
    if (!appName.trim() || !appUrl.trim()) return

    const id = appName.toLowerCase().replace(/\s+/g, '-')

    setConnectedAccounts(prev => [
      ...prev,
      {
        id,
        name: appName,
        iconUrl: appIconUrl.trim() || ''
      }
    ])

    resetForm()
    setIsDialogOpen(false)
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col'>
        <h3 className='text-base font-semibold'>Connect Accounts</h3>
        <p className='text-muted-foreground text-sm'>Manage your connected accounts.</p>
      </div>

      {/* Content */}
      <div className='space-y-4 lg:col-span-2'>
        <div className='flex flex-wrap items-center gap-4'>
          {connectedAccounts.map(account => (
            <div key={account.id} className='flex h-9 w-fit items-center gap-2 rounded-md border px-2.5 text-sm'>
              {account.iconUrl ? (
                <img src={account.iconUrl} alt={account.name} className='size-4 rounded' />
              ) : (
                <div className='bg-muted-foreground/10 text-muted-foreground flex size-4 items-center justify-center rounded text-sm font-medium'>
                  {account.name.charAt(0)}
                </div>
              )}

              <p className='text-sm font-medium'>{account.name}</p>
              <Button
                size='icon-xs'
                variant='ghost'
                className='text-primary bg-primary/10 size-5 shrink-0 rounded-md transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none'
                aria-label={`Remove ${account.name}`}
                onClick={() => handleRemoveAccount(account.id)}
              >
                <XIcon className='size-3' aria-hidden='true' />
              </Button>
            </div>
          ))}

          {/* Add App Button + Modal */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant='outline'
                  className='bg-background h-9 gap-2 rounded-md px-3'
                  onClick={() => setIsDialogOpen(true)}
                />
              }
            >
              <PlusIcon className='size-4' />
              Add App
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect New App</DialogTitle>
                <DialogDescription>Add a new integration by providing the details below.</DialogDescription>
              </DialogHeader>

              <div className='grid gap-3 py-2'>
                <div className='grid gap-1'>
                  <Label>App Name</Label>
                  <Input value={appName} onChange={e => setAppName(e.target.value)} placeholder='e.g., Zoom' />
                </div>

                <div className='grid gap-1'>
                  <Label>App URL or Integration Key</Label>
                  <Input
                    value={appUrl}
                    onChange={e => setAppUrl(e.target.value)}
                    placeholder='https://app.example.com or key_abc123'
                  />
                </div>

                <div className='grid gap-1'>
                  <Label>Optional Description</Label>
                  <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder='Notes about this integration (optional)'
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => {
                    resetForm()
                    setIsDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleConnect} disabled={!appName.trim() || !appUrl.trim()}>
                  Connect
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className='text-muted-foreground text-sm'>
          Connected accounts allow you to integrate with third-party services for enhanced functionality.
        </p>
      </div>
    </div>
  )
}

export default ConnectedAccount
