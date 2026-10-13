'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  Download,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/DataTable'
import FacultyInvitationForm, {
  EMPTY_FORM,
} from '@/components/forms/FacultyInvitationForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createFacultyInvitation,
  deleteFacultyInvitation,
  getFacultyInvitationById,
  getFacultyInvitations,
  sendFacultyInvitationEmail,
  updateFacultyInvitation,
} from '@/services/faculty-invitation.service'
import type {
  FacultyInvitation,
  FacultyInvitationFormValues,
  InvitationGroup,
  InvitationType,
  ResponseStatus,
} from '@/types/faculty-invitation.types'

type StatusFilter = 'ALL' | ResponseStatus
type TypeFilter = 'ALL' | InvitationType
type GroupFilter = 'ALL' | InvitationGroup

type PendingAction =
  | { type: 'DELETE'; invitation: FacultyInvitation }
  | { type: 'EMAIL'; invitation: FacultyInvitation }
  | null

function getStatus(invitation: FacultyInvitation): ResponseStatus {
  return invitation.responseStatus ?? 'PENDING'
}

function getStatusBadge(status: ResponseStatus) {
  if (status === 'ACCEPTED') {
    return (
      <Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        <CheckCircle2 className="mr-1 size-3.5" />
        Accepted
      </Badge>
    )
  }

  if (status === 'DECLINED') {
    return (
      <Badge className="border-0 bg-rose-100 text-rose-800 hover:bg-rose-100">
        <XCircle className="mr-1 size-3.5" />
        Declined
      </Badge>
    )
  }

  return (
    <Badge className="border-0 bg-amber-100 text-amber-800 hover:bg-amber-100">
      <Clock3 className="mr-1 size-3.5" />
      Pending
    </Badge>
  )
}

function formatInvitationType(type: InvitationType) {
  return type.replaceAll('_', ' ')
}

function formatInvitationGroup(group: InvitationGroup) {
  return group === 'OUT_OF_MP' ? 'Out of MP' : 'MP'
}

function toFormValues(
  invitation: FacultyInvitation,
): FacultyInvitationFormValues {
  return {
    ...EMPTY_FORM,
    invitationType: invitation.invitationType,
    group: invitation.group,
    name: invitation.name ?? '',
    email: invitation.email ?? '',
    mobile: invitation.mobile ?? '',
    sessionName: invitation.sessionName ?? '',
    topic: invitation.topic ?? '',
    workshopName: invitation.workshopName ?? '',
    date: invitation.date ?? '',
    time: invitation.time ?? '',
    hall: invitation.hall ?? '',
    moderators: invitation.moderators ?? [],
    coPanellists: invitation.coPanellists ?? [],
    panelPeople: invitation.panelPeople ?? [],
  }
}

