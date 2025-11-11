// app/(frontend)/(protected)/groups/[id]/MessageHostButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface MessageHostButtonProps {
  hostId: string;
}

export function MessageHostButton({ hostId }: MessageHostButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMessageHost = async () => {
    console.log('MessageHostButton clicked, hostId:', hostId);
    setIsLoading(true);
    
    router.push(`/chats?newChatWith=${hostId}`);
  };

  return (
    <button
      onClick={handleMessageHost}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {isLoading ? 'Opening chat...' : 'Message Host'}
    </button>
  );
}