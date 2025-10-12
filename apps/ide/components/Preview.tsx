'use client';

import { useMemo, useState } from 'react';

interface PreviewProps {
  html?: string;
  css?: string;
  javascript?: string;
}

export function Preview({ html = '', css = '', javascript = '' }: PreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const handleReset = () => {
    setIframeKey(prev => prev + 1);
    setError(null);
  };

  // Build the complete HTML document using srcdoc (safer than contentDocument)
  const fullHTML = useMemo(() => {
    try {
      setError(null);
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
    ${css}
  </style>
</head>
<body>
  ${html}

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

    // User's JavaScript
    try {
      ${javascript}
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
  }, [html, css, javascript]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-sm text-gray-600 font-medium">Preview</span>
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
