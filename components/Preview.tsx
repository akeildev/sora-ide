'use client';

import { useMemo, useState, useEffect } from 'react';

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface PreviewProps {
  files: File[];
}

export function Preview({ files }: PreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [currentPage, setCurrentPage] = useState<string>('');

  // Find HTML files
  const htmlFiles = useMemo(() => {
    return files.filter(f => f.language === 'html');
  }, [files]);

  // Get CSS and JavaScript content (combine all CSS/JS files)
  const cssContent = useMemo(() => {
    return files
      .filter(f => f.language === 'css')
      .map(f => f.content)
      .join('\n\n');
  }, [files]);

  const jsContent = useMemo(() => {
    return files
      .filter(f => f.language === 'javascript')
      .map(f => f.content)
      .join('\n\n');
  }, [files]);

  // Set initial page (index.html or first HTML file)
  useEffect(() => {
    if (!currentPage && htmlFiles.length > 0) {
      const indexFile = htmlFiles.find(f => f.name.toLowerCase() === 'index.html');
      setCurrentPage(indexFile?.name || htmlFiles[0].name);
    }
  }, [htmlFiles, currentPage]);

  // Listen for navigation messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'navigate') {
        const targetPage = event.data.page;
        // Check if this HTML file exists
        const targetFile = htmlFiles.find(f => f.name === targetPage);
        if (targetFile) {
          setCurrentPage(targetPage);
        } else {
          console.warn(`Page not found: ${targetPage}`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [htmlFiles]);

  const handleReset = () => {
    setIframeKey(prev => prev + 1);
    setError(null);
    // Reset to index.html or first HTML file
    const indexFile = htmlFiles.find(f => f.name.toLowerCase() === 'index.html');
    setCurrentPage(indexFile?.name || htmlFiles[0]?.name || '');
  };

  // Build the complete HTML document using srcdoc (safer than contentDocument)
  const fullHTML = useMemo(() => {
    try {
      setError(null);

      // Get the current HTML file's content
      const currentHtmlFile = htmlFiles.find(f => f.name === currentPage);
      const htmlContent = currentHtmlFile?.content || '';

      // If no HTML files exist, show empty preview
      if (!htmlContent && htmlFiles.length === 0) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div>
    <p>No HTML files to preview</p>
    <p style="font-size: 12px; margin-top: 8px;">Create an HTML file to see the preview</p>
  </div>
</body>
</html>`;
      }

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}

  <script>
    // Intercept console methods and send to parent
    (function() {
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };

      ['log', 'error', 'warn', 'info'].forEach(method => {
        console[method] = function(...args) {
          // Call original method
          originalConsole[method].apply(console, args);

          // Send to parent window
          try {
            window.parent.postMessage({
              type: 'console',
              method: method,
              args: args.map(arg => {
                try {
                  return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
                } catch (e) {
                  return String(arg);
                }
              })
            }, '*');
          } catch (e) {
            // Ignore errors sending to parent
          }
        };
      });
    })();

    // Global error handling
    window.addEventListener('error', (e) => {
      console.error(\`Error: \${e.message} at \${e.filename}:\${e.lineno}:\${e.colno}\`);
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled Promise Rejection:', e.reason);
    });

    // Intercept navigation to handle multi-page projects
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a');
      if (target && target.href) {
        const href = target.getAttribute('href');

        // Navigate to home page (index.html) for # links
        if (href === '#' || href === '') {
          e.preventDefault();
          window.parent.postMessage({
            type: 'navigate',
            page: 'index.html'
          }, '*');
          console.log('Navigating to home page (index.html)');
          return;
        }

        // Allow other anchor links (like #section) within the same page
        if (href && href.startsWith('#')) {
          return;
        }

        // Allow javascript: links
        if (href && href.startsWith('javascript:')) {
          return;
        }

        // Check if this is a link to another HTML file in the project
        if (href && href.endsWith('.html')) {
          e.preventDefault();
          // Extract just the filename (handle both relative and absolute paths)
          const filename = href.split('/').pop();

          // Send navigation request to parent
          window.parent.postMessage({
            type: 'navigate',
            page: filename
          }, '*');

          console.log('Navigating to:', filename);
          return;
        }

        // Block all other external navigation
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          e.preventDefault();
          console.log('External navigation blocked:', href, '- Only internal HTML pages are supported in preview.');
        }
      }
    });

    // User's JavaScript
    try {
      ${jsContent}
    } catch (err) {
      console.error('JavaScript Error:', err.message || err);
    }
  </script>
</body>
</html>`;
    } catch (err) {
      console.error('Preview render error:', err);
      setError(err instanceof Error ? err.message : 'Failed to render preview');
      return '';
    }
  }, [htmlFiles, currentPage, cssContent, jsContent]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-sm text-gray-600 font-medium">
          {currentPage || 'Preview'}
        </span>
        <button
          onClick={handleReset}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Reset preview"
          aria-label="Reset preview"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Preview iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          key={iframeKey}
          title="preview"
          srcDoc={fullHTML}
          sandbox="allow-scripts"
          className="w-full h-full border-0"
          style={{ background: 'white' }}
        />
      </div>
    </div>
  );
}
