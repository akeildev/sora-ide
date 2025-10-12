import { Mastra } from '@mastra/core';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

// File editing tools for the agent
export const createFileTool = createTool({
  id: 'create_file',
  description: 'Create a new HTML, CSS, or JavaScript file in the project',
  inputSchema: z.object({
    name: z.string().describe('File name (e.g., "styles.css", "script.js", "index.html")'),
    content: z.string().describe('File content'),
    language: z.enum(['html', 'css', 'javascript']).describe('File type'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    fileId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context, input }) => {
    // This will be handled by the API route which has access to Yjs
    return {
      success: true,
      fileId: `pending-${Date.now()}`,
    };
  },
});

export const updateFileTool = createTool({
  id: 'update_file',
  description: 'Update the content of an existing file',
  inputSchema: z.object({
    fileId: z.string().describe('ID of the file to update'),
    content: z.string().describe('New file content'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({ context, input }) => {
    return { success: true };
  },
});

export const deleteFileTool = createTool({
  id: 'delete_file',
  description: 'Delete a file from the project',
  inputSchema: z.object({
    fileId: z.string().describe('ID of the file to delete'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({ context, input }) => {
    return { success: true };
  },
});

export const listFilesTool = createTool({
  id: 'list_files',
  description: 'List all files in the project with their names, IDs, and languages',
  inputSchema: z.object({}),
  outputSchema: z.object({
    files: z.array(z.object({
      id: z.string(),
      name: z.string(),
      language: z.string(),
      content: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    // Will be provided via context from API route
    return { files: [] };
  },
});

export const readFileTool = createTool({
  id: 'read_file',
  description: 'Read the content of a specific file',
  inputSchema: z.object({
    fileId: z.string().describe('ID of the file to read'),
  }),
  outputSchema: z.object({
    content: z.string(),
    name: z.string(),
    language: z.string(),
  }),
  execute: async ({ context, input }) => {
    return {
      content: '',
      name: '',
      language: 'html',
    };
  },
});

// Initialize Mastra
export const mastra = new Mastra({
  agents: {
    codeAgent: {
      name: 'Code Agent',
      instructions: `You are a helpful coding assistant for SoraIDE, a collaborative web IDE.

Your role:
- Help users with HTML, CSS, and JavaScript code
- Create, update, and delete files as needed
- Provide explanations and suggestions
- Fix bugs and improve code quality

Important guidelines:
- ONLY work with HTML, CSS, and JavaScript files
- Always use the provided tools to edit files
- Keep code clean and well-formatted
- Add helpful comments
- Follow web development best practices

When creating files:
- HTML files should have proper structure with <!DOCTYPE html>, <html>, <head>, and <body>
- CSS files should be well-organized with clear selectors
- JavaScript files should use modern ES6+ syntax

Always confirm what you're doing before making changes.`,
      model: openai('gpt-4o'),
      tools: {
        createFile: createFileTool,
        updateFile: updateFileTool,
        deleteFile: deleteFileTool,
        listFiles: listFilesTool,
        readFile: readFileTool,
      },
    },
  },
});

export const codeAgent = mastra.getAgent('codeAgent');
