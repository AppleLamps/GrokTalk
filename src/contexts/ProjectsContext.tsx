import React, { createContext, useContext, useState, useEffect } from 'react';
import { projectsAPI, migrationAPI } from '../services/database';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/use-toast';

// Define Project type
export interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  conversationStarters: string[];
  createdAt: string;
  updatedAt: string;
}

// Define context type
interface ProjectsContextType {
  projects: Project[];
  isLoading: boolean;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  refreshProjects: () => Promise<void>;
}

// Create context
const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'localGrok_projects';

// Provider component
export const ProjectsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Load projects from database when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const fetchedProjects = await projectsAPI.getAll();
      setProjects(fetchedProjects);
      
      // Check if we need to migrate from localStorage
      const localProjects = localStorage.getItem(STORAGE_KEY);
      if (localProjects && fetchedProjects.length === 0) {
        await migrateFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects from database.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const migrateFromLocalStorage = async () => {
    try {
      const migratedProjects = await migrationAPI.migrateProjects();
      if (migratedProjects.length > 0) {
        setProjects(migratedProjects);
        toast({
          title: 'Migration Complete',
          description: `Successfully migrated ${migratedProjects.length} projects to database.`,
        });
      }
    } catch (error) {
      console.error('Failed to migrate projects:', error);
      toast({
        title: 'Migration Failed',
        description: 'Failed to migrate projects from local storage.',
        variant: 'destructive',
      });
    }
  };

  // Add a new project
  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create projects.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const newProject = await projectsAPI.create(projectData);
      setProjects(prev => [...prev, newProject]);
      toast({
        title: 'Project Created',
        description: `Project "${newProject.name}" has been created successfully.`,
      });
      return newProject.id;
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing project
  const updateProject = async (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to update projects.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const updatedProject = await projectsAPI.update(id, updates);
      setProjects(prev => 
        prev.map(project => 
          project.id === id ? updatedProject : project
        )
      );
      toast({
        title: 'Project Updated',
        description: 'Project has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (id: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete projects.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(project => project.id !== id));
      toast({
        title: 'Project Deleted',
        description: 'Project has been deleted successfully.',
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get a project by ID
  const getProject = (id: string): Project | undefined => {
    return projects.find(project => project.id === id);
  };

  // Context value
  const value: ProjectsContextType = {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    getProject,
    refreshProjects: loadProjects
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};

// Custom hook for using the projects context
export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};