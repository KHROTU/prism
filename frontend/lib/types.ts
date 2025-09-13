export interface ResearchResponse {
    final_report: FinalReport;
    research_history: HistoryStep[];
}

export interface ArchivedResearch {
    id: string;
    query: string;
    timestamp: string;
    researchData: ResearchResponse;
}

export interface SummarizedContent {
    url: string;
    title: string;
    summary: string;
    relevance_score: number;
}

export interface FinalReport {
    report: string;
    image_urls: string[];
}

export interface HistoryStepOutput {
    summaries?: SummarizedContent[];
    code?: string;
    result?: string;
}

export type AgentType = 
    | "ResearcherAgent"
    | "LeadSynthesizer"
    | "CodeExecutor"
    | "UserClarificationAgent";

export interface HistoryStep {
    uniqueId: string;
    task_id: number;
    agent: AgentType;
    prompt: string;
    output: HistoryStepOutput;
}

export interface AgentStartData {
    task_id: number;
    agent: AgentType;
    prompt: string;
}

export interface CurrentStep extends AgentStartData {
    uniqueId: string;
    details: {
        queries?: string[];
        urls?: string[];
        summaries?: SummarizedContent[];
        code?: string;
    }
}

export interface ModelConfig {
    provider: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
}

export type AgentModelName = 
    | "prism-reasoning-core"
    | "prism-researcher-default"
    | "prism-summarizer-large-context"
    | "prism-coder-agent";

export type ClarificationMode = "agent" | "always_ask" | "never_ask";