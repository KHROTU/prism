import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const ResearchLoader = ({ message }: { message: string }) => {
    return (
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="absolute -left-[30px] top-0 h-4 w-4 rounded-full bg-muted ring-8 ring-background animate-pulse"></div>
        <div className="ml-4 flex items-center text-muted-foreground">
            <Loader2 className="mr-3 h-5 w-5 animate-spin"/>
            <p className="font-medium">{message}</p>
        </div>
      </motion.div>
    )
}