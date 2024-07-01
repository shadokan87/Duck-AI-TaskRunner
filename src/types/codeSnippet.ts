import z from 'zod';

export const snippetSchema = z.object({
  actionDescription: z.string().describe("concise description of what this action does example: move element X and export it"),
  actionType: z.enum(['create', 'update']).describe("type of action: 'create' for creating new code, 'update' for modifying existing code"),
  language: z.string().describe('the language of the source code'),
  path: z.string().describe("the file path"),
  sourceCode: z.string().optional().describe("the source code, to be ignored if running in DRY mode")
});