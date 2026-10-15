'use client'

import { useEffect } from 'react'
import {
  useFieldArray,
  useForm,
  type FieldPath,
  type UseFormReturn,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { facultyInvitationSchema } from '@/schema/faculty-invitation.schema'
import type {
  FacultyInvitationFormValues,
  InvitationGroup,
  InvitationType,
} from '@/types/faculty-invitation.types'

export const DRAFT_KEY = 'faculty-invitation-form-draft-v1'

export const EMPTY_FORM: FacultyInvitationFormValues = {
  invitationType: 'SOLO_TALK',
  group: 'MP',
  name: '',
  email: '',
  mobile: '',
  sessionName: '',
  topic: '',
  workshopName: '',
  date: '',
  time: '',
  hall: '',
  moderators: [],
  coPanellists: [],
  panelPeople: [],
}


const INVITATION_CATEGORIES: Record<
  InvitationGroup,
  { value: InvitationType; label: string }[]
> = {
  MP: [
    { value: 'SOLO_TALK', label: 'Solo Talk' },
    { value: 'PANELIST', label: 'Panelist' },
    { value: 'MODERATOR', label: 'Moderator' },
    { value: 'WORKSHOP', label: 'Workshop' },
  ],
  OUT_OF_MP: [
    { value: 'SOLO_TALK', label: 'Solo Talk' },
    { value: 'PANELIST', label: 'Panelist' },
    { value: 'MODERATOR', label: 'Moderator' },
    { value: 'WORKSHOP', label: 'Workshop' },
  ],
  NCD: [
    { value: 'SOLO_TALK', label: 'Solo Talk' },
    {
      value: 'SOLO_TALK_ALL_COMPLIMENTARY',
      label: 'Solo Talk - All Complimentary',
    },
    { value: 'PANELIST', label: 'Panelist' },
    { value: 'MODERATOR', label: 'Moderator' },
  ],
}

interface Props {
  initialValues: FacultyInvitationFormValues
  loading: boolean
  onSubmit: (values: FacultyInvitationFormValues) => Promise<void>
  submitLabel?: string
}

export default function FacultyInvitationForm({
  initialValues,
  loading,
  onSubmit,
  submitLabel = 'Add Faculty',
}: Props) {
  const form = useForm<FacultyInvitationFormValues>({
    resolver: zodResolver(facultyInvitationSchema),
    defaultValues: initialValues,
    mode: 'onSubmit',
    shouldUnregister: false,
  })

  const {
    fields: moderatorFields,
    append: appendModerator,
    remove: removeModerator,
  } = useFieldArray({
    control: form.control,
    name: 'moderators',
  })

  const {
    fields: coPanellistFields,
    append: appendCoPanellist,
    remove: removeCoPanellist,
  } = useFieldArray({
    control: form.control,
    name: 'coPanellists',
  })

  const {
    fields: panelPeopleFields,
    append: appendPanelPerson,
    remove: removePanelPerson,
  } = useFieldArray({
    control: form.control,
    name: 'panelPeople',
  })

  const invitationType = form.watch('invitationType')
  const group = form.watch('group')
  const availableCategories = INVITATION_CATEGORIES[group]

  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
      } catch {
        // Keep editing available if browser storage is unavailable.
      }
    })

    return () => subscription.unsubscribe()
  }, [form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  const errors = form.formState.errors

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Group *</Label>
          <Select
            value={group}
            onValueChange={(value) => {
              if (!value) return

              const nextGroup = value as InvitationGroup
              const allowedCategories = INVITATION_CATEGORIES[nextGroup]
              const currentType = form.getValues('invitationType')

              form.setValue('group', nextGroup, {
                shouldDirty: true,
                shouldValidate: true,
              })

              if (
                !allowedCategories.some(
                  (category) => category.value === currentType,
                )
              ) {
                form.setValue('invitationType', allowedCategories[0].value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })

                // Clear fields belonging to the previous category.
                form.setValue('topic', '')
                form.setValue('workshopName', '')
                form.setValue('moderators', [])
                form.setValue('coPanellists', [])
                form.setValue('panelPeople', [])
              }
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MP">MP</SelectItem>
              <SelectItem value="OUT_OF_MP">Out of MP</SelectItem>
              <SelectItem value="NCD">NCD</SelectItem>
            </SelectContent>
          </Select>
          {errors.group && (
            <p className="text-sm text-destructive">{errors.group.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Invitation Type *</Label>
          <Select
            value={invitationType}
            onValueChange={(value) => {
              if (!value) return

              form.setValue('invitationType', value as InvitationType, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select invitation type" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.invitationType && (
            <p className="text-sm text-destructive">
              {errors.invitationType.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty-name">Faculty Name *</Label>
          <Input
            id="faculty-name"
            {...form.register('name')}
            placeholder="Enter faculty name"
            disabled={loading}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty-email">Email *</Label>
          <Input
            id="faculty-email"
            type="text"
            {...form.register('email')}
            placeholder="faculty@example.com"
            disabled={loading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty-mobile">Mobile</Label>
          <Input
            id="faculty-mobile"
            {...form.register('mobile')}
            placeholder="Enter mobile number"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty-hall">Hall *</Label>
          <Input
            id="faculty-hall"
            {...form.register('hall')}
            placeholder="Enter hall"
            disabled={loading}
          />
          {errors.hall && (
            <p className="text-sm text-destructive">{errors.hall.message}</p>
          )}
        </div>

        {invitationType === 'WORKSHOP' ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="workshop-name">Workshop Name *</Label>
            <Input
              id="workshop-name"
              {...form.register('workshopName')}
              placeholder="Enter workshop name"
              disabled={loading}
            />
            {errors.workshopName && (
              <p className="text-sm text-destructive">
                {errors.workshopName.message}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="faculty-topic">Topic *</Label>
            <Input
              id="faculty-topic"
              {...form.register('topic')}
              placeholder="Enter topic"
              disabled={loading}
            />
            {errors.topic && (
              <p className="text-sm text-destructive">{errors.topic.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="session-name">Session Name</Label>
          <Input
            id="session-name"
            {...form.register('sessionName')}
            placeholder="Enter session name"
            disabled={loading}
          />
          {errors.sessionName && (
            <p className="text-sm text-destructive">
              {errors.sessionName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty-date">Date *</Label>
          <Select
            value={form.watch('date')}
            onValueChange={(value) => {
              if (!value) return
              form.setValue('date', value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
            disabled={loading}
          >
            <SelectTrigger id="faculty-date" className="w-full">
              <SelectValue placeholder="Select conference date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18th December 2026">
                18th December 2026
              </SelectItem>
              <SelectItem value="19th December 2026">
                19th December 2026
              </SelectItem>
              <SelectItem value="20th December 2026">
                20th December 2026
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty-time">Time *</Label>
          <Input
            id="faculty-time"
            {...form.register('time')}
            placeholder="e.g. 10:00 - 10:45 AM"
            disabled={loading}
          />
          {errors.time && (
            <p className="text-sm text-destructive">{errors.time.message}</p>
          )}
        </div>
      </div>

      {invitationType === 'PANELIST' && (
        <div className="space-y-4">
          <PeopleSection
            title="Moderators"
            description="Add one or more moderators for this panel discussion."
            fields={moderatorFields}
            fieldName="moderators"
            form={form}
            loading={loading}
            onAdd={() => appendModerator({ name: '', contact: '', email: '' })}
            onRemove={removeModerator}
          />

          <PeopleSection
            title="Co-panellists"
            description="Add the co-panellists participating in this discussion."
            fields={coPanellistFields}
            fieldName="coPanellists"
            form={form}
            loading={loading}
            onAdd={() =>
              appendCoPanellist({ name: '', contact: '', email: '' })
            }
            onRemove={removeCoPanellist}
          />
        </div>
      )}

      {invitationType === 'MODERATOR' && (
        <PeopleSection
          title="Panellists"
          description="Add the panellists for the session being moderated."
          fields={panelPeopleFields}
          fieldName="panelPeople"
          form={form}
          loading={loading}
          onAdd={() => appendPanelPerson({ name: '', contact: '', email: '' })}
          onRemove={removePanelPerson}
        />
      )}

      <div className="flex justify-center border-t pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#001f3f] text-white hover:bg-[#003366] disabled:opacity-50"
        >
          {loading ? 'Saving Faculty...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

type PersonFieldName = 'moderators' | 'coPanellists' | 'panelPeople'

interface PersonRow {
  id: string
}

interface PeopleSectionProps {
  title: string
  description: string
  fields: PersonRow[]
  fieldName: PersonFieldName
  form: UseFormReturn<FacultyInvitationFormValues>
  loading: boolean
  onAdd: () => void
  onRemove: (index: number) => void
}

function PeopleSection({
  title,
  description,
  fields,
  fieldName,
  form,
  loading,
  onAdd,
  onRemove,
}: PeopleSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={onAdd}
        >
          <Plus className="mr-2 size-4" />
          Add Person
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No people added yet.
        </p>
      )}

      {fields.map((person, index) => {
        const namePath =
          `${fieldName}.${index}.name` as FieldPath<FacultyInvitationFormValues>
        const contactPath =
          `${fieldName}.${index}.contact` as FieldPath<FacultyInvitationFormValues>
        const nameError = form.getFieldState(namePath).error?.message
        const contactError = form.getFieldState(contactPath).error?.message

        const emailPath =
          `${fieldName}.${index}.email` as FieldPath<FacultyInvitationFormValues>

        const emailError = form.getFieldState(emailPath).error?.message

        return (
          <div
            key={person.id}
            className="grid grid-cols-1 items-start gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor={`${fieldName}-${index}-name`}>
                {title === 'Moderators'
                  ? `Moderator ${index + 1} Name *`
                  : title === 'Co-panellists'
                    ? `Co-panellist ${index + 1} Name *`
                    : `Panellist ${index + 1} Name *`}
              </Label>
              <Input
                id={`${fieldName}-${index}-name`}
                {...form.register(namePath)}
                placeholder="Enter name"
                disabled={loading}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldName}-${index}-contact`}>Contact *</Label>
              <Input
                id={`${fieldName}-${index}-contact`}
                {...form.register(contactPath)}
                placeholder="Mobile number"
                disabled={loading}
              />
              {contactError && (
                <p className="text-sm text-destructive">{contactError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldName}-${index}-email`}>Email *</Label>
              <Input
                id={`${fieldName}-${index}-email`}
                type="email"
                {...form.register(emailPath)}
                placeholder="Enter email address"
                disabled={loading}
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label={`Remove ${title.toLowerCase()} person ${index + 1}`}
              disabled={loading}
              onClick={() => onRemove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )
      })}
    </section>
  )
}
