import { useState, useEffect } from "react";
import { UserPlus, Edit2, Trash2, Search, Users, Shield, Clock, Plus, X } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { usersAPI } from "@/lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  role: "Admin" | "Standard";
  lastLogin: string;
  status: "Active" | "Inactive";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<{ username: string, email: string, role: "Admin" | "Standard" }>({
    username: "",
    email: "",
    role: "Standard",
  });

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getUsers();
      setUsers(data.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role as "Admin" | "Standard",
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never",
        status: u.status as "Active" | "Inactive",
      })));
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async () => {
    if (newUser.username && newUser.email) {
      try {
        await usersAPI.addUser(newUser.username, newUser.email, newUser.role);
        setNewUser({ username: "", email: "", role: "Standard" });
        setShowAddModal(false);
        await fetchUsers();
      } catch (error) {
        console.error("Failed to add user:", error);
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm("Execute termination sequence for this user?")) {
      try {
        await usersAPI.deleteUser(id);
        await fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const handleToggleRole = async (id: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newRole = user.role === "Admin" ? "Standard" : "Admin";
    try {
      await usersAPI.updateUser(id, newRole);
      await fetchUsers();
    } catch (error) {
      console.error("Failed to update user role:", error);
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
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                <Users className="w-8 h-8 text-primary" />
              </div>
              Access Control
            </h1>
            <p className="text-muted-foreground mt-3 font-medium text-lg">Manage platform operatives and clearance levels</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="group flex items-center gap-3 px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transform hover:-translate-y-1"
          >
            <span className="bg-white/20 p-1.5 rounded-full group-hover:rotate-90 transition-transform">
              <Plus className="w-5 h-5 text-white" />
            </span>
            Provision Operative
          </button>
        </motion.div>

        {/* Global Stats Matrix */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-primary/10 group-hover:scale-110 transition-transform group-hover:text-primary/20"><Users className="w-32 h-32" /></div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Operatives</p>
              <p className="text-5xl font-black text-foreground">{users.length}</p>
            </div>
          </div>
          <div className="glass-card relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-purple-500/10 group-hover:scale-110 transition-transform group-hover:text-purple-500/20"><Shield className="w-32 h-32" /></div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Admin Clearance</p>
              <p className="text-5xl font-black text-purple-400">{users.filter(u => u.role === 'Admin').length}</p>
            </div>
          </div>
          <div className="glass-card relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-yellow-500/10 group-hover:scale-110 transition-transform group-hover:text-yellow-500/20"><Clock className="w-32 h-32" /></div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Active Sessions</p>
              <p className="text-5xl font-black text-yellow-400">{users.filter(u => u.status === 'Active').length}</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants} className="relative group max-w-2xl">
          <input
            type="text"
            placeholder="Scan directory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-background/50 backdrop-blur-sm border-2 border-border/50 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-base shadow-lg group-hover:border-primary/50"
          />
          <Search className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </motion.div>

        {/* Users Table */}
        <motion.div variants={itemVariants} className="glass-card overflow-hidden p-0 border border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-background/40 backdrop-blur-sm">
                  <th className="px-8 py-6 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">Identity Record</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">Protocol Email</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">Clearance Level</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">Last Authentication</th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">Status Node</th>
                  <th className="px-8 py-6 text-right text-[11px] font-black text-muted-foreground uppercase tracking-widest">Directives</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, i) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={user.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg font-black text-lg ${user.role === 'Admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white'}`}>
                              {user.username[0].toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${user.status === 'Active' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                          </div>
                          <div>
                            <span className="font-bold text-foreground text-sm tracking-tight">{user.username}</span>
                            <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">UID: {String(user.id).padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-mono text-muted-foreground-lighter">{user.email}</td>
                      <td className="px-8 py-5 text-sm">
                        <span
                          className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${user.role === "Admin"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs font-mono text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">{user.lastLogin}</td>
                      <td className="px-8 py-5 text-sm">
                        <span
                          className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest flex w-max items-center gap-1.5 border ${user.status === "Active"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-muted text-muted-foreground border-border"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,1)]' : 'bg-muted-foreground'}`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleRole(user.id)}
                            title="Modify Clearance"
                            className="p-2.5 hover:bg-purple-500 text-purple-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-purple-500 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            title="Terminate Operative"
                            className="p-2.5 hover:bg-destructive text-destructive hover:text-white rounded-xl transition-all border border-transparent hover:border-destructive shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <Users className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold text-lg">Directory Empty.</p>
                      <p className="text-sm text-muted-foreground/60 mt-2">No operatives match the assigned scan parameters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          <div className="px-8 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
              {filteredUsers.length} Record{filteredUsers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </motion.div>

        {/* Add User Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0f111a] rounded-3xl p-8 max-w-md w-full border border-primary/20 shadow-[0_0_40px_rgba(20,184,166,0.2)] isolate"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
                    <UserPlus className="w-8 h-8 text-primary" /> Provision
                  </h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Designation Handle</label>
                    <input
                      type="text"
                      placeholder="E.g. operative_zero"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Protocol Routing (Email)</label>
                    <input
                      type="email"
                      placeholder="operative@secure.net"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Clearance Level</label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value as "Admin" | "Standard" })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                      <option value="Standard">Standard (L1/L2)</option>
                      <option value="Admin">Administrator (L5)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleAddUser}
                      disabled={!newUser.username || !newUser.email}
                      className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/20 disabled:text-primary/50 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-primary/50"
                    >
                      AUTHORIZE PROVISIONING
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AdminLayout>
  );
}
