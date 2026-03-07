import { AdminLayout } from "@/components/AdminLayout";
import { Shield, Key, Database, GlobeLock, Lock } from "lucide-react";
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AdminSettings() {
    return (
        <AdminLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-8 max-w-4xl mx-auto"
            >
                {/* Page Header */}
                <motion.div variants={itemVariants}>
                    <h1 className="text-4xl font-extrabold text-foreground tracking-tight">System Configuration</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Platform security status and infrastructure overview
                    </p>
                </motion.div>

                {/* Security Visual */}
                <motion.div variants={itemVariants} className="glass-card relative overflow-hidden group border-2 border-primary/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 z-0" />

                    <img
                        src="/images/shield.png"
                        alt="Security Shield"
                        className="w-full max-w-xs mx-auto object-cover rounded-xl z-10 relative shadow-2xl drop-shadow-[0_0_30px_rgba(20,184,166,0.6)] mix-blend-screen opacity-90 group-hover:scale-105 transition-transform duration-700"
                    />

                    <div className="relative z-20 mt-6 text-center space-y-2">
                        <h3 className="font-bold text-xl text-foreground flex items-center justify-center gap-2">
                            <Lock className="w-5 h-5 text-primary" /> Core Defenses Active
                        </h3>
                        <p className="text-sm text-primary font-mono bg-primary/10 px-3 py-1 rounded-full border border-primary/20 inline-block">
                            SYSTEM SECURE
                        </p>
                    </div>
                </motion.div>

                {/* Security Status */}
                <motion.div variants={itemVariants} className="glass-card space-y-4">
                    <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Security Infrastructure</h2>
                            <p className="text-sm text-muted-foreground">Active security measures protecting the platform</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                            <span className="text-sm font-medium flex items-center gap-3">
                                <Key className="w-5 h-5 text-accent" /> Data Encryption
                            </span>
                            <span className="text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">AES-256 GCM</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                            <span className="text-sm font-medium flex items-center gap-3">
                                <GlobeLock className="w-5 h-5 text-accent" /> Access Control
                            </span>
                            <span className="text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">RBAC + JWT</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                            <span className="text-sm font-medium flex items-center gap-3">
                                <Database className="w-5 h-5 text-accent" /> PII Detection Engine
                            </span>
                            <span className="text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">PRESIDIO NLP</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                            <span className="text-sm font-medium flex items-center gap-3">
                                <Shield className="w-5 h-5 text-accent" /> File Scanning
                            </span>
                            <span className="text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">VIRUSTOTAL + CDR</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                            <span className="text-sm font-medium flex items-center gap-3">
                                <Lock className="w-5 h-5 text-accent" /> DPDP Compliance
                            </span>
                            <span className="text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">CONSENT + ERASURE</span>
                        </div>
                    </div>
                </motion.div>

            </motion.div>
        </AdminLayout>
    );
}