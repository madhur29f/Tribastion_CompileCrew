import { useState } from "react";
import { Search as SearchIcon, Database, ShieldAlert, ShieldCheck, Filter, ArrowRight } from "lucide-react";
import { UserLayout } from "@/components/UserLayout";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
    id: string;
    sourceFile: string;
    entityType: string;
    sanitizationStatus: "Fully Sanitized" | "Partially Sanitized" | "Quarantined";
    timestamp: string;
    excerpt: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function UserSearch() {
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Mock results that appear after searching
    const mockResults: SearchResult[] = [
        {
            id: "REC-9942-A",
            sourceFile: "Q1_Customer_Data_Sanitized.csv",
            entityType: "Person Metadata",
            sanitizationStatus: "Fully Sanitized",
            timestamp: "Mar 5, 2026 - 14:32:01",
            excerpt: "[REDACTED] accessed the portal from IP: [TOKEN_X92] on platform v2.1. Payload size: 45kb.",
        },
        {
            id: "REC-8110-B",
            sourceFile: "Employee_Records_Clean.pdf",
            entityType: "Financial Ledger",
            sanitizationStatus: "Fully Sanitized",
            timestamp: "Mar 4, 2026 - 09:12:44",
            excerpt: "Transaction approved for account ending in ****4521. Amount: $4,500. Executed by [REDACTED].",
        },
        {
            id: "REC-1049-C",
            sourceFile: "Raw_Ingest_Log.txt",
            entityType: "System Log",
            sanitizationStatus: "Partially Sanitized",
            timestamp: "Mar 3, 2026 - 11:45:00",
            excerpt: "User ID 5928 connected. Email matched pattern: user@***.com. Phone missing.",
        }
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setHasSearched(false);

        // Simulate network delay
        setTimeout(() => {
            setIsSearching(false);
            setHasSearched(true);
        }, 1500);
    };

    const getStatusBadge = (status: SearchResult["sanitizationStatus"]) => {
        switch (status) {
            case "Fully Sanitized":
                return <span className="badge-success"><ShieldCheck className="w-3 h-3" /> Fully Sanitized</span>;
            case "Partially Sanitized":
                return <span className="badge-warning"><ShieldAlert className="w-3 h-3" /> Partial</span>;
            case "Quarantined":
                return <span className="badge-danger"><ShieldAlert className="w-3 h-3" /> Quarantined</span>;
        }
    }

    return (
        <UserLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-8"
            >
                {/* Page Header */}
                <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mt-8 mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(20,184,166,0.3)] mb-6">
                        <SearchIcon className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-5xl font-black text-foreground tracking-tighter mb-4">Deep Data Query</h1>
                    <p className="text-muted-foreground text-lg text-balance">
                        Execute cross-vault searches across all sanitized records and indexed metadata. Enter terms, GUIDs, or entity types.
                    </p>
                </motion.div>

                {/* Search Input Area */}
                <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group flex gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="e.g. REC-9942, 'Financial Ledger', or transaction IDs..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-6 pr-4 py-5 bg-background border-2 border-border/80 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all font-mono text-lg shadow-xl group-hover:border-primary/50"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                <kbd className="hidden sm:inline-block px-3 py-1 bg-secondary rounded text-xs font-mono font-bold text-muted-foreground">ENTER</kbd>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="px-8 py-5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-2xl font-black text-lg transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center gap-3"
                        >
                            {isSearching ? (
                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>Query <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Filters:</span>
                        {['Metadata Only', 'Fully Sanitized', 'Recent (24h)', 'CSV Sources'].map(f => (
                            <button key={f} className="px-3 py-1.5 rounded-full border border-border bg-card/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors text-xs font-bold text-foreground">
                                {f}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Results Area */}
                <AnimatePresence>
                    {isSearching ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                                <div className="absolute inset-2 rounded-full border-4 border-primary/40 animate-spin border-t-transparent" />
                                <SearchIcon className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                            <p className="mt-8 font-mono text-primary font-bold tracking-widest uppercase">Scanning index sectors...</p>
                        </motion.div>
                    ) : hasSearched ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-5xl mx-auto mt-12 space-y-4"
                        >
                            <div className="flex items-center justify-between px-2 mb-6">
                                <h3 className="text-xl font-black text-foreground">Query Results</h3>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Found {mockResults.length} matches in 0.42s</p>
                            </div>

                            {mockResults.map((result, i) => (
                                <motion.div
                                    key={result.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card hover:-translate-y-1 transition-transform group cursor-pointer"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-primary/10 rounded-lg"><Database className="w-5 h-5 text-primary" /></div>
                                            <div>
                                                <h4 className="font-bold text-foreground">{result.sourceFile}</h4>
                                                <p className="text-xs font-mono text-muted-foreground">{result.timestamp}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-secondary rounded font-mono text-xs font-bold text-foreground opacity-80">{result.entityType}</span>
                                            {getStatusBadge(result.sanitizationStatus)}
                                        </div>
                                    </div>

                                    <div className="bg-background/80 rounded-xl p-4 border border-border/50 font-mono text-sm text-muted-foreground shadow-inner group-hover:border-primary/30 transition-colors">
                                        <span className="text-primary mr-2 font-black">&gt;</span>
                                        {/* Highlight matching text if requested, here we just show plain */}
                                        <span dangerouslySetInnerHTML={{
                                            __html: result.excerpt.replace(/(\[REDACTED\]|\[TOKEN_.*\])/g, '<span class="text-red-400 font-bold bg-red-400/10 px-1 rounded">$1</span>')
                                        }} />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : null}
                </AnimatePresence>

            </motion.div>
        </UserLayout>
    );
}
