import { z } from 'zod'

const panelPersonSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  contact: z.string().trim().min(1, 'Contact is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
})

export const facultyInvitationSchema = z
  .object({
    invitationType: z.enum([
      'WORKSHOP',
      'SOLO_TALK',
      'SOLO_TALK_REIMBURSEMENT',
      'SOLO_TALK_ALL_COMPLIMENTARY',
      'PANELIST',
      'PANELIST_ALL_COMPLIMENTARY',
      'PANELIST_REIMBURSEMENT',
      'MODERATOR',
      'MODERATOR_REIMBURSEMENT',
    ]),
    group: z.enum(['MP', 'OUT_OF_MP', 'NCD']),
    name: z.string().trim().min(1, 'Faculty name is required'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    // Optional in the API payload; keep an empty string in form state.
    mobile: z.string().trim(),
    sessionName: z.string().trim(),
    topic: z.string().trim(),
    workshopName: z.string().trim(),
    date: z.string().trim().min(1, 'Date is required'),
    time: z.string().trim().min(1, 'Time is required'),
    hall: z.string().trim().min(1, 'Hall is required'),

    // PANELIST payload fields
    moderators: z.array(panelPersonSchema),
    coPanellists: z.array(panelPersonSchema),

    // MODERATOR payload field
    panelPeople: z.array(panelPersonSchema),
  })
  .superRefine((values, ctx) => {
    if (values.invitationType === 'WORKSHOP' && !values.workshopName.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['workshopName'],
        message: 'Workshop name is required',
      })
    }

    if (values.invitationType !== 'WORKSHOP' && !values.topic.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['topic'],
        message: 'Topic is required',
      })
    }

    if (
      values.invitationType === 'PANELIST' ||
      values.invitationType === 'PANELIST_ALL_COMPLIMENTARY' ||
      values.invitationType === 'PANELIST_REIMBURSEMENT'
    ) {
      values.moderators.forEach((person, index) => {
        if (!person.name.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['moderators', index, 'name'],
            message: 'Moderator name is required',
          })
        }

        if (!person.contact.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['moderators', index, 'contact'],
            message: 'Moderator contact is required',
          })
        }
      })

      values.coPanellists.forEach((person, index) => {
        if (!person.name.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['coPanellists', index, 'name'],
            message: 'Co-panellist name is required',
          })
        }

        if (!person.contact.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['coPanellists', index, 'contact'],
            message: 'Co-panellist contact is required',
          })
        }
      })
    }

    if (
      values.invitationType === 'MODERATOR' ||
      values.invitationType === 'MODERATOR_REIMBURSEMENT'
    ) {
      values.panelPeople.forEach((person, index) => {
        if (!person.name.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['panelPeople', index, 'name'],
            message: 'Panel member name is required',
          })
        }

        if (!person.contact.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['panelPeople', index, 'contact'],
            message: 'Panel member contact is required',
          })
        }
      })
    }
  })

export type FacultyInvitationSchemaValues = z.infer<
  typeof facultyInvitationSchema
>
