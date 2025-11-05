// app/(frontend)/admin/page.tsx
import { requireAdmin } from "@/lib/requireAdmin";
import prisma from "@/lib/db";
import Link from "next/link";
import { Shield, AlertTriangle, Users, BarChart3 } from "lucide-react";

export default async function AdminPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  const reportCount = await prisma.report.count();
  const userCount = await prisma.user.count();
  const groupCount = await prisma.group.count();

  const stats = [
    {
      label: "Pending Reports",
      value: reportCount,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      label: "Total Users",
      value: userCount,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      label: "Active Groups",
      value: groupCount,
      icon: BarChart3,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Welcome back, <span className="font-semibold text-blue-600">{admin.username}</span></p>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-white rounded-2xl p-6 border-2 ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* reports card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Report Management</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {reportCount > 0 
                ? `There ${reportCount === 1 ? 'is' : 'are'} ${reportCount} pending report${reportCount === 1 ? '' : 's'} requiring your attention.`
                : "All reports have been reviewed. No pending actions needed."
              }
            </p>
            {reportCount > 0 && (
              <Link 
                href="/reports" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-800 text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                <AlertTriangle size={18} />
                Review Reports
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}