"use client";

import Link from "next/link";
import { useHistoryStore } from "../../../store/historyStore";
import { Card, CardDescription,  CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useEffect, useState } from "react";
import { ArchivedResearch } from "../../../lib/types";
import { Input } from "../../../components/ui/input";
import { Trash2, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HistoryPage() {
  const { history, clearHistory, deleteResearch } = useHistoryStore();
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState("");
  
  useEffect(() => {
    document.title = "History | PRISM";
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Research History</h1>
        </div>
      </div>
    );
  }
  
  const filteredHistory = history.filter((item: ArchivedResearch) =>
    item.query.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedHistory = [...filteredHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Research History</h1>
        {history.length > 0 && (
            <div className="flex gap-2">
                <Input
                    placeholder="Filter history..."
                    value={filter}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
                    className="w-full sm:w-64"
                />
                <Button variant="destructive" size="sm" onClick={clearHistory}>
                    Clear All
                </Button>
            </div>
        )}
        </div>
        {sortedHistory.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center">
            <Inbox className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold">
                {history.length > 0 ? "No Results Found" : "No Research History"}
            </h3>
            <p className="text-muted-foreground mt-1 mb-6">
                {history.length > 0 ? "No research items match your filter." : "Your completed research will appear here."}
            </p>
            <Button asChild>
            <Link href="/">Start New Research</Link>
            </Button>
        </div>
        ) : (
        <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence>
                {sortedHistory.map((item: ArchivedResearch) => (
                <motion.div
                    key={item.id}
                    variants={itemVariants}
                    layout
                    exit="exit"
                >
                    <Card className="group transition-all hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10">
                        <div className="flex items-center justify-between">
                            <Link href={`/research/${item.id}`} className="flex-grow p-6">
                                <CardTitle className="text-lg">{item.query}</CardTitle>
                                <CardDescription className="mt-1">
                                    {new Date(item.timestamp).toLocaleString()}
                                </CardDescription>
                            </Link>
                            <div className="p-4 pr-6">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-muted-foreground transition-colors group-hover:text-destructive/80 hover:!text-destructive"
                                    onClick={(e: React.MouseEvent) => { e.preventDefault(); deleteResearch(item.id); }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
        )}
    </main>
  );
}