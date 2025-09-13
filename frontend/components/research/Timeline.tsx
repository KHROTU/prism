import { HistoryStep, CurrentStep } from "../../lib/types";
import { TimelineNode } from "./TimelineNode";
import { motion } from "framer-motion";
import { ResearchLoader } from "./ResearchLoader";

interface TimelineProps {
  history: HistoryStep[];
  currentStep: CurrentStep | null;
  isLoading: boolean;
  loadingMessage: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.5,
    },
  },
};

export function Timeline({ history, currentStep, isLoading, loadingMessage }: TimelineProps) {
  return (
    <div className="relative pl-6 before:absolute before:left-6 before:top-0 before:h-full before:w-px before:bg-border/60">
      <motion.div 
        className="space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {history.map((step) => (
          <TimelineNode key={step.uniqueId} step={step} isCurrent={false} />
        ))}

        {currentStep && (
            <TimelineNode key={currentStep.uniqueId} step={currentStep} isCurrent={true} />
        )}
        
        {isLoading && !currentStep && <ResearchLoader message={loadingMessage} />}
      </motion.div>
    </div>
  );
}