export default function FacultyInvitationClient() {
  const [invitations, setInvitations] = useState<FacultyInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const [pageError, setPageError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] =
    useState<FacultyInvitationFormValues>(EMPTY_FORM)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadInvitations = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true)
    setPageError('')

    try {
      const response = await getFacultyInvitations()
      setInvitations(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load faculty invitations.'

      setPageError(message)
      toast.error(message)
    } finally {
      if (showLoader) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInvitations()
  }, [loadInvitations])

  /*
   * The available groups depend on the selected invitation type.
   * When "All types" is selected, show groups present in all records.
   */
  const availableGroups = useMemo(() => {
    const matchingInvitations =
      typeFilter === 'ALL'
        ? invitations
        : invitations.filter(
            (invitation) => invitation.invitationType === typeFilter,
          )

    return Array.from(
      new Set(matchingInvitations.map((invitation) => invitation.group)),
    )
  }, [invitations, typeFilter])

  /*
   * Combine every active filter here so the table and the summary counts
   * always represent the same filtered dataset.
   */
  const filteredInvitations = useMemo(() => {
    const query = search.trim().toLowerCase()

    return invitations.filter((invitation) => {
      const matchesType =
        typeFilter === 'ALL' || invitation.invitationType === typeFilter

      const matchesGroup =
        groupFilter === 'ALL' || invitation.group === groupFilter

      const matchesStatus =
        statusFilter === 'ALL' || getStatus(invitation) === statusFilter

      const searchableText = [
        invitation.name,
        invitation.email,
        invitation.mobile,
        invitation.sessionName,
        invitation.topic,
        invitation.workshopName,
        invitation.invitationType,
        invitation.group,
        invitation.date,
        invitation.time,
        invitation.hall,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !query || searchableText.includes(query)

      return (
        matchesType && matchesGroup && matchesStatus && matchesSearch
      )
    })
  }, [invitations, search, typeFilter, groupFilter, statusFilter])

  /*
   * These counts respect the currently selected type, group, and search.
   * The status dropdown itself is excluded from the summary calculation,
   * allowing users to compare Pending / Accepted / Declined for the
   * currently selected type and group.
   */
  const statusSummary = useMemo(() => {
    const query = search.trim().toLowerCase()

    const summaryRecords = invitations.filter((invitation) => {
      const matchesType =
        typeFilter === 'ALL' || invitation.invitationType === typeFilter

      const matchesGroup =
        groupFilter === 'ALL' || invitation.group === groupFilter

      const searchableText = [
        invitation.name,
        invitation.email,
        invitation.mobile,
        invitation.sessionName,
        invitation.topic,
        invitation.workshopName,
        invitation.invitationType,
        invitation.group,
        invitation.date,
        invitation.time,
        invitation.hall,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        matchesType &&
        matchesGroup &&
        (!query || searchableText.includes(query))
      )
    })

    return {
      total: summaryRecords.length,
      pending: summaryRecords.filter(
        (item) => getStatus(item) === 'PENDING',
      ).length,
      accepted: summaryRecords.filter(
        (item) => getStatus(item) === 'ACCEPTED',
      ).length,
      declined: summaryRecords.filter(
        (item) => getStatus(item) === 'DECLINED',
      ).length,
    }
  }, [invitations, search, typeFilter, groupFilter])

  const openCreateForm = () => {
    setEditingId(null)
    setFormValues(EMPTY_FORM)
    setFormError('')
    setPageError('')
    setFormOpen(true)
  }

  const openEditForm = async (invitation: FacultyInvitation) => {
    setPageError('')
    setFormError('')
    setIsLoadingEdit(true)
    setEditingId(invitation._id)
    setFormValues(EMPTY_FORM)
    setFormOpen(true)

    try {
      const detail = await getFacultyInvitationById(invitation._id)
      setFormValues(toFormValues(detail))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load this invitation for editing.'

      setFormOpen(false)
      setEditingId(null)
      setPageError(message)
      toast.error(message)
    } finally {
      setIsLoadingEdit(false)
    }
  }

  const handleFormSubmit = async (
    values: FacultyInvitationFormValues,
  ) => {
    setFormLoading(true)
    setFormError('')
    setPageError('')

    try {
      if (editingId) {
        await updateFacultyInvitation(editingId, values)
        toast.success('Faculty invitation updated successfully.')
      } else {
        await createFacultyInvitation(values)
        toast.success('Faculty invitation created successfully.')
      }

      setFormOpen(false)
      setEditingId(null)
      await loadInvitations(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save faculty invitation.'

      setFormError(message)
      toast.error(message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleConfirmedAction = async () => {
    if (!pendingAction) return

    setActionLoading(true)
    setPageError('')

    try {
      if (pendingAction.type === 'DELETE') {
        await deleteFacultyInvitation(pendingAction.invitation._id)
        toast.success(
          `Invitation for ${pendingAction.invitation.name} was deleted.`,
        )
      } else {
        await sendFacultyInvitationEmail(pendingAction.invitation._id)
        toast.success(
          `Invitation email sent to ${pendingAction.invitation.email}.`,
        )
      }

      setPendingAction(null)
      await loadInvitations(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : pendingAction.type === 'DELETE'
            ? 'Unable to delete this invitation.'
            : 'Unable to send the invitation email.'

      setPageError(message)
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Faculty',
        size: 210,
        cell: ({ row }: { row: { original: FacultyInvitation } }) => (
          <div className="min-w-40">
            <p className="font-semibold text-foreground">
              {row.original.name}
            </p>
            <p className="break-all text-xs text-muted-foreground">
              {row.original.email}
            </p>
            {row.original.mobile ? (
              <p className="text-xs text-muted-foreground">
                {row.original.mobile}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'invitationType',
        header: 'Invitation / Group',
        size: 150,
        cell: ({ row }: { row: { original: FacultyInvitation } }) => (
          <div className="space-y-1">
            <p className="font-medium">
              {formatInvitationType(row.original.invitationType)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatInvitationGroup(row.original.group)}
            </p>
          </div>
        ),
      },
{
  id: 'session',
  header: 'Session / Topic',
  size: 300,
  cell: ({ row }: { row: { original: FacultyInvitation } }) => {
    const item = row.original

    const renderPeople = (
      title: string,
      people: { name: string; contact: string }[],
    ) => {
      if (!people?.length) return null

      return (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-700">
            {title} ({people.length})
          </p>

          <div className="space-y-1">
            {people.map((person, index) => (
              <div
                key={`${title}-${person.name}-${person.contact}-${index}`}
                className="rounded-md bg-slate-50 px-2 py-1"
              >
                <p className="text-sm font-medium text-slate-800">
                  {person.name || 'Unnamed'}
                </p>
                {person.contact ? (
                  <p className="text-xs text-muted-foreground">
                    {person.contact}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="min-w-52 space-y-2">
        <div>
          <p className="font-medium text-slate-900">
            {item.sessionName || '—'}
          </p>
        </div>

        {item.invitationType === 'WORKSHOP' ? (
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Workshop
            </p>
            <p className="text-sm text-slate-700">
              {item.workshopName || '—'}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Topic
            </p>
            <p className="text-sm text-slate-700">
              {item.topic || '—'}
            </p>
          </div>
        )}

        {item.invitationType === 'MODERATOR' &&
          renderPeople('Panel People', item.panelPeople ?? [])}

        {item.invitationType === 'PANELIST' && (
          <>
            {renderPeople('Moderators', item.moderators ?? [])}
            {renderPeople('Co-panellists', item.coPanellists ?? [])}
          </>
        )}
      </div>
    )
  },
},

      {
        id: 'schedule',
        header: 'Date & Time',
        size: 160,
        cell: ({ row }: { row: { original: FacultyInvitation } }) => (
          <div className="space-y-1">
            <p>{row.original.date || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.time || '—'}
              {row.original.hall ? ` · Hall ${row.original.hall}` : ''}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'responseStatus',
        header: 'Response',
        size: 130,
        cell: ({ row }: { row: { original: FacultyInvitation } }) =>
          getStatusBadge(getStatus(row.original)),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 220,
        cell: ({ row }: { row: { original: FacultyInvitation } }) => {
          const invitation = row.original

          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => void openEditForm(invitation)}
                title="Edit invitation"
              >
                <Pencil className="mr-1 size-3.5" />
                Edit
              </Button>

              <Button
                type="button"
                size="sm"
                className="bg-rose-600 text-white hover:bg-rose-700"
                onClick={() =>
                  setPendingAction({ type: 'DELETE', invitation })
                }
                title="Delete invitation"
              >
                <Trash2 className="mr-1 size-3.5" />
                Delete
              </Button>

              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() =>
                  setPendingAction({ type: 'EMAIL', invitation })
                }
                title="Send invitation email"
              >
                <Mail className="mr-1 size-3.5" />
                Email
              </Button>
            </div>
          )
        },
      },
    ],
    [],
  )

  const isDeleteAction = pendingAction?.type === 'DELETE'

  const actionTitle = isDeleteAction
    ? 'Delete invitation?'
    : 'Send invitation email?'

  const actionDescription = pendingAction
    ? isDeleteAction
      ? `This will permanently delete the invitation for ${pendingAction.invitation.name}. This action cannot be undone.`
      : `Send the invitation email to ${pendingAction.invitation.email}?`
    : ''

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'ALL' ||
    groupFilter !== 'ALL' ||
    statusFilter !== 'ALL'

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('ALL')
    setGroupFilter('ALL')
    setStatusFilter('ALL')
  }




  const formatExcelDate = (value: string | null | undefined): string => {
    if (!value) return ''

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return ''

    const pad = (number: number) => String(number).padStart(2, '0')

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }
  


  const handleExport = async () => {
    try {
      setIsLoading(true)

      const response = await getFacultyInvitations()
      const rows = Array.isArray(response.data) ? response.data : []

      if (!rows.length) {
        toast.error('No faculty invitations available to export.')
        return
      }

      const headers = [
        'Invitation Type',
        'Group',
        'Name',
        'Email',
        'Mobile',
        'Session Name',
        'Topic',
        'Workshop Name',
        'Date',
        'Time',
        'Hall',
        'Panel People',
        'Moderators',
        'Co-Panellists',
        'Response Status',
        'Responded At',
        'Created At',
        'Updated At',
      ]

      const escapeCsv = (value: unknown): string => {
        const text = value === null || value === undefined ? '' : String(value)

        // Prevent Excel from interpreting text fields as formulas.
        const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text

        return `"${safeText.replace(/"/g, '""')}"`
      }

      const formatPeople = (
        people: Array<{ name?: string; contact?: string }> | null | undefined,
      ): string =>
        (people ?? [])
          .map((person) =>
            [person.name, person.contact].filter(Boolean).join(' - '),
          )
          .join('; ')

      const csvRows = [
        headers.map(escapeCsv).join(','),
        ...rows.map((item) =>
          [
            item.invitationType,
            item.group,
            item.name,
            item.email,
            item.mobile,
            item.sessionName,
            item.topic,
            item.workshopName,
            item.date,
            item.time,
            item.hall,
            formatPeople(item.panelPeople),
            formatPeople(item.moderators),
            formatPeople(item.coPanellists),
            item.responseStatus ?? 'PENDING',
            formatExcelDate(item.respondedAt),
            formatExcelDate(item.createdAt),
            formatExcelDate(item.updatedAt),
          ]
            .map(escapeCsv)
            .join(','),
        ),
      ]

      // BOM helps Excel recognize UTF-8 correctly.
      const csv = '\uFEFF' + csvRows.join('\r\n')
      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = 'Faculty_Invitations.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()

      // Allow the browser time to start the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)

      toast.success(`${rows.length} faculty invitations exported.`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to export faculty invitations.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="w-full space-y-5 p-3 sm:p-5 lg:p-6">
      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Faculty Invitations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, manage, and track faculty invitation responses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExport()}
            disabled={isLoading}
          >
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadInvitations()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button
            type="button"
            className="bg-[#001f3f] text-white hover:bg-[#003366] disabled:opacity-50"
            onClick={openCreateForm}
          >
            <Plus className="mr-2 size-4" />
            Add Faculty
          </Button>
        </div>
      </div>

      {pageError ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <span>{pageError}</span>
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => setPageError('')}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Search and filters */}
      <div className="space-y-3 rounded-xl border bg-white p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_190px_170px_190px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search faculty, email, session..."
              className="pl-9"
              aria-label="Search faculty invitations"
            />
          </div>

          {/* Invitation type */}
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              if (!value) return

              const nextType = value as TypeFilter
              setTypeFilter(nextType)

              // Group options depend on the selected invitation type.
              // Reset the selected group to avoid an invalid combination.
              setGroupFilter('ALL')
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Invitation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All invitation types</SelectItem>
              <SelectItem value="WORKSHOP">Workshop</SelectItem>
              <SelectItem value="SOLO_TALK">Solo Talk</SelectItem>
              <SelectItem value="PANELIST">Panelist</SelectItem>
              <SelectItem value="MODERATOR">Moderator</SelectItem>
            </SelectContent>
          </Select>

          {/* Group options update when invitation type changes */}
          <Select
            value={groupFilter}
            onValueChange={(value) => {
              if (value) setGroupFilter(value as GroupFilter)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All groups</SelectItem>
              {availableGroups.includes('MP') ? (
                <SelectItem value="MP">MP</SelectItem>
              ) : null}
              {availableGroups.includes('OUT_OF_MP') ? (
                <SelectItem value="OUT_OF_MP">Out of MP</SelectItem>
              ) : null}
            </SelectContent>
          </Select>

          {/* Response status */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value) setStatusFilter(value as StatusFilter)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Response status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="w-full xl:w-auto"
            >
              <XCircle className="mr-2 size-4" />
              Clear
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Select an invitation type to see the groups available for that type.
        </p>
      </div>

      {/* Counts follow the current type, group, and search filters */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700">
          Total: <strong>{statusSummary.total}</strong>
        </span>

        <span className="rounded-md bg-amber-100 px-3 py-1.5 text-amber-800">
          Pending: <strong>{statusSummary.pending}</strong>
        </span>

        <span className="rounded-md bg-emerald-100 px-3 py-1.5 text-emerald-800">
          Accepted: <strong>{statusSummary.accepted}</strong>
        </span>

        <span className="rounded-md bg-rose-100 px-3 py-1.5 text-rose-800">
          Declined: <strong>{statusSummary.declined}</strong>
        </span>

        <span className="ml-auto text-muted-foreground">
          Showing {filteredInvitations.length} of {invitations.length}
        </span>
      </div>

      {/* DataTable handles pagination through its configured pagination component */}
      <DataTable
        columns={columns}
        data={filteredInvitations}
        isLoading={isLoading}
        emptyMessage={
          hasActiveFilters
            ? 'No invitations match your search or filters.'
            : 'No faculty invitations found.'
        }
      />

      {/* Create / edit dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (formLoading || isLoadingEdit) return

          setFormOpen(open)

          if (!open) {
            setEditingId(null)
            setFormError('')
          }
        }}
      >
        <DialogContent
          className="flex max-h-[90dvh] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-[95vw] sm:max-w-5xl"
          showCloseButton={!formLoading && !isLoadingEdit}
          onEscapeKeyDown={(event) => {
            if (formLoading || isLoadingEdit) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (formLoading || isLoadingEdit) event.preventDefault()
          }}
        >
          <DialogHeader className="border-b px-5 py-4 pr-12">
            <DialogTitle>
              {editingId ? 'Edit Faculty' : 'Add Faculty'}
            </DialogTitle>
            <DialogDescription>
              Enter the faculty details and invitation schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-5 py-5">
            {formError ? (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {formError}
              </div>
            ) : null}

            {isLoadingEdit ? (
              <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-muted-foreground">
                <RefreshCw className="size-5 animate-spin" />
                Loading invitation details...
              </div>
            ) : (
              <FacultyInvitationForm
                key={editingId ?? 'create-faculty-invitation'}
                initialValues={formValues}
                loading={formLoading}
                onSubmit={handleFormSubmit}
                submitLabel={editingId ? 'Update Faculty' : 'Add Faculty'}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete / send-email confirmation */}
      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (actionLoading) return
          if (!open) setPendingAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionTitle}</AlertDialogTitle>
            <AlertDialogDescription>{actionDescription}</AlertDialogDescription>
          </AlertDialogHeader>

          {pageError ? (
            <p role="alert" className="text-sm text-rose-600">
              {pageError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={actionLoading}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmedAction()
              }}
              className={
                isDeleteAction
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }
            >
              {actionLoading ? (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              ) : isDeleteAction ? (
                <Trash2 className="mr-2 size-4" />
              ) : (
                <Send className="mr-2 size-4" />
              )}

              {actionLoading
                ? isDeleteAction
                  ? 'Deleting...'
                  : 'Sending...'
                : isDeleteAction
                  ? 'Delete Invitation'
                  : 'Send Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
