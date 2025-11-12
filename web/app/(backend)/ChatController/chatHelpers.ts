"use server";

import { requireUser } from "@/lib/requireUser";
import prisma from "@/lib/db";

//get all users at the same education level (for search)
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

//get all existing chats for current user 
export async function viewAllChats() {
  const currentUser = await requireUser();

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: currentUser.id }, { receiverId: currentUser.id }],
    },
    include: {
      sender: { select: { id: true, username: true, email: true } },
      receiver: { select: { id: true, username: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const conversationsMap = new Map<string, any>();

  for (const msg of messages) {
    const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
    const otherUser = msg.senderId === currentUser.id ? msg.receiver : msg.sender;

    if (!conversationsMap.has(otherUserId)) {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: otherUserId,
          receiverId: currentUser.id,
          isRead: false,
        },
      });

      conversationsMap.set(otherUserId, {
        chatId: `${currentUser.id}-${otherUserId}`,
        otherUser,
        lastMessage: {
          content: msg.message,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          status:
            msg.senderId === currentUser.id && msg.isRead ? ("read" as const) : ("delivered" as const),
        },
        unreadCount,
      });
    }
  }

  return Array.from(conversationsMap.values());
}

//view selected chat messages
export async function viewSelectedChat(chatId: string) {
  const currentUser = await requireUser();
  const [user1Id, user2Id] = chatId.split("-");
  const otherUserId = user1Id === currentUser.id ? user2Id : user1Id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUser.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUser.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, username: true, email: true },
  });

  if (!otherUser) throw new Error("User not found");

  return {
    chatId,
    otherUser,
    messages: messages.map((msg) => ({
      id: msg.id,
      content: msg.message,
      senderId: msg.senderId,
      createdAt: msg.createdAt,
      status:
        msg.senderId === currentUser.id && msg.isRead ? ("read" as const) : ("delivered" as const),
      sender: {
        id: msg.senderId,
        username:
          msg.senderId === currentUser.id
            ? currentUser.username
            : otherUser.username,
      },
    })),
  };
}

//send a new message
export async function sendMessage(chatId: string, content: string) {
  const currentUser = await requireUser();
  const [user1Id, user2Id] = chatId.split("-");
  const receiverId = user1Id === currentUser.id ? user2Id : user1Id;

  const m = await prisma.message.create({
    data: {
      senderId: currentUser.id,
      receiverId,
      message: content,
      isRead: false,
    },
  });

  return { id: m.id, createdAt: m.createdAt };
}

//mark all unread messages from the other user as read
export async function markMessagesAsRead(chatId: string) {
  const currentUser = await requireUser();
  const [user1Id, user2Id] = chatId.split("-");
  const otherUserId = user1Id === currentUser.id ? user2Id : user1Id;

  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: currentUser.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  return { success: true, chatId, otherUserId };
}

//delete a single message
export async function deleteMessage(messageId: string) {
  const currentUser = await requireUser();

  const { count } = await prisma.message.deleteMany({
    where: {
      id: messageId,
      senderId: currentUser.id, 
    },
  });

  if (count === 0) {

    const exists = await prisma.message.findUnique({ where: { id: messageId } });
    if (!exists) {
      throw new Error("Message not found (wrong id or different database).");
    }
    if (exists.senderId !== currentUser.id) {
      throw new Error("Not authorised to delete this message (not the sender).");
    }
    throw new Error("Delete failed unexpectedly.");
  }

  return { deleted: count };
}




//create or get existing chat
export async function createOrGetChat(otherUserId: string) {
  const currentUser = await requireUser();

  if (otherUserId === currentUser.id) throw new Error("Cannot chat with yourself");

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
  });

  if (!otherUser) throw new Error("User not found");
  if (otherUser.status !== "ACTIVE") throw new Error("Cannot chat with inactive user");

  return `${currentUser.id}-${otherUserId}`;
}

//delete an entire chat (all messages between two users)
export async function deleteChat(chatId: string) {
  const currentUser = await requireUser();
  const [user1Id, user2Id] = chatId.split("-");
  const otherUserId = user1Id === currentUser.id ? user2Id : user1Id;

  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: currentUser.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUser.id },
      ],
    },
  });
}