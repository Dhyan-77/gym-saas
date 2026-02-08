import { useState } from "react";
import Navigation from "../components/Navigation";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function Subscriptions() {
  // Mock data - sorted by days remaining (ascending)
  const members = [
    {
      id: "5",
      name: "David Brown",
      email: "david@example.com",
      phone: "(555) 567-8901",
      plan: "Premium",
      endDate: "2026-01-15",
      daysRemaining: -21,
      status: "expired",
    },
    {
      id: "6",
      name: "Lisa Anderson",
      email: "lisa@example.com",
      phone: "(555) 678-9012",
      plan: "Standard",
      endDate: "2026-02-07",
      daysRemaining: 2,
      status: "expiring",
    },
    {
      id: "7",
      name: "Robert Taylor",
      email: "robert@example.com",
      phone: "(555) 789-0123",
      plan: "VIP",
      endDate: "2026-02-09",
      daysRemaining: 4,
      status: "expiring",
    },
    {
      id: "8",
      name: "Jennifer Lee",
      email: "jennifer@example.com",
      phone: "(555) 890-1234",
      plan: "Standard",
      endDate: "2026-02-10",
      daysRemaining: 5,
      status: "expiring",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "(555) 234-5678",
      plan: "Standard",
      endDate: "2026-02-15",
      daysRemaining: 10,
      status: "expiring",
    },
    {
      id: "4",
      name: "Emily Wilson",
      email: "emily@example.com",
      phone: "(555) 456-7890",
      plan: "Standard",
      endDate: "2026-02-20",
      daysRemaining: 15,
      status: "expiring",
    },
    {
      id: "3",
      name: "Mike Davis",
      email: "mike@example.com",
      phone: "(555) 345-6789",
      plan: "VIP",
      endDate: "2026-02-28",
      daysRemaining: 23,
      status: "active",
    },
    {
      id: "1",
      name: "John Smith",
      email: "john@example.com",
      phone: "(555) 123-4567",
      plan: "Premium",
      endDate: "2026-03-01",
      daysRemaining: 24,
      status: "active",
    },
  ];

  const [selectedTab, setSelectedTab] = useState("all");

  const filteredMembers = members.filter((member) => {
    if (selectedTab === "expiring") return member.status === "expiring";
    if (selectedTab === "expired") return member.status === "expired";
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "expired":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "expiring":
        return <Clock className="w-5 h-5 text-orange-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Gradient background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Subscription Status
          </h1>
          <p className="text-gray-400">Monitor member subscriptions and renewals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="text-gray-400 text-sm">Expired</div>
            </div>
            <div className="text-3xl text-red-400">
              {members.filter((m) => m.status === "expired").length}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <div className="text-gray-400 text-sm">Expiring Soon ({"<"}7 days)</div>
            </div>
            <div className="text-3xl text-orange-400">
              {members.filter((m) => m.daysRemaining > 0 && m.daysRemaining < 7).length}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-gray-400 text-sm">Active</div>
            </div>
            <div className="text-3xl text-green-400">
              {members.filter((m) => m.status === "active").length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 mb-6 inline-flex">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-6 py-2 rounded-xl transition-all ${
              selectedTab === "all"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Members
          </button>
          <button
            onClick={() => setSelectedTab("expiring")}
            className={`px-6 py-2 rounded-xl transition-all ${
              selectedTab === "expiring"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Expiring Soon
          </button>
          <button
            onClick={() => setSelectedTab("expired")}
            className={`px-6 py-2 rounded-xl transition-all ${
              selectedTab === "expired"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Expired
          </button>
        </div>

        {/* Members List */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Priority</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Member</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Contact</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Plan</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">End Date</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Days Remaining</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className={`border-b border-white/5 transition-colors ${
                      member.status === "expired"
                        ? "bg-red-500/5 hover:bg-red-500/10"
                        : member.daysRemaining < 7
                        ? "bg-orange-500/5 hover:bg-orange-500/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(member.status)}
                        <span className="text-gray-400">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{member.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      <div className="text-sm">{member.email}</div>
                      <div className="text-xs text-gray-500">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 bg-white/10 rounded-lg text-sm">
                        {member.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{member.endDate}</td>
                    <td className="px-6 py-4">
                      <div
                        className={`${
                          member.daysRemaining < 0
                            ? "text-red-400"
                            : member.daysRemaining < 7
                            ? "text-orange-400"
                            : "text-green-400"
                        }`}
                      >
                        {member.daysRemaining < 0
                          ? `${Math.abs(member.daysRemaining)} days overdue`
                          : `${member.daysRemaining} days`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs ${
                          member.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : member.status === "expiring"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Box */}
        {members.filter((m) => m.daysRemaining < 7 && m.daysRemaining > 0).length > 0 && (
          <div className="mt-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg mb-2 text-orange-400">Action Required</h3>
                <p className="text-gray-300">
                  {members.filter((m) => m.daysRemaining < 7 && m.daysRemaining > 0).length}{" "}
                  member(s) have subscriptions expiring within the next 7 days. Consider reaching
                  out for renewal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
