import { requireUser } from "@/lib/requireUser";
import ChatInterface from "./chatInterface";
import { viewAllChats, getAllChatsUsers } from "./chatHelpers"; // ← Changed import

export default async function ChatsPage() {
  const user = await requireUser();
  const existingChats = await viewAllChats();
  const availableUsers = await getAllChatsUsers();

  return (
    <div className="h-[calc(100vh-120px)]">
      <ChatInterface
        currentUserId={user.id}
        currentUsername={user.username}
        existingChats={existingChats}
        availableUsers={availableUsers}
      />
    </div>
  );
}