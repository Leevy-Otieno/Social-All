import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  adminToken: null,
  isAdmin: false,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setAdminToken: (adminToken) => set({ adminToken, isAdmin: !!adminToken }),
  logout: () => set({ user: null, token: null, adminToken: null, isAdmin: false }),
}))

export const useFeedStore = create((set, get) => ({
  posts: [],
  page: 1,
  hasMore: true,
  loading: false,
  setPosts: (posts) => set({ posts }),
  appendPosts: (posts) => set((s) => ({ posts: [...s.posts, ...posts] })),
  prependPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setLoading: (loading) => set({ loading }),
  removePost: (id) => set((s) => ({ posts: s.posts.filter((p) => (p.type === 'post' ? p.data.id !== id : true)) })),
}))

export const useNotifStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications, unreadCount: notifications.filter((n) => !n.is_read).length }),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, is_read: 1 })), unreadCount: 0 })),
}))

export const useChatStore = create((set, get) => ({
  conversations: [],
  messages: [],
  activeConvId: null,
  setConversations: (conversations) => set({ conversations }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setActiveConvId: (activeConvId) => set({ activeConvId }),
}))

export const useUIStore = create((set) => ({
  createPostOpen: false,
  setCreatePostOpen: (createPostOpen) => set({ createPostOpen }),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}))

export const useXpStore = create((set) => ({
  xpNotification: null, // { amount, action }
  showXp: (amount, action) => {
    set({ xpNotification: { amount, action, id: Date.now() } })
    setTimeout(() => set({ xpNotification: null }), 3000)
  },
  clearXp: () => set({ xpNotification: null }),
}))
