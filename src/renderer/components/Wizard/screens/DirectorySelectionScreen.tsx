import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Folder, GitBranch, ArrowLeft, Search } from 'lucide-react';
import { useWizard } from '../WizardContext';
import type { Theme } from '../../../types';

interface DirectorySelectionScreenProps {
  theme: Theme;
}

/**
 * DirectorySelectionScreen - Second wizard screen for choosing project directory
 *
 * Features:
 * - Directory path input field
 * - Browse button for native folder picker
 * - Auto-detection of agent path
 * - Display of whether selected path is a Git repo
 * - Keyboard support (Tab, Enter, Escape)
 */
export function DirectorySelectionScreen({ theme }: DirectorySelectionScreenProps) {
  const { state, setDirectoryPath, setIsGitRepo, goToNextStep, goToPreviousStep } = useWizard();
  const [isChecking, setIsChecking] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Check if path is a git repo when directory changes
  useEffect(() => {
    const checkGitRepo = async () => {
      if (!state.directoryPath) {
        setIsGitRepo(false);
        setPathError(null);
        return;
      }

      setIsChecking(true);
      setPathError(null);

      try {
        // Check if it's a valid directory and git repo
        const isGit = await window.maestro.git.isRepo(state.directoryPath);
        setIsGitRepo(isGit);
      } catch (error) {
        setIsGitRepo(false);
        setPathError('Invalid directory path');
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce the check
    const timer = setTimeout(checkGitRepo, 300);
    return () => clearTimeout(timer);
  }, [state.directoryPath, setIsGitRepo]);

  // Handle browse button click
  const handleBrowse = async () => {
    try {
      const result = await window.maestro.dialog.selectFolder();
      if (result) {
        setDirectoryPath(result);
      }
    } catch (error) {
      console.error('Failed to open folder picker:', error);
    }
  };

  // Handle continue button
  const handleContinue = () => {
    if (state.directoryPath && !pathError) {
      goToNextStep();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && state.directoryPath && !pathError) {
      e.preventDefault();
      handleContinue();
    }
  }, [state.directoryPath, pathError]);

  return (
    <div
      className="h-full flex flex-col p-6"
      onKeyDown={handleKeyDown}
    >
      {/* Back button */}
      <button
        onClick={goToPreviousStep}
        className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity self-start"
        style={{ color: theme.colors.textSecondary }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: theme.colors.textMain }}
        >
          Choose Your Project Directory
        </h1>
        <p
          className="text-sm"
          style={{ color: theme.colors.textSecondary }}
        >
          Select the folder where your project lives. This is where the AI will work.
        </p>
      </div>

      {/* Directory Selection */}
      <div className="max-w-2xl mx-auto w-full flex-1">
        {/* Path Input */}
        <div className="mb-6">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            Project Directory
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Folder
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: theme.colors.textDim }}
              />
              <input
                ref={inputRef}
                type="text"
                value={state.directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
                placeholder="/path/to/your/project"
                className="w-full pl-11 pr-4 py-3 rounded-lg border outline-none transition-colors"
                style={{
                  backgroundColor: theme.colors.bgSidebar,
                  borderColor: pathError
                    ? theme.colors.error || '#ef4444'
                    : theme.colors.border,
                  color: theme.colors.textMain,
                }}
              />
              {isChecking && (
                <div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <div
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: theme.colors.accent }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleBrowse}
              className="px-4 py-3 rounded-lg border transition-colors hover:bg-white/5"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.textMain,
              }}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          {pathError && (
            <p
              className="mt-2 text-sm"
              style={{ color: theme.colors.error || '#ef4444' }}
            >
              {pathError}
            </p>
          )}
        </div>

        {/* Git Status */}
        {state.directoryPath && !pathError && !isChecking && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg mb-6"
            style={{
              backgroundColor: state.isGitRepo
                ? theme.colors.accent + '15'
                : theme.colors.bgSidebar,
              borderColor: state.isGitRepo
                ? theme.colors.accent + '40'
                : theme.colors.border,
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            <GitBranch
              className="w-5 h-5"
              style={{
                color: state.isGitRepo
                  ? theme.colors.accent
                  : theme.colors.textDim,
              }}
            />
            <div>
              <p
                className="text-sm font-medium"
                style={{
                  color: state.isGitRepo
                    ? theme.colors.textMain
                    : theme.colors.textSecondary,
                }}
              >
                {state.isGitRepo
                  ? 'Git repository detected'
                  : 'Not a Git repository'}
              </p>
              <p
                className="text-xs"
                style={{ color: theme.colors.textDim }}
              >
                {state.isGitRepo
                  ? 'Great! Version control is set up for this project.'
                  : 'Consider initializing Git for better file tracking.'}
              </p>
            </div>
          </div>
        )}

        {/* Project Preview */}
        {state.directoryPath && !pathError && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: theme.colors.bgSidebar,
              borderColor: theme.colors.border,
            }}
          >
            <h3
              className="text-sm font-medium mb-2"
              style={{ color: theme.colors.textSecondary }}
            >
              Project Preview
            </h3>
            <div className="flex items-center gap-3">
              <Folder
                className="w-10 h-10"
                style={{ color: theme.colors.accent }}
              />
              <div>
                <p
                  className="font-medium"
                  style={{ color: theme.colors.textMain }}
                >
                  {state.agentName || state.directoryPath.split('/').pop() || 'Project'}
                </p>
                <p
                  className="text-xs font-mono"
                  style={{ color: theme.colors.textDim }}
                >
                  {state.directoryPath}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="mt-auto flex justify-center pt-6">
        <button
          onClick={handleContinue}
          disabled={!state.directoryPath || !!pathError || isChecking}
          className="px-8 py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: theme.colors.accent,
            color: theme.colors.accentForeground,
          }}
        >
          Continue
        </button>
      </div>

      {/* Keyboard hints */}
      <div
        className="mt-4 text-center text-xs"
        style={{ color: theme.colors.textDim }}
      >
        Press Enter to continue • Escape to go back
      </div>
    </div>
  );
}

export default DirectorySelectionScreen;
