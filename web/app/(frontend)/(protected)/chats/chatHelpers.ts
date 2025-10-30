"use server";

import { requireUser } from "@/lib/requireUser";
import { viewAllChats as viewAllMessages } from "@/app/(backend)/ChatController/viewAllChats";
import { viewSelectedChat as viewMessages } from "@/app/(backend)/ChatController/viewSelectedChat";
import { sendMessage as sendMsg } from "@/app/(backend)/ChatController/sendMessage";
import { deleteMessage as delMsg } from "@/app/(backend)/ChatController/deleteMessage";
import { deleteChat as delChat } from "@/app/(backend)/ChatController/deleteChat";
import prisma from "@/lib/db";

// Get all users at the same education level (for search)
export async function getAllChatsUsers() {
  const currentUser = await requireUser();
  
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { eduLevel: true },
  });

  if (!user) throw new Error("User not found");

  const users = await prisma.user.findMany({
    where: {
      eduLevel: user.eduLevel,
      id: { not: currentUser.id },
      status: "ACTIVE",
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
    orderBy: {
      username: "asc",
    },
  });

  return users;
}

// Get all existing chats for current user with structured format
export async function viewAllChats() {
  const currentUser = await requireUser();
  
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUser.id },
        { receiverId: currentUser.id },
      ],
    },
    include: {
      sender: {
        select: { id: true, username: true, email: true },
      },
      receiver: {
        select: { id: true, username: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group messages by conversation partner
  const conversationsMap = new Map<string, any>();

  for (const msg of messages) {
    const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
    const otherUser = msg.senderId === currentUser.id ? msg.receiver : msg.sender;

    if (!conversationsMap.has(otherUserId)) {
      // Count unread messages from this specific user
      const unreadCount = await prisma.message.count({
        where: {
          senderId: otherUserId,
          receiverId: currentUser.id,
          isRead: false,
        },
      });

      conversationsMap.set(otherUserId, {
        chatId: `${currentUser.id}-${otherUserId}`,
        otherUser: otherUser,
        lastMessage: {
          content: msg.message,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          // Set status based on isRead - if current user sent it and it's read, show 'read' (blue)
          status: (msg.senderId === currentUser.id && msg.isRead) ? 'read' as const : 'delivered' as const,
        },
        unreadCount: unreadCount,
      });
    }
  }

  return Array.from(conversationsMap.values());
}

// View selected chat messages
export async function viewSelectedChat(chatId: string) {
  const currentUser = await requireUser();
  
  const [user1Id, user2Id] = chatId.split('-');
  const otherUserId = user1Id === currentUser.id ? user2Id : user1Id;

  // Fetch messages directly with Prisma to get isRead field
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUser.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUser.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, username: true, email: true },
  });

  if (!otherUser) throw new Error("User not found");

  return {
    chatId: chatId,
    otherUser: otherUser,
    messages: messages.map((msg: any) => ({
      id: msg.id,
      content: msg.message,
      senderId: msg.senderId,
      createdAt: msg.createdAt,
      // If YOU sent it and receiver has read it → 'read' (blue)
      // Otherwise → 'delivered' (gray)
      status: (msg.senderId === currentUser.id && msg.isRead) ? 'read' as const : 'delivered' as const,
      sender: {
        id: msg.senderId,
        username: msg.senderId === currentUser.id ? currentUser.username : otherUser.username,
      },
    })),
  };
}

// Send message
export async function sendMessage(chatId: string, content: string) {
  const currentUser = await requireUser();
  
  const [user1Id, user2Id] = chatId.split('-');
  const receiverId = user1Id === currentUser.id ? user2Id : user1Id;

  await sendMsg(currentUser.id, receiverId, content);
}

// Mark messages as read when opening a chat
export async function markMessagesAsRead(chatId: string) {
  const currentUser = await requireUser();
  
  const [user1Id, user2Id] = chatId.split('-');
  const otherUserId = user1Id === currentUser.id ? user2Id : user1Id;

  // Mark all unread messages from the other user as read
  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: currentUser.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
  
  return { 
    success: true, 
    chatId,
    otherUserId 
  };
}

// Delete message
export async function deleteMessage(messageId: string) {
  const currentUser = await requireUser();
  await delMsg(messageId, currentUser.id);
}

// Create or get existing chat
export async function createOrGetChat(otherUserId: string) {
  const currentUser = await requireUser();

  if (otherUserId === currentUser.id) {
    throw new Error("Cannot chat with yourself");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  if (otherUser.status !== "ACTIVE") {
    throw new Error("Cannot chat with inactive user");
  }

  return `${currentUser.id}-${otherUserId}`;
}

// Delete entire chat
export async function deleteChat(chatId: string) {
  const currentUser = await requireUser();
  
  const [user1Id, user2Id] = chatId.split('-');
  const otherUserId = user1Id === currentUser.id ? user2Id : user1Id;

  await delChat(currentUser.id, otherUserId);
}