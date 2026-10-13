'use client'

import { useEffect, useState } from 'react'
import { LoaderCircle, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import FacultyInvitationForm, {
  DRAFT_KEY,
  EMPTY_FORM,
} from './FacultyInvitationForm'

import { createFacultyInvitation } from '@/services/faculty-invitation.service'
import type { FacultyInvitationFormValues } from '@/types/faculty-invitation.types'

function readDraft(): FacultyInvitationFormValues {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)

    if (!saved) return EMPTY_FORM

    const parsed = JSON.parse(saved) as Partial<FacultyInvitationFormValues>

    return {
      ...EMPTY_FORM,
      ...parsed,
      panelPeople: Array.isArray(parsed.panelPeople) ? parsed.panelPeople : [],
    }
  } catch {
    return EMPTY_FORM
  }
}

export default function FacultyInvitationDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [initialValues, setInitialValues] =
    useState<FacultyInvitationFormValues>(EMPTY_FORM)

  useEffect(() => {
    setInitialValues(readDraft())
  }, [])

  function handleOpenChange(nextOpen: boolean) {
    // Prevent Escape, outside click, or close button from dismissing
    // the dialog while the request is in progress.
    if (loading && !nextOpen) return

    if (nextOpen) {
      setInitialValues(readDraft())
      setError('')
    }

    setOpen(nextOpen)
  }

  async function handleSubmit(values: FacultyInvitationFormValues) {
    if (loading) return

    setLoading(true)
    setError('')

    try {
      await createFacultyInvitation(values)

      // Remove the draft only after the API confirms success.
      localStorage.removeItem(DRAFT_KEY)
      setInitialValues(EMPTY_FORM)
      setOpen(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send the invitation. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="gap-2 bg-[#001f3f] text-white hover:bg-[#003366]"
        >
          <Plus className="size-4" />
          Create Faculty
        </Button>
      </DialogTrigger>

      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-[95vw] sm:max-w-5xl"
        showCloseButton={!loading}
        onEscapeKeyDown={(event) => {
          if (loading) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (loading) event.preventDefault()
        }}
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 sm:px-6">
          <DialogTitle className="justify-center text-center">
            Add Faculty
          </DialogTitle>
          <DialogDescription>
            Enter the faculty member’s details to add them to your medical
            conference. Then click send email button from table to send
            invitation
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {loading && (
            <div
              role="status"
              className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <LoaderCircle className="size-4 animate-spin" />
              Sending invitation. Please wait...
            </div>
          )}

          {open && (
            <FacultyInvitationForm
              key="faculty-invitation-form"
              initialValues={initialValues}
              loading={loading}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
