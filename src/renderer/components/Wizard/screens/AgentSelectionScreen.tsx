import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWizard } from '../WizardContext';
import type { Theme, ToolType } from '../../../types';

interface AgentSelectionScreenProps {
  theme: Theme;
}

/**
 * Agent tile data for display
 */
interface AgentTile {
  id: ToolType;
  name: string;
  description: string;
  available: boolean;
  logoColor: string;  // Accent color for the agent
}

const AGENTS: AgentTile[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Anthropic\'s powerful AI coding assistant',
    available: true,
    logoColor: '#da7756',  // Claude's orange/terracotta
  },
  {
    id: 'opencode' as ToolType,
    name: 'OpenAI Codex',
    description: 'Coming soon',
    available: false,
    logoColor: '#10a37f',  // OpenAI green
  },
  {
    id: 'terminal' as ToolType,  // Using terminal as placeholder
    name: 'Gemini CLI',
    description: 'Coming soon',
    available: false,
    logoColor: '#4285f4',  // Google blue
  },
  {
    id: 'aider',
    name: 'Aider',
    description: 'Coming soon',
    available: false,
    logoColor: '#6366f1',  // Indigo
  },
];

/**
 * AgentSelectionScreen - First wizard screen for selecting AI agent
 *
 * Features:
 * - Tiled grid view of agent logos
 * - Claude Code highlighted/selectable, others ghosted out
 * - Optional Name field with placeholder "My Project"
 * - Keyboard navigation (arrow keys, Tab, Enter)
 */
export function AgentSelectionScreen({ theme }: AgentSelectionScreenProps) {
  const { state, setSelectedAgent, setAgentName, goToNextStep } = useWizard();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Auto-select Claude Code if nothing selected
  useEffect(() => {
    if (!state.selectedAgent) {
      setSelectedAgent('claude-code');
    }
  }, [state.selectedAgent, setSelectedAgent]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const availableAgents = AGENTS.filter(a => a.available);
    const numCols = 2;  // 2 columns in the grid

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, AGENTS.length - 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + numCols, AGENTS.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - numCols, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const agent = AGENTS[focusedIndex];
        if (agent && agent.available) {
          setSelectedAgent(agent.id);
          goToNextStep();
        }
        break;
      case 'Tab':
        // Allow Tab to move to name input naturally
        break;
    }
  }, [focusedIndex, setSelectedAgent, goToNextStep]);

  // Handle agent tile click
  const handleAgentClick = (agent: AgentTile) => {
    if (agent.available) {
      setSelectedAgent(agent.id);
    }
  };

  // Handle continue button
  const handleContinue = () => {
    if (state.selectedAgent) {
      goToNextStep();
    }
  };

  return (
    <div
      className="h-full flex flex-col p-6"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: theme.colors.textMain }}
        >
          Welcome to Maestro
        </h1>
        <p
          className="text-sm"
          style={{ color: theme.colors.textSecondary }}
        >
          Let's set up your first AI-powered project. Choose an AI assistant to get started.
        </p>
      </div>

      {/* Agent Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8"
        tabIndex={0}
      >
        {AGENTS.map((agent, index) => {
          const isSelected = state.selectedAgent === agent.id;
          const isFocused = focusedIndex === index;

          return (
            <button
              key={agent.id}
              onClick={() => handleAgentClick(agent)}
              disabled={!agent.available}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200
                ${agent.available ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'}
                ${isFocused ? 'ring-2 ring-offset-2' : ''}
              `}
              style={{
                backgroundColor: isSelected
                  ? theme.colors.bgActivity
                  : theme.colors.bgSidebar,
                borderColor: isSelected
                  ? agent.logoColor
                  : agent.available
                  ? theme.colors.border
                  : theme.colors.border + '40',
                opacity: agent.available ? 1 : 0.4,
                ringColor: theme.colors.accent,
                ringOffsetColor: theme.colors.bgMain,
              }}
            >
              {/* Agent Logo Placeholder */}
              <div
                className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                style={{
                  backgroundColor: agent.logoColor + '20',
                  color: agent.logoColor,
                }}
              >
                {agent.name.charAt(0)}
              </div>

              {/* Agent Name */}
              <h3
                className="font-semibold mb-1"
                style={{
                  color: agent.available
                    ? theme.colors.textMain
                    : theme.colors.textDim,
                }}
              >
                {agent.name}
              </h3>

              {/* Description */}
              <p
                className="text-xs"
                style={{ color: theme.colors.textDim }}
              >
                {agent.description}
              </p>

              {/* Selected checkmark */}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: agent.logoColor }}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Project Name Input */}
      <div className="max-w-md mx-auto w-full mb-8">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: theme.colors.textSecondary }}
        >
          Project Name (optional)
        </label>
        <input
          ref={nameInputRef}
          type="text"
          value={state.agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="My Project"
          className="w-full px-4 py-3 rounded-lg border outline-none transition-colors"
          style={{
            backgroundColor: theme.colors.bgSidebar,
            borderColor: theme.colors.border,
            color: theme.colors.textMain,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleContinue();
            }
          }}
        />
        <p
          className="mt-1 text-xs"
          style={{ color: theme.colors.textDim }}
        >
          Give your project a memorable name, or leave blank to name it later.
        </p>
      </div>

      {/* Continue Button */}
      <div className="mt-auto flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!state.selectedAgent}
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
        Use arrow keys to navigate • Enter to continue • Tab to jump to name field
      </div>
    </div>
  );
}

export default AgentSelectionScreen;
