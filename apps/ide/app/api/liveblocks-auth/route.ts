import { Liveblocks } from '@liveblocks/node';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Failed to verify Firebase token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || 'Anonymous';
    const userName = decodedToken.name || userEmail;

    // Get the room ID from the request body
    const { room } = await request.json();

    if (!room) {
      return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
    }

    // Check if this is a project room (format: "project:{projectId}")
    if (room.startsWith('project:')) {
      const projectId = room.split('project:')[1];

      // Get the project from Firestore
      const projectDoc = await adminDb.collection('projects').doc(projectId).get();

      if (!projectDoc.exists) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const project = projectDoc.data();

      // Check if user has access (owner or collaborator)
      const hasAccess = project?.ownerId === userId || project?.collaborators?.includes(userId);

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Create a session for the authenticated user
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        email: userEmail,
      },
    });

    // Allow the user to access the room
    session.allow(room, session.FULL_ACCESS);

    // Authorize the user and return the result
    const { status, body } = await session.authorize();

    return new NextResponse(body, { status });
  } catch (error) {
    console.error('Liveblocks auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
