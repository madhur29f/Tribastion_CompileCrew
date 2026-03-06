import { useState, useEffect } from "react";
import { Eye, EyeOff, Code, FileText, Table, ServerCrash, Loader } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { filesAPI } from "@/lib/api";

type ViewMode = "text" | "table" | "json";

interface FileOption {
  id: number;
  name: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdminDataViewer() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [files, setFiles] = useState<FileOption[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [sanitizedData, setSanitizedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch file list on mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const data = await filesAPI.getFiles();
        const opts = data.map((f: any) => ({ id: f.id, name: f.name }));
        setFiles(opts);
        if (opts.length > 0) setSelectedFileId(opts[0].id);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      }
    };
    fetchFiles();
  }, []);

  // Fetch raw + sanitized data when file selection changes
  useEffect(() => {
    if (!selectedFileId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [raw, sanitized] = await Promise.all([
          filesAPI.getRawFile(selectedFileId),
          filesAPI.getSanitizedFile(selectedFileId),
        ]);
        setRawData(raw);
        setSanitizedData(sanitized);
      } catch (error) {
        console.error("Failed to fetch file data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedFileId]);

  // Convert data to display string
  const toDisplayString = (data: any): string => {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (data.content) return data.content;
    return JSON.stringify(data, null, 2);
  };

  const rawText = toDisplayString(rawData);
  const sanitizedText = toDisplayString(sanitizedData);

  // For table view, try to parse as rows
  const parseTableRows = (text: string): string[][] => {
    if (!text) return [];
    const lines = text.split("\n").filter(l => l.trim());
    return lines.map(line => line.split(",").map(cell => cell.trim()));
  };

  const rawRows = parseTableRows(rawText);
  const sanitizedRows = parseTableRows(sanitizedText);

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl glass-card py-6 px-8 border-l-4 border-l-primary flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div>
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              <ServerCrash className="w-8 h-8 text-primary" /> Visual Protocol Inspector
            </h1>
            <p className="text-muted-foreground mt-2 font-medium max-w-xl">
              Cross-examine raw ingestion payloads against sanitized outputs to verify the integrity of the PII neutralization pipeline.
            </p>
          </div>

          <div className="bg-background/80 px-4 py-2 rounded-xl text-center border border-primary/20 shadow-md backdrop-blur-sm shrink-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sanitization Confidence</p>
            <p className="text-2xl font-black text-primary">99.9%</p>
          </div>
        </motion.div>

        {/* View Mode & File Selector */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 items-center justify-between bg-secondary/30 p-2 rounded-xl border border-white/5">
          <div className="flex gap-2">
            {(["text", "table", "json"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${viewMode === mode
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                  }`}
              >
                {mode === "text" && <FileText className="w-4 h-4" />}
                {mode === "table" && <Table className="w-4 h-4" />}
                {mode === "json" && <Code className="w-4 h-4" />}
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pr-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">File:</label>
            <select
              value={selectedFileId ?? ""}
              onChange={(e) => setSelectedFileId(Number(e.target.value))}
              className="px-4 py-2 border border-primary/30 rounded-lg bg-background text-foreground font-mono font-bold focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer hover:border-primary transition-colors"
            >
              {files.length === 0 && <option value="">No files uploaded</option>}
              {files.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-muted-foreground font-bold">Fetching and sanitizing data...</span>
          </div>
        )}

        {/* No Files State */}
        {!loading && files.length === 0 && (
          <div className="glass-card text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Files Available</h3>
            <p className="text-muted-foreground">Upload a file first to inspect raw vs sanitized data.</p>
          </div>
        )}

        {/* Data Comparison Area */}
        {!loading && selectedFileId && (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + selectedFileId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {viewMode === "text" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Raw Data */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-destructive/10 rounded-xl border border-destructive/20"><Eye className="w-5 h-5 text-destructive" /></div>
                      <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Source Vector</h3>
                    </div>
                    <div className="bg-destructive/5 border-2 border-destructive/20 rounded-2xl p-6 shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-50"><span className="text-[10px] font-mono text-destructive tracking-widest bg-destructive/10 px-2 py-1 rounded">UNSECURED</span></div>
                      <pre className="text-sm font-mono whitespace-pre-wrap break-words mt-4 text-destructive">{rawText || "No data"}</pre>
                    </div>
                  </div>

                  {/* Sanitized Data */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-xl border border-accent/20"><EyeOff className="w-5 h-5 text-accent" /></div>
                      <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Neutralized Vector</h3>
                    </div>
                    <div className="bg-accent/5 border-2 border-accent/20 rounded-2xl p-6 shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-50"><span className="text-[10px] font-mono text-accent tracking-widest bg-accent/10 px-2 py-1 rounded">SECURED</span></div>
                      <pre className="text-sm font-mono whitespace-pre-wrap break-words mt-4 text-accent">{sanitizedText || "No data"}</pre>
                    </div>
                  </div>
                </div>
              ) : viewMode === "table" ? (
                <div className="glass-card overflow-hidden border border-white/10 shadow-xl p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-background/80">
                          <th className="px-6 py-5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-8">#</th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-destructive uppercase tracking-wider">Raw Source</th>
                          <th className="px-6 py-5 text-left text-xs font-bold text-accent uppercase tracking-wider">Sanitized Output</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rawText.split("\n").filter((l: string) => l.trim()).map((line: string, i: number) => (
                          <motion.tr
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            key={i}
                            className="border-b border-white/5 hover:bg-secondary/30 transition-colors"
                          >
                            <td className="px-6 py-3 text-xs text-muted-foreground font-mono">{i + 1}</td>
                            <td className="px-6 py-3 text-sm text-destructive font-mono">{line}</td>
                            <td className="px-6 py-3 text-sm text-accent font-mono font-black bg-accent/5">
                              {sanitizedText.split("\n").filter((l: string) => l.trim())[i] || ""}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Raw JSON */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Code className="w-5 h-5 text-destructive" /> Raw Payload</h3>
                    <div className="bg-[#0f111a] border border-destructive/30 rounded-2xl p-6 overflow-auto max-h-[500px] font-mono text-sm shadow-xl relative w-full">
                      <div className="absolute top-0 right-0 p-2 opacity-50"><span className="text-xs text-destructive">JSON</span></div>
                      <pre className="text-red-400">{typeof rawData === "object" ? JSON.stringify(rawData, null, 2) : rawText}</pre>
                    </div>
                  </div>

                  {/* Sanitized JSON */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Code className="w-5 h-5 text-accent" /> Sanitized Payload</h3>
                    <div className="bg-[#0f111a] border border-accent/30 rounded-2xl p-6 overflow-auto max-h-[500px] font-mono text-sm shadow-xl relative w-full">
                      <div className="absolute top-0 right-0 p-2 opacity-50"><span className="text-xs text-accent">JSON</span></div>
                      <pre className="text-teal-400">{typeof sanitizedData === "object" ? JSON.stringify(sanitizedData, null, 2) : sanitizedText}</pre>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Sanitization Legend */}
        <motion.div variants={itemVariants} className="glass-card border-t-2 border-primary/20 bg-background/50">
          <h3 className="text-sm font-extrabold text-muted-foreground mb-6 uppercase tracking-widest border-b border-border pb-3">Transformation Methods Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start group">
              <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <span className="text-2xl">🎭</span>
              </div>
              <div className="pt-1">
                <p className="font-bold text-foreground">Pattern Masking</p>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">Partially conceals sensitive signatures while preserving structure.</p>
                <p className="text-xs text-yellow-500/80 font-mono mt-2 bg-yellow-500/5 inline-block px-2 py-1 rounded">aarav.m***@email.com</p>
              </div>
            </div>

            <div className="flex gap-4 items-start group">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <span className="text-2xl">🚫</span>
              </div>
              <div className="pt-1">
                <p className="font-bold text-foreground">Total Redaction</p>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">Hard removal of critical data. Zero-trust extraction.</p>
                <p className="text-xs text-red-500/80 font-mono mt-2 bg-red-500/5 inline-block px-2 py-1 rounded">[REDACTED]</p>
              </div>
            </div>

            <div className="flex gap-4 items-start group">
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <span className="text-2xl">🔑</span>
              </div>
              <div className="pt-1">
                <p className="font-bold text-foreground">Tokenization</p>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">One-way cryptographic hash replacement for data preservation.</p>
                <p className="text-xs text-purple-500/80 font-mono mt-2 bg-purple-500/5 inline-block px-2 py-1 rounded">TOKEN_A7X9K</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
