import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import { SearchIcon, UserIcon } from "../components/ui/Icons";
import { useDebounce } from "../hooks/useDebounce";
import messageService from "../appwrite/message";
import followService from "../appwrite/follow";
import postService from "../appwrite/post";
import { formatRelativeTime, getHandle } from "../lib/ui";

export default function Messages() {
  const user = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeTab, setActiveTab] = useState("all");

  const [conversations, setConversations] = useState([]);
  const [usersDirectory, setUsersDirectory] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Load users directory (since we don't have a direct users API)
  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const [postsResponse, followingResponse, convsResponse] = await Promise.all([
          postService.getPosts(), // Used to extract unique users
          followService.getFollowing(user.$id),
          messageService.getConversations(user.$id)
        ]);

        if (!active) return;

        // Extract unique users
        const uniqueUsersMap = new Map();
        for (const post of postsResponse?.documents || []) {
          if (!uniqueUsersMap.has(post.authorID) && post.authorID !== user.$id) {
            uniqueUsersMap.set(post.authorID, {
              id: post.authorID,
              name: post.authorName,
            });
          }
        }
        setUsersDirectory(Array.from(uniqueUsersMap.values()));
        setFollowingIds(followingResponse || []);

        // Enhance conversations with other user's info
        const enhancedConvs = (convsResponse?.documents || []).map(conv => {
          const otherUserId = conv.members.find(id => id !== user.$id);
          const otherUser = uniqueUsersMap.get(otherUserId) || { id: otherUserId, name: "Unknown User" };
          return {
            ...conv,
            otherUser
          };
        });
        
        setConversations(enhancedConvs);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [user]);

  // 2. Handle Search Results
  const searchResults = useMemo(() => {
    if (!debouncedSearch) return [];
    return usersDirectory.filter(u => 
      u.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch, usersDirectory]);

  // 3. Handle Filters
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const isFollowing = followingIds.includes(conv.otherUser.id);
      
      if (activeTab === "unread") {
        return conv.unreadCount > 0; // Assuming unreadCount is reset when viewed
      }
      if (activeTab === "following") {
        return isFollowing;
      }
      if (activeTab === "requests") {
        return !isFollowing;
      }
      return true; // "all"
    });
  }, [conversations, activeTab, followingIds]);

  // 4. Handle User Click (from Search or Direct)
  const handleUserClick = async (targetUser) => {
    if (!user) return;
    
    // Check if conversation exists
    let conv = await messageService.getConversationByMembers(user.$id, targetUser.id);
    
    if (!conv) {
      // Create new conversation
      conv = await messageService.createConversation([user.$id, targetUser.id]);
    }
    
    navigate(`/messages/${conv.$id}`);
  };

  if (!user) {
    return (
      <EmptyState
        eyebrow="Messages"
        title="Sign in to chat"
        description="Connect with other users through direct messages."
        actionLabel="Log in"
        actionTo="/login"
      />
    );
  }

  return (
    <div className="space-y-4 max-w-[850px] mx-auto">
      {/* HEADER & SEARCH */}
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h1 className="font-display text-2xl text-white font-bold">Messages</h1>
          
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 focus-within:border-white/30 transition w-full sm:max-w-[300px]">
            <SearchIcon className="h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* TABS */}
        {!searchQuery && (
          <div className="flex gap-1 overflow-x-auto hide-scrollbar rounded-full border border-white/5 bg-black/20 p-1 w-fit">
            {["all", "unread", "following", "requests"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-bold capitalize transition whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-white text-black shadow-lg"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* SEARCH RESULTS OR CONVERSATION LIST */}
      <section className="rounded-[32px] border border-white/10 bg-[#121212]/92 p-3 sm:p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)] min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-zinc-600 border-t-white rounded-full animate-spin" /></div>
        ) : searchQuery ? (
          // SEARCH RESULTS
          <div className="space-y-1">
            <h3 className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Suggested Users</h3>
            {searchResults.length > 0 ? searchResults.map(u => (
              <div
                key={u.id}
                onClick={() => handleUserClick(u)}
                className="flex items-center gap-4 rounded-[20px] px-4 py-3 cursor-pointer transition hover:bg-white/5"
              >
                <Avatar name={u.name} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{u.name}</p>
                  <p className="text-xs text-zinc-500">{getHandle(u.name)}</p>
                </div>
              </div>
            )) : (
              <p className="p-4 text-sm text-zinc-500 text-center">No users found.</p>
            )}
          </div>
        ) : (
          // CONVERSATION LIST
          <div className="space-y-1">
            {filteredConversations.length > 0 ? filteredConversations.map((conv) => (
              <Link
                key={conv.$id}
                to={`/messages/${conv.$id}`}
                className="flex items-center gap-4 rounded-[20px] px-3 py-3 sm:px-4 transition hover:bg-white/5 group"
              >
                <div 
                  onClick={(e) => { e.preventDefault(); navigate(`/profile/${conv.otherUser.id}`); }}
                  className="shrink-0 relative z-10"
                >
                  <Avatar name={conv.otherUser.name} size="md" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${conv.unreadCount > 0 ? "font-bold text-white" : "font-medium text-zinc-200"}`}>
                      {conv.otherUser.name}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="shrink-0 text-[11px] text-zinc-500">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className={`mt-0.5 truncate text-[13px] ${conv.unreadCount > 0 ? "font-medium text-zinc-300" : "text-zinc-500"}`}>
                    {conv.lastMessage || "Start a conversation"}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </Link>
            )) : (
              <EmptyState
                eyebrow="Inbox"
                title={`No ${activeTab !== 'all' ? activeTab : ''} messages`}
                description="Search for a user to start a conversation."
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
