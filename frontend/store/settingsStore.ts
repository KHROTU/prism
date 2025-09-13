import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ModelConfig, AgentModelName, ClarificationMode } from "../lib/types";

interface SettingsState {
  googleApiKey: string;
  googleCxId: string;
  modelConfigs: Record<AgentModelName, ModelConfig>;
  clarificationMode: ClarificationMode;
  setGoogleApiKey: (key: string) => void;
  setGoogleCxId: (id: string) => void;
  setModelConfig: (agent: AgentModelName, config: Partial<ModelConfig>) => void;
  setClarificationMode: (mode: ClarificationMode) => void;
}

const initialModelConfigs: Record<AgentModelName, ModelConfig> = {
  "prism-reasoning-core": { provider: "default" },
  "prism-researcher-default": { provider: "default" },
  "prism-summarizer-large-context": { provider: "default" },
  "prism-coder-agent": { provider: "default" },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      googleApiKey: "",
      googleCxId: "",
      modelConfigs: initialModelConfigs,
      clarificationMode: "agent",
      setGoogleApiKey: (key) => set({ googleApiKey: key }),
      setGoogleCxId: (id) => set({ googleCxId: id }),
      setModelConfig: (agent, newConfig) =>
        set((state) => ({
          modelConfigs: {
            ...state.modelConfigs,
            [agent]: { ...state.modelConfigs[agent], ...newConfig },
          },
        })),
      setClarificationMode: (mode) => set({ clarificationMode: mode }),
    }),
    {
      name: "prism-settings-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);