import { useState, useEffect } from "react";
import { UserLayout } from "@/components/UserLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    Fingerprint, ScrollText, Trash2, AlertTriangle, Hash, Clock,
    ShieldCheck, BarChart3, Eye, Share2, Loader, Check
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { consentAPI, type ConsentPreferences, type ConsentAuditEntry, type DeletionCertificate } from "@/lib/api";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ---------------------------------------------------------------------------
// Consent Dashboard Component (DPDP Act)
// ---------------------------------------------------------------------------
function ConsentDashboard() {
    const [preferences, setPreferences] = useState<ConsentPreferences>({
        analytics_consent: false,
        security_scanning_consent: true,
        pii_processing_consent: false,
        third_party_sharing_consent: false,
    });
    const [auditTrail, setAuditTrail] = useState<ConsentAuditEntry[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showForgetDialog, setShowForgetDialog] = useState(false);
    const [forgetting, setForgetting] = useState(false);
    const [deletionCert, setDeletionCert] = useState<DeletionCertificate | null>(null);

    // Load current consent preferences and audit trail
    useEffect(() => {
        const load = async () => {
            try {
                const [consentRes, auditRes] = await Promise.all([
                    consentAPI.getConsent(),
                    consentAPI.getAuditTrail(),
                ]);
                if (consentRes.preferences) {
                    setPreferences(consentRes.preferences);
                }
                setAuditTrail(auditRes);
            } catch (err) {
                console.error("Failed to load consent data:", err);
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleSaveConsent = async () => {
        setSaving(true);
        try {
            await consentAPI.updateConsent(preferences);
            const auditRes = await consentAPI.getAuditTrail();
            setAuditTrail(auditRes);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Failed to save consent:", err);
        }
        setSaving(false);
    };

    const handleForgetMe = async () => {
        setForgetting(true);
        try {
            const cert = await consentAPI.forgetMe();
            setDeletionCert(cert);
        } catch (err) {
            console.error("Failed to execute erasure:", err);
        }
        setForgetting(false);
    };

    const consentItems = [
        {
            key: "analytics_consent" as const,
            label: "Platform Analytics",
            desc: "Allow anonymized usage data for platform improvement",
            icon: BarChart3,
            color: "blue",
        },
        {
            key: "security_scanning_consent" as const,
            label: "Security Scanning",
            desc: "Permit security analysis of uploaded files via hash-based scanning",
            icon: ShieldCheck,
            color: "green",
        },
        {
            key: "pii_processing_consent" as const,
            label: "PII Processing",
            desc: "Authorize automated detection and sanitization of personal data",
            icon: Eye,
            color: "yellow",
        },
        {
            key: "third_party_sharing_consent" as const,
            label: "Third-Party Sharing",
            desc: "Allow sharing sanitized datasets with authorized third parties",
            icon: Share2,
            color: "purple",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 text-primary animate-spin" />
                <span className="ml-3 text-muted-foreground font-bold">Loading consent data...</span>
            </div>
        );
    }

    // If erasure was completed, show the certificate
    if (deletionCert) {
        return (
            <section className="glass-card border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-500/10 rounded-lg"><Check className="w-5 h-5 text-green-500" /></div>
                    <h2 className="text-2xl font-bold text-foreground">Certificate of Deletion</h2>
                </div>
                <div className="space-y-4 text-sm">
                    <div className="p-4 bg-background/50 rounded-xl border border-green-500/20">
                        <p className="font-mono text-green-400 mb-2">{deletionCert.message}</p>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Certificate ID</p>
                                <p className="font-mono text-foreground text-xs mt-1 break-all">{deletionCert.certificate_id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Erased At</p>
                                <p className="font-mono text-foreground text-xs mt-1">{new Date(deletionCert.erased_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Audit Logs Redacted</p>
                                <p className="font-mono text-foreground text-xs mt-1">{deletionCert.audit_logs_redacted}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Files Deleted</p>
                                <p className="font-mono text-foreground text-xs mt-1">{deletionCert.files_deleted}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            {/* DPDP Consent Preferences */}
            <section className="glass-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Fingerprint className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">DPDP Consent Preferences</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Digital Personal Data Protection Act — Granular Control</p>
                    </div>
                </div>

                <div className="space-y-3 relative z-10">
                    {consentItems.map((item) => {
                        const Icon = item.icon;
                        const isEnabled = preferences[item.key];
                        return (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-xl hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-${item.color}-500/10 rounded-full`}>
                                        <Icon className={`w-5 h-5 text-${item.color}-400`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground text-sm">{item.label}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPreferences(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? "bg-primary" : "bg-muted"}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={handleSaveConsent}
                    disabled={saving}
                    className={`mt-6 w-full px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        saved
                            ? "bg-green-500 text-white shadow-green-500/20"
                            : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 hover:-translate-y-0.5"
                    }`}
                >
                    {saving ? (
                        <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><Check className="w-4 h-4" /> Consent Recorded with Cryptographic Hash</>
                    ) : (
                        <><Fingerprint className="w-4 h-4" /> Save Consent Preferences</>
                    )}
                </button>
            </section>

            {/* Consent Audit Trail */}
            <section className="glass-card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <ScrollText className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Consent Audit Trail</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Tamper-proof cryptographic record of all consent changes</p>
                    </div>
                </div>

                {auditTrail.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No consent records yet</p>
                        <p className="text-sm mt-1">Save your consent preferences to create the first record</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-border/50">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-background/80">
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        <Clock className="w-3 h-3 inline mr-1" />Timestamp
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        <Hash className="w-3 h-3 inline mr-1" />SHA-256 Hash
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        Snapshot
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditTrail.map((entry) => (
                                    <tr key={entry.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-foreground whitespace-nowrap">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="text-[11px] font-mono text-primary bg-primary/5 px-2 py-1 rounded break-all">
                                                {entry.consent_hash}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(entry.consent_snapshot).map(([key, val]) => (
                                                    <span
                                                        key={key}
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            val
                                                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                        }`}
                                                    >
                                                        {key.replace(/_/g, " ").replace("consent", "").trim()}:
                                                        {val ? " ✓" : " ✗"}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Right to be Forgotten */}
            <section className="glass-card border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-destructive/10 rounded-lg border border-destructive/20">
                        <Trash2 className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Right to be Forgotten</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">DPDP Act — Irreversible Data Erasure</p>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Exercise your right under the Digital Personal Data Protection Act to permanently erase all your personal data.
                    This action is <strong className="text-destructive">irreversible</strong> and will:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-6 ml-4">
                    <li>• Cryptographically scramble your profile data</li>
                    <li>• Permanently delete all your uploaded files</li>
                    <li>• Redact your identity from audit logs</li>
                    <li>• Generate a Certificate of Deletion</li>
                </ul>

                {!showForgetDialog ? (
                    <button
                        onClick={() => setShowForgetDialog(true)}
                        className="px-6 py-3 border-2 border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Request Data Erasure
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-destructive/5 border border-destructive/30 rounded-xl"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <p className="font-bold text-destructive">This action cannot be undone!</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleForgetMe}
                                disabled={forgetting}
                                className="px-6 py-2.5 bg-destructive hover:bg-destructive/90 text-white rounded-lg font-bold transition-all flex items-center gap-2"
                            >
                                {forgetting ? (
                                    <><Loader className="w-4 h-4 animate-spin" /> Erasing...</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" /> Confirm Permanent Erasure</>
                                )}
                            </button>
                            <button
                                onClick={() => setShowForgetDialog(false)}
                                className="px-6 py-2.5 border border-border rounded-lg font-bold text-muted-foreground hover:bg-secondary transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </section>
        </>
    );
}

// ---------------------------------------------------------------------------
// Main Settings Page — Only DPDP Consent (functional backend)
// ---------------------------------------------------------------------------
export default function UserSettings() {
    const { username } = useAuth();

    return (
        <UserLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-4xl mx-auto space-y-8"
            >
                {/* Page Header */}
                <motion.div variants={itemVariants} className="pb-6 border-b border-white/10">
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">DPDP Consent & Privacy</h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Manage your data privacy preferences under the Digital Personal Data Protection Act
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-xs font-mono bg-secondary px-2 py-1 rounded border border-border">Signed in as: {username || "User"}</span>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-8">
                    <ConsentDashboard />
                </motion.div>
            </motion.div>
        </UserLayout>
    );
}
