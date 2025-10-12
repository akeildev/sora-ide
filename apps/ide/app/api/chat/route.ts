import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, projectId, userId, files } = await request.json();

    if (!message || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build context about current files
    const filesContext = files?.length
      ? `\n\nCurrent project files:\n${files
          .map(
            (f: any) =>
              `- ${f.name} (${f.language}): ${f.content.substring(0, 200)}${
                f.content.length > 200 ? '...' : ''
              }`
          )
          .join('\n')}`
      : '\n\nNo files in the project yet.';

    const systemPrompt = `You are a helpful coding assistant for SoraIDE, a collaborative web IDE.

Your role:
- Help users with HTML, CSS, and JavaScript code
- Provide clear explanations and suggestions
- Suggest file operations when needed

Available operations:
1. CREATE_FILE - Create a new HTML, CSS, or JS file
2. UPDATE_FILE - Modify an existing file
3. DELETE_FILE - Delete a file

When you want to perform file operations, respond with JSON in this format:
{
  "message": "Your explanation of what you're doing",
  "operations": [
    {
      "type": "CREATE_FILE",
      "name": "filename.ext",
      "language": "html|css|javascript",
      "content": "file content here"
    },
    {
      "type": "UPDATE_FILE",
      "fileId": "file-id",
      "content": "new content"
    },
    {
      "type": "DELETE_FILE",
      "fileId": "file-id"
    }
  ]
}

Guidelines:
- ONLY work with HTML, CSS, and JavaScript
- Keep code clean and well-formatted
- Add helpful comments
- Follow web development best practices
- HTML files should have proper <!DOCTYPE html> structure
- Use modern ES6+ JavaScript

${filesContext}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || 'I apologize, I could not process that request.';

    // Try to parse as JSON for operations
    let response;
    try {
      response = JSON.parse(responseText);
    } catch {
      // Not JSON, just a regular message
      response = {
        message: responseText,
        operations: [],
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
