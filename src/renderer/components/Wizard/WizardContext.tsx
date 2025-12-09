import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ToolType, LogEntry } from '../../types';

/**
 * Wizard Steps
 * Defines the sequential screens in the onboarding wizard
 */
export type WizardStep =
  | 'agent-selection'    // Step 1: Choose AI agent (Claude Code, etc.)
  | 'directory-selection' // Step 2: Choose project directory
  | 'conversation'       // Step 3: AI-driven project discovery
  | 'document-generation' // Step 4: Generating phase documents (loading state)
  | 'phase-review'       // Step 5: Review and edit Phase 1 document
  | 'complete';          // Wizard finished

/**
 * Wizard state for a single conversation exchange
 */
export interface WizardConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  confidence?: number;  // For assistant messages: 0-100
  ready?: boolean;      // For assistant messages: whether agent is ready to proceed
}

/**
 * Generated document from the wizard
 */
export interface WizardGeneratedDocument {
  filename: string;      // e.g., 'Phase-01-Setup.md'
  content: string;       // Full markdown content
  taskCount: number;     // Number of tasks (checkboxes) in the document
  filePath?: string;     // Absolute path after saving to disk
}

/**
 * Full wizard state
 */
export interface WizardState {
  // Navigation
  currentStep: WizardStep;
  totalSteps: number;

  // Step 1: Agent Selection
  selectedAgent: ToolType | null;
  agentName: string;  // User-provided project name (optional)

  // Step 2: Directory Selection
  directoryPath: string;
  isGitRepo: boolean;

  // Step 3: Conversation
  conversationHistory: WizardConversationMessage[];
  confidenceLevel: number;  // 0-100, aggregated from conversation
  isReady: boolean;         // Agent indicates ready to proceed

  // Step 4 & 5: Document Generation
  generatedDocuments: WizardGeneratedDocument[];
  isGenerating: boolean;
  generationError: string | null;

  // Step 5: Tour Preference
  wantsTour: boolean | null;  // null = not yet chosen

  // Error handling
  error: string | null;
}

/**
 * Wizard context API
 */
export interface WizardContextAPI {
  // State
  state: WizardState;

