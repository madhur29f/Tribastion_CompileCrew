import { useState } from "react";
import { UserLayout } from "@/components/UserLayout";
import { motion } from "framer-motion";
import { User as UserIcon, Shield, Bell, Key, Smartphone, MonitorSmartphone, Activity, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function UserSettings() {
    const { username } = useAuth();

    const [profileForm, setProfileForm] = useState({
        name: username || "Standard User",
        email: "user@company.com",
        department: "Data Analysis",
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        newDownloads: true,
        securityWarnings: true,
        weeklyDigest: false,
    });

    const [mfaEnabled, setMfaEnabled] = useState(true);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <UserLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-5xl mx-auto space-y-8"
            >
                {/* Page Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter">Account Setup</h1>
                        <p className="text-muted-foreground mt-2 font-medium">Manage your operative profile and security parameters</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${isSaved
                                ? 'bg-green-500 text-white shadow-green-500/20'
                                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30 hover:-translate-y-1'
                            }`}
                    >
                        {isSaved ? <><Check className="w-5 h-5" /> Saved Securely</> : 'Commit Changes'}
                    </button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar nav for settings (visual only) */}
                    <motion.div variants={itemVariants} className="space-y-4 lg:col-span-1">
                        <div className="glass-card p-4 space-y-1">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold transition-all">
                                <UserIcon className="w-5 h-5" /> Identity Profile
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground font-medium transition-all">
                                <Shield className="w-5 h-5" /> Security & Auth
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground font-medium transition-all">
                                <Bell className="w-5 h-5" /> Notifications
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground font-medium transition-all">
                                <MonitorSmartphone className="w-5 h-5" /> Active Sessions
                            </button>
                        </div>

                        <div className="glass-card p-6 border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent">
                            <div className="flex items-center gap-3 mb-2">
                                <Check className="w-5 h-5 text-green-500" />
                                <h4 className="font-bold text-foreground">Account Status</h4>
                            </div>
                            <p className="text-sm font-mono text-green-400">ACTIVE & SECURE</p>
                            <p className="text-xs text-muted-foreground mt-2">Last login: 12 mins ago from IP 192.168.1.1</p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                        {/* Profile Section */}
                        <section className="glass-card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/10 rounded-lg"><UserIcon className="w-5 h-5 text-blue-500" /></div>
                                <h2 className="text-2xl font-bold text-foreground">Identity Profile</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-6 items-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-4 border-background flex items-center justify-center shadow-xl">
                                        <span className="text-3xl font-black text-white">{profileForm.name[0]}</span>
                                    </div>
                                    <div>
                                        <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-bold text-foreground transition-colors border border-border">Change Avatar</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="input-field bg-background/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Routing Email</label>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="input-field bg-background/50"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Department</label>
                                        <input
                                            type="text"
                                            value={profileForm.department}
                                            onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                                            className="input-field bg-background/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Security Section */}
                        <section className="glass-card relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="p-2 bg-primary/10 rounded-lg"><Shield className="w-5 h-5 text-primary" /></div>
                                <h2 className="text-2xl font-bold text-foreground">Authentication & MFA</h2>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-secondary rounded-full"><Smartphone className="w-6 h-6 text-foreground" /></div>
                                        <div>
                                            <h4 className="font-bold text-foreground">Authenticator App Required</h4>
                                            <p className="text-sm text-muted-foreground">Use a TOTP application for 2FA</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setMfaEnabled(!mfaEnabled)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${mfaEnabled ? "bg-primary" : "bg-muted"
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mfaEnabled ? "translate-x-6" : "translate-x-1"
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-secondary rounded-full"><Key className="w-6 h-6 text-foreground" /></div>
                                        <div>
                                            <h4 className="font-bold text-foreground">Passkey Authentication</h4>
                                            <p className="text-sm text-muted-foreground">Use biometric hardware tokens</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 border border-border rounded-lg text-sm font-bold hover:bg-secondary transition-colors">Configure</button>
                                </div>
                            </div>
                        </section>

                        {/* Notifications Section */}
                        <section className="glass-card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-yellow-500/10 rounded-lg"><Bell className="w-5 h-5 text-yellow-500" /></div>
                                <h2 className="text-2xl font-bold text-foreground">Alert Protocols</h2>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: 'emailAlerts', label: 'Global Email Alerts', desc: 'Receive critical system updates via email.' },
                                    { id: 'newDownloads', label: 'Vault Additions', desc: 'Notify when new sanitized datasets are ready.' },
                                    { id: 'securityWarnings', label: 'Security Anomalies', desc: 'Alert immediately on unrecognized login attempts.' },
                                    { id: 'weeklyDigest', label: 'Weekly Activity Digest', desc: 'Receive a summary of platform usage.' }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm">{item.label}</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${notifications[item.id as keyof typeof notifications] ? "bg-primary" : "bg-muted"
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${notifications[item.id as keyof typeof notifications] ? "translate-x-5" : "translate-x-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </motion.div>
                </div>
            </motion.div>
        </UserLayout>
    );
}
