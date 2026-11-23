'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/context/AppDataContext'

interface WorkspaceDetailProps {
  profile: Profile
  user: User
  refreshAppData: () => Promise<void>
}

const WorkspaceDetail = ({ profile, user, refreshAppData }: WorkspaceDetailProps) => {
  const { toast } = useToast()
  const [businessField, setBusinessField] = useState(profile.business_field ?? '')
  const [companySize, setCompanySize] = useState(profile.company_size ?? '')
  const [businessLocation, setBusinessLocation] = useState(profile.business_location ?? '')
  const [companyBio, setCompanyBio] = useState(profile.company_bio ?? '')
  const [serviceInput, setServiceInput] = useState('')
  const [services, setServices] = useState<string[]>(profile.services_offered ?? [])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setBusinessField(profile.business_field ?? '')
    setCompanySize(profile.company_size ?? '')
    setBusinessLocation(profile.business_location ?? '')
    setCompanyBio(profile.company_bio ?? '')
    setServices(profile.services_offered ?? [])
  }, [profile.business_field, profile.business_location, profile.company_bio, profile.company_size, profile.services_offered])

  function addService() {
    const service = serviceInput.trim()
    if (!service || services.includes(service)) return

    setServices((currentServices) => [...currentServices, service])
    setServiceInput('')
  }

  const saveWorkspaceDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_field: businessField || null,
          company_size: companySize || null,
          business_location: businessLocation.trim() || null,
          company_bio: companyBio.trim() || null,
          services_offered: services,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error
      await refreshAppData()
      toast({ title: 'Business details updated', description: 'Your workspace details were saved.' })
    } catch (error) {
      toast({ title: 'Unable to save business details', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
        {/* Workspace Detail */}
        <div className='flex flex-col space-y-1'>
          <h3 className='text-base font-semibold'>Workspace Detail</h3>
          <p className='text-muted-foreground text-sm'>Manage your business details and services.</p>
        </div>
        {/* Content */}
        <form className='space-y-6 lg:col-span-2' onSubmit={saveWorkspaceDetails}>
          <div className='w-full space-y-2'>
            <Label htmlFor='business-field'>Business field</Label>
            <Select value={businessField} onValueChange={setBusinessField}>
              <SelectTrigger id='business-field'>
                <SelectValue placeholder='Select your business field' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Technology'>Technology</SelectItem>
                <SelectItem value='Marketing'>Marketing &amp; Advertising</SelectItem>
                <SelectItem value='Finance'>Finance &amp; Accounting</SelectItem>
                <SelectItem value='Fashion'>Fashion &amp; Apparel</SelectItem>
                <SelectItem value='Ecommerce'>E-commerce</SelectItem>
                <SelectItem value='RealEstate'>Real Estate</SelectItem>
                <SelectItem value='Construction'>Construction</SelectItem>
                <SelectItem value='Education'>Education</SelectItem>
                <SelectItem value='Healthcare'>Healthcare</SelectItem>
                <SelectItem value='Hospitality'>Hospitality</SelectItem>
                <SelectItem value='Food'>Food &amp; Beverage</SelectItem>
                <SelectItem value='Logistics'>Logistics &amp; Transport</SelectItem>
                <SelectItem value='Creative'>Creative / Design</SelectItem>
                <SelectItem value='Consulting'>Consulting</SelectItem>
                <SelectItem value='Manufacturing'>Manufacturing</SelectItem>
                <SelectItem value='Retail'>Retail</SelectItem>
                <SelectItem value='Agriculture'>Agriculture</SelectItem>
                <SelectItem value='Legal'>Legal</SelectItem>
                <SelectItem value='Other'>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='w-full space-y-2'>
            <Label htmlFor='company-size'>Company size</Label>
            <Select value={companySize} onValueChange={setCompanySize}>
              <SelectTrigger id='company-size'>
                <SelectValue placeholder='Select company size' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1-5'>1–5</SelectItem>
                <SelectItem value='6-20'>6–20</SelectItem>
                <SelectItem value='21-50'>21–50</SelectItem>
                <SelectItem value='50+'>50+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='w-full space-y-2'>
            <Label htmlFor='business-location'>Business location</Label>
            <Input
              id='business-location'
              placeholder='City, country'
              value={businessLocation}
              onChange={event => setBusinessLocation(event.target.value)}
            />
          </div>
          <div className='w-full space-y-2'>
            <Label htmlFor='company-bio'>Company bio</Label>
            <Textarea
              id='company-bio'
              placeholder='Briefly describe your business'
              rows={5}
              value={companyBio}
              onChange={event => setCompanyBio(event.target.value)}
            />
          </div>
          <div className='w-full space-y-2'>
            <Label htmlFor='services-offered'>Services offered</Label>
            <div className='flex gap-2'>
              <Input
                id='services-offered'
                placeholder='Add a service'
                value={serviceInput}
                onChange={event => setServiceInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addService()
                  }
                }}
              />
              <Button type='button' onClick={addService}>
                Add
              </Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              {services.map(service => (
                <Badge
                  key={service}
                  variant='secondary'
                  className='cursor-pointer'
                  onClick={() =>
                    setServices(currentServices =>
                      currentServices.filter(item => item !== service)
                    )
                  }
                >
                  {service} ×
                </Badge>
              ))}
            </div>
          </div>
          <div className='flex justify-end'>
            <Button type='submit' className='max-sm:w-full' disabled={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorkspaceDetail
