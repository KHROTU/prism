import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ArchivedResearch, ResearchResponse } from "../lib/types";

interface HistoryState {
  history: ArchivedResearch[];
  tempQuery: Record<string, string>;
  getResearchById: (id: string) => ArchivedResearch | undefined;
  startNewResearch: (id: string, query: string) => void;
  saveResearch: (id: string, query: string, data: ResearchResponse) => void;
  deleteResearch: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      tempQuery: {},
      
      getResearchById: (id: string) => {
        return get().history.find((item) => item.id === id);
      },

      startNewResearch: (id: string, query: string) => {
        set((state) => ({
          tempQuery: { ...state.tempQuery, [id]: query },
        }));
      },

      saveResearch: (id: string, query: string, data: ResearchResponse) => {
        const newResearch: ArchivedResearch = {
          id,
          query,
          timestamp: new Date().toISOString(),
          researchData: data,
        };
        set((state) => ({
          history: [...state.history, newResearch],
          tempQuery: Object.fromEntries(Object.entries(state.tempQuery).filter(([key]) => key !== id)),
        }));
      },
      
      deleteResearch: (id: string) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: "prism-research-history",
      storage: createJSONStorage(() => localStorage),
    }
  )
);