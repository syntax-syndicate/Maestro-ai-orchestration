import React, { useEffect, useRef, useCallback } from 'react';
import { WizardProvider, useWizard, WizardStep } from './WizardContext';
import { WizardModal } from './WizardModal';
import { AgentSelectionScreen } from './screens/AgentSelectionScreen';
import { DirectorySelectionScreen } from './screens/DirectorySelectionScreen';
import { useLayerStack } from '../../contexts/LayerStackContext';
import { MODAL_PRIORITIES } from '../../constants/modalPriorities';
import type { Theme } from '../../types';

interface MaestroWizardProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onComplete?: (result: WizardResult) => void;
}

/**
 * Result returned when wizard completes successfully
 */
export interface WizardResult {
  selectedAgent: string;
  agentName: string;
  directoryPath: string;
  isGitRepo: boolean;
  generatedDocuments: Array<{
    filename: string;
    filePath: string;
    taskCount: number;
  }>;
  wantsTour: boolean;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * WizardContent - Internal component that uses the wizard context
 */
function WizardContent({
  isOpen,
  onClose,
  theme,
  onComplete,
}: MaestroWizardProps) {
  const { state, goToStep } = useWizard();
  const { registerLayer, unregisterLayer } = useLayerStack();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Register with layer stack for Escape key handling
  useEffect(() => {
    if (isOpen) {
      const layerId = registerLayer({
        type: 'modal',
        priority: MODAL_PRIORITIES.WIZARD,
        onEscape: async () => {
          // If past step 1, show confirmation before closing
          if (state.currentStep !== 'agent-selection') {
            // For now, just close - confirmation will be added later
            onCloseRef.current();
            return true;
          }
          onCloseRef.current();
          return true;
        },
      });
      return () => unregisterLayer(layerId);
    }
  }, [isOpen, state.currentStep, registerLayer, unregisterLayer]);

  // Handle wizard completion
  useEffect(() => {
    if (state.currentStep === 'complete' && onComplete) {
      const result: WizardResult = {
        selectedAgent: state.selectedAgent ?? 'claude-code',
        agentName: state.agentName,
        directoryPath: state.directoryPath,
        isGitRepo: state.isGitRepo,
        generatedDocuments: state.generatedDocuments.map(doc => ({
          filename: doc.filename,
          filePath: doc.filePath ?? '',
          taskCount: doc.taskCount,
        })),
        wantsTour: state.wantsTour ?? false,
        conversationHistory: state.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      };
      onComplete(result);
    }
  }, [state.currentStep, state, onComplete]);

  // Render the appropriate screen based on current step
  const renderScreen = useCallback(() => {
    switch (state.currentStep) {
      case 'agent-selection':
        return <AgentSelectionScreen theme={theme} />;
      case 'directory-selection':
        return <DirectorySelectionScreen theme={theme} />;
      case 'conversation':
        // Placeholder for Phase 02
        return (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: theme.colors.textSecondary }}>
              Conversation Screen (Coming in Phase 02)
            </p>
          </div>
        );
      case 'document-generation':
        // Placeholder for Phase 03
        return (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: theme.colors.textSecondary }}>
              Document Generation (Coming in Phase 03)
            </p>
          </div>
        );
      case 'phase-review':
        // Placeholder for Phase 04
        return (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: theme.colors.textSecondary }}>
              Phase Review (Coming in Phase 04)
            </p>
          </div>
        );
      case 'complete':
        return null;
      default:
        return null;
    }
  }, [state.currentStep, theme]);

  if (!isOpen) return null;

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      currentStep={state.currentStep}
      stepNumber={state.currentStep === 'complete' ? state.totalSteps : undefined}
      totalSteps={state.totalSteps}
    >
      {renderScreen()}
    </WizardModal>
  );
}

/**
 * MaestroWizard - Main orchestrator component for the onboarding wizard
 *
 * Wraps the wizard content in a provider and handles the overall lifecycle.
 * Renders the appropriate screen based on current step and manages
 * transitions between screens.
 */
export function MaestroWizard(props: MaestroWizardProps) {
  if (!props.isOpen) return null;

  return (
    <WizardProvider>
      <WizardContent {...props} />
    </WizardProvider>
  );
}

export default MaestroWizard;
