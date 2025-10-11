import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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

// Serve preview sessions
app.use('/sessions/:sessionId', (req, res, next) => {
  const sessionId = req.params.sessionId;
  const sessionPath = path.join(SESSION_DIR, sessionId);

  // Security: prevent directory traversal
  if (!sessionPath.startsWith(SESSION_DIR)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Check if session exists
  if (!fs.existsSync(sessionPath)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Serve static files from session directory
  express.static(sessionPath, {
    setHeaders: (res) => {
      // Security headers for preview
      res.setHeader('Content-Security-Policy',
        "default-src 'none'; " +
        "script-src 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'unsafe-inline'; " +
        "img-src data: https:; " +
        "font-src data:; " +
        "frame-ancestors 'self';"
      );
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  })(req, res, next);
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
