import { HistoryStep, CurrentStep } from "../../lib/types";
import { BrainCircuit, Calculator, Search, FileText } from "lucide-react";
import { NodeContent } from "./NodeContent";
import { motion, Variants } from "framer-motion";
import { Badge } from "../ui/badge";

interface TimelineNodeProps {
  step: HistoryStep | CurrentStep;
  isCurrent: boolean;
}

const getAgentInfo = (agent: string) => {
  switch (agent) {
    case "ResearcherAgent":
      return { icon: <Search className="w-5 h-5" />, color: "bg-blue-500" };
    case "CodeExecutor":
      return { icon: <Calculator className="w-5 h-5" />, color: "bg-green-500" };
    case "LeadSynthesizer":
        return { icon: <FileText className="w-5 h-5" />, color: "bg-purple-500" };
    default:
      return { icon: <BrainCircuit className="w-5 h-5" />, color: "bg-gray-500" };
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
      <div className={`absolute -left-[30px] top-0 h-4 w-4 rounded-full ${agentInfo.color} ring-8 ring-background ${isCurrent ? 'animate-pulse' : ''}`}></div>
      <div className="ml-4">
        <div className="flex items-center gap-3">
            <span className={`flex items-center justify-center w-8 h-8 rounded-full ${agentInfo.color}/10 text-${agentInfo.color}`}>
                <div className={`${agentInfo.color} p-1.5 rounded-full text-primary-foreground`}>
                    {agentInfo.icon}
                </div>
            </span>
            <Badge variant="secondary" className="font-semibold">{step.agent}</Badge>
        </div>
        <div className="mt-3 pl-2">
            <p className="text-muted-foreground italic text-sm mb-4 border-l-2 border-border pl-3">
            {step.prompt}
            </p>
            <NodeContent output={output} details={details} />
        </div>
      </div>
    </motion.div>
  );
}