"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Send, Trash2, Clock, User, MessageSquare, Check, CheckCheck, MoreVertical, X } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
  status?: 'sent' | 'delivered' | 'read';
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
    senderId?: string;
    status?: 'sent' | 'delivered' | 'read';
  } | null;
  unreadCount?: number;
}

interface ChatInterfaceProps {
  currentUserId?: string;
  currentUsername?: string;
  existingChats?: Chat[];
  availableUsers?: User[];
  initialChatToOpen?: string; // chatId to automatically open
  initialUserToChat?: string; // userId to start new chat with
}

export default function ChatInterface({
  currentUserId = "demo-user",
  currentUsername = "Demo User",
  existingChats: initialChats = [],
  availableUsers = [],
  initialChatToOpen, // NEW
  initialUserToChat, // NEW - userId to start chat with
}: ChatInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Chat[]>(initialChats || []);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasAutoOpenedRef = useRef(false); // NEW: prevent multiple auto-opens
  const hasAutoStartedRef = useRef(false); // NEW: prevent multiple auto-starts

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMessageMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // NEW: Auto-open chat when initialChatToOpen is provided
  useEffect(() => {
    const autoOpenChat = async () => {
      // Only run once
      if (hasAutoOpenedRef.current || !initialChatToOpen) return;
      hasAutoOpenedRef.current = true;

      try {
        // The chatId is already created by the button click, just open it
        await handleSelectChat(initialChatToOpen);

        // Clear the URL parameter
        const params = new URLSearchParams(searchParams.toString());
        params.delete('openChat');
        const newUrl = params.toString() ? `/chats?${params.toString()}` : '/chats';
        router.replace(newUrl);
      } catch (error) {
        console.error("Error auto-opening chat:", error);
        hasAutoOpenedRef.current = false; // Allow retry on error
      }
    };

    autoOpenChat();
  }, [initialChatToOpen]); // Only depend on initialChatToOpen

  // NEW: Auto-start chat with user when initialUserToChat is provided
  useEffect(() => {
    const autoStartChat = async () => {
      // Only run once
      if (hasAutoStartedRef.current || !initialUserToChat) return;
      
      // Mark as started immediately to prevent re-runs
      hasAutoStartedRef.current = true;

      try {
        // FIRST: Check if chat already exists with this user
        const existingChat = chats.find((c) => c.otherUser.id === initialUserToChat);
        
        if (existingChat) {
          // Open the existing chat instead of creating new one
          console.log('Found existing chat, opening it:', existingChat.chatId);
          await handleSelectChat(existingChat.chatId);
        } else {
          // No existing chat, find user and create new one
          const targetUser = availableUsers.find(u => u.id === initialUserToChat);
          
          if (targetUser) {
            console.log('No existing chat, creating new one with:', targetUser.username);
            await handleSelectUser(targetUser);
          }
        }

        // Clear the URL parameter
        const params = new URLSearchParams(searchParams.toString());
        params.delete('newChatWith');
        const newUrl = params.toString() ? `/chats?${params.toString()}` : '/chats';
        router.replace(newUrl);
      } catch (error) {
        console.error("Error starting new chat:", error);
        hasAutoStartedRef.current = false; // Allow retry on error
      }
    };

    autoStartChat();
  }, [initialUserToChat]); // Only depend on initialUserToChat - don't depend on chats!

  // Reload chats when component mounts to get fresh unread counts
  useEffect(() => {
    const loadFreshChats = async () => {
      try {
        const { viewAllChats } = await import("./chatHelpers");
        const freshChats = await viewAllChats();
        setChats(freshChats);
      } catch (error) {
        console.error("Error loading chats:", error);
      }
    };
    
    loadFreshChats();
  }, []); // Empty dependency array means this runs once on mount

  // Update chats when initialChats prop changes (e.g., after navigation)
  useEffect(() => {
    setChats(initialChats || []);
  }, [initialChats]);

  // Function to reload chat list with updated counts
  const reloadChats = async () => {
    try {
      const { viewAllChats } = await import("./chatHelpers");
      const updatedChats = await viewAllChats();
      setChats(updatedChats);
    } catch (error) {
      console.error("Error reloading chats:", error);
    }
  };

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
      
      // Immediately clear the unread count in local state
      setChats(prevChats => 
        prevChats.map(c => 
          c.chatId === chatId 
            ? { ...c, unreadCount: undefined }
            : c
        )
      );
    }

    try {
      const { viewSelectedChat, markMessagesAsRead } = await import("./chatHelpers");
      
      // Load messages
      const chatData = await viewSelectedChat(chatId);
      setMessages(chatData.messages);
      
      // Mark messages as read in database
      await markMessagesAsRead(chatId);
      
      // Reload chat list to get updated unread counts
      await reloadChats();
      
      // Refresh the page data from server (this updates sidebar counts)
      router.refresh();
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
      const { createOrGetChat } = await import("./chatHelpers");
      const chatId = await createOrGetChat(user.id);
      
      const newChat: Chat = {
        chatId: chatId,
        otherUser: user,
        lastMessage: null,
        unreadCount: 0,
      };
      
      setChats([newChat, ...chats]);
      setSelectedChatId(chatId);
      setSelectedUser(user);
      setMessages([]);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat");
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId) return;

    const tempMessageId = Date.now().toString();
    const messageContent = messageInput;
    const newMessage: Message = {
      id: tempMessageId,
      content: messageContent,
      senderId: currentUserId,
      createdAt: new Date(),
      status: 'sent',
      sender: {
        id: currentUserId,
        username: currentUsername,
      },
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");

    setChats(prevChats => 
      prevChats.map(chat => 
        chat.chatId === selectedChatId
          ? {
              ...chat,
              lastMessage: {
                content: messageContent,
                createdAt: new Date(),
                senderId: currentUserId,
                status: 'sent' as const,
              }
            }
          : chat
      )
    );

    try {
      const { sendMessage } = await import("./chatHelpers");
      await sendMessage(selectedChatId, messageContent);
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempMessageId 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );

      setChats(prevChats => 
        prevChats.map(chat => 
          chat.chatId === selectedChatId && chat.lastMessage
            ? {
                ...chat,
                lastMessage: {
                  ...chat.lastMessage,
                  status: 'delivered' as const,
                }
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessageId));
      
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.chatId === selectedChatId
            ? {
                ...chat,
                lastMessage: messages.length > 0 
                  ? {
                      content: messages[messages.length - 1].content,
                      createdAt: messages[messages.length - 1].createdAt,
                      senderId: messages[messages.length - 1].senderId,
                      status: messages[messages.length - 1].status,
                    }
                  : null
              }
            : chat
        )
      );
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { deleteMessage } = await import("./chatHelpers");
      await deleteMessage(messageId);
      setMessages(messages.filter((msg) => msg.id !== messageId));
      setMessageToDelete(null);
      setMessageMenuOpen(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChatId) return;
    if (!confirm("Are you sure you want to delete this entire chat? This action cannot be undone.")) return;

    try {
      const { deleteChat } = await import("./chatHelpers");
      await deleteChat(selectedChatId);
      setChats(chats.filter((c) => c.chatId !== selectedChatId));
      setSelectedChatId(null);
      setMessages([]);
      setSelectedUser(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return formatTime(date);
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const shouldShowTimestamp = (
    currentMessage: Message,
    nextMessage: Message | null,
    previousMessage: Message | null
  ) => {
    if (!nextMessage) return true;
    
    if (currentMessage.senderId !== nextMessage.senderId) return true;
    
    const timeDiff = new Date(nextMessage.createdAt).getTime() - new Date(currentMessage.createdAt).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeDiff > fiveMinutes;
  };

  const renderMessageStatus = (status?: 'sent' | 'delivered' | 'read') => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-white border border-gray-300">
      {/* Delete Message Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-200 transform transition-all duration-200 scale-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Message</h3>
              <button
                onClick={() => setMessageToDelete(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <p className="text-center text-gray-600 mb-2">This action cannot be undone.</p>
              <p className="text-center text-sm text-gray-500">The message will be permanently deleted.</p>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setMessageToDelete(null)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 rounded-lg flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(messageToDelete)}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 rounded-lg flex-1 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 border-r border-gray-300 flex flex-col bg-gray-50">
        {/* Search Bar */}
        <div className="p-3 border-b border-gray-300 bg-white">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Chat/User List */}
        <div className="flex-1 overflow-y-auto">
          {isSearching && searchQuery ? (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2">SEARCH RESULTS</div>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 hover:bg-gray-100 transition-colors flex items-center gap-3 border-b border-gray-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800 text-sm">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No users found
                </div>
              )}
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2">MESSAGES</div>
              {chats.length > 0 ? (
                chats.map((chat) => (
                  <button
                    key={chat.chatId}
                    onClick={() => handleSelectChat(chat.chatId)}
                    className={`relative w-full p-3 transition-colors flex items-start gap-3 border-b border-gray-200 ${
                      selectedChatId === chat.chatId
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {chat.otherUser.username.charAt(0).toUpperCase()}
                      </div>
                      {chat.otherUser.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* First row: Name and Time on same line */}
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-medium text-gray-800 text-sm truncate">
                          {chat.otherUser.username}
                        </span>
                        {chat.lastMessage && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                            {/* Show status checks if the last message was sent by current user */}
                            {chat.lastMessage.senderId === currentUserId && renderMessageStatus(chat.lastMessage.status)}
                            <span>{formatLastMessageTime(chat.lastMessage.createdAt)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Second row: Message preview and Badge on same line */}
                      {chat.lastMessage && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500 truncate">
                            {chat.lastMessage.content}
                          </span>
                          
                          {/* Unread count badge - only show if count > 0 */}
                          {(chat.unreadCount || 0) > 0 && (
                            <span className="flex items-center justify-center min-w-5 h-5 text-xs font-bold px-1.5 bg-red-500 text-white flex-shrink-0">
                              {chat.unreadCount! > 99 ? '99+' : chat.unreadCount}
                            </span>
                          )}
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
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  {selectedUser.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-sm">{selectedUser.username}</h2>
                  {selectedUser.isOnline && (
                    <p className="text-xs text-green-600">online</p>
                  )}
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
                <div className="space-y-1 max-w-4xl mx-auto">
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === currentUserId;
                    const previousMessage = index > 0 ? messages[index - 1] : null;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                    const showAvatar = !isOwn && (
                      index === 0 || 
                      messages[index - 1]?.senderId !== message.senderId
                    );
                    const showTimestamp = shouldShowTimestamp(message, nextMessage, previousMessage);

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"} group relative`}
                      >
                        {!isOwn && showAvatar && (
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 self-end mb-0.5">
                            {message.sender.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {!isOwn && !showAvatar && (
                          <div className="w-8 flex-shrink-0" />
                        )}
                        
                        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[65%]`}>
                          {showAvatar && !isOwn && (
                            <div className="text-xs text-gray-600 mb-1 px-3">
                              {message.sender.username}
                            </div>
                          )}
                          
                          <div className="flex items-end gap-1">
                            <div
                              className={`px-3 py-2 max-w-full rounded-2xl ${
                                isOwn
                                  ? "bg-blue-500 text-white rounded-br-md"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                              } transition-all duration-200`}
                            >
                              <p className="text-sm leading-relaxed break-words">{message.content}</p>
                            </div>

                            {/* Message Menu Button */}
                            {isOwn && (
                              <div ref={menuRef} className="relative">
                                <button
                                  onClick={() => setMessageMenuOpen(messageMenuOpen === message.id ? null : message.id)}
                                  className="p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-200 rounded-lg"
                                >
                                  <MoreVertical size={14} className="text-gray-500" />
                                </button>

                                {/* Message Menu Dropdown */}
                                {messageMenuOpen === message.id && (
                                  <div className="absolute right-0 top-6 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10 min-w-32">
                                    <button
                                      onClick={() => {
                                        setMessageToDelete(message.id);
                                        setMessageMenuOpen(null);
                                      }}
                                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {showTimestamp && (
                            <div className="flex items-center gap-1 mt-0.5 px-2">
                              <span className="text-xs text-gray-500">
                                {formatTime(message.createdAt)}
                              </span>
                              {isOwn && renderMessageStatus(message.status)}
                            </div>
                          )}
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
                    className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-blue-500 text-sm rounded-lg"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white hover:from-gray-800 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-sm font-medium rounded-xl shadow-sm hover:shadow-md"
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