import type {
  DeleteFacultyInvitationResponse,
  FacultyInvitation,
  FacultyInvitationDetailResponse,
  FacultyInvitationFormValues,
  FacultyInvitationMutationResponse,
  FacultyInvitationPayload,
  FacultyInvitationsListResponse,
  PanelPerson,
  SendFacultyInvitationEmailResponse,
} from '@/types/faculty-invitation.types'

const FACULTY_INVITATIONS_PATH = '/api/faculty-invitations'

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.')
  }

  return baseUrl
}

function formatInvitationDate(value: string): string {
  // Keep dates already formatted by the API (for example, "18 December 2026").
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!isoMatch) return value

  const [, year, month, day] = isoMatch
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function normalizePanelPeople(people: PanelPerson[] | undefined): PanelPerson[] {
  return (people ?? []).map((person) => ({
    name: person.name.trim(),
    contact: person.contact.trim(),
  }))
}

/**
 * Builds the exact conditional request body for the selected invitation type.
 * Used by both POST and PUT.
 */
export function buildFacultyInvitationPayload(
  values: FacultyInvitationFormValues,
): FacultyInvitationPayload {
  const common = {
    invitationType: values.invitationType,
    group: values.group,
    name: values.name.trim(),
    email: values.email.trim(),
    ...(values.mobile.trim() ? { mobile: values.mobile.trim() } : {}),
    sessionName: values.sessionName.trim(),
    date: formatInvitationDate(values.date),
    time: values.time.trim(),
    hall: values.hall.trim(),
  }

  if (values.invitationType === 'WORKSHOP') {
    return {
      ...common,
      invitationType: 'WORKSHOP',
      workshopName: values.workshopName.trim(),
    }
  }

  if (values.invitationType === 'SOLO_TALK') {
    return {
      ...common,
      invitationType: 'SOLO_TALK',
      topic: values.topic.trim(),
    }
  }

  if (values.invitationType === 'PANELIST') {
    return {
      ...common,
      invitationType: 'PANELIST',
      topic: values.topic.trim(),
      moderators: normalizePanelPeople(values.moderators),
      coPanellists: normalizePanelPeople(values.coPanellists),
    }
  }

  return {
    ...common,
    invitationType: 'MODERATOR',
    topic: values.topic.trim(),
    panelPeople: normalizePanelPeople(values.panelPeople),
  }
}

async function readResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      result &&
      typeof result === 'object' &&
      'message' in result &&
      typeof result.message === 'string'
        ? result.message
        : `${fallbackMessage} (HTTP ${response.status}).`

    throw new Error(message)
  }

  if (!result || typeof result !== 'object') {
    throw new Error('The server returned an invalid response.')
  }

  if ('success' in result && result.success === false) {
    const message =
      'message' in result && typeof result.message === 'string'
        ? result.message
        : fallbackMessage

    throw new Error(message)
  }

  return result as T
}

/** GET /api/faculty-invitations */
export async function getFacultyInvitations(): Promise<FacultyInvitationsListResponse> {
  const response = await fetch(`${getBaseUrl()}${FACULTY_INVITATIONS_PATH}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  return readResponse<FacultyInvitationsListResponse>(
    response,
    'Unable to fetch faculty invitations.',
  )
}

/** GET /api/faculty-invitations/:id */
export async function getFacultyInvitationById(
  id: string,
): Promise<FacultyInvitation> {
  if (!id.trim()) throw new Error('Faculty invitation ID is required.')

  const response = await fetch(
    `${getBaseUrl()}${FACULTY_INVITATIONS_PATH}/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  )

  const result = await readResponse<FacultyInvitationDetailResponse | FacultyInvitation>(
    response,
    'Unable to fetch faculty invitation.',
  )

  // Support either a direct record response or the common { data: record } shape.
  if ('_id' in result) return result

  const data = result.data
  if (data && '_id' in data) return data
  if (data && 'data' in data && data.data && '_id' in data.data) return data.data

  throw new Error('The server response did not contain a faculty invitation.')
}

/** POST /api/faculty-invitations */
export async function createFacultyInvitation(
  values: FacultyInvitationFormValues,
): Promise<FacultyInvitationMutationResponse> {
  const payload = buildFacultyInvitationPayload(values)

  const response = await fetch(`${getBaseUrl()}${FACULTY_INVITATIONS_PATH}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return readResponse<FacultyInvitationMutationResponse>(
    response,
    'Unable to create faculty invitation.',
  )
}

/** PUT /api/faculty-invitations/:id */
export async function updateFacultyInvitation(
  id: string,
  values: FacultyInvitationFormValues,
): Promise<FacultyInvitationMutationResponse> {
  if (!id.trim()) throw new Error('Faculty invitation ID is required.')

  const payload = buildFacultyInvitationPayload(values)

  const response = await fetch(
    `${getBaseUrl()}${FACULTY_INVITATIONS_PATH}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )

  return readResponse<FacultyInvitationMutationResponse>(
    response,
    'Unable to update faculty invitation.',
  )
}

/** DELETE /api/faculty-invitations/:id */
export async function deleteFacultyInvitation(
  id: string,
): Promise<DeleteFacultyInvitationResponse> {
  if (!id.trim()) throw new Error('Faculty invitation ID is required.')

  const response = await fetch(
    `${getBaseUrl()}${FACULTY_INVITATIONS_PATH}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  return readResponse<DeleteFacultyInvitationResponse>(
    response,
    'Unable to delete faculty invitation.',
  )
}

/** POST /api/faculty-invitations/:id/send-email */
export async function sendFacultyInvitationEmail(
  id: string,
): Promise<SendFacultyInvitationEmailResponse> {
  if (!id.trim()) throw new Error('Faculty invitation ID is required.')

  const response = await fetch(
    `${getBaseUrl()}${FACULTY_INVITATIONS_PATH}/${encodeURIComponent(id)}/send-email`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  return readResponse<SendFacultyInvitationEmailResponse>(
    response,
    'Unable to send faculty invitation email.',
  )
}
