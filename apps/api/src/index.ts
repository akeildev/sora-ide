import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Piston URL from environment
const PISTON_URL = process.env.PISTON_URL || 'http://localhost:2000';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'soraide-api' });
});

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'SoraIDE API',
    version: '1.0.0',
    status: 'running'
  });
});

// Execute code via Piston
app.post('/execute', async (req, res) => {
  try {
    const { language, version, files, stdin, args } = req.body;

    // Validate required fields
    if (!language) {
      return res.status(400).json({ error: 'Language is required' });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' });
    }

    // Build Piston request
    const pistonRequest = {
      language,
      version: version || '*', // Use latest if not specified
      files: files.map((file: any) => ({
        name: file.name,
        content: file.content,
      })),
      stdin: stdin || '',
      args: args || [],
      run_timeout: 5000, // 5 second timeout
      compile_timeout: 10000, // 10 second compile timeout
    };

    // Call Piston API
    const pistonResponse = await fetch(`${PISTON_URL}/api/v2/piston/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pistonRequest),
    });

    if (!pistonResponse.ok) {
      const error = await pistonResponse.text();
      console.error('Piston API error:', error);
      return res.status(502).json({
        error: 'Code execution failed',
        details: error,
      });
    }

    const result = await pistonResponse.json();

    // Return execution results
    res.json({
      language: result.language,
      version: result.version,
      run: {
        stdout: result.run.stdout,
        stderr: result.run.stderr,
        output: result.run.output,
        code: result.run.code,
        signal: result.run.signal,
      },
      compile: result.compile ? {
        stdout: result.compile.stdout,
        stderr: result.compile.stderr,
        output: result.compile.output,
        code: result.compile.code,
      } : undefined,
    });
  } catch (error: any) {
    console.error('Execute endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
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
  console.log(`🚀 SoraIDE API Server running on port ${PORT}`);
});

export default app;
