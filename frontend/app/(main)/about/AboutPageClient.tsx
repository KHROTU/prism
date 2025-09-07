"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { BrainCircuit, Search, Calculator, PenSquare, ShieldCheck, Eye } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function AboutPageClient() {
  const agents = [
    { name: "Chief Orchestrator", desc: "The project manager. It analyzes the query and research history to decide the next best action.", icon: <BrainCircuit />, url: "https://llm-stats.com/models/o4-mini" },
    { name: "Researcher Agent", desc: "The web expert. It formulates queries, finds relevant information, and extracts key facts.", icon: <Search />, url: "https://llm-stats.com/models/gpt-4.1-nano-2025-04-14"},
    { name: "Code Executor", desc: "The mathematician. It writes and runs Python code in a secure sandbox to perform precise calculations.", icon: <Calculator />, url: "https://llm-stats.com/models/qwen-2.5-coder-32b-instruct" },
    { name: "Lead Synthesizer", desc: "The writer. It takes all gathered intelligence and weaves it into a coherent, final report.", icon: <PenSquare />, url: "https://llm-stats.com/models/gemini-2.5-flash-lite" },
  ];

  const FADE_UP: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={FADE_UP}>
            <h1 className="text-5xl font-bold tracking-tighter mb-4 text-center">About PRISM</h1>
            <p className="text-xl text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
            PRISM is an open-source tool that automates research. It uses a team of specialized AI agents to go from a single question to a comprehensive, transparent, and well-supported report.
            </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div variants={FADE_UP}>
                <Card className="h-full">
                    <CardHeader className="flex-row items-center gap-4">
                        <Eye className="w-8 h-8 text-primary"/>
                        <CardTitle>The &quot;Glass Box&quot; Philosophy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        Unlike &quot;black box&quot; AI tools, PRISM is built for transparency. We show you exactly how the AI arrived at its conclusions. The research flow shows every step—every query, every site analyzed, every calculation—so you can trust, verify, and build upon the work.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={FADE_UP}>
                <Card className="h-full">
                    <CardHeader className="flex-row items-center gap-4">
                        <ShieldCheck className="w-8 h-8 text-primary"/>
                        <CardTitle>Self-Hosted and Private</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        PRISM runs on your own machine. This ensures your research queries and results remain private and under your control. By providing your own API keys, you maintain ownership and privacy of your data flow from end to end.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        <motion.div variants={FADE_UP} className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">The Multi-Agent Team</h2>
            <p className="text-muted-foreground mt-2">PRISM orchestrates a team of expert AI agents, each with a specific role.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent, i) => (
            <motion.div key={agent.name} custom={i} variants={FADE_UP}>
                <a href={agent.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                    <Card className="text-center h-full p-6 transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
                        <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                            {agent.icon}
                        </div>
                        <h3 className="text-lg font-semibold">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{agent.desc}</p>
                    </Card>
                </a>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}