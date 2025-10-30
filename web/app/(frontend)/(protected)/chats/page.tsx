// app/(frontend)/(protected)/chats/page.tsx
import { requireUser } from "@/lib/requireUser";
import ChatInterface from "./chatInterface";
import { viewAllChats, getAllChatsUsers } from "./chatHelpers";

interface ChatsPageProps {
  searchParams?: Promise<{ 
    openChat?: string;
    newChatWith?: string;
  }>;
}

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const existingChats = await viewAllChats();
  const availableUsers = await getAllChatsUsers();

  // Pass parameters to client component
  const chatToOpen = params?.openChat;
  const userToStartChat = params?.newChatWith;

  return (
    <div className="h-[calc(100vh-120px)]">
      <ChatInterface
        currentUserId={user.id}
        currentUsername={user.username}
        existingChats={existingChats}
        availableUsers={availableUsers}
        initialChatToOpen={chatToOpen}
        initialUserToChat={userToStartChat}
      />
    </div>
  );
}