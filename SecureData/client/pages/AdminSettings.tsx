import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Save, Shield, User, Moon, Bell, Key, Database, GlobeLock, Lock } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function AdminSettings() {
    const [name, setName] = useState("admin1");
    const [email, setEmail] = useState("admin@securedata.com");
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [twoFactor, setTwoFactor] = useState(true);

    const handleSave = () => {
        alert("Configuration securely updated.");
    };

    return (
        <AdminLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-8 max-w-6xl mx-auto"
            >

                {/* Page Header */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">System Configuration</h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Manage global security policies and platform preferences
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-[0_4px_20px_0_rgba(20,184,166,0.3)]"
                    >
                        <Save className="w-5 h-5" />
                        Save Configuration
                    </motion.button>
                </motion.div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Visual Security Center (Left Sidebar) */}
                    <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                        <div className="glass-card relative overflow-hidden group border-2 border-primary/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 z-0" />

                            <img
                                src="/images/shield.png"
                                alt="Security Shield"
                                className="w-full object-cover rounded-xl z-10 relative shadow-2xl drop-shadow-[0_0_30px_rgba(20,184,166,0.6)] mix-blend-screen opacity-90 group-hover:scale-105 transition-transform duration-700"
                            />

                            <div className="relative z-20 mt-6 text-center space-y-2">
                                <h3 className="font-bold text-xl text-foreground flex items-center justify-center gap-2">
                                    <Lock className="w-5 h-5 text-primary" /> Core Defenses Active
                                </h3>
                                <p className="text-sm text-primary font-mono bg-primary/10 px-3 py-1 rounded-full border border-primary/20 inline-block">
                                    SYSTEM SECURE
                                </p>
                            </div>
                        </div>

                        <div className="glass-card space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Security Status</h3>

                            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                                <span className="text-sm font-medium flex items-center gap-2"><Key className="w-4 h-4 text-accent" /> Encryption</span>
                                <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded">AES-256 GCM</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                                <span className="text-sm font-medium flex items-center gap-2"><GlobeLock className="w-4 h-4 text-accent" /> Access Control</span>
                                <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded">ZERO-TRUST</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                                <span className="text-sm font-medium flex items-center gap-2"><Database className="w-4 h-4 text-accent" /> Data Residency</span>
                                <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded">US-EAST (ISOLATED)</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Settings Form (Right Content) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* ================= PROFILE SETTINGS ================= */}
                        <motion.div variants={itemVariants} className="glass-card space-y-6 border-l-4 border-l-primary hover:border-l-accent transition-colors">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Operator Profile</h2>
                                    <p className="text-sm text-muted-foreground">Manage administrative identity and contact channels</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Operator ID (Username)</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Secure Comm Channel (Email)</label>
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* ================= SECURITY SETTINGS ================= */}
                        <motion.div variants={itemVariants} className="glass-card space-y-6 border-l-4 border-l-destructive/80 hover:border-l-destructive transition-colors">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <Shield className="w-6 h-6 text-destructive" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Access & Authentication</h2>
                                    <p className="text-sm text-muted-foreground">Configure strict access protocols and MFA policies</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border hover:bg-secondary/40 transition-colors">
                                    <div>
                                        <p className="font-bold text-foreground">Require Multi-Factor Authentication</p>
                                        <p className="text-sm text-muted-foreground mt-1">Enforce biometric or token-based MFA for all administrative sessions.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                                        <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-xl text-foreground font-bold shadow-sm transition-all border border-border hover:border-primary/50">
                                        Rotate Encryption Keys
                                    </button>
                                    <button className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-xl text-foreground font-bold shadow-sm transition-all border border-border hover:border-primary/50">
                                        Update Master Password
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ================= NOTIFICATION SETTINGS ================= */}
                            <motion.div variants={itemVariants} className="glass-card space-y-6">
                                <div className="flex items-center gap-3 border-b border-border pb-4">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <Bell className="w-6 h-6 text-accent" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">Alerts</h2>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <p className="font-bold text-foreground">Incident Alerts</p>
                                        <p className="text-xs text-muted-foreground mt-1">Email on threat detection</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent shadow-inner"></div>
                                    </label>
                                </div>
                            </motion.div>

                            {/* ================= THEME SETTINGS ================= */}
                            <motion.div variants={itemVariants} className="glass-card space-y-6">
                                <div className="flex items-center gap-3 border-b border-border pb-4">
                                    <div className="p-2 bg-slate-300/10 rounded-lg">
                                        <Moon className="w-6 h-6 text-foreground" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">Interface</h2>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <p className="font-bold text-foreground">Night Operations Mode</p>
                                        <p className="text-xs text-muted-foreground mt-1">Force tactical dark theme</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-400 shadow-inner"></div>
                                    </label>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

            </motion.div>
        </AdminLayout>
    );
}