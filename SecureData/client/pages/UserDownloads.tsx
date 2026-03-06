import { useState, useEffect } from "react";
import { Download, Search, FileText, Database, Shield, Lock, FileArchive, CheckCircle2 } from "lucide-react";
import { UserLayout } from "@/components/UserLayout";
import { motion, AnimatePresence } from "framer-motion";
import { filesAPI } from "@/lib/api";

interface SanitizedFile {
    id: string;
    name: string;
    date: string;
    size: string;
    records: number;
    type: string;
    status: "Ready" | "Processing";
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function UserDownloads() {
    const [searchTerm, setSearchTerm] = useState("");
    const [files, setFiles] = useState<SanitizedFile[]>([]);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const data = await filesAPI.getFiles();
                setFiles(data.map((f: any) => ({
                    id: String(f.id),
                    name: f.name,
                    date: new Date(f.uploadDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                    size: "—",
                    records: f.piiDetected || 0,
                    type: f.name.split(".").pop()?.toUpperCase() || "TXT",
                    status: f.status === "Completed" ? "Ready" as const : "Processing" as const,
                })));
            } catch (error) {
                console.error("Failed to fetch files:", error);
            }
        };
        fetchFiles();
    }, []);

    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const filteredFiles = files.filter(
        (file) =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = async (id: string) => {
        setDownloadingId(id);
        try {
            const blob = await filesAPI.downloadFile(Number(id));
            const file = files.find(f => f.id === id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file?.name || "download";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
        }
        setDownloadingId(null);
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case "CSV": return <Database className="w-6 h-6 text-green-400" />;
            case "PDF": return <FileText className="w-6 h-6 text-red-400" />;
            case "XLSX": return <FileArchive className="w-6 h-6 text-green-500" />;
            case "JSON": return <FileText className="w-6 h-6 text-yellow-400" />;
            default: return <FileText className="w-6 h-6 text-blue-400" />;
        }
    };

    return (
        <UserLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-8"
            >
                {/* Page Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                                <Download className="w-8 h-8 text-primary" />
                            </div>
                            Secure Vault Access
                        </h1>
                        <p className="text-muted-foreground mt-3 font-medium text-lg max-w-xl">
                            Download your processed, PII-free datasets. All files in this vault have passed the zero-trust sanitization pipeline.
                        </p>
                    </div>

                    <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-4 flex items-center gap-4 shadow-lg w-full md:w-auto">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vault Status</p>
                            <p className="text-green-500 font-black flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                SECURE & ONLINE
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Search */}
                <motion.div variants={itemVariants} className="relative group max-w-2xl">
                    <input
                        type="text"
                        placeholder="Search vault inventory by filename or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 bg-background/50 backdrop-blur-sm border-2 border-border/50 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-base shadow-lg group-hover:border-primary/50"
                    />
                    <Search className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </motion.div>

                {/* Files Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredFiles.length > 0 ? (
                            filteredFiles.map((file, i) => (
                                <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass-card group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-secondary/50 rounded-xl group-hover:scale-110 transition-transform">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black font-mono text-muted-foreground mb-1">{file.id}</span>
                                                <span className="badge-success shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                                                    <CheckCircle2 className="w-3 h-3" /> Ready
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground truncate mb-1" title={file.name}>{file.name}</h3>
                                        <p className="text-sm font-mono text-muted-foreground mb-4 opacity-80">{file.date} &bull; {file.size}</p>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                                        <div className="flex items-center gap-2">
                                            <Database className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xs font-bold text-muted-foreground">{file.records.toLocaleString()} rows</span>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(file.id)}
                                            disabled={downloadingId === file.id}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 
                                        ${downloadingId === file.id
                                                    ? 'bg-primary/20 text-primary cursor-wait'
                                                    : 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/50 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {downloadingId === file.id ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                    Extracting...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" /> Download
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 text-center glass-card"
                            >
                                <Lock className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">Vault Empty</h3>
                                <p className="text-muted-foreground">No sanitized files match your search criteria.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </UserLayout>
    );
}
