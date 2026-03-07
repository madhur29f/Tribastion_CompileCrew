import { Upload, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { UserLayout } from "@/components/UserLayout";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function UserDashboard() {
  const navigate = useNavigate();

  return (
    <UserLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-3xl mx-auto space-y-8 py-8"
      >
        {/* Welcome Banner */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-5 bg-primary/10 rounded-full border border-primary/20 shadow-[0_0_40px_rgba(20,184,166,0.2)]">
            <ShieldCheck className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter">SecureData Platform</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto text-balance">
            Upload files containing sensitive data. Our PII detection engine will automatically identify and sanitize personal information.
          </p>
        </motion.div>

        {/* Upload CTA */}
        <motion.div
          variants={itemVariants}
          className="glass-card text-center space-y-6 border-2 border-primary/20 hover:border-primary/40 transition-colors"
        >
          <div className="p-4 bg-primary/5 rounded-2xl inline-block">
            <Upload className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Upload & Sanitize Files</h2>
            <p className="text-muted-foreground mt-2">
              Supported formats: CSV, TXT, JSON, SQL, PDF, DOCX, PNG, JPG, and more.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/user/upload")}
            className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg shadow-[0_4px_20px_0_rgba(20,184,166,0.4)] transition-all inline-flex items-center gap-3"
          >
            <Upload className="w-5 h-5" /> Start Upload
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card text-center space-y-3 p-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-foreground text-sm">Multi-Format Support</h3>
            <p className="text-xs text-muted-foreground">CSV, PDF, DOCX, SQL, JSON, images & more</p>
          </div>
          <div className="glass-card text-center space-y-3 p-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-bold text-foreground text-sm">PII Detection</h3>
            <p className="text-xs text-muted-foreground">Aadhaar, PAN, names, DOB, faces & more</p>
          </div>
          <div className="glass-card text-center space-y-3 p-6">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-bold text-foreground text-sm">Secure Download</h3>
            <p className="text-xs text-muted-foreground">Download sanitized, PII-free versions</p>
          </div>
        </motion.div>
      </motion.div>
    </UserLayout>
  );
}
