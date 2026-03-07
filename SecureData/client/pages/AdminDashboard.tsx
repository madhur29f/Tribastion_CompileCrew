import { useState, useEffect } from "react";
import { ShieldAlert, Users, FileText, Zap, Upload, FileSearch } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { dashboardAPI, logsAPI } from "@/lib/api";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "red" | "purple" | "green";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const StatCard = ({ label, value, icon, color }: StatCard) => {
  const bgColors = {
    blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
    red: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-800/50",
    purple: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50",
    green: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-800/50",
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`glass-card border-t-4 border-t-current ${bgColors[color].split(" ")[3]} relative overflow-hidden group`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
        <div className="w-24 h-24">{icon}</div>
      </div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">
            {value === "-" ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ...
              </motion.span>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {value}
              </motion.span>
            )}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColors[color].split(" ").slice(0, 3).join(" ")} shadow-inner`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

interface AuditActivity {
  id: number;
  user: string;
  action: string;
  file?: string;
  time: string;
  type: "success" | "warning" | "info";
}

const RecentActivity = () => {
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await logsAPI.getLogs();
        // Take the most recent 6 entries
        const recent = data.slice(0, 6).map((log: any, i: number) => ({
          id: i + 1,
          user: log.user,
          action: log.action,
          file: log.file || undefined,
          time: new Date(log.timestamp).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          }),
          type: log.action === "PII Detection" || log.action === "DPDP_High_Risk_Alert"
            ? "warning" as const
            : log.action === "User Login"
              ? "info" as const
              : "success" as const,
        }));
        setActivities(recent);
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <motion.div variants={itemVariants} className="glass-card h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Recent Activity
        </h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-muted-foreground font-bold">
            Loading audit trail...
          </motion.div>
        </div>
      ) : activities.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No recent activity recorded.</p>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              key={activity.id}
              className="flex items-start gap-4 p-3 hover:bg-white/5 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 dark:hover:border-white/10"
            >
              <div
                className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_10px_currentColor] ${activity.type === "success" ? "bg-primary text-primary" :
                  activity.type === "warning" ? "bg-yellow-500 text-yellow-500" :
                    "bg-accent text-accent"
                  }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{activity.user}</span>
                  <span className={`badge-${activity.type}`}>{activity.action}</span>
                  {activity.file && <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{activity.file}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalFiles: 0,
    piiDetected: 0,
    activeUsers: 0,
    sanitizedDownloads: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">System Overview</h1>
            <p className="text-muted-foreground mt-2 font-medium">Real-time security metrics and system status.</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">System Operational</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Files Secured"
            value={isLoading ? "-" : stats.totalFiles}
            icon={<FileText className="w-8 h-8" />}
            color="blue"
          />
          <StatCard
            label="PII Threats Detected"
            value={isLoading ? "-" : stats.piiDetected}
            icon={<ShieldAlert className="w-8 h-8" />}
            color="red"
          />
          <StatCard
            label="Active Users"
            value={isLoading ? "-" : stats.activeUsers}
            icon={<Users className="w-8 h-8" />}
            color="purple"
          />
          <StatCard
            label="Sanitized Downloads"
            value={isLoading ? "-" : stats.sanitizedDownloads}
            icon={<FileText className="w-8 h-8" />}
            color="green"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <RecentActivity />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="glass-card">
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Quick Actions</h3>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/admin/upload")}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Initiate Secure Upload
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/admin/logs")}
                  className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-bold text-sm shadow-sm transition-all border border-border flex items-center justify-center gap-2"
                >
                  <FileSearch className="w-4 h-4" /> Access Audit Logs
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
