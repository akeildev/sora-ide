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
    const { messages: conversationMessages, projectId, userId, files } = await request.json();

    if (!conversationMessages || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a helpful coding assistant for SoraIDE, a collaborative web IDE.

Your role:
- Help users create, edit, and improve HTML, CSS, and JavaScript code
- Analyze existing files and make smart updates
- Have natural conversations with users about their project

CRITICAL COMMUNICATION RULES:
- NEVER show code blocks in your responses
- NEVER paste code snippets or examples in the chat
- Instead, EXPLAIN what you're doing in plain English
- The code you create/update will automatically appear in the editor
- Focus on describing your changes and asking for user feedback
- Keep responses conversational and friendly

IMPORTANT WORKFLOW:
1. ALWAYS call list_files FIRST to see what files exist
2. If updating existing files, call read_file to see their current content
3. Only create new files if they don't exist yet
4. When updating, provide the COMPLETE new file content (not just changes)
5. Use tools to make changes, then explain what you did in simple terms

Guidelines:
- ONLY work with HTML, CSS, and JavaScript files
- HTML files must have proper structure: <!DOCTYPE html>, <html>, <head>, <body>
- CSS files should be well-organized with clear selectors
- JavaScript should use modern ES6+ syntax
- Follow web development best practices

CRITICAL COMMENTING RULES:
- Add DETAILED comments throughout ALL code you write
- Every function should have a comment explaining what it does
- Every section of HTML should have comments explaining its purpose
- CSS selectors should have comments explaining what they style
- Complex logic should have step-by-step inline comments
- Help users understand HOW and WHY the code works
- Make the code educational and easy to follow
- Think of comments as teaching the user, not just documenting

Example of well-commented code:
HTML:
<!-- Navigation bar with links to all pages -->
<nav>
  <!-- Home page link -->
  <a href="#">Home</a>
</nav>

CSS:
/* Style the navigation bar */
nav {
  background: #333; /* Dark background color */
  padding: 1rem; /* Add spacing inside nav */
}

JavaScript:
// Function to toggle dark mode on/off
function toggleDarkMode() {
  // Get the body element
  const body = document.body;
  // Toggle the dark-mode class
  body.classList.toggle('dark-mode');
}

CRITICAL PREVIEW OPTIMIZATION:
- The preview panel is NARROW (approximately 300-400px wide)
- ALWAYS design for mobile-first/narrow viewports
- Use responsive units (%, vw, rem) instead of large fixed widths
- Keep layouts simple and vertical (single column works best)
- Avoid horizontal scrolling - use max-width: 100% on images and containers
- Use flex-direction: column for layouts
- Keep font sizes readable but not too large (16px base is good)
- Buttons and interactive elements should be appropriately sized for the space
- Test that content flows vertically and is scrollable

CRITICAL LINK RULES:
- NEVER create links to external websites (no http://, https://, or www.)
- For navigation buttons/links that go home, use "#" as the href (e.g., <a href="#">Home</a>)
- For internal navigation between project pages, use relative paths (e.g., href="about.html")
- If user needs external links, they will add them manually
- Buttons should use <button> tags or <a href="#"> without external URLs

Example conversation:
User: "Make the background red"
Assistant: "I'll update your styles to add a red background. Let me check what files you have first."
*calls list_files and read_file*
*calls update_file with red background*
Assistant: "Done! I've updated your styles.css file to set the background color to red. You should see the change in the preview now."

Remember: You can see the full conversation history, so reference previous messages and continue building on what you've already done!`;

    // Build messages array with system prompt and full conversation history
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
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
        if (toolCall.type !== 'function') continue;
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
