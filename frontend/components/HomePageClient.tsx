"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ArrowRight, Zap } from "lucide-react";
import { useHistoryStore } from "../store/historyStore";
import { v4 as uuidv4 } from 'uuid';
import { motion, Variants } from "framer-motion";

const allExamplePrompts = [
  "What are the latest breakthroughs in solid-state battery technology?",
  "Compare the economic impacts of AI in the manufacturing vs. healthcare sectors.",
  "What is the current scientific consensus on the feasibility of warp drives?",
  "Summarize the key arguments in the debate over universal basic income (UBI).",
  "What are the main ethical concerns surrounding CRISPR gene-editing technology?",
  "Explain the impact of quantum computing on modern cryptography.",
  "What are the most promising strategies for carbon capture and storage?",
  "Analyze the geopolitical implications of declining global oil reserves."
];

const shuffleArray = (array: string[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

export function HomePageClient() {
  const [prompt, setPrompt] = useState("");
  const { startNewResearch } = useHistoryStore();
  const router = useRouter();
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);

  useEffect(() => {
    setExamplePrompts(shuffleArray([...allExamplePrompts]).slice(0, 3));
  }, []);

  const handleStartResearch = () => {
    if (prompt.trim()) {
      const newId = uuidv4();
      startNewResearch(newId, prompt.trim());
      router.push(`/research/${newId}`);
    }
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  const FADE_UP_VARIANTS: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 relative z-10">
      <motion.header 
        initial="hidden"
        animate="visible"
        variants={FADE_UP_VARIANTS}
        className="mb-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-neutral-500">
          Autonomous Research
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Go from a single question to a comprehensive report. PRISM&apos;s AI agents
          handle the searching, reading, and analysis, showing you every step.
        </p>
      </motion.header>

      <motion.main 
        initial="hidden"
        animate="visible"
        variants={FADE_UP_VARIANTS}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative flex flex-col gap-4">
            <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., What are the latest breakthroughs in solid-state battery technology?"
                className="min-h-[120px] text-base p-4 pr-36 rounded-lg border-2 border-border bg-background/80 backdrop-blur-sm focus-visible:ring-primary/40 focus-visible:ring-4 transition-all"
                onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleStartResearch();
                }
                }}
            />
            <Button
                size="lg"
                onClick={handleStartResearch}
                disabled={!prompt.trim()}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
            >
                Research <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            </div>
        </div>
      </motion.main>

      <motion.footer 
        initial="hidden"
        animate="visible"
        variants={FADE_UP_VARIANTS}
        transition={{ delay: 0.4 }}
        className="mt-16 w-full max-w-4xl"
      >
        <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">
          Or try one of these suggestions
        </h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {examplePrompts.map((p, i) => (
             <motion.div
             key={p}
             className="relative p-px rounded-lg group"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5 + i * 0.1, ease: "easeOut" }}
           >
             <div className="absolute inset-0 bg-gradient-to-r from-border to-border/20 rounded-lg" />
             <button
               onClick={() => handleExampleClick(p)}
               className="relative w-full h-full text-left p-4 bg-secondary rounded-lg transition-all group-hover:bg-secondary/80 group-hover:-translate-y-1"
             >
               <Zap className="w-5 h-5 mb-2 text-primary/80" />
               <p className="text-sm text-foreground/90">{p}</p>
             </button>
           </motion.div>
          ))}
        </div>
      </motion.footer>
    </div>
  );
}