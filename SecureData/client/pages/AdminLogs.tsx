import { useState, useEffect } from "react";
import { Search, ChevronDown, Activity, ShieldAlert, DownloadCloud, LogIn, ShieldCheck, FileDown } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { logsAPI } from "@/lib/api";
import apiClient from "@/lib/api-client";

interface AuditLogEntry {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  file?: string;
  details: string;
  ipAddress: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await logsAPI.getLogs();
        setLogs(data.map((log: any, index: number) => ({
          id: index + 1,
          timestamp: new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          user: log.user,
          action: log.action,
          file: log.file || undefined,
          details: log.details,
          ipAddress: log.ipAddress,
        })));
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };
    fetchLogs();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("All Actions");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const actions = ["All Actions", "File Upload", "PII Detection", "File Download", "User Login"];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.file?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesAction = selectedAction === "All Actions" || log.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  const getActionStyles = (action: string) => {
    switch (action) {
      case "File Upload":
        return { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: <Activity className="w-4 h-4" /> };
      case "PII Detection":
        return { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", icon: <ShieldAlert className="w-4 h-4" /> };
      case "File Download":
        return { color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", icon: <DownloadCloud className="w-4 h-4" /> };
      case "User Login":
        return { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", icon: <LogIn className="w-4 h-4" /> };
      default:
        return { color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", icon: <ShieldCheck className="w-4 h-4" /> };
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
        {/* Page Header */}
        <motion.div variants={itemVariants} className="relative rounded-2xl glass-card py-8 px-10 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 p-0.5">
              <div className="w-full h-full bg-background rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight drop-shadow-md">Global Audit Trail</h1>
              <p className="text-muted-foreground mt-1 font-medium max-w-lg leading-relaxed">
                Immutable ledger of all system interactions, security events, and data access requests within the platform.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex gap-4 items-end">
            <div className="bg-background/80 backdrop-blur-md px-6 py-4 rounded-2xl text-center border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Events</p>
              <p className="text-3xl font-black text-foreground font-mono">{logs.length}</p>
            </div>
            <div className="bg-background/80 backdrop-blur-md px-6 py-4 rounded-2xl text-center border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Anomalies</p>
              <p className="text-3xl font-black text-red-500 font-mono">0</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await apiClient.get("/logs/export/siem", { responseType: "blob" });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "securedata_siem_audit.log";
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error("Failed to export SIEM logs:", err);
                }
              }}
              className="bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 backdrop-blur-md px-5 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all group shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-primary/20"
            >
              <FileDown className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Export CEF</p>
            </button>
          </div>
        </motion.div>

        {/* Activity Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card flex items-center gap-4 group hover:bg-white/5 transition-colors border-l-4 border-l-blue-500">
            <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform"><Activity className="w-6 h-6 text-blue-500" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ingestions</p>
              <p className="text-2xl font-black text-foreground font-mono">{logs.filter((l) => l.action === "File Upload").length}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-4 group hover:bg-white/5 transition-colors border-l-4 border-l-red-500">
            <div className="p-3 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform"><ShieldAlert className="w-6 h-6 text-red-500" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Detections</p>
              <p className="text-2xl font-black text-foreground font-mono">{logs.filter((l) => l.action === "PII Detection").length}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-4 group hover:bg-white/5 transition-colors border-l-4 border-l-green-500">
            <div className="p-3 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform"><DownloadCloud className="w-6 h-6 text-green-500" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Extractions</p>
              <p className="text-2xl font-black text-foreground font-mono">{logs.filter((l) => l.action === "File Download").length}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-4 group hover:bg-white/5 transition-colors border-l-4 border-l-yellow-500">
            <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:scale-110 transition-transform"><LogIn className="w-6 h-6 text-yellow-500" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Auth Events</p>
              <p className="text-2xl font-black text-foreground font-mono">{logs.filter((l) => l.action === "User Login").length}</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants} className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative group">
            <input
              type="text"
              placeholder="Query audit ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-sm shadow-sm group-hover:border-primary/50"
            />
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>

          <div className="flex flex-wrap gap-2 items-center bg-card/50 backdrop-blur-md border-2 border-border/50 rounded-xl p-1 px-2 shadow-sm">
            {actions.map((action) => (
              <button
                key={action}
                onClick={() => setSelectedAction(action)}
                className={`px-4 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider ${selectedAction === action
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
              >
                {action}
              </button>
            ))}
          </div>


        </motion.div>

        {/* Logs Table */}
        <motion.div variants={itemVariants} className="glass-card overflow-hidden p-0 border border-white/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/60">
                  <th className="px-6 py-5 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest w-40">Timestamp</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest w-48">Actor</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">Event Type</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">Target Object</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">Origin IP</th>
                  <th className="px-6 py-5 text-center text-[11px] font-black text-muted-foreground uppercase tracking-widest">Payload</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, i) => {
                    const styles = getActionStyles(log.action);
                    return (
                      <AnimatePresence key={log.id}>
                        <motion.tr
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`border-b border-white/5 hover:bg-secondary/40 transition-colors cursor-pointer ${expandedRow === log.id ? "bg-secondary/20" : ""}`}
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                        >
                          <td className="px-6 py-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary/80 to-accent/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
                                <span className="text-xs font-black text-white mix-blend-overlay">
                                  {log.user[0].toUpperCase()}
                                </span>
                              </div>
                              <span className="font-bold text-foreground text-xs">{log.user}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${styles.bg} ${styles.border} ${styles.color}`}>
                              {styles.icon}
                              <span className="text-[10px] font-black uppercase tracking-wider">{log.action}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {log.file ? <span className="font-mono bg-white/5 px-2 py-1 rounded border border-white/5 text-foreground/80">{log.file}</span> : <span className="text-muted-foreground/30 font-bold">—</span>}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground font-mono opacity-60 hover:opacity-100 transition-opacity">{log.ipAddress}</td>
                          <td className="px-6 py-4 text-sm text-center">
                            <button
                              className={`p-2 hover:bg-white/10 rounded-full transition-all ${expandedRow === log.id ? "bg-white/10 text-primary" : "text-muted-foreground"}`}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-300 ${expandedRow === log.id ? "rotate-180" : ""
                                  }`}
                              />
                            </button>
                          </td>
                        </motion.tr>

                        {expandedRow === log.id && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-b border-border bg-gradient-to-r from-transparent via-secondary/10 to-transparent"
                          >
                            <td colSpan={6} className="px-8 py-6">
                              <div className="flex gap-4 items-start">
                                <div className="w-1 bg-primary/50 h-full min-h-[40px] rounded-full" />
                                <div className="space-y-2 flex-1">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Encrypted Payload Data:</p>
                                  <div className="bg-[#0f111a] p-4 rounded-xl font-mono text-sm border border-white/5 text-green-400/80 shadow-inner relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded">JSON</span></div>
                                    {`{
  "event_id": "EVT-${Math.random().toString(36).substr(2, 9).toUpperCase()}",
  "severity": "info",
  "detail": "${log.details}",
  "agent": "SecureData Sanitization Engine v2.4.1"
}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold">No historical data matches the current parameters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-sm">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
              Showing {filteredLogs.length} of {logs.length} entries
            </p>
          </div>
        </motion.div>

      </motion.div>
    </AdminLayout>
  );
}
