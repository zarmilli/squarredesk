'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import { CheckIcon, EyeIcon, EyeOffIcon, MailIcon, XIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'

// Util Imports
import { cn } from '@/lib/utils'

const requirements = [
  { regex: /.{12,}/, text: 'At least 12 characters' },
  { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
  { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
  { regex: /[0-9]/, text: 'At least 1 number' },
  {
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
    text: 'At least 1 special character'
  }
]

const EmailPass = () => {
  const [isVisible, setIsVisible] = useState(false)

  const [password, setPassword] = useState('')

  const toggleVisibility = () => setIsVisible(prevState => !prevState)

  const strength = requirements.map(req => ({
    met: req.regex.test(password),
    text: req.text
  }))

  const strengthScore = useMemo(() => {
    return strength.filter(req => req.met).length
  }, [strength])

  const getColor = (score: number) => {
    if (score === 0) return 'bg-border'
    if (score <= 1) return 'bg-destructive'
    if (score <= 2) return 'bg-orange-500 '
    if (score <= 3) return 'bg-amber-500'
    if (score === 4) return 'bg-yellow-400'

    return 'bg-green-500'
  }

  const getText = (score: number) => {
    if (score === 0) return 'Enter a password'
    if (score <= 2) return 'Weak password'
    if (score <= 3) return 'Medium password'
    if (score === 4) return 'Strong password'

    return 'Very strong password'
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Email & Password</h3>
        <p className='text-muted-foreground text-sm'>Manage your email and password settings.</p>
      </div>

      {/* Content */}
      <div className='lg:col-span-2'>
        <form className='mx-auto space-y-6'>
          <div className='w-full space-y-2'>
            <Label htmlFor='email' className='gap-1'>
              Email<span className='text-destructive'>*</span>
            </Label>
            <InputGroup>
              <InputGroupInput id='email' type='email' placeholder='Email address' required />
              <InputGroupAddon align='inline-end' className='pr-2.75'>
                <MailIcon className='size-4' />
                <span className='sr-only'>Email</span>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className='w-full space-y-2'>
            <Label htmlFor='current-password' className='gap-1'>
              Current Password<span className='text-destructive'>*</span>
            </Label>
            <InputGroup>
              <InputGroupInput
                id='current-password'
                type={isVisible ? 'text' : 'password'}
                placeholder='Password'
                required
              />
              <InputGroupAddon align='inline-end' className='pr-1.5'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsVisible(prevState => !prevState)}
                  className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                >
                  {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                  <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className='w-full space-y-2'>
            <Label htmlFor='new-password' className='gap-1'>
              New Password<span className='text-destructive'>*</span>
            </Label>
            <InputGroup className='mb-3'>
              <InputGroupInput
                id='new-password'
                type={isVisible ? 'text' : 'password'}
                placeholder='Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <InputGroupAddon align='inline-end' className='pr-1.5'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={toggleVisibility}
                  className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                >
                  {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                  <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
                </Button>
              </InputGroupAddon>
            </InputGroup>

            <div className='mb-4 flex h-1 w-full gap-1'>
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-full flex-1 rounded-full transition-all duration-500 ease-out',
                    index < strengthScore ? getColor(strengthScore) : 'bg-border'
                  )}
                />
              ))}
            </div>

            <p className='text-foreground text-sm font-medium'>{getText(strengthScore)}. Must contain :</p>

            <ul className='mb-4 space-y-1.5'>
              {strength.map((req, index) => (
                <li key={index} className='flex items-center gap-2'>
                  {req.met ? (
                    <CheckIcon className='size-4 text-green-600 dark:text-green-400' />
                  ) : (
                    <XIcon className='text-muted-foreground size-4' />
                  )}
                  <span
                    className={cn('text-xs', req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}
                  >
                    {req.text}
                    <span className='sr-only'>{req.met ? ' - Requirement met' : ' - Requirement not met'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className='mt-6 flex justify-end'>
            <Button type='submit' className='max-sm:w-full'>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmailPass
