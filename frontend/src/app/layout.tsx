import './globals.css';
import React from 'react';
import { AuthProvider } from '../lib/context/AuthContext';
import { WorkspaceProvider } from '../lib/context/WorkspaceContext';

export const metadata = {
  title: 'Abstrat — Multi-Workspace Document Assistant (RAG & Tool Calling)',
  description: 'AI assistant grounded in workspace documents with multi-tool execution and strict tenant isolation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
