"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type DialogType = "create" | "rename" | "delete" | null;

export interface Project {
  id: string;
  name: string;
}

interface DialogPayload {
  projectId?: string;
  projectName?: string;
}

interface ProjectDialogsContextType {
  activeDialog: DialogType;
  dialogPayload: DialogPayload | null;
  openDialog: (type: DialogType, payload?: DialogPayload) => void;
  closeDialog: () => void;
  myProjects: Project[];
  addProject: (name: string) => void;
  renameProject: (id: string, newName: string) => void;
  deleteProject: (id: string) => void;
}

const ProjectDialogsContext = createContext<ProjectDialogsContextType | undefined>(undefined);

const INITIAL_MOCK_PROJECTS: Project[] = [
  { id: "1", name: "E-Commerce App Architecture" },
  { id: "2", name: "Authentication Flow Diagram" },
  { id: "3", name: "Microservices Network" },
];

export function ProjectDialogsProvider({ children }: { children: ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [dialogPayload, setDialogPayload] = useState<DialogPayload | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>(INITIAL_MOCK_PROJECTS);

  const openDialog = (type: DialogType, payload?: DialogPayload) => {
    setActiveDialog(type);
    setDialogPayload(payload || null);
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setDialogPayload(null);
  };

  const addProject = (name: string) => {
    const newProject = { id: Math.random().toString(36).substring(7), name };
    setMyProjects((prev) => [...prev, newProject]);
  };

  const renameProject = (id: string, newName: string) => {
    setMyProjects((prev) => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const deleteProject = (id: string) => {
    setMyProjects((prev) => prev.filter(p => p.id !== id));
  };

  return (
    <ProjectDialogsContext.Provider
      value={{ 
        activeDialog, dialogPayload, openDialog, closeDialog,
        myProjects, addProject, renameProject, deleteProject
      }}
    >
      {children}
    </ProjectDialogsContext.Provider>
  );
}

export function useProjectDialogs() {
  const context = useContext(ProjectDialogsContext);
  if (!context) {
    throw new Error("useProjectDialogs must be used within a ProjectDialogsProvider");
  }
  return context;
}
