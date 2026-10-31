import { z } from 'zod';
export { leadFormSchema } from './inbound-policy.mjs';
import { leadFormSchema } from './inbound-policy.mjs';
export type LeadFormInput = z.infer<typeof leadFormSchema>;
export const leadUpdateSchema = z.object({status:z.enum(['new','contacted','quoted','negotiating','won','lost']).optional(),memo:z.string().max(2000).optional()});
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
