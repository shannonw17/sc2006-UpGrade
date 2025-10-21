"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, Trash2, Clock, User, MessageSquare} from "lucide-react";

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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastMessageTime = (date: Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return formatTime(messageDate);
    }
    
    return messageDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-full bg-white border border-gray-300">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-300 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300 bg-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-800">Messages</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {isSearching && searchQuery ? (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-2 py-1">USERS</div>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 hover:bg-gray-200 text-left transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">
                        {user.username}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <User size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">No users found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-0">
              {chats.length > 0 ? (
                chats.map((chat) => (
                  <button
                    key={chat.chatId}
                    onClick={() => handleSelectChat(chat.chatId)}
                    className={`w-full p-3 text-left transition-colors flex items-center gap-3 border-b border-gray-200 ${
                      selectedChatId === chat.chatId
                        ? "bg-blue-50 border-r-2 border-blue-500"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {chat.otherUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-gray-800 text-sm truncate">
                          {chat.otherUser.username}
                        </div>
                        {chat.lastMessage && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {formatLastMessageTime(chat.lastMessage.createdAt)}
                          </div>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <div className="text-xs text-gray-500 truncate">
                          {chat.lastMessage.content}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <MessageSquare size={40} className="mb-3 opacity-50" />
                  <p className="text-sm mb-1">No chats yet</p>
                  <p className="text-xs text-center px-4">Search for users to start chatting</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area*/}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChatId && selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-sm">{selectedUser.username}</h2>
                  <p className="text-xs text-green-600">online</p>
                </div>
              </div>
              <button
                onClick={handleDeleteChat}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-200 transition-colors"
                title="Delete chat"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
              {messages.length > 0 ? (
                <div className="space-y-2 max-w-4xl mx-auto">
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === currentUserId;
                    const showAvatar = !isOwn && (
                      index === 0 || 
                      messages[index - 1]?.senderId !== message.senderId
                    );

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        {!isOwn && showAvatar && (
                          <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-1">
                            {message.sender.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {!isOwn && !showAvatar && (
                          <div className="w-6 flex-shrink-0" />
                        )}
                        
                        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                          {showAvatar && (
                            <div className="text-xs text-gray-600 mb-1 px-2">
                              {message.sender.username}
                            </div>
                          )}
                          <div
                            className={`px-3 py-2 max-w-full ${
                              isOwn
                                ? "bg-blue-500 text-white"
                                : "bg-white text-gray-800 border border-gray-300"
                            }`}
                          >
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 px-1">
                            <span className="text-xs text-gray-500">
                              {formatTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
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
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-300 bg-white">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-light text-gray-500 mb-2">UpGrade Messenger</h3>
              <p className="text-sm text-gray-400 max-w-sm px-4">
                Select a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}