import { z } from 'zod'

const panelPersonSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  contact: z.string().trim().min(1, 'Contact is required'),
})

export const facultyInvitationSchema = z
  .object({
    invitationType: z.enum(['WORKSHOP', 'SOLO_TALK', 'PANELIST', 'MODERATOR']),
    group: z.enum(['MP', 'OUT_OF_MP']),
    name: z.string().trim().min(1, 'Faculty name is required'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    // Optional in the API payload; keep an empty string in form state.
    mobile: z.string().trim(),
    sessionName: z.string().trim().min(1, 'Session name is required'),
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

    if (values.invitationType === 'PANELIST') {
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

    if (values.invitationType === 'MODERATOR') {
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
