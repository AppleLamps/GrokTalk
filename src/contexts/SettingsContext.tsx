import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { apiKeysAPI } from '../services/database';
import { useAuth } from './AuthContext';

// Context default values
interface SettingsContextType {
  apiKey: string;
  modelTemperature: number;
  maxTokens: number;
  currentModel: string;
  settingsOpen: boolean;
  isLoading: boolean;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Setters
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  setModelTemperature: React.Dispatch<React.SetStateAction<number>>;
  setMaxTokens: React.Dispatch<React.SetStateAction<number>>;
  setCurrentModel: React.Dispatch<React.SetStateAction<string>>;
  
  // Functions
  handleSaveSettings: (key: string, temp: number, tokens: number, model?: string) => Promise<void>;
  loadApiKey: (provider: string) => Promise<void>;
}

// Create context with default values
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for settings
  const [apiKey, setApiKey] = useState("");
  const [modelTemperature, setModelTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [currentModel, setCurrentModel] = useState<string>('x-ai/grok-4');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Load settings from localStorage (non-sensitive data)
    const storedTemperature = localStorage.getItem('modelTemperature');
    const storedMaxTokens = localStorage.getItem('maxTokens');
    const storedModel = localStorage.getItem('currentModel');
    
    if (storedTemperature) {
      setModelTemperature(parseFloat(storedTemperature));
    }
    
    if (storedMaxTokens) {
      setMaxTokens(parseInt(storedMaxTokens, 10));
    }

    if (storedModel) {
      setCurrentModel(storedModel);
    }

    // Load API key from database if authenticated
    if (isAuthenticated) {
      loadApiKeyFromDatabase();
    } else {
      // Check localStorage for legacy API key and show settings if none
      const legacyApiKey = localStorage.getItem('apiKey');
      if (legacyApiKey) {
        setApiKey(legacyApiKey);
      } else {
        setSettingsOpen(true);
      }
    }
  }, [isAuthenticated]);

  const loadApiKeyFromDatabase = async () => {
    try {
      setIsLoading(true);
      // Try to load the default provider API key (x-ai for Grok)
      const response = await apiKeysAPI.getByProvider('x-ai');
      if (response && response.keyValue) {
        setApiKey(response.keyValue);
      } else {
        // No API key found, open settings
        setSettingsOpen(true);
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
      // Fallback to localStorage for legacy support
      const legacyApiKey = localStorage.getItem('apiKey');
      if (legacyApiKey) {
        setApiKey(legacyApiKey);
      } else {
        setSettingsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiKey = async (provider: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to load API keys.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiKeysAPI.getByProvider(provider);
      if (response && response.keyValue) {
        setApiKey(response.keyValue);
      }
    } catch (error) {
      console.error('Failed to load API key for provider:', provider, error);
      toast({
        title: 'Error',
        description: `Failed to load API key for ${provider}.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveSettings = async (key: string, temp: number, tokens: number, model?: string) => {
    try {
      setIsLoading(true);
      
      // Update local state
      setApiKey(key);
      setModelTemperature(temp);
      setMaxTokens(tokens);
      if (model) {
        setCurrentModel(model);
      }
      
      // Save API key to database if authenticated
      if (isAuthenticated && key) {
        try {
          // Determine provider based on model
          const provider = model?.includes('grok') ? 'x-ai' : 'openai';
          
          // Check if API key already exists for this provider
          const existingKey = await apiKeysAPI.getByProvider(provider);
          
          if (existingKey) {
            // Update existing key
            await apiKeysAPI.update(existingKey.id, {
              keyValue: key,
              name: `${provider} API Key`,
            });
          } else {
            // Create new key
            await apiKeysAPI.create({
              provider,
              keyValue: key,
              name: `${provider} API Key`,
            });
          }
          
          // Remove legacy localStorage API key
          localStorage.removeItem('apiKey');
        } catch (apiError) {
          console.error('Failed to save API key to database:', apiError);
          // Fallback to localStorage for now
          if (key) {
            localStorage.setItem('apiKey', key);
          }
        }
      } else if (key) {
        // Save to localStorage if not authenticated
        localStorage.setItem('apiKey', key);
      }
      
      // Save other settings to localStorage (non-sensitive)
      localStorage.setItem('modelTemperature', temp.toString());
      localStorage.setItem('maxTokens', tokens.toString());
      if (model) {
        localStorage.setItem('currentModel', model);
      }
      
      // Close settings after saving
      setSettingsOpen(false);
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    apiKey,
    modelTemperature,
    maxTokens,
    currentModel,
    settingsOpen,
    isLoading,
    setSettingsOpen,
    
    setApiKey,
    setModelTemperature,
    setMaxTokens,
    setCurrentModel,
    
    handleSaveSettings,
    loadApiKey,
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for using the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};