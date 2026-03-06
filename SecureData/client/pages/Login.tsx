import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import * as api from "../../shared/api";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.login({ username, password });
      console.log("LOGIN RESPONSE:", response);

      // Store auth data
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userRole", response.role);
      localStorage.setItem("userId", response.user_id.toString());
      localStorage.setItem("username", response.username);

      // Redirect based on role
      if (response.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
      window.location.reload();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20 dark:opacity-40">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-3xl"
        />
      </div>

      {/* Left Side - Information Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-md w-full glass-card border-none bg-black/10 dark:bg-black/30 backdrop-blur-2xl p-10 mt-10"
        >
          <div className="flex items-center gap-4 mb-10">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
            >
              <ShieldAlert className="w-7 h-7 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">SecureData</h1>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Sanitization Platform</p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-foreground leading-snug">
              Enterprise-Grade <br />
              <span className="text-primary">Data Protection</span>
            </h2>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {[
                {
                  title: "Advanced NLP Detection",
                  desc: "Automatically identify and classify sensitive PII across diverse datasets."
                },
                {
                  title: "Zero-Trust Architecture",
                  desc: "Strict role-based access control ensures data is only available to authorized personnel."
                },
                {
                  title: "Immutable Audit Trail",
                  desc: "Comprehensive logging of all interactions for regulatory compliance."
                }
              ].map((feature, i) => (
                <motion.div key={i} variants={itemVariants} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 dark:hover:border-white/10">
                  <div className="mt-1 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10 w-full lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="glass-card sm:p-10 border-primary/20 shadow-2xl relative">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "anticipate" }}
              className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary via-accent to-primary origin-left rounded-t-xl"
            />

            <div className="mb-8 text-center sm:text-left pt-2">
              <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                Welcome back
              </h2>
              <p className="text-muted-foreground">
                Authenticate to access the secure portal
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg overflow-hidden"
                >
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive font-medium">{error}</div>
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Username</label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field shadow-inner"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field shadow-inner"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign In to Workspace
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 p-5 bg-background/50 border border-white/10 dark:border-white/5 rounded-xl backdrop-blur-sm"
            >
              <p className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Demo Credentials</p>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between items-center bg-card/50 p-2 rounded border border-border">
                  <span className="text-primary font-bold">Admin</span>
                  <span className="text-foreground">admin1 / secure@123</span>
                </div>
                <div className="flex justify-between items-center bg-card/50 p-2 rounded border border-border">
                  <span className="text-accent font-bold">User</span>
                  <span className="text-foreground">john_doe / secure@123</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
