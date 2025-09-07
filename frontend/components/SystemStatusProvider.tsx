"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { checkBackendHealth, checkLlmApiHealth } from "../lib/api";

const BACKEND_TOAST_ID = "backend-status-toast";
const LLM_TOAST_ID = "llm-status-toast";

export function SystemStatusProvider() {
  const isBackendOffline = useRef(false);
  const isLlmOffline = useRef(false);

  const createCheckService = (
    serviceName: string,
    checkFn: () => Promise<boolean>,
    toastId: string,
    isOfflineRef: React.MutableRefObject<boolean>
  ) => {
    const check = async () => {
      const isOnline = await checkFn();

      if (isOnline) {
        if (isOfflineRef.current) {
          toast.success(`${serviceName} connected.`, {
            id: toastId,
            duration: 3000,
          });
        } else {
          toast.dismiss(toastId);
        }
        isOfflineRef.current = false;
      } else {
        toast.error(`${serviceName} is offline.`, {
          id: toastId,
          duration: Infinity,
          action: (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                toast.loading(`Checking ${serviceName} status...`, { id: toastId, duration: 5000 });
                check();
              }}
            >
              Retry
            </Button>
          ),
        });
        isOfflineRef.current = true;
      }
    };
    return check;
  };

  const checkBackend = createCheckService("Backend server", checkBackendHealth, BACKEND_TOAST_ID, isBackendOffline);
  const checkLlm = createCheckService("LLM API", checkLlmApiHealth, LLM_TOAST_ID, isLlmOffline);

  useEffect(() => {
    const initialCheckTimeout = setTimeout(() => {
      checkBackend();
      checkLlm();
    }, 1500);

    const interval = setInterval(() => {
      checkBackend();
      checkLlm();
    }, 30000);

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}