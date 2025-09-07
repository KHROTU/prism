"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { startResearchStream, StreamEvent } from "../lib/api";
import { FinalReport, HistoryStep, ResearchResponse, CurrentStep, HistoryStepOutput, AgentStartData, SummarizedContent } from "../lib/types";
import { Button } from "./ui/button";
import { ArrowLeft, Clipboard, FileDown, Loader2, ServerCrash } from "lucide-react";
import { useHistoryStore } from "../store/historyStore";
import { useSettingsStore } from "../store/settingsStore";
import { Timeline } from "./research/Timeline";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const loadingMessages: Record<string, string> = {
    'ResearcherAgent': 'Gathering intelligence...',
    'CodeExecutor': 'Running calculations...',
    'LeadSynthesizer': 'Synthesizing final report...',
    'initial': 'Planning research strategy...',
};

function FinalReportDisplay({ reportData }: { reportData: FinalReport }) {
    const [copied, setCopied] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const reportContentRef = useRef<HTMLDivElement>(null);
  
    const handleCopyToClipboard = () => {
      navigator.clipboard.writeText(reportData.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
  
    const handleExportAsPDF = async () => {
      if (!reportContentRef.current) return;
      setIsExporting(true);
      try {
        const canvas = await html2canvas(reportContentRef.current, { scale: 2, backgroundColor: "hsl(240 10% 3.9%)" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save("PRISM-Research-Report.pdf");
      } catch (error) { console.error("Failed to export PDF:", error); } 
      finally { setIsExporting(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
            <Card className="overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/10">
                <div ref={reportContentRef} className="bg-card">
                    <CardHeader>
                        <CardTitle className="text-2xl">Final Research Report</CardTitle>
                        <div className="absolute top-4 right-4 flex gap-2">
                            <Button variant="secondary" size="sm" onClick={handleCopyToClipboard} disabled={isExporting}><Clipboard className="h-3 w-3 mr-2" />{copied ? "Copied!" : "Copy"}</Button>
                            <Button variant="secondary" size="sm" onClick={handleExportAsPDF} disabled={isExporting}>{isExporting ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <FileDown className="h-3 w-3 mr-2" />}Export PDF</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-invert prose-sm md:prose-base max-w-full"><ReactMarkdown remarkPlugins={[remarkGfm]}>{reportData.report}</ReactMarkdown></div>
                        {reportData.image_urls && reportData.image_urls.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Relevant Images</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {reportData.image_urls.map((url, index) => (<Image key={index} src={url} alt={`Relevant visual data ${index + 1}`} width={200} height={200} className="rounded-md object-cover aspect-square"/>))}
                            </div>
                        </div>
                        )}
                    </CardContent>
                </div>
            </Card>
        </motion.div>
    )
}

export function ResearchDisplay() {
  const router = useRouter();
  const params = useParams();
  const researchId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { getResearchById, saveResearch, tempQuery } = useHistoryStore();
  const { modelConfigs } = useSettingsStore();

  const [researchHistory, setResearchHistory] = useState<HistoryStep[]>([]);
  const [currentStep, setCurrentStep] = useState<CurrentStep | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [query, setQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages['initial']);

  const researchHistoryRef = useRef<HistoryStep[]>([]);
  useEffect(() => { researchHistoryRef.current = researchHistory; }, [researchHistory]);

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.event) {
        case 'agent_start': {
            if (currentStep) {
                const finalOutput: HistoryStepOutput = {
                    summaries: currentStep.details.summaries,
                    code: currentStep.details.code,
                };
                const completedStep: HistoryStep = { ...currentStep, output: finalOutput };
                setResearchHistory(prev => [...prev, completedStep]);
            }
            const data = event.data as AgentStartData;
            setCurrentStep({ ...data, details: {} });
            setLoadingMessage(loadingMessages[data.agent] || "Processing...");
            break;
        }
        case 'queries_generated': {
            const data = event.data as { queries: string[] };
            setCurrentStep(prev => prev ? { ...prev, details: { ...prev.details, queries: data.queries } } : null);
            break;
        }
        case 'urls_found': {
            const data = event.data as { urls: string[] };
            setCurrentStep(prev => prev ? { ...prev, details: { ...prev.details, urls: data.urls, summaries: [] } } : null);
            break;
        }
        case 'summary_complete': {
            const data = event.data as SummarizedContent;
            setCurrentStep(prev => prev ? { ...prev, details: { ...prev.details, summaries: [...(prev.details.summaries || []), data] } } : null);
            break;
        }
        case 'code_executing': {
            const data = event.data as { code: string };
            setCurrentStep(prev => prev ? { ...prev, details: { ...prev.details, code: data.code } } : null);
            break;
        }
    }
  }, [currentStep]);

  useEffect(() => {
    if (!researchId) return;
    const existingResearch = getResearchById(researchId);
    if (existingResearch) {
      setResearchHistory(existingResearch.researchData.research_history);
      setFinalReport(existingResearch.researchData.final_report);
      setQuery(existingResearch.query);
      setIsLoading(false);
    } else {
      const newQuery = tempQuery[researchId];
      if (!newQuery) { router.replace("/history"); return; }
      
      setQuery(newQuery);
      setResearchHistory([]);
      setCurrentStep(null);
      setFinalReport(null);
      setError(null);
      setIsLoading(true);

      startResearchStream(newQuery, modelConfigs, {
        onEvent: handleStreamEvent,
        onComplete: (report) => {
            if (currentStep) {
                const finalOutput: HistoryStepOutput = { summaries: currentStep.details.summaries, code: currentStep.details.code };
                const completedStep: HistoryStep = { ...currentStep, output: finalOutput };
                researchHistoryRef.current = [...researchHistoryRef.current, completedStep];
                setResearchHistory(researchHistoryRef.current);
            }
            setCurrentStep(null);
            setFinalReport(report);
            setIsLoading(false);
            const finalData: ResearchResponse = { research_history: researchHistoryRef.current, final_report: report };
            saveResearch(researchId, newQuery, finalData);
        },
        onError: (err) => {
            setError(`Research failed: ${err}. Please check API keys and backend status.`);
            setIsLoading(false);
            setCurrentStep(null);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchId]);
  
  useEffect(() => { document.title = query ? `Research: "${query}"` : "Research in Progress..."; }, [query]);

  return (
    <>
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto flex h-16 items-center justify-between p-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/")}><ArrowLeft className="mr-2 h-4 w-4" /> New Research</Button>
          <p className="text-center font-medium truncate text-muted-foreground hidden sm:block max-w-lg">{query}</p>
          <div></div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="space-y-12">
            <Timeline history={researchHistory} currentStep={currentStep} isLoading={isLoading} loadingMessage={loadingMessage} />
            {error && (
                <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
                    <Card className="bg-destructive/10 border-destructive/30">
                        <CardHeader className="flex-row items-center gap-4"><ServerCrash className="w-8 h-8 text-destructive"/><CardTitle className="text-destructive">A Critical Error Occurred</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-destructive/90">{error}</p>
                            <Button variant="destructive" className="mt-4" onClick={() => router.push("/settings")}>Check Settings</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
            {finalReport && <FinalReportDisplay reportData={finalReport}/>}
        </div>
      </main>
    </>
  );
}