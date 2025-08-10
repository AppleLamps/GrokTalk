import { Project, Message, SavedChat } from '../types/chat';

// Prefer same-origin in production to avoid CORS and custom domains
const API_BASE_URL = ((): string => {
  // Always hit Vercel functions on same origin in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return `${window.location.origin}/api`;
  }
  return process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
})();

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to make authenticated requests
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    return fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    }).then(res => res.json());
  },

  login: async (email: string, password: string) => {
    return fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(res => res.json());
  },

  getProfile: async () => {
    return authenticatedFetch('/auth/me');
  },

  updateProfile: async (data: { name?: string; email?: string }) => {
    return authenticatedFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Projects API
export const projectsAPI = {
  getAll: async (): Promise<Project[]> => {
    return authenticatedFetch('/projects');
  },

  getById: async (id: string): Promise<Project> => {
    return authenticatedFetch(`/projects/${id}`);
  },

  create: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    return authenticatedFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    return authenticatedFetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },

  delete: async (id: string): Promise<void> => {
    return authenticatedFetch(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Chat API
export const chatAPI = {
  getAll: async (projectId?: string): Promise<SavedChat[]> => {
    const url = projectId ? `/chat?projectId=${projectId}` : '/chat';
    return authenticatedFetch(url);
  },

  getById: async (id: string): Promise<SavedChat> => {
    return authenticatedFetch(`/chat/${id}`);
  },

  create: async (chat: {
    title: string;
    messages: Message[];
    projectId?: string;
  }): Promise<SavedChat> => {
    return authenticatedFetch('/chat', {
      method: 'POST',
      body: JSON.stringify(chat),
    });
  },

  update: async (id: string, chat: {
    title?: string;
    messages?: Message[];
  }): Promise<SavedChat> => {
    return authenticatedFetch(`/chat/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chat),
    });
  },

  delete: async (id: string): Promise<void> => {
    return authenticatedFetch(`/chat/${id}`, {
      method: 'DELETE',
    });
  },
};

// API Keys API
export const apiKeysAPI = {
  getAll: async () => {
    return authenticatedFetch('/api-keys');
  },

  getByProvider: async (provider: string) => {
    return authenticatedFetch(`/api-keys/provider/${provider}`);
  },

  create: async (data: {
    provider: string;
    keyValue: string;
    name?: string;
  }) => {
    return authenticatedFetch('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    keyValue?: string;
    name?: string;
  }) => {
    return authenticatedFetch(`/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return authenticatedFetch(`/api-keys/${id}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return fetch(`${API_BASE_URL}/health`).then(res => res.json());
  },
};

// Migration helpers for moving from localStorage to database
export const migrationAPI = {
  // Migrate projects from localStorage to database
  migrateProjects: async () => {
    const localProjects = localStorage.getItem('projects');
    if (localProjects) {
      const projects: Project[] = JSON.parse(localProjects);
      const migratedProjects = [];
      
      for (const project of projects) {
        try {
          const { id, createdAt, updatedAt, ...projectData } = project;
          const migratedProject = await projectsAPI.create(projectData);
          migratedProjects.push(migratedProject);
        } catch (error) {
          console.error('Failed to migrate project:', project.name, error);
        }
      }
      
      return migratedProjects;
    }
    return [];
  },

  // Migrate saved chats from localStorage to database
  migrateSavedChats: async () => {
    const localChats = localStorage.getItem('savedChats');
    if (localChats) {
      const chats: SavedChat[] = JSON.parse(localChats);
      const migratedChats = [];
      
      for (const chat of chats) {
        try {
          const migratedChat = await chatAPI.create({
            title: chat.title,
            messages: chat.messages,
          });
          migratedChats.push(migratedChat);
        } catch (error) {
          console.error('Failed to migrate chat:', chat.title, error);
        }
      }
      
      return migratedChats;
    }
    return [];
  },

  // Migrate chats from localStorage to database
  migrateChats: async (data: {
    savedChats: SavedChat[];
    currentMessages: Message[];
    currentChatId: string | null;
  }) => {
    const migratedChats = [];
    
    // Migrate saved chats
    for (const chat of data.savedChats) {
      try {
        const migratedChat = await chatAPI.create({
          title: chat.title,
          messages: chat.messages,
        });
        migratedChats.push(migratedChat);
      } catch (error) {
        console.error('Failed to migrate chat:', chat.title, error);
      }
    }
    
    // Migrate current messages if they exist and aren't already saved
    if (data.currentMessages.length > 0 && data.currentChatId) {
      try {
        const currentChatTitle = data.currentMessages[0]?.content?.toString().substring(0, 50) || 'Current Chat';
        const migratedCurrentChat = await chatAPI.create({
          title: currentChatTitle,
          messages: data.currentMessages,
        });
        migratedChats.push(migratedCurrentChat);
      } catch (error) {
        console.error('Failed to migrate current chat:', error);
      }
    }
    
    return migratedChats;
  },

  // Clear localStorage after successful migration
  clearLocalStorage: () => {
    localStorage.removeItem('projects');
    localStorage.removeItem('savedChats');
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('currentChatId');
  },
};