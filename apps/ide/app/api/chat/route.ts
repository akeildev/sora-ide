import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define tools for the AI agent
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List all files currently in the project. Use this FIRST to see what files exist before making any changes.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the full content of a specific file by its ID. Use this to see the complete file before updating it.',
      parameters: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'ID of the file to read',
          },
        },
        required: ['fileId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a new HTML, CSS, or JavaScript file. Only use if the file does not already exist (check with list_files first).',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'File name (e.g., "styles.css", "script.js", "index.html")',
          },
          content: {
            type: 'string',
            description: 'Complete file content',
          },
          language: {
            type: 'string',
            enum: ['html', 'css', 'javascript'],
            description: 'File type',
          },
        },
        required: ['name', 'content', 'language'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_file',
      description: 'Update an existing file with new content. Provide the COMPLETE new file content (not partial changes). Use read_file first to get current content.',
      parameters: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'ID of the file to update',
          },
          content: {
            type: 'string',
            description: 'Complete new file content',
          },
        },
        required: ['fileId', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Delete a file from the project. Only use when explicitly requested by the user.',
      parameters: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'ID of the file to delete',
          },
        },
        required: ['fileId'],
      },
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const { message, projectId, userId, files } = await request.json();

    if (!message || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a helpful coding assistant for SoraIDE, a collaborative web IDE.

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

CRITICAL LINK RULES:
- NEVER create links to external websites (no http://, https://, or www.)
- For navigation buttons/links, use "#" as the href (e.g., <a href="#">Button</a>)
- For internal navigation between project pages, use relative paths (e.g., href="about.html")
- If user needs external links, they will add them manually
- Buttons should use <button> tags or <a href="#"> without external URLs

Example workflow:
User: "Make the background red"
1. Call list_files to see what files exist
2. If styles.css exists, call read_file to see current CSS
3. Call update_file with modified CSS including red background
4. Respond explaining what you changed`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    let operations: any[] = [];
    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
      temperature: 0.7,
    });

    // Process tool calls
    while (response.choices[0].finish_reason === 'tool_calls') {
      const toolCalls = response.choices[0].message.tool_calls;
      if (!toolCalls) break;

      messages.push(response.choices[0].message);

      for (const toolCall of toolCalls) {
        const args = JSON.parse(toolCall.function.arguments);
        let result: any;

        switch (toolCall.function.name) {
          case 'list_files':
            result = files.map((f: any) => ({
              id: f.id,
              name: f.name,
              language: f.language,
              contentPreview: f.content.substring(0, 100) + (f.content.length > 100 ? '...' : ''),
            }));
            break;

          case 'read_file':
            const file = files.find((f: any) => f.id === args.fileId);
            if (file) {
              result = {
                id: file.id,
                name: file.name,
                language: file.language,
                content: file.content,
              };
            } else {
              result = { error: `File with ID ${args.fileId} not found` };
            }
            break;

          case 'create_file':
            operations.push({
              type: 'CREATE_FILE',
              name: args.name,
              language: args.language,
              content: args.content,
            });
            result = { success: true };
            break;

          case 'update_file':
            operations.push({
              type: 'UPDATE_FILE',
              fileId: args.fileId,
              content: args.content,
            });
            result = { success: true };
            break;

          case 'delete_file':
            operations.push({
              type: 'DELETE_FILE',
              fileId: args.fileId,
            });
            result = { success: true };
            break;

          default:
            result = { error: 'Unknown tool' };
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Get next response
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools,
        temperature: 0.7,
      });
    }

    const agentMessage = response.choices[0].message.content || 'I apologize, I could not process that request.';

    return NextResponse.json({
      message: agentMessage,
      operations,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
