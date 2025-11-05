// app/(frontend)/reports/page.tsx
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminHomepageClient from "../admin/AdminHomepageClient";

export default async function ReportsPage() {
  await requireAdmin();

  const reportedGroups = await prisma.report.findMany({
    include: {
      group: {
        include: {
          host: {
            select: {
              id: true,
              username: true,
              email: true,
              warning: true,
              status: true,
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          warning: true,
          status: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedReports = reportedGroups.map(report => ({
    id: report.id,
    group: {
      id: report.group.id,
      name: report.group.name,
      location: report.group.location,
      start: report.group.start.toISOString(),
      end: report.group.end.toISOString(),
      host: report.group.host,
      tags: report.group.tags
    },
    reporter: report.user,
    reportTypes: report.types,
    createdAt: report.createdAt.toISOString()
  }));

  return <AdminHomepageClient reportedGroups={formattedReports} />;
}