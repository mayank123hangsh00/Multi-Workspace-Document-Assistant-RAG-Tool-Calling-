'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Workspace } from '../types';
import { api } from '../api';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (ws: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  activeWorkspace: null,
  loading: true,
  setActiveWorkspace: () => {},
  refreshWorkspaces: async () => {},
  createWorkspace: async () => ({} as Workspace),
  deleteWorkspace: async () => {},
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await api.listWorkspaces();
      setWorkspaces(list);

      // Keep active workspace if valid, else pick first, or null
      if (list.length > 0) {
        setActiveWorkspace((prev) => {
          if (prev && list.some((w) => w.id === prev.id)) {
            return list.find((w) => w.id === prev.id) || list[0];
          }
          return list[0];
        });
      } else {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const handleCreateWorkspace = async (name: string): Promise<Workspace> => {
    const created = await api.createWorkspace(name);
    await refreshWorkspaces();
    setActiveWorkspace(created);
    return created;
  };

  const handleDeleteWorkspace = async (id: string): Promise<void> => {
    await api.deleteWorkspace(id);
    await refreshWorkspaces();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        loading,
        setActiveWorkspace,
        refreshWorkspaces,
        createWorkspace: handleCreateWorkspace,
        deleteWorkspace: handleDeleteWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
