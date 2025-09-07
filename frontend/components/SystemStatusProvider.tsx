"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { checkBackendHealth, checkLlmApiHealth } from "../lib/api";
import { useStatusStore } from "../store/statusStore";

export function SystemStatusProvider() {
  const { setBackendStatus, setLlmStatus } = useStatusStore();
  const wasBackendOffline = useRef(false);
  const wasLlmOffline = useRef(false);

  useEffect(() => {
    const createCheckService = (
      serviceName: string,
      checkFn: () => Promise<{ isOnline: boolean; latency: number | null }>,
      setStatus: (isOnline: boolean, latency: number | null) => void,
      wasOfflineRef: React.MutableRefObject<boolean>
    ) => {
      return async () => {
        const { isOnline, latency } = await checkFn();
        setStatus(isOnline, latency);

        if (isOnline) {
          if (wasOfflineRef.current) {
            toast.success(`${serviceName} reconnected.`, { id: serviceName, duration: 3000 });
          }
          wasOfflineRef.current = false;
        } else {
          if (!wasOfflineRef.current) {
            toast.error(`${serviceName} is offline.`, {
              id: serviceName,
              duration: Infinity,
              action: <Button variant="secondary" size="sm" onClick={() => toast.dismiss(serviceName)}>Dismiss</Button>,
            });
          }
          wasOfflineRef.current = true;
        }
      };
    };

    const checkBackend = createCheckService("Backend server", checkBackendHealth, setBackendStatus, wasBackendOffline);
    const checkLlm = createCheckService("Default LLM API", checkLlmApiHealth, setLlmStatus, wasLlmOffline);

    const initialCheck = () => {
      checkBackend();
      checkLlm();
    };

    const initialTimeout = setTimeout(initialCheck, 1500);
    const interval = setInterval(initialCheck, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [setBackendStatus, setLlmStatus]);

  return null;
}