import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SESSION_DIR = process.env.SESSION_DIR || '/tmp/sessions';
const SESSION_TTL_MINUTES = parseInt(process.env.SESSION_TTL_MINUTES || '60');

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'soraide-preview',
    sessionDir: SESSION_DIR,
    ttl: `${SESSION_TTL_MINUTES} minutes`
  });
});

// Create a new preview session
app.post('/sessions', (req, res) => {
  try {
    const { html, css, javascript } = req.body;

    if (!html && !css && !javascript) {
      return res.status(400).json({ error: 'At least one of html, css, or javascript must be provided' });
    }

    // Generate unique session ID
    const sessionId = crypto.randomBytes(16).toString('hex');
    const sessionPath = path.join(SESSION_DIR, sessionId);

    // Create session directory
    fs.mkdirSync(sessionPath, { recursive: true });

    // Build complete HTML document
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SoraIDE Preview</title>
  <style>
    /* Reset some default styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 16px;
    }

    /* User's custom CSS */
    ${css || ''}
  </style>
</head>
<body>
  ${html || ''}

  <script>
    // Error handling
    window.addEventListener('error', (e) => {
      console.error('Preview Error:', e.message);
    });

    // User's JavaScript
    try {
      ${javascript || ''}
    } catch (err) {
      console.error('JavaScript Error:', err);
    }
  </script>
</body>
</html>`;

    // Write index.html to session directory
    fs.writeFileSync(path.join(sessionPath, 'index.html'), fullHTML);

    // Set expiration time (cleanup can be handled by a background job)
    const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);

    // Write metadata
    fs.writeFileSync(
      path.join(sessionPath, '.metadata.json'),
      JSON.stringify({
        sessionId,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        ttl: SESSION_TTL_MINUTES
      })
    );

    // Return session URL
    const previewUrl = `http://localhost:${PORT}/preview/${sessionId}`;

    res.status(201).json({
      sessionId,
      url: previewUrl,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error: any) {
    console.error('Failed to create session:', error);
    res.status(500).json({ error: 'Failed to create preview session' });
  }
});

// Serve preview sessions
app.get('/preview/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const sessionPath = path.join(SESSION_DIR, sessionId);
  const indexPath = path.join(sessionPath, 'index.html');

  // Security: prevent directory traversal
  if (!sessionPath.startsWith(SESSION_DIR)) {
    return res.status(403).send('Forbidden');
  }

  // Check if session exists
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Not Found</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .error {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #e53e3e; margin-bottom: 1rem; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>404 - Session Not Found</h1>
            <p>This preview session may have expired or never existed.</p>
          </div>
        </body>
      </html>
    `);
  }

  // Check if session has expired
  const metadataPath = path.join(sessionPath, '.metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const expiresAt = new Date(metadata.expiresAt);

    if (expiresAt < new Date()) {
      // Clean up expired session
      fs.rmSync(sessionPath, { recursive: true, force: true });

      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Session Expired</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .error {
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              h1 { color: #d69e2e; margin-bottom: 1rem; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>410 - Session Expired</h1>
              <p>This preview session has expired. Sessions are valid for ${SESSION_TTL_MINUTES} minutes.</p>
            </div>
          </body>
        </html>
      `);
    }
  }

  // Serve the HTML file
  res.sendFile(indexPath);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SoraIDE Preview Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SoraIDE Preview Server running on port ${PORT}`);
  console.log(`📁 Session directory: ${SESSION_DIR}`);
  console.log(`⏱️  Session TTL: ${SESSION_TTL_MINUTES} minutes`);
});

export default app;
