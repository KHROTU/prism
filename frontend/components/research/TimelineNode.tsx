import { HistoryStep, CurrentStep } from "../../lib/types";
import { BrainCircuit, Calculator, Search, FileText, HelpCircle } from "lucide-react";
import { NodeContent } from "./NodeContent";
import { motion, Variants } from "framer-motion";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface TimelineNodeProps {
  step: HistoryStep | CurrentStep;
  isCurrent: boolean;
}

const getAgentInfo = (agent: string) => {
  switch (agent) {
    case "ResearcherAgent":
      return { icon: <Search className="w-5 h-5" />, color: "bg-blue-500", name: "Researcher" };
    case "CodeExecutor":
      return { icon: <Calculator className="w-5 h-5" />, color: "bg-green-500", name: "Code Executor" };
    case "LeadSynthesizer":
        return { icon: <FileText className="w-5 h-5" />, color: "bg-purple-500", name: "Synthesizer" };
    case "UserClarificationAgent":
        return { icon: <HelpCircle className="w-5 h-5" />, color: "bg-yellow-500", name: "Clarification" };
    default:
      return { icon: <BrainCircuit className="w-5 h-5" />, color: "bg-gray-500", name: "Orchestrator" };
  }
};

const nodeVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    },
};

export function TimelineNode({ step, isCurrent }: TimelineNodeProps) {
  const agentInfo = getAgentInfo(step.agent);
  
  const output = 'output' in step ? step.output : {};
  const details = 'details' in step ? step.details : {};

  return (
    <motion.div className="relative" variants={nodeVariants}>
      <div className={cn(
          "absolute -left-[30px] top-0 h-4 w-4 rounded-full ring-8 ring-background", 
          agentInfo.color,
          isCurrent && 'animate-pulse'
        )}>
      </div>
      <div className="ml-4 space-y-3 rounded-lg border border-border/80 bg-background/50 p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-full text-primary-foreground", agentInfo.color)}>
              {agentInfo.icon}
          </div>
          <Badge variant="secondary" className="font-semibold">{agentInfo.name}</Badge>
        </div>
        <div>
          <p className="text-muted-foreground italic text-sm border-l-2 border-border/80 pl-3">
            {step.prompt}
          </p>
        </div>
        <NodeContent output={output} details={details} />
      </div>
    </motion.div>
  );
}