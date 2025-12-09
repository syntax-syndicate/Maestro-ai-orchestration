import React, { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Theme } from '../../types';
import type { WizardStep } from './WizardContext';
import { useWizard } from './WizardContext';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  currentStep: WizardStep;
  stepNumber?: number;  // Override the auto-calculated step number
  totalSteps: number;
  children: ReactNode;
}

/**
 * Step indicator mapping for display
 */
const STEP_LABELS: Record<WizardStep, string> = {
  'agent-selection': 'Select Agent',
  'directory-selection': 'Choose Directory',
  'conversation': 'Project Discovery',
  'document-generation': 'Creating Plan',
  'phase-review': 'Review & Launch',
  'complete': 'Complete',
};

/**
 * WizardModal - Base modal component for wizard screens
 *
 * Provides consistent sizing (matching PromptComposer), step indicator,
 * fade animations between screens, and keyboard navigation support.
 */
export function WizardModal({
  isOpen,
  onClose,
  theme,
  currentStep,
  stepNumber,
  totalSteps,
  children,
}: WizardModalProps) {
  const { getStepNumber } = useWizard();
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate display step number
  const displayStepNumber = stepNumber ?? getStepNumber(currentStep);
  const stepLabel = STEP_LABELS[currentStep] || '';

  // Focus trap management
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Focus the content area on open
      contentRef.current.focus();
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center wizard-modal-backdrop"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        // Close on backdrop click, but only if on step 1
        if (e.target === e.currentTarget && currentStep === 'agent-selection') {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className="w-[90vw] h-[85vh] max-w-5xl rounded-xl border shadow-2xl flex flex-col overflow-hidden outline-none wizard-modal-content"
        style={{
          backgroundColor: theme.colors.bgMain,
          borderColor: theme.colors.border,
        }}
      >
        {/* Header with step indicator */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.bgSidebar,
          }}
        >
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: theme.colors.accent }}
              >
                Step {displayStepNumber} of {totalSteps}
              </span>
              <span
                className="text-xs"
                style={{ color: theme.colors.textDim }}
              >
                {stepLabel}
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 ml-2">
              {Array.from({ length: totalSteps }, (_, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === displayStepNumber;
                const isCompleted = stepNum < displayStepNumber;

                return (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: isActive
                        ? theme.colors.accent
                        : isCompleted
                        ? theme.colors.accent + '80'
                        : theme.colors.border,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Close (Escape)"
          >
            <X className="w-5 h-5" style={{ color: theme.colors.textDim }} />
          </button>
        </div>

        {/* Content area with fade animation */}
        <div
          className="flex-1 overflow-hidden wizard-screen-transition"
          key={currentStep} // Re-mount for animation
        >
          {children}
        </div>
      </div>

      {/* CSS for fade animations */}
      <style>{`
        .wizard-modal-backdrop {
          animation: wizardBackdropFadeIn 0.2s ease-out;
        }

        .wizard-modal-content {
          animation: wizardModalSlideIn 0.3s ease-out;
        }

        .wizard-screen-transition {
          animation: wizardScreenFadeIn 0.25s ease-out;
        }

        @keyframes wizardBackdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes wizardModalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes wizardScreenFadeIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default WizardModal;
