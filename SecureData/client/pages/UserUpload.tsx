import { useState, useCallback } from "react";
import { Upload as UploadIcon, ShieldCheck, FileText, Database, X, CheckCircle2, Lock } from "lucide-react";
import { UserLayout } from "@/components/UserLayout";
import { motion, AnimatePresence } from "framer-motion";
import { filesAPI } from "@/lib/api";

export default function UserUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "verifying" | "success">("idle");
    const [progress, setProgress] = useState(0);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploadStatus("uploading");
        setProgress(0);

        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        try {
            await filesAPI.uploadFile(file);
            clearInterval(progressInterval);
            setProgress(100);
            setUploadStatus("verifying");
            setTimeout(() => {
                setUploadStatus("success");
            }, 1000);
        } catch (error) {
            clearInterval(progressInterval);
            setUploadStatus("idle");
            setProgress(0);
            console.error("Upload failed:", error);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setUploadStatus("idle");
        setProgress(0);
    };

    return (
        <UserLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(20,184,166,0.3)] mb-6">
                        <UploadIcon className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter mb-4">Secure Ingestion Portal</h1>
                    <p className="text-muted-foreground text-lg text-balance max-w-2xl mx-auto">
                        Upload sensitive datasets for automated PII sanitization. All data submitted is encrypted in transit and securely verified before pipeline execution.
                    </p>
                </motion.div>

                {/* Dynamic Upload Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div
                        className={`transition-all duration-300 rounded-3xl p-1 relative overflow-hidden ${isDragging ? "bg-gradient-to-r from-primary to-accent" : "bg-border/50"
                            }`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    >
                        {/* Inner Content Area */}
                        <div className="bg-card rounded-[1.4rem] p-12 flex flex-col items-center justify-center text-center min-h-[400px] relative z-10">
                            <AnimatePresence mode="wait">
                                {!file && (
                                    <motion.div
                                        key="upload-prompt"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div className={`p-6 rounded-full mb-6 transition-colors duration-300 ${isDragging ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                                            <UploadIcon className="w-16 h-16" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-2">Drag & Drop Dataset</h3>
                                        <p className="text-muted-foreground mb-8">Supported formats: CSV, JSON, Parquet, TXT</p>

                                        <div className="flex gap-4">
                                            <div className="badge-info px-4 py-2"><Database className="w-4 h-4" /> Max 5GB</div>
                                            <div className="badge-success px-4 py-2"><Lock className="w-4 h-4" /> E2E Encrypted</div>
                                        </div>

                                        <div className="mt-8 relative w-full">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-border/50"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="bg-card px-4 text-sm text-muted-foreground font-bold uppercase tracking-wider">OR</span>
                                            </div>
                                        </div>

                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={onFileSelect}
                                            accept=".csv,.json,.parquet,.txt"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="mt-8 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg cursor-pointer transition-all shadow-lg hover:shadow-primary/50 hover:-translate-y-1 block"
                                        >
                                            Browse Local Files
                                        </label>
                                    </motion.div>
                                )}

                                {file && uploadStatus === "idle" && (
                                    <motion.div
                                        key="file-selected"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="w-full max-w-lg"
                                    >
                                        <div className="glass-card p-6 flex items-center gap-6 mb-8 text-left border-primary/30 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                                            <div className="p-4 bg-primary/20 rounded-2xl flex-shrink-0">
                                                <FileText className="w-10 h-10 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-foreground text-lg truncate mb-1">{file.name}</h4>
                                                <p className="text-muted-foreground font-mono text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                            <button
                                                onClick={() => setFile(null)}
                                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleUpload}
                                            className="w-full px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-primary/50 hover:-translate-y-1 flex justify-center items-center gap-3"
                                        >
                                            <ShieldCheck className="w-6 h-6" /> Initialize Ingestion Protocol
                                        </button>
                                    </motion.div>
                                )}

                                {file && uploadStatus !== "idle" && (
                                    <motion.div
                                        key="uploading-state"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-full max-w-lg"
                                    >
                                        <div className="mb-8 relative">
                                            <div className="w-32 h-32 mx-auto relative flex items-center justify-center">
                                                {uploadStatus === "success" ? (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500">
                                                        <CheckCircle2 className="w-24 h-24" />
                                                    </motion.div>
                                                ) : (
                                                    <>
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle className="text-secondary" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                                            <circle className="text-primary transition-all duration-300 ease-out" strokeWidth="8" strokeDasharray={364} strokeDashoffset={364 - (progress / 100) * 364} strokeLinecap="round" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                                        </svg>
                                                        <div className="absolute flex flex-col items-center justify-center">
                                                            {uploadStatus === "uploading" && <span className="font-bold text-xl">{progress}%</span>}
                                                            {uploadStatus === "verifying" && <ShieldCheck className="w-10 h-10 text-primary animate-pulse" />}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-center mb-8">
                                            <h3 className="text-xl font-bold text-foreground mb-2">
                                                {uploadStatus === "uploading" && "Transmitting payload..."}
                                                {uploadStatus === "verifying" && "Verifying checksums and schema..."}
                                                {uploadStatus === "success" && "Transmission Complete"}
                                            </h3>
                                            <p className="text-muted-foreground font-mono text-sm">
                                                {uploadStatus === "success" ? "Job queued for sanitization." : `[SID: UPL-${Math.random().toString(36).substr(2, 6).toUpperCase()}]`}
                                            </p>
                                        </div>

                                        {uploadStatus === "success" && (
                                            <button
                                                onClick={resetUpload}
                                                className="w-full px-6 py-3 border-2 border-border/50 hover:border-primary/50 bg-secondary/50 rounded-xl font-bold text-foreground transition-all"
                                            >
                                                Upload Another Dataset
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </UserLayout>
    );
}
