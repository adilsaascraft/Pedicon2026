export const INVITATION_TYPES = [
  'WORKSHOP',
  'SOLO_TALK',
  'SOLO_TALK_ALL_COMPLIMENTARY',
  'PANELIST',
  'MODERATOR',
] as const

export const INVITATION_GROUPS = ['MP', 'OUT_OF_MP', 'NCD'] as const

export const RESPONSE_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED'] as const

export type InvitationType = (typeof INVITATION_TYPES)[number]
export type InvitationGroup = (typeof INVITATION_GROUPS)[number]
export type ResponseStatus = (typeof RESPONSE_STATUSES)[number]

export interface PanelPerson {
  name: string
  contact: string
  email: string
}

/**
 * Form state keeps every conditional field available so React Hook Form can
 * switch invitation types without changing the overall form-value shape.
 * The payload builder should omit fields that do not belong to the selected
 * invitation type.
 */
export interface FacultyInvitationFormValues {
  invitationType: InvitationType
  group: InvitationGroup
  name: string
  email: string
  mobile: string
  sessionName: string
  topic: string
  workshopName: string
  date: string
  time: string
  hall: string
  moderators: PanelPerson[]
  coPanellists: PanelPerson[]
  panelPeople: PanelPerson[]
}

/** Shared fields accepted by invitation create/update payloads. */
interface FacultyInvitationBasePayload {
  invitationType: InvitationType
  group: InvitationGroup
  name: string
  email: string
  mobile?: string
  sessionName: string
  date: string
  time: string
  hall: string
}

/** POST /api/faculty-invitations — WORKSHOP payload. */
export interface WorkshopInvitationPayload extends FacultyInvitationBasePayload {
  invitationType: 'WORKSHOP'
  workshopName: string
  topic?: never
  moderators?: never
  coPanellists?: never
  panelPeople?: never
}

/** POST /api/faculty-invitations — SOLO_TALK payload. */
export interface SoloTalkInvitationPayload extends FacultyInvitationBasePayload {
  invitationType: 'SOLO_TALK'
  topic: string
  workshopName?: never
  moderators?: never
  coPanellists?: never
  panelPeople?: never
}


/** POST /api/faculty-invitations — SOLO_TALK_ALL_COMPLIMENTARY payload. */
export interface SoloTalkAllComplimentaryInvitationPayload
  extends FacultyInvitationBasePayload {
  invitationType: 'SOLO_TALK_ALL_COMPLIMENTARY'
  topic: string
  workshopName?: never
  moderators?: never
  coPanellists?: never
  panelPeople?: never
}

/** POST /api/faculty-invitations — PANELIST payload. */
export interface PanelistInvitationPayload extends FacultyInvitationBasePayload {
  invitationType: 'PANELIST'
  topic: string
  moderators: PanelPerson[]
  coPanellists: PanelPerson[]
  workshopName?: never
  panelPeople?: never
}

/** POST /api/faculty-invitations — MODERATOR payload. */
export interface ModeratorInvitationPayload extends FacultyInvitationBasePayload {
  invitationType: 'MODERATOR'
  topic: string
  panelPeople: PanelPerson[]
  workshopName?: never
  moderators?: never
  coPanellists?: never
}

/** Union used by POST and PUT payload builders. */
export type FacultyInvitationPayload =
  | WorkshopInvitationPayload
  | SoloTalkInvitationPayload
  | SoloTalkAllComplimentaryInvitationPayload
  | PanelistInvitationPayload
  | ModeratorInvitationPayload

/**
 * GET /api/faculty-invitations and GET /api/faculty-invitations/:id.
 * Backend records may omit optional properties depending on invitation type
 * and older records, so conditional fields are optional here.
 */
export interface FacultyInvitation {
  _id: string
  invitationType: InvitationType
  group: InvitationGroup
  name: string
  email: string
  mobile?: string
  sessionName?: string
  topic?: string
  workshopName?: string
  date?: string
  time?: string
  hall?: string
  moderators?: PanelPerson[]
  coPanellists?: PanelPerson[]
  panelPeople?: PanelPerson[]
  isMailSent?: boolean
  responseStatus: ResponseStatus
  respondedAt?: string | null
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface FacultyInvitationsListResponse {
  success: boolean
  count: number
  data: FacultyInvitation[]
  message?: string
}

/**
 * GET /api/faculty-invitations/:id.
 * `data` is optional to tolerate APIs that return the record directly or
 * wrap it in a data property; normalize the response in the service layer.
 */
export interface FacultyInvitationDetailResponse {
  success: boolean
  message?: string
  data?: FacultyInvitation | { data?: FacultyInvitation }
}

/** POST /api/faculty-invitations and PUT /api/faculty-invitations/:id. */
export interface FacultyInvitationMutationResponse {
  success: boolean
  message?: string
  data?: FacultyInvitation | unknown
}

/** DELETE /api/faculty-invitations/:id. */
export interface DeleteFacultyInvitationResponse {
  success: boolean
  message?: string
  data?: unknown
}

/** POST /api/faculty-invitations/:id/send-email. */
export interface SendFacultyInvitationEmailResponse {
  success: boolean
  message?: string
  data?: unknown
}

/** Common error shape returned by API responses when available. */
export interface FacultyInvitationApiErrorResponse {
  success?: false
  message?: string
  error?: string
}
