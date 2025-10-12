import { Mastra } from '@mastra/core';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

// Type for file data
interface FileData {
  id: string;
  name: string;
  language: string;
  content: string;
}

// File editing tools for the agent
export const listFilesTool = createTool({
  id: 'list_files',
  description: 'List all files currently in the project. Use this FIRST to see what files exist before making any changes.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    files: z.array(z.object({
      id: z.string(),
      name: z.string(),
      language: z.string(),
      contentPreview: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const files = (context.files || []) as FileData[];
    return {
      files: files.map(f => ({
        id: f.id,
        name: f.name,
        language: f.language,
        contentPreview: f.content.substring(0, 100) + (f.content.length > 100 ? '...' : ''),
      })),
    };
  },
});

export const readFileTool = createTool({
  id: 'read_file',
  description: 'Read the full content of a specific file by its ID. Use this to see the complete file before updating it.',
  inputSchema: z.object({
    fileId: z.string().describe('ID of the file to read'),
  }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    language: z.string(),
    content: z.string(),
  }),
  execute: async ({ context, input }) => {
    const files = (context.files || []) as FileData[];
    const file = files.find(f => f.id === input.fileId);

    if (!file) {
      throw new Error(`File with ID ${input.fileId} not found`);
    }

    return {
      id: file.id,
      name: file.name,
      language: file.language,
      content: file.content,
    };
  },
});

export const createFileTool = createTool({
  id: 'create_file',
  description: 'Create a new HTML, CSS, or JavaScript file. Only use if the file does not already exist (check with list_files first).',
  inputSchema: z.object({
    name: z.string().describe('File name (e.g., "styles.css", "script.js", "index.html")'),
    content: z.string().describe('Complete file content'),
    language: z.enum(['html', 'css', 'javascript']).describe('File type'),
  }),
  outputSchema: z.object({
    operation: z.object({
      type: z.literal('CREATE_FILE'),
      name: z.string(),
      language: z.string(),
      content: z.string(),
    }),
  }),
  execute: async ({ input }) => {
    return {
      operation: {
        type: 'CREATE_FILE' as const,
        name: input.name,
        language: input.language,
        content: input.content,
      },
    };
  },
});

export const updateFileTool = createTool({
  id: 'update_file',
  description: 'Update an existing file with new content. Provide the COMPLETE new file content (not partial changes). Use read_file first to get current content.',
  inputSchema: z.object({
    fileId: z.string().describe('ID of the file to update'),
    content: z.string().describe('Complete new file content'),
  }),
  outputSchema: z.object({
    operation: z.object({
      type: z.literal('UPDATE_FILE'),
      fileId: z.string(),
      content: z.string(),
    }),
  }),
  execute: async ({ input }) => {
    return {
      operation: {
        type: 'UPDATE_FILE' as const,
        fileId: input.fileId,
        content: input.content,
      },
    };
  },
});

export const deleteFileTool = createTool({
  id: 'delete_file',
  description: 'Delete a file from the project. Only use when explicitly requested by the user.',
  inputSchema: z.object({
    fileId: z.string().describe('ID of the file to delete'),
  }),
  outputSchema: z.object({
    operation: z.object({
      type: z.literal('DELETE_FILE'),
      fileId: z.string(),
    }),
  }),
  execute: async ({ input }) => {
    return {
      operation: {
        type: 'DELETE_FILE' as const,
        fileId: input.fileId,
      },
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
- Help users create, edit, and improve HTML, CSS, and JavaScript code
- Analyze existing files and make smart updates
- Provide clear explanations of what you're doing

IMPORTANT WORKFLOW:
1. ALWAYS call list_files FIRST to see what files exist
2. If updating existing files, call read_file to see their current content
3. Only create new files if they don't exist yet
4. When updating, provide the COMPLETE new file content (not just changes)
5. Explain what you're doing in your response

Guidelines:
- ONLY work with HTML, CSS, and JavaScript files
- HTML files must have proper structure: <!DOCTYPE html>, <html>, <head>, <body>
- CSS files should be well-organized with clear selectors
- JavaScript should use modern ES6+ syntax
- Keep code clean, formatted, and commented
- Follow web development best practices

Example workflow:
User: "Make the background red"
1. Call list_files to see what files exist
2. If styles.css exists, call read_file to see current CSS
3. Call update_file with modified CSS including red background
4. Respond explaining what you changed`,
      model: openai('gpt-4o'),
      tools: {
        listFiles: listFilesTool,
        readFile: readFileTool,
        createFile: createFileTool,
        updateFile: updateFileTool,
        deleteFile: deleteFileTool,
      },
    },
  },
});

export const codeAgent = mastra.getAgent('codeAgent');
