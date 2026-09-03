/**
 * store.js
 * Central reactive application state object and initial session storage loader.
 */

import { FREE_MODELS, PERSONA_PRESETS } from '../config/constants.js';

export function loadInitialSessions() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  const savedInvestigations = localStorage.getItem('atlas_investigations') || localStorage.getItem('omni_sessions') || '[]';
  try {
    const rawParsed = JSON.parse(savedInvestigations);
    if (Array.isArray(rawParsed)) {
      return rawParsed.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);
    }
  } catch (e) {
    return [];
  }
  return [];
}

export const state = {
  theme: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_theme')) || 'vylex',
  currentModel: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_model')) || 'openrouter/free',
  models: FREE_MODELS,
  apiKey: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_openrouter_api_key')) || '',
  activeMode: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_mode')) || 'auto',
  accountName: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_account_name')) || 'Your Name',
  systemPrompt: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_sys_prompt')) || PERSONA_PRESETS.auto,
  activePreset: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_preset')) || 'auto',
  temperature: parseFloat((typeof window !== 'undefined' && window.localStorage?.getItem('omni_temp')) || '0.7'),
  defaultVoiceName: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_default_voice')) || '',
  isDeepReasoning: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_deep_reasoning')) === 'true',
  isWebSearch: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_web_search')) === 'true',
  sessions: loadInitialSessions(),
  activeSessionId: null,
  isGenerating: false,
  abortController: null,
  activeArtifact: null,
  lastUserPrompt: '',
  isReadingResponse: false,
  activeSpeechButton: null,
  projectFiles: []
};
