// app/(frontend)/admin/page.tsx
import { requireAdmin } from "@/lib/requireAdmin";
import prisma from "@/lib/db";
import Link from "next/link";

export default async function AdminPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  const reportCount = await prisma.report.count();

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome back, {admin.username}</p>

      <div className="rounded-lg border p-4">
        <h2 className="font-medium text-lg">System Overview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Total reports: {reportCount}
        </p>
        {reportCount > 0 && (
          <Link 
            href="/reports" 
            className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Reports
          </Link>
        )}
      </div>
    </main>
  );
}