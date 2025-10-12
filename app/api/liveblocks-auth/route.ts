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
    // For anonymous users, use their display name from Firebase profile
    // For regular users, use email and name from token
    const isAnonymous = decodedToken.firebase?.sign_in_provider === 'anonymous';

    let userEmail = 'Guest';
    let userName = 'Guest User';

    if (!isAnonymous) {
      userEmail = decodedToken.email || 'Anonymous';
      userName = decodedToken.name || userEmail;
    } else {
      // For anonymous users, we'll fetch their display name from the user profile
      // The display name is set in the signInAsGuest function
      try {
        const userRecord = await adminAuth.getUser(userId);
        userName = userRecord.displayName || 'Guest User';
        userEmail = userName; // Use display name as email for anonymous users
      } catch (error) {
        console.error('Failed to fetch anonymous user profile:', error);
      }
    }

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
        console.log(`Project not found: ${projectId}`);
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Allow all authenticated users to access any project room
      // No access restrictions - users can join any project
      console.log(`User ${userId} authorized for project room: ${projectId}`);
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
