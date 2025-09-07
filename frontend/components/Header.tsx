"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Settings, Book, Info } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useStatusStore } from "../store/statusStore";
import { cn } from "../lib/utils";
import { Separator } from "./ui/separator";

const StatusIndicator = ({ status, latency }: { status: "online" | "degraded" | "offline"; latency: number | null }) => {
  const color = {
    online: "bg-status-online",
    degraded: "bg-status-degraded",
    offline: "bg-status-offline",
  }[status];

  return (
    <div className="flex items-center gap-1.5" title={`${status.charAt(0).toUpperCase() + status.slice(1)}`}>
      <div className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-xs font-mono text-muted-foreground">
        {latency !== null ? `${latency}ms` : "---"}
      </span>
    </div>
  );
};

export function Header() {
  const { backend, llm, googleApiUsage } = useStatusStore();

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg"
    >
      <div className="container mx-auto flex h-16 items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Image src="/favicon.ico" alt="PRISM Logo" width={24} height={24} />
            PRISM
          </Link>
          <div className="hidden md:flex items-center gap-3 border border-border/60 bg-background/50 rounded-full px-3 py-1 text-sm">
              <div className="flex items-center gap-2" title="Default LLM API status">
                  <span className="text-xs font-medium text-muted-foreground">LLM:</span>
                  <StatusIndicator status={llm.status} latency={llm.latency} />
              </div>
              <Separator orientation="vertical" className="h-4 bg-border/60" />
              <div className="flex items-center gap-2" title="Backend server status">
                  <span className="text-xs font-medium text-muted-foreground">Backend:</span>
                  <StatusIndicator status={backend.status} latency={backend.latency} />
              </div>
              <Separator orientation="vertical" className="h-4 bg-border/60" />
              <div className="flex items-center gap-2" title="Free Google Custom Search daily quota usage (approx.)">
                  <span className="text-xs font-medium text-muted-foreground">Search:</span>
                  <span className="text-xs font-mono text-muted-foreground">{googleApiUsage}/100</span>
              </div>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost">
            <Link href="/history"><Book className="h-4 w-4 mr-2"/>History</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/about"><Info className="h-4 w-4 mr-2"/>About</Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </nav>
      </div>
    </motion.header>
  );
}