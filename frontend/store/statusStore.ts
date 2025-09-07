import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Status = "online" | "degraded" | "offline";

interface ApiStatus {
  status: Status;
  latency: number | null;
}

interface StatusState {
  backend: ApiStatus;
  llm: ApiStatus;
  googleApiUsage: number;
  setBackendStatus: (isOnline: boolean, latency: number | null) => void;
  setLlmStatus: (isOnline: boolean, latency: number | null) => void;
  setGoogleApiUsage: (count: number) => void;
  incrementGoogleApiUsage: (count: number) => void;
  resetGoogleApiUsage: () => void;
}

const getStatus = (isOnline: boolean, latency: number | null): Status => {
  if (!isOnline) return "offline";
  if (latency === null || latency > 1500) return "degraded";
  return "online";
};

export const useStatusStore = create<StatusState>()(
  persist(
    (set) => ({
      backend: { status: "online", latency: null },
      llm: { status: "online", latency: null },
      googleApiUsage: 0,
      setBackendStatus: (isOnline, latency) =>
        set({
          backend: {
            status: getStatus(isOnline, latency),
            latency: latency,
          },
        }),
      setLlmStatus: (isOnline, latency) =>
        set({
          llm: {
            status: getStatus(isOnline, latency),
            latency: latency,
          },
        }),
      setGoogleApiUsage: (count) => set({ googleApiUsage: count }),
      incrementGoogleApiUsage: (count) =>
        set((state) => ({ googleApiUsage: state.googleApiUsage + count })),
      resetGoogleApiUsage: () => set({ googleApiUsage: 0 }),
    }),
    {
      name: "prism-system-status",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);