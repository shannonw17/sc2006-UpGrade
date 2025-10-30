// app/(frontend)/(protected)/groups/[id]/MessageMemberButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface MessageMemberButtonProps {
  memberId: string;
  memberName: string;
}

export function MessageMemberButton({ memberId, memberName }: MessageMemberButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMessageMember = async () => {
    setIsLoading(true);
    
    // Simply navigate with userId - let ChatInterface handle it
    router.push(`/chats?newChatWith=${memberId}`);
  };

  return (
    <button
      onClick={handleMessageMember}
      disabled={isLoading}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {isLoading ? 'Opening...' : 'Message'}
    </button>
  );
}