// app/(frontend)/(protected)/inbox/MessageHostLink.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface MessageHostLinkProps {
  hostId: string;
}

export function MessageHostLink({ hostId }: MessageHostLinkProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simply navigate with userId - let ChatInterface handle it
    router.push(`/chats?newChatWith=${hostId}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-1 text-green-600 hover:text-green-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {isLoading ? 'Opening...' : 'Message host'}
    </button>
  );
}