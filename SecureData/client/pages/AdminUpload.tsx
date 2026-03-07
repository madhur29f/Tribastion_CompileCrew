import { useState, useRef } from "react";
import { Upload, FileType, CheckCircle2, Loader, Image as ImageIcon, ShieldAlert } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { filesAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface UploadState {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  progress: number;
  message: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* =========================
   File Format Card
========================= */
const FileFormatBadge = ({
  format,
  icon,
  desc,
}: {
  format: string;
  icon: string;
  desc: string;
}) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group flex flex-col items-center gap-3 px-4 py-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 dark:from-slate-800/50 dark:to-slate-900/50 border border-white/10 dark:border-white/5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all duration-300 cursor-pointer backdrop-blur-md relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-primary/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-500 ease-out z-0 rounded-2xl" />

      <div className="text-3xl text-foreground group-hover:text-white group-hover:scale-110 transition-all duration-300 z-10 flex h-12 w-12 items-center justify-center bg-background/50 rounded-xl shadow-inner border border-white/5">
        {icon}
      </div>

      <div className="text-center z-10">
        <p className="text-sm font-bold text-foreground group-hover:text-white transition-colors">{format}</p>
        <p className="text-[10px] text-muted-foreground group-hover:text-white/80 font-medium uppercase tracking-wider transition-colors mt-1">{desc}</p>
      </div>
    </motion.div>
  );
};

