import { HistoryStepOutput, SummarizedContent } from "../../lib/types";
import { Separator } from "../ui/separator";
import { CheckCircle, Loader2 } from "lucide-react";

interface NodeContentProps {
  output: HistoryStepOutput;
  details: {
    queries?: string[];
    urls?: string[];
    summaries?: SummarizedContent[];
    code?: string;
  };
}

const DetailItem = ({ children }: { children: React.ReactNode }) => (
    <div className="p-3 bg-secondary/50 rounded-md border border-border/60">{children}</div>
);

export function NodeContent({ output, details }: NodeContentProps) {
  const hasDetails = details && Object.values(details).some(val => val !== undefined && val !== null && (Array.isArray(val) ? val.length !== 0 : true));
  const hasOutput = output && Object.values(output).some(val => val !== undefined && val !== null && (Array.isArray(val) ? val.length !== 0 : true));

  if (!hasDetails && !hasOutput) return null;

  return (
    <div className="space-y-3 pt-3 border-t border-border/60">
        {details.queries && (
          <DetailItem>
            <h4 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Generated Queries</h4>
            <ul className="space-y-1">
              {details.queries.map((q, i) => <li key={i} className="text-sm font-mono text-foreground/80 truncate">- {q}</li>)}
            </ul>
          </DetailItem>
        )}

        {details.urls && (
            <DetailItem>
                <h4 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Found {details.urls.length} URLs to analyze</h4>
                {details.summaries && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500"/>
                        <span>{details.summaries.length} / {details.urls.length} Summarized</span>
                    </div>
                )}
            </DetailItem>
        )}
        
        {details.summaries && details.summaries.length > 0 && (
          <DetailItem>
            <h4 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Completed Summaries</h4>
            <div className="space-y-2">
                {details.summaries.map((s) => (
                    <div key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">{s.title}</a>
                        <p className="text-sm text-foreground/90 mt-1">{s.summary}</p>
                    </div>
                ))}
            </div>
          </DetailItem>
        )}

        {output.summaries && output.summaries.length > 0 && (
          <DetailItem>
            <h4 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Analyzed {output.summaries.length} sources</h4>
            <div className="space-y-3">
              {output.summaries.map((s, i) => (
                <div key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-primary hover:underline">{s.title}</a>
                    <p className="text-sm text-foreground/90 mt-1">{s.summary}</p>
                </div>
              ))}
            </div>
          </DetailItem>
        )}

        {details.code && (
             <DetailItem>
                <h4 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Executing Code</h4>
                <pre className="p-3 bg-background rounded-md border border-border/60 text-xs overflow-x-auto font-mono">
                    <code>{details.code}</code>
                </pre>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Loader2 className="w-4 h-4 animate-spin"/>
                    <span>Waiting for result...</span>
                </div>
             </DetailItem>
        )}

        {output.code && output.result && (
          <div className="font-mono text-sm">
             <DetailItem>
                <h4 className="font-sans font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Executed Code</h4>
                <pre className="p-2 bg-background rounded-md border border-border/60 text-xs overflow-x-auto"><code>{output.code}</code></pre>
                <Separator className="my-3 bg-border/60" />
                <h4 className="font-sans font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Result</h4>
                <pre className="p-2 bg-background rounded-md border border-border/60"><code>{output.result}</code></pre>
             </DetailItem>
          </div>
        )}
    </div>
  );
}