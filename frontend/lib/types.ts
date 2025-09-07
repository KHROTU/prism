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

export interface HistoryStep {
    task_id: number;
    agent: string;
    prompt: string;
    output: HistoryStepOutput;
}

export interface AgentStartData {
    task_id: number;
    agent: string;
    prompt: string;
}

export interface CurrentStep extends AgentStartData {
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

export type AgentName = 
    | "prism-reasoning-core"
    | "prism-researcher-default"
    | "prism-summarizer-large-context"
    | "prism-coder-agent";