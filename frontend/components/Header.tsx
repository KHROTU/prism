"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Settings, Book, Info } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg"
    >
      <div className="container mx-auto flex h-16 items-center justify-between p-4">
        <Link href="/" className="font-bold text-xl tracking-tighter">
          PRISM
        </Link>
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