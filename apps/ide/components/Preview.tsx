'use client';

import { useEffect, useRef, useState } from 'react';

interface PreviewProps {
  html?: string;
  css?: string;
  javascript?: string;
}

export function Preview({ html = '', css = '', javascript = '' }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!iframeDoc) return;

    try {
      setError(null);

      // Build the complete HTML document
      const fullHTML = `
<!DOCTYPE html>
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
    // Error handling
    window.addEventListener('error', (e) => {
      console.error('Preview Error:', e.message);
    });

    // User's JavaScript
    try {
      ${javascript}
    } catch (err) {
      console.error('JavaScript Error:', err);
    }
  </script>
</body>
</html>
      `.trim();

      // Write to iframe
      iframeDoc.open();
      iframeDoc.write(fullHTML);
      iframeDoc.close();
    } catch (err) {
      console.error('Preview render error:', err);
      setError(err instanceof Error ? err.message : 'Failed to render preview');
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
        <div className="w-20" /> {/* Spacer for centering */}
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
          ref={iframeRef}
          title="preview"
          sandbox="allow-scripts"
          className="w-full h-full border-0"
          style={{ background: 'white' }}
        />
      </div>
    </div>
  );
}
