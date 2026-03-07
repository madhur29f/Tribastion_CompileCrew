import { useState, useEffect } from "react";
import { Eye, Download, Trash2, Search, HardDrive, ShieldCheck, AlertTriangle, ShieldAlert, Gauge } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { filesAPI } from "@/lib/api";

interface FileRecord {
  id: number;
  name: string;
  uploadDate: string;
  uploadedBy: string;
  status: "Completed" | "Processing" | "Failed";
  piiDetected: number;
  piiRiskScore: number;
  dataClassificationTier: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const getRiskColor = (score: number) => {
  if (score >= 75) return { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/30", glow: "shadow-red-500/20" };
  if (score >= 50) return { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500/30", glow: "shadow-orange-500/20" };
  if (score >= 25) return { bg: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30", glow: "shadow-yellow-500/20" };
  return { bg: "bg-green-500", text: "text-green-400", border: "border-green-500/30", glow: "shadow-green-500/20" };
};

const getTierBadge = (tier: string) => {
  switch (tier) {
    case "Strictly Confidential":
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-500/10">
          <ShieldAlert className="w-3 h-3" /> Strictly Conf.
        </span>
      );
    case "Confidential":
      return (
        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
          Confidential
        </span>
      );
    case "Internal":
      return (
        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
          Internal
        </span>
      );
    default:
      return (
        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
          Public
        </span>
      );
  }
};

export default function AdminFiles() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFiles, setFilteredFiles] = useState<FileRecord[]>([]);

  const fetchFiles = async () => {
    try {
      const data = await filesAPI.getFiles();
      const mapped = data.map((f: any) => ({
        id: f.id,
        name: f.name,
        uploadDate: new Date(f.uploadDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        uploadedBy: f.uploadedBy,
        status: f.status as FileRecord["status"],
        piiDetected: f.piiDetected,
        piiRiskScore: f.piiRiskScore ?? 0,
        dataClassificationTier: f.dataClassificationTier ?? "Public",
      }));
      setFiles(mapped);
      setFilteredFiles(mapped);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = files.filter(
      (file) =>
        file.name.toLowerCase().includes(term.toLowerCase()) ||
        file.uploadedBy.toLowerCase().includes(term.toLowerCase()) ||
        file.dataClassificationTier.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredFiles(filtered);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Execute deletion protocol for this asset?")) {
      try {
        await filesAPI.deleteFile(id);
        await fetchFiles();
      } catch (error) {
        console.error("Failed to delete file:", error);
      }
    }
  };

  const getStatusBadge = (status: FileRecord["status"]) => {
    switch (status) {
      case "Completed":
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20">Secured</span>;
      case "Processing":
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20 animate-pulse">Running</span>;
      case "Failed":
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/20">Failed</span>;
    }
  };

  // Stats
  const avgRisk = files.length > 0 ? Math.round(files.reduce((s, f) => s + f.piiRiskScore, 0) / files.length) : 0;
  const criticalCount = files.filter(f => f.dataClassificationTier === "Strictly Confidential").length;

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6 max-w-7xl mx-auto"
      >
        {/* Animated Visual Header */}
        <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden h-40 shadow-2xl group border border-white/10 flex items-center">
          <div className="absolute inset-0 bg-background/80 z-10" />
          <motion.img
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
            src="/images/abstract.png"
            alt="Data Visualization"
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 mix-blend-screen"
          />

          {/* Header Content */}
          <div className="relative z-20 px-8 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight drop-shadow-md">
                Vault Inventory
              </h1>
              <p className="text-muted-foreground mt-1 font-medium drop-shadow">
                Manage, audit, and retrieve sanitized data assets.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="bg-background/50 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <HardDrive className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Assets</p>
                  <p className="font-mono font-bold text-foreground">{files.length}</p>
                </div>
              </div>
              <div className="bg-background/50 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <Gauge className="w-6 h-6 text-accent" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Avg Risk</p>
                  <p className={`font-mono font-bold ${getRiskColor(avgRisk).text}`}>{avgRisk}/100</p>
                </div>
              </div>
              {criticalCount > 0 && (
                <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-red-400/80">Critical</p>
                    <p className="font-mono font-bold text-red-400">{criticalCount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <input
              type="text"
              placeholder="Query asset registry..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-sm shadow-sm group-hover:border-primary/50"
            />
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
        </motion.div>

        {/* Asset Table */}
        <motion.div variants={itemVariants} className="glass-card overflow-hidden border-2 border-primary/20 p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Pointer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Originator</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-destructive uppercase tracking-wider">
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> PII</span>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="flex items-center justify-center gap-1"><Gauge className="w-3 h-3" /> Risk Score</span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Classification</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file, i) => {
                    const riskColors = getRiskColor(file.piiRiskScore);
                    return (
                      <motion.tr
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={file.id}
                        className="border-b border-white/5 hover:bg-secondary/40 transition-colors group"
                      >
                        <td className="px-6 py-5 text-sm font-bold text-foreground font-mono flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${file.status === 'Completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : file.status === 'Processing' ? 'bg-accent shadow-[0_0_10px_rgba(20,184,166,0.5)] animate-pulse' : 'bg-destructive'}`} />
                          {file.name}
                        </td>
                        <td className="px-6 py-5 text-sm text-muted-foreground font-mono">{file.uploadDate}</td>
                        <td className="px-6 py-5 text-sm text-muted-foreground">
                          <span className="bg-white/5 px-2 py-1 rounded font-mono text-xs border border-white/10">{file.uploadedBy}</span>
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(file.status)}
                        </td>
                        <td className="px-6 py-5 text-sm font-black text-destructive font-mono">{file.piiDetected > 0 ? file.piiDetected : '-'}</td>

                        {/* Risk Score Column */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`font-mono font-black text-sm ${riskColors.text}`}>
                              {file.piiRiskScore}
                            </span>
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${riskColors.bg} transition-all duration-700`}
                                style={{ width: `${file.piiRiskScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Classification Tier */}
                        <td className="px-6 py-5">
                          {getTierBadge(file.dataClassificationTier)}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button
                              title="Inspect"
                              className="p-2 hover:bg-primary text-primary hover:text-white rounded-lg transition-all border border-transparent hover:border-primary shadow-sm hover:shadow-primary/30"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              title="Download Package"
                              disabled={file.status !== 'Completed'}
                              className="p-2 hover:bg-accent text-accent hover:text-white rounded-lg transition-all border border-transparent hover:border-accent shadow-sm hover:shadow-accent/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-accent disabled:hover:border-transparent"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              title="Terminate Asset"
                              className="p-2 hover:bg-destructive text-destructive hover:text-white rounded-lg transition-all border border-transparent hover:border-destructive shadow-sm hover:shadow-destructive/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <HardDrive className="w-12 h-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-bold">No assets found matching query.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredFiles.length > 0 && (
            <div className="px-6 py-4 bg-secondary/20 flex items-center justify-between border-t border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Showing {filteredFiles.length} of {files.length} ASSETS
              </p>
            </div>
          )}
        </motion.div>

      </motion.div>
    </AdminLayout>
  );
}
