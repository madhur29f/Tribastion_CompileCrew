import { useState, useEffect } from "react";
import { Eye, Filter } from "lucide-react";
import { UserLayout } from "@/components/UserLayout";

interface SanitizedRecord {
  id: number;
  name: string;
  phone: string;
  email: string;
  pan: string;
  address: string;
}

export default function UserDashboard() {
  const [records, setRecords] = useState<SanitizedRecord[]>([
    {
      id: 1,
      name: "Aarav Mehta",
      phone: "+91 9876****",
      email: "a***@gmail.com",
      pan: "[REDACTED]",
      address: "42 MG Road, Bangalore, Karnataka 560001",
    },
    {
      id: 2,
      name: "Priya Sharma",
      phone: "+91 9876****",
      email: "p***@gmail.com",
      pan: "[REDACTED]",
      address: "15 Park Street, Mumbai, Maharashtra 400001",
    },
    {
      id: 3,
      name: "Rahul Kumar",
      phone: "+91 9876****",
      email: "r***@gmail.com",
      pan: "[REDACTED]",
      address: "89 Brigade Road, Chennai, Tamil Nadu 600001",
    },
    {
      id: 4,
      name: "Ananya Patel",
      phone: "+91 9876****",
      email: "a***@gmail.com",
      pan: "[REDACTED]",
      address: "23 Residency Road, Pune, Maharashtra 411001",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState<SanitizedRecord[]>(records);

  useEffect(() => {
    const filtered = records.filter(
      (record) =>
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRecords(filtered);
  }, [searchTerm]);

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Page Header with Alert */}
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-primary/30 rounded-lg flex items-start gap-3">
            <Eye className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary">Protected Data View</p>
              <p className="text-sm text-primary/80 mt-0.5">
                All sensitive PII information has been removed or masked for your protection. You only have access to sanitized data.
              </p>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Sanitized Data</h1>
            <p className="text-muted-foreground mt-1">View and search through sanitized records</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-2.5 border border-border rounded-lg hover:bg-secondary transition-all font-medium">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Data Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">PAN</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-secondary/50 transition-all">
                      <td className="px-6 py-4 text-sm text-foreground">{record.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{record.phone}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{record.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="badge-danger">{record.pan}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{record.address}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">No records found matching your search</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {filteredRecords.length} of {records.length} records
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-all text-sm font-medium">
                Previous
              </button>
              <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-all text-sm font-medium">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Data Protection Legend */}
        <div className="glass-card grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <p className="font-semibold text-foreground">Masked</p>
            </div>
            <p className="text-xs text-muted-foreground">+91 9876**** (Partially hidden)</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <p className="font-semibold text-foreground">Redacted</p>
            </div>
            <p className="text-xs text-muted-foreground">[REDACTED] (Fully removed)</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-purple-400" />
              <p className="font-semibold text-foreground">Tokenized</p>
            </div>
            <p className="text-xs text-muted-foreground">TOKEN_A7X9K (Unique token)</p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
