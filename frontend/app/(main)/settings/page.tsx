"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "../../../store/settingsStore";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { updateApiKeys } from "../../../lib/api";
import { motion } from "framer-motion";
import { AgentModelName, ClarificationMode } from "../../../lib/types";

const agentDisplayNames: Record<AgentModelName, { name: string, description: string }> = {
  "prism-reasoning-core": { name: "Orchestrator & Synthesizer", description: "High-level reasoning, planning, and final report generation." },
  "prism-researcher-default": { name: "Researcher (Query Generation)", description: "Generates search queries based on the research task." },
  "prism-summarizer-large-context": { name: "Researcher (Summarization)", description: "Reads and summarizes web pages. Needs a large context window." },
  "prism-coder-agent": { name: "Code Executor", description: "Generates Python code for calculations. Use a code-specialized model." },
};

const providers = [
  { value: "default", label: "Default" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai_compatible", label: "Custom (OpenAI-Compatible)" },
];

const providerDetails: Record<string, { defaultModel: string, baseUrl?: string }> = {
    openai: { defaultModel: "gpt-4-turbo" },
    anthropic: { defaultModel: "claude-3-sonnet-20240229" },
    google: { defaultModel: "gemini-1.5-pro-latest" },
    openrouter: { defaultModel: "openrouter/auto" },
    openai_compatible: { defaultModel: "" }
};

function AgentModelConfig({ agentName }: { agentName: AgentModelName }) {
  const { modelConfigs, setModelConfig } = useSettingsStore();
  const config = modelConfigs[agentName];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    const details = providerDetails[newProvider];
    setModelConfig(agentName, {
      provider: newProvider,
      model: details?.defaultModel ?? "",
      baseUrl: details?.baseUrl,
      apiKey: newProvider === 'default' ? "" : config.apiKey,
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-background/50">
      <h4 className="font-semibold">{agentDisplayNames[agentName].name}</h4>
      <p className="text-sm text-muted-foreground mb-4">{agentDisplayNames[agentName].description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>LLM Provider</Label>
          <select
            value={config.provider}
            onChange={handleProviderChange}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
          >
            {providers.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {config.provider !== 'default' && (
          <>
            <div className="space-y-2">
              <Label>Model Name</Label>
              <Input
                placeholder="e.g., gpt-4-turbo"
                value={config.model}
                onChange={(e) => setModelConfig(agentName, { model: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={config.apiKey}
                onChange={(e) => setModelConfig(agentName, { apiKey: e.target.value })}
              />
            </div>
            {config.provider === 'openai_compatible' && (
              <div className="space-y-2 md:col-span-2">
                <Label>API Base URL</Label>
                <Input
                  placeholder="e.g., https://api.groq.com/openai/v1"
                  value={config.baseUrl}
                  onChange={(e) => setModelConfig(agentName, { baseUrl: e.target.value })}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { googleApiKey, googleCxId, setGoogleApiKey, setGoogleCxId, clarificationMode, setClarificationMode } = useSettingsStore();
  const [apiKey, setApiKey] = useState(googleApiKey);
  const [cxId, setCxId] = useState(googleCxId);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  useEffect(() => {
    document.title = "Settings | PRISM";
    setApiKey(googleApiKey);
    setCxId(googleCxId);
  }, [googleApiKey, googleCxId]);

  const handleSave = async () => {
    setMessage(null);
    try {
      await updateApiKeys({ google_api_key: apiKey, google_cx_id: cxId });
      setGoogleApiKey(apiKey);
      setGoogleCxId(cxId);
      setMessage({ type: 'success', text: 'API keys saved successfully for this session.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save API keys. Ensure the backend server is running.' });
    }
  };

  const FADE_IN = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
       <motion.div 
        className="space-y-8"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.h1 variants={FADE_IN} className="text-4xl font-bold tracking-tight">Settings</motion.h1>
        
        <motion.div variants={FADE_IN}>
          <Card>
            <CardHeader>
                <CardTitle>Google Search API Keys</CardTitle>
                <CardDescription>Required for the Researcher Agent to search the web. Stored in your browser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Google API Key</Label>
                  <Input id="api-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your Google API Key" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cx-id">Programmable Search Engine ID (CX ID)</Label>
                  <Input id="cx-id" type="password" value={cxId} onChange={(e) => setCxId(e.target.value)} placeholder="Enter your CX ID" />
                </div>
                <Button onClick={handleSave}>Save Session Keys</Button>
                {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-destructive'}`}>{message.text}</p>}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={FADE_IN}>
          <Card>
            <CardHeader>
              <CardTitle>Research Strategy</CardTitle>
              <CardDescription>Configure how PRISM handles ambiguous user queries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Clarification Mode</Label>
                <select
                  value={clarificationMode}
                  onChange={(e) => setClarificationMode(e.target.value as ClarificationMode)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
                >
                  <option value="agent">Let Agent Decide</option>
                  <option value="always_ask">Always Ask for Clarification</option>
                  <option value="never_ask">Never Ask (Make Assumptions)</option>
                </select>
                <p className="text-xs text-muted-foreground pt-1">
                  {clarificationMode === 'agent' && 'The AI will decide whether to ask a clarifying question or make a reasonable assumption.'}
                  {clarificationMode === 'always_ask' && 'The AI will always stop and ask for more details if your query is ambiguous.'}
                  {clarificationMode === 'never_ask' && 'The AI will never ask for clarification and will instead make its best assumption to proceed.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={FADE_IN}>
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>
                Configure the large language models used by each agent. Select &apos;Default&apos; to use the free, built-in provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {(Object.keys(agentDisplayNames) as AgentModelName[]).map(agentName => (
                  <AgentModelConfig key={agentName} agentName={agentName} />
                ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}