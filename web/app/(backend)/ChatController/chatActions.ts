"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";

// Type assertion to fix the Prisma client issue
const prismaWithChat = prisma as any;

// Get all users at the same education level (for search)
export async function getAllChatsUsers() {
  const currentUser = await requireUser();
  
  const user = await prismaWithChat.user.findUnique({
    where: { id: currentUser.id },
    select: { eduLevel: true },
  });

  if (!user) throw new Error("User not found");

  const users = await prismaWithChat.user.findMany({
    where: {
      eduLevel: user.eduLevel,
      id: { not: currentUser.id },
      status: "ACTIVE", // Only show active users
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

// Get all existing chats for current user
export async function viewAllChats() {
  const currentUser = await requireUser();

  const chats = await prismaWithChat.chat.findMany({
    where: {
      OR: [
        { user1Id: currentUser.id },
        { user2Id: currentUser.id },
      ],
    },
    include: {
      user1: {
        select: { id: true, username: true, email: true },
      },
      user2: {
        select: { id: true, username: true, email: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Format chats to show the other user
  const formattedChats = chats.map((chat) => {
    const otherUser = chat.user1Id === currentUser.id ? chat.user2 : chat.user1;
    const lastMessage = chat.messages[0];

    return {
      chatId: chat.id,
      otherUser,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
          }
        : null,
    };
  });

  return formattedChats;
}

// View selected chat messages
export async function viewSelectedChat(chatId: string) {
  const currentUser = await requireUser();

  const chat = await prismaWithChat.chat.findUnique({
    where: { id: chatId },
    include: {
      user1: {
        select: { id: true, username: true, email: true },
      },
      user2: {
        select: { id: true, username: true, email: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { id: true, username: true },
          },
        },
      },
    },
  });

  if (!chat) throw new Error("Chat not found");

  // Verify user is part of this chat
  if (chat.user1Id !== currentUser.id && chat.user2Id !== currentUser.id) {
    throw new Error("Unauthorized");
  }

  const otherUser = chat.user1Id === currentUser.id ? chat.user2 : chat.user1;

  return {
    chatId: chat.id,
    otherUser,
    messages: chat.messages,
  };
}

// Send message
export async function sendMessage(chatId: string, content: string) {
  const currentUser = await requireUser();

  if (!content.trim()) {
    throw new Error("Message cannot be empty");
  }

  const chat = await prismaWithChat.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) throw new Error("Chat not found");

  // Verify user is part of this chat
  if (chat.user1Id !== currentUser.id && chat.user2Id !== currentUser.id) {
    throw new Error("Unauthorized");
  }

  const message = await prismaWithChat.message.create({
    data: {
      chatId,
      senderId: currentUser.id,
      content: content.trim(),
    },
  });

  revalidatePath("/chats");
  return message;
}

// Delete message (only your own)
export async function deleteMessage(messageId: string) {
  const currentUser = await requireUser();

  const message = await prismaWithChat.message.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new Error("Message not found");

  if (message.senderId !== currentUser.id) {
    throw new Error("You can only delete your own messages");
  }

  await prismaWithChat.message.delete({
    where: { id: messageId },
  });

  revalidatePath("/chats");
}

// Create or get existing chat with another user
export async function createOrGetChat(otherUserId: string) {
  const currentUser = await requireUser();

  if (otherUserId === currentUser.id) {
    throw new Error("Cannot chat with yourself");
  }

  // Check if chat already exists (either direction)
  const existingChat = await prismaWithChat.chat.findFirst({
    where: {
      OR: [
        { user1Id: currentUser.id, user2Id: otherUserId },
        { user1Id: otherUserId, user2Id: currentUser.id },
      ],
    },
  });

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat
  const newChat = await prismaWithChat.chat.create({
    data: {
      user1Id: currentUser.id,
      user2Id: otherUserId,
    },
  });

  revalidatePath("/chats");
  return newChat.id;
}

// Delete entire chat
export async function deleteChat(chatId: string) {
  const currentUser = await requireUser();

  const chat = await prismaWithChat.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) throw new Error("Chat not found");

  // Verify user is part of this chat
  if (chat.user1Id !== currentUser.id && chat.user2Id !== currentUser.id) {
    throw new Error("Unauthorized");
  }

  await prismaWithChat.chat.delete({
    where: { id: chatId },
  });

  revalidatePath("/chats");
}