  // Navigation
  goToStep: (step: WizardStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  getStepNumber: (step: WizardStep) => number;

  // Step 1: Agent Selection
  setSelectedAgent: (agent: ToolType) => void;
  setAgentName: (name: string) => void;

  // Step 2: Directory Selection
  setDirectoryPath: (path: string) => void;
  setIsGitRepo: (isGit: boolean) => void;

  // Step 3: Conversation
  addConversationMessage: (message: Omit<WizardConversationMessage, 'id' | 'timestamp'>) => void;
  setConfidenceLevel: (level: number) => void;
  setIsReady: (ready: boolean) => void;
  clearConversation: () => void;

  // Step 4 & 5: Document Generation
  setGeneratedDocuments: (docs: WizardGeneratedDocument[]) => void;
  setIsGenerating: (generating: boolean) => void;
  setGenerationError: (error: string | null) => void;

  // Step 5: Tour Preference
  setWantsTour: (wants: boolean) => void;

  // Error handling
  setError: (error: string | null) => void;

  // Reset
  resetWizard: () => void;
}

// Step order for navigation
const STEP_ORDER: WizardStep[] = [
  'agent-selection',
  'directory-selection',
  'conversation',
  'document-generation',
  'phase-review',
  'complete',
];

// Initial state
const initialState: WizardState = {
  currentStep: 'agent-selection',
  totalSteps: 5, // Excludes 'complete' which is not a user-facing step

  selectedAgent: null,
  agentName: '',

  directoryPath: '',
  isGitRepo: false,

  conversationHistory: [],
  confidenceLevel: 0,
  isReady: false,

  generatedDocuments: [],
  isGenerating: false,
  generationError: null,

  wantsTour: null,

  error: null,
};

// Create context
const WizardContext = createContext<WizardContextAPI | null>(null);

interface WizardProviderProps {
  children: ReactNode;
  initialStep?: WizardStep;
}

/**
 * WizardProvider - Provides wizard state management for the onboarding flow
 */
export function WizardProvider({ children, initialStep }: WizardProviderProps) {
  const [state, setState] = useState<WizardState>({
    ...initialState,
    currentStep: initialStep ?? initialState.currentStep,
  });

  // Navigation helpers
  const getStepNumber = useCallback((step: WizardStep): number => {
    const index = STEP_ORDER.indexOf(step);
    // Return 1-based step number, capping at totalSteps
    return Math.min(index + 1, initialState.totalSteps);
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  }, []);

  const goToNextStep = useCallback(() => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1);
      return { ...prev, currentStep: STEP_ORDER[nextIndex], error: null };
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { ...prev, currentStep: STEP_ORDER[prevIndex], error: null };
    });
  }, []);

  // Step 1: Agent Selection
  const setSelectedAgent = useCallback((agent: ToolType) => {
    setState(prev => ({ ...prev, selectedAgent: agent }));
  }, []);

  const setAgentName = useCallback((name: string) => {
    setState(prev => ({ ...prev, agentName: name }));
  }, []);

  // Step 2: Directory Selection
  const setDirectoryPath = useCallback((path: string) => {
    setState(prev => ({ ...prev, directoryPath: path }));
  }, []);

  const setIsGitRepo = useCallback((isGit: boolean) => {
    setState(prev => ({ ...prev, isGitRepo: isGit }));
  }, []);

  // Step 3: Conversation
  const addConversationMessage = useCallback(
    (message: Omit<WizardConversationMessage, 'id' | 'timestamp'>) => {
      const newMessage: WizardConversationMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      setState(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, newMessage],
        // Update confidence and ready status from assistant messages
        ...(message.role === 'assistant' && message.confidence !== undefined
          ? { confidenceLevel: message.confidence }
          : {}),
        ...(message.role === 'assistant' && message.ready !== undefined
          ? { isReady: message.ready }
          : {}),
      }));
    },
    []
  );

  const setConfidenceLevel = useCallback((level: number) => {
    setState(prev => ({ ...prev, confidenceLevel: Math.max(0, Math.min(100, level)) }));
  }, []);

  const setIsReady = useCallback((ready: boolean) => {
    setState(prev => ({ ...prev, isReady: ready }));
  }, []);

  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversationHistory: [],
      confidenceLevel: 0,
      isReady: false,
    }));
  }, []);

  // Step 4 & 5: Document Generation
  const setGeneratedDocuments = useCallback((docs: WizardGeneratedDocument[]) => {
    setState(prev => ({ ...prev, generatedDocuments: docs }));
  }, []);

  const setIsGenerating = useCallback((generating: boolean) => {
    setState(prev => ({ ...prev, isGenerating: generating }));
  }, []);

  const setGenerationError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, generationError: error }));
  }, []);

  // Step 5: Tour Preference
  const setWantsTour = useCallback((wants: boolean) => {
    setState(prev => ({ ...prev, wantsTour: wants }));
  }, []);

  // Error handling
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Reset wizard to initial state
  const resetWizard = useCallback(() => {
    setState(initialState);
  }, []);

  const contextValue: WizardContextAPI = {
    state,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    getStepNumber,
    setSelectedAgent,
    setAgentName,
    setDirectoryPath,
    setIsGitRepo,
    addConversationMessage,
    setConfidenceLevel,
    setIsReady,
    clearConversation,
    setGeneratedDocuments,
    setIsGenerating,
    setGenerationError,
    setWantsTour,
    setError,
    resetWizard,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
}

/**
 * useWizard - Hook to access the wizard context
 *
 * Must be used within a WizardProvider. Throws an error if used outside.
 */
export function useWizard(): WizardContextAPI {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }

  return context;
}
