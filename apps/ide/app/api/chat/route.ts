import { NextRequest, NextResponse } from 'next/server';
import { codeAgent } from '@/lib/mastra-agent';

export async function POST(request: NextRequest) {
  try {
    const { message, projectId, userId, files } = await request.json();

    if (!message || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Mastra agent with files context
    const result = await codeAgent.generate(message, {
      context: {
        files: files || [],
      },
    });

    // Extract operations from tool results
    const operations: any[] = [];

    if (result.toolResults) {
      for (const toolResult of result.toolResults) {
        // Tool results that return operations (createFile, updateFile, deleteFile)
        if (toolResult.result && typeof toolResult.result === 'object' && 'operation' in toolResult.result) {
          operations.push(toolResult.result.operation);
        }
      }
    }

    // Get the agent's text response
    const agentMessage = result.text || 'I apologize, I could not process that request.';

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
