"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { BrainCircuit, Code, Globe, Wrench, GitPullRequest, Server, Rocket, AlertTriangle, Search, Calculator } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Button } from "../../../components/ui/button";
import { useEffect, useState } from "react";
import { getLocalVersion, getLatestVersion } from "../../../lib/api";
import { Skeleton } from "../../../components/ui/skeleton";
import semver from 'semver';
import { toast } from "sonner";

function VersionCheck() {
  const [localVersion, setLocalVersion] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      try {
        const local = await getLocalVersion();
        const latest = await getLatestVersion();
        
        const localV = local?.version ? semver.clean(local.version) : null;
        const latestV = latest?.tag_name ? semver.clean(latest.tag_name) : null;

        setLocalVersion(localV);
        setLatestVersion(latestV);

        if (localV && latestV && semver.gt(latestV, localV)) {
          setUpdateAvailable(true);
          toast.info("A new version of PRISM is available!", {
            action: {
              label: "How to Update",
              onClick: () => {
                  toast.message("Update Instructions", {
                      description: "Open your terminal, navigate to the project directory, run 'git pull' to get the latest files, and then restart both the backend and frontend servers.",
                      duration: 15000,
                  });
              },
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch versions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVersions();
  }, []);

  const renderVersion = (version: string | null) => {
    if (isLoading) return <Skeleton className="h-6 w-20" />;
    return version ? <span className="font-mono">{version}</span> : <span className="text-muted-foreground">Unknown</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version Information</CardTitle>
        <CardDescription>Check your local version against the latest official release.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 border rounded-lg">
          <span className="font-medium">Your Version</span>
          {renderVersion(localVersion)}
        </div>
        <div className="flex justify-between items-center p-3 border rounded-lg">
          <span className="font-medium">Latest Version</span>
          {renderVersion(latestVersion)}
        </div>
        {updateAvailable && (
          <div className="p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5"/>
              <h4 className="font-semibold">Update Available: {latestVersion}</h4>
            </div>
            <p className="text-sm mt-2 text-yellow-200/80">A new version of PRISM is available. For the latest features and bug fixes, please update your local installation.</p>
            <Card className="mt-4 bg-background/50">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold">How to Update:</p>
                <ol className="list-decimal list-inside text-sm space-y-2 mt-2">
                  <li>Open a terminal in your PRISM project directory.</li>
                  <li>Pull the latest changes: <code className="bg-muted text-muted-foreground p-1 rounded-sm text-xs font-mono">git pull</code></li>
                  <li>Restart the backend and frontend servers.</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AboutPageClient() {
  const techStack = [
    { name: "Python", desc: "For the core backend logic and agent orchestration.", icon: <Code /> },
    { name: "FastAPI", desc: "A high-performance web framework for building the backend API.", icon: <Server /> },
    { name: "Docker", desc: "Provides a secure, isolated sandbox for the CodeExecutor agent.", icon: <Wrench /> },
    { name: "Next.js & React", desc: "Powers the modern, reactive frontend user interface.", icon: <Rocket /> },
  ];

  const agents = [
    { name: "Orchestrator & Synthesizer", desc: "Plans the research and writes the final report. Default model: o4-mini.", icon: <BrainCircuit /> },
    { name: "Researcher Agent", desc: "Generates search queries and summarizes web content. Default models: gpt-4.1-nano, gemini-2.5-flash-lite.", icon: <Search /> },
    { name: "Code Executor", desc: "Writes and executes Python code for calculations. Default model: qwen-2.5-coder-32b-instruct.", icon: <Calculator /> },
  ];

  const FADE_UP: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <motion.div 
        className="max-w-4xl mx-auto space-y-12"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={FADE_UP}>
            <h1 className="text-5xl font-bold tracking-tighter mb-4 text-center">About PRISM</h1>
            <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
              PRISM is an open-source, self-hosted tool that automates research. It uses a team of specialized AI agents to go from a single question to a comprehensive, transparent, and well-supported report.
            </p>
        </motion.div>

        <motion.div variants={FADE_UP}>
            <VersionCheck />
        </motion.div>

        <motion.div variants={FADE_UP}>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">The Multi-Agent Team</h2>
            <p className="text-muted-foreground mt-2">PRISM orchestrates a team of expert AI agents, each with a specific role.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {agents.map((agent) => (
              <motion.div key={agent.name} variants={FADE_UP}>
                  <Card className="text-center h-full p-6">
                      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                          {agent.icon}
                      </div>
                      <h3 className="text-lg font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{agent.desc}</p>
                  </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={FADE_UP}>
          <Card>
            <CardHeader className="flex-row items-center gap-4">
                <GitPullRequest className="w-8 h-8 text-primary"/>
                <CardTitle>Setup & Contribution</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                  PRISM is designed to be run locally for maximum privacy and control. Follow the setup instructions in the official GitHub repository to get started. Contributions are welcome!
                </p>
                <Button asChild>
                    <a href="https://github.com/KHROTU/prism" target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4 mr-2"/>View on GitHub</a>
                </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={FADE_UP}>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Technology Stack</h2>
              <p className="text-muted-foreground mt-2">Built with modern, high-performance tools.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {techStack.map((tech) => (
                <motion.div key={tech.name} variants={FADE_UP}>
                    <Card className="text-center h-full p-6">
                        <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                            {tech.icon}
                        </div>
                        <h3 className="text-lg font-semibold">{tech.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{tech.desc}</p>
                    </Card>
                </motion.div>
              ))}
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
}