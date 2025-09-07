import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ModelConfig, AgentName } from "../lib/types";

interface SettingsState {
  googleApiKey: string;
  googleCxId: string;
  modelConfigs: Record<AgentName, ModelConfig>;
  setGoogleApiKey: (key: string) => void;
  setGoogleCxId: (id: string) => void;
  setModelConfig: (agent: AgentName, config: Partial<ModelConfig>) => void;
}

const initialModelConfigs: Record<AgentName, ModelConfig> = {
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
      setGoogleApiKey: (key) => set({ googleApiKey: key }),
      setGoogleCxId: (id) => set({ googleCxId: id }),
      setModelConfig: (agent, newConfig) =>
        set((state) => ({
          modelConfigs: {
            ...state.modelConfigs,
            [agent]: { ...state.modelConfigs[agent], ...newConfig },
          },
        })),
    }),
    {
      name: "prism-settings-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);