export default function AdminUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    message: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sanitizationMethod, setSanitizationMethod] = useState<
    "masking" | "redaction" | "tokenization" | "smart"
  >("smart");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState({
      status: "uploading",
      progress: 20,
      message: "Initiating secure transfer...",
    });

    try {
      const progressInterval = setInterval(() => {
        setUploadState((prev) => {
          if (prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            progress: prev.progress + Math.random() * 20,
          };
        });
      }, 500);

      const response = await filesAPI.uploadFile(
        selectedFile,
        sanitizationMethod
      );

      clearInterval(progressInterval);

      const steps = [
        "Scanning for PII signatures...",
        "Running ML syntax analysis...",
        "Applying active sanitization protocols...",
        "Finalizing secure container...",
      ];

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setUploadState((prev) => ({
          ...prev,
          progress: 100,
          message: step,
        }));
      }

      setUploadState({
        status: "success",
        progress: 100,
        message: `Asset "${selectedFile.name}" isolated and neutralized successfully!`,
      });

      setTimeout(() => {
        setSelectedFile(null);
        setUploadState({
          status: "idle",
          progress: 0,
          message: "",
        });
      }, 4000);
    } catch (error) {
      setUploadState({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Security protocol failed",
      });
    }
  };

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Animated Banner Header */}
        <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden h-48 md:h-64 shadow-2xl group border border-white/10">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            src="/images/banner.png"
            alt="Cyber Security Data Flow"
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
          />
          <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-20 pointer-events-none" />

          <div className="absolute inset-0 p-8 z-30 flex flex-col justify-end">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
              Secure Ingestion
            </h1>
            <p className="text-white/90 mt-2 font-medium max-w-2xl text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              Upload critical assets. Our AI-driven pipeline automatically detects, isolates, and neutralizes sensitive PII data streams.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Upload Area */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
            {/* Upload Area */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-3xl p-12 lg:p-20 text-center transition-all duration-500 overflow-hidden ${isDragging
                ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(20,184,166,0.3)] scale-[1.02]"
                : "border-primary/30 hover:border-primary/60 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl"
                }`}
            >
              {isDragging && (
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/10 pointer-events-none"
                />
              )}

              <div className="flex flex-col items-center gap-6 relative z-10">
                <motion.div
                  animate={isDragging ? { y: [0, -10, 0], scale: 1.1 } : { y: 0, scale: 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center border border-primary/30 shadow-inner"
                >
                  <Upload className="w-10 h-10 text-primary" />
                </motion.div>

                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isDragging ? "Drop to initialize transfer" : "Drag asset here or browse"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">
                    Automated sanitization protocols will apply instantly.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-[0_4px_20px_0_rgba(20,184,166,0.4)] transition-all flex items-center gap-2"
                >
                  <FileType className="w-5 h-5" />
                  Select File
                </motion.button>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".sql,.csv,.json,.pdf,.docx,.txt,.png,.jpg,.jpeg,.bmp,.tiff,.tif,.webp"
                />
              </div>
            </div>

            {/* Selected File Area */}
            <AnimatePresence>
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, scale: 0.9 }}
                  className="glass-card space-y-6 overflow-hidden border-2 border-primary/30"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-accent" /> Active Asset
                    </h3>
                    <span className="text-xs font-mono bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">READY FOR PROTOCOL</span>
                  </div>

                  <div className="flex items-center gap-5 bg-background/50 p-4 rounded-xl border border-white/5">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
                      <FileType className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-lg truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">
                        {(selectedFile.size / 1024).toFixed(2)} KB • {selectedFile.type || "Unknown Type"}
                      </p>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  <AnimatePresence mode="wait">
                    {uploadState.status !== "idle" && uploadState.status !== "success" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 p-4 bg-secondary/30 rounded-xl border border-border"
                      >
                        <div className="flex justify-between text-sm font-bold tracking-wide">
                          <span className="text-primary flex items-center gap-2">
                            <Loader className="w-4 h-4 animate-spin" />
                            {uploadState.message}
                          </span>
                          <span className="text-foreground font-mono">{Math.round(uploadState.progress)}%</span>
                        </div>

                        <div className="h-3 bg-background rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary via-accent to-primary relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadState.progress}%` }}
                            transition={{ ease: "linear" }}
                          >
                            <motion.div
                              animate={{ x: ["-100%", "200%"] }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {uploadState.status === "success" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 p-5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500"
                      >
                        <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                        <span className="font-bold">{uploadState.message}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {uploadState.status === "idle" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpload}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-lg uppercase tracking-wider"
                    >
                      <ShieldAlert className="w-5 h-5" />
                      Execute Sanitization Protocol
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column: Information & Formats */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="glass-card bg-secondary/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">
                  Supported Vectors
                </h3>
                <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full font-bold tracking-wider">
                  8 FORMATS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FileFormatBadge format="SQL" icon="🗄️" desc="Database" />
                <FileFormatBadge format="JSON" icon="🧾" desc="Data" />
                <FileFormatBadge format="CSV" icon="📊" desc="Sheet" />
                <FileFormatBadge format="TXT" icon="📃" desc="Text" />
                <FileFormatBadge format="PDF" icon="📄" desc="Doc" />
                <FileFormatBadge format="DOCX" icon="📝" desc="Word" />
                <FileFormatBadge format="PNG" icon="🖼️" desc="Image" />
                <FileFormatBadge format="JPG" icon="📷" desc="Image" />
              </div>
            </div>

            <div className="glass-card border-l-4 border-l-accent relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-accent/10 rounded-full blur-xl group-hover:bg-accent/20 transition-colors" />
              <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Sanitization Method</h3>
              <p className="text-xs text-muted-foreground mb-4 font-medium leading-relaxed">
                The default processing engine uses <strong className="text-accent">Smart Sanitization</strong> to redact highly critical data and mask general PII while retaining analytic value. Adjust rules natively.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSanitizationMethod('smart')}
                  className={`flex-1 py-2 text-xs font-bold rounded shadow-md border transition-colors ${sanitizationMethod === 'smart' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-secondary text-foreground border-border'}`}
                >
                  Smart
                </button>
                <button
                  onClick={() => setSanitizationMethod('masking')}
                  className={`flex-1 py-2 text-xs font-bold rounded shadow-md border transition-colors ${sanitizationMethod === 'masking' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-secondary text-foreground border-border'}`}
                >
                  Masking
                </button>
                <button
                  onClick={() => setSanitizationMethod('redaction')}
                  className={`flex-1 py-2 text-xs font-bold rounded shadow-md border transition-colors ${sanitizationMethod === 'redaction' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-secondary text-foreground border-border'}`}
                >
                  Redaction
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </AdminLayout>
  );
}