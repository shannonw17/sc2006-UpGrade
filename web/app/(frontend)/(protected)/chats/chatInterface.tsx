"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, Trash2 } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
  };
}

interface Chat {
  chatId: string;
  otherUser: User;
  lastMessage: {
    content: string;
    createdAt: Date;
  } | null;
}

interface ChatInterfaceProps {
  currentUserId?: string;
  currentUsername?: string;
  existingChats?: Chat[];
  availableUsers?: User[];
}

export default function ChatInterface({
  currentUserId = "demo-user",
  currentUsername = "Demo User",
  existingChats: initialChats = [],
  availableUsers = [],
}: ChatInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>(initialChats || []);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredUsers = (availableUsers || []).filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    setIsSearching(false);
    setSearchQuery("");

    const chat = chats.find((c) => c.chatId === chatId);
    if (chat) {
      setSelectedUser(chat.otherUser);
    }

    try {
      const { viewSelectedChat } = await import("@/app/(backend)/ChatController/chatActions");
      const chatData = await viewSelectedChat(chatId);
      setMessages(chatData.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSelectUser = async (user: User) => {
    setIsSearching(false);
    setSearchQuery("");

    const existingChat = chats.find((c) => c.otherUser.id === user.id);

    if (existingChat) {
      handleSelectChat(existingChat.chatId);
      return;
    }

    try {
      const { createOrGetChat } = await import("@/app/(backend)/ChatController/chatActions");
      const chatId = await createOrGetChat(user.id);
      setSelectedChatId(chatId);
      setSelectedUser(user);
      setMessages([]);
      window.location.reload();
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat");
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId) return;

    try {
      const { sendMessage } = await import("@/app/(backend)/ChatController/chatActions");
      await sendMessage(selectedChatId, messageInput);

      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageInput,
        senderId: currentUserId,
        createdAt: new Date(),
        sender: {
          id: currentUserId,
          username: currentUsername,
        },
      };

      setMessages([...messages, newMessage]);
      setMessageInput("");
      setTimeout(() => handleSelectChat(selectedChatId), 500);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;

    try {
      const { deleteMessage } = await import("@/app/(backend)/ChatController/chatActions");
      await deleteMessage(messageId);
      setMessages(messages.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChatId || !confirm("Delete this entire chat?")) return;

    try {
      const { deleteChat } = await import("@/app/(backend)/ChatController/chatActions");
      await deleteChat(selectedChatId);
      setSelectedChatId(null);
      setSelectedUser(null);
      setMessages([]);
      setChats(chats.filter((c) => c.chatId !== selectedChatId));
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat");
    }
  };

  return (
    <div className="flex h-full border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="w-80 border-r border-gray-300 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-300 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isSearching && searchQuery ? (
            <div className="p-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 hover:bg-blue-50 rounded-lg text-left transition-colors"
                  >
                    <div className="font-semibold text-gray-800">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">No users found</div>
              )}
            </div>
          ) : (
            <div className="p-2">
              {chats.length > 0 ? (
                chats.map((chat) => (
                  <button
                    key={chat.chatId}
                    onClick={() => handleSelectChat(chat.chatId)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedChatId === chat.chatId
                        ? "bg-blue-100 border-l-4 border-blue-600"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-semibold text-gray-800">
                      {chat.otherUser.username}
                    </div>
                    {chat.lastMessage && (
                      <div className="text-sm text-gray-500 truncate">
                        {chat.lastMessage.content}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No chats yet. Search for users to start chatting!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChatId && selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-300 bg-white flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-800">{selectedUser.username}</h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <button
                onClick={handleDeleteChat}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete chat"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-md ${isOwn ? "order-1" : ""}`}>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwn
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-800 border border-gray-300"
                            }`}
                          >
                            <p>{message.content}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 px-1">
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isOwn && (
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-300 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Select a chat to start messaging</p>
              <p className="text-sm">or search for a user to start a new conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}