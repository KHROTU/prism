import axios from "axios";
import { FinalReport, SummarizedContent, AgentStartData, ModelConfig, AgentName } from "./types";

const API_BASE_URL = "http://localhost:8000";
const LLM_API_BASE_URL = "https://text.pollinations.ai";

interface ApiKeys {
  google_api_key: string;
  google_cx_id: string;
}

export async function checkBackendHealth(): Promise<boolean> {
    try {
        await axios.get(`${API_BASE_URL}/health`, { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
}

export async function checkLlmApiHealth(): Promise<boolean> {
    try {
        await axios.get(`${LLM_API_BASE_URL}/models`, { timeout: 3000 });
        return true;
    } catch {
        return false;
    }
}

export async function updateApiKeys(keys: ApiKeys): Promise<{ message: string }> {
    const response = await axios.post(`${API_BASE_URL}/v1/config/keys`, keys);
    return response.data;
}

type StreamEventData = 
    | AgentStartData
    | { queries: string[] }
    | { urls: string[] }
    | SummarizedContent
    | { code: string }
    | { detail: string }
    | { message: string };

export interface StreamEvent {
    event: string;
    data: StreamEventData;
}

interface StreamCallbacks {
    onEvent: (event: StreamEvent) => void;
    onComplete: (report: FinalReport) => void;
    onError: (error: string) => void;
}

export async function startResearchStream(query: string, modelConfigs: Record<AgentName, ModelConfig>, callbacks: StreamCallbacks): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/v1/prism/research/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, model_configs: modelConfigs }),
        });

        if (!response.ok || !response.body) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.substring(6);
                    try {
                        const event = JSON.parse(jsonStr) as StreamEvent;
                        if (event.event === 'complete') {
                            callbacks.onComplete(event.data as unknown as FinalReport);
                        } else if (event.event === 'error') {
                            callbacks.onError((event.data as { detail: string }).detail || 'An unknown server error occurred.');
                        } else {
                            callbacks.onEvent(event);
                        }
                    } catch (e) {
                        console.error("Failed to parse stream event JSON:", jsonStr, e);
                    }
                }
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred.";
        callbacks.onError(errorMessage);
    }
}