// app/(frontend)/admin/AdminHomepageClient.tsx
"use client";

import { useState } from 'react';
import { approveReport } from '@/app/(backend)/ReportController/approveReport';
import { dismissReport } from '@/app/(backend)/ReportController/dismissReport';

interface ReportedGroup {
  id: string;
  group: {
    id: string;
    name: string;
    location: string;
    start: string;
    end: string;
    host: {
      id: string;
      username: string;
      email: string;
      warning: boolean;
      status: string;
    };
  };
  reporter: {
    id: string;
    username: string;
    email: string;
    warning: boolean;
    status: string;
  };
  reportTypes: any;
  createdAt: string;
}

interface AdminHomepageClientProps {
  reportedGroups: ReportedGroup[];
}

export default function AdminHomepageClient({ reportedGroups }: AdminHomepageClientProps) {
  const [reports, setReports] = useState(reportedGroups);
  const [processingReport, setProcessingReport] = useState<string | null>(null);

  const handleApproveReport = async (reportId: string, action: "warn" | "ban") => {
    setProcessingReport(reportId);
    try {
        console.log("🔄 Calling approveReport...");
        await approveReport(reportId, action);
        setReports(reports.filter(report => report.id !== reportId));
    } catch (error: any) {
        console.error('❌ Error approving report:', error);
        // Show the actual error message
        alert(`Failed to approve report: ${error.message || 'Unknown error'}`);
    } finally {
        setProcessingReport(null);
    }
    };

  const handleDismissReport = async (reportId: string, action: "warn" | "ban") => {
    setProcessingReport(reportId);
    try {
      await dismissReport(reportId, action);
      // Remove from local state
      setReports(reports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Failed to dismiss report');
    } finally {
      setProcessingReport(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard - Reported Groups</h1>
        
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No reported groups to review.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                  {/* Group Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Reported Group</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Group Name:</span> {report.group.name}</p>
                      <p><span className="font-medium">Location:</span> {report.group.location}</p>
                      <p><span className="font-medium">Time:</span> {formatDate(report.group.start)} - {formatDate(report.group.end)}</p>
                      <p><span className="font-medium">Host:</span> {report.group.host.username} ({report.group.host.email})</p>
                      <p><span className="font-medium">Host Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          report.group.host.status === 'BANNED' ? 'bg-red-100 text-red-800' :
                          report.group.host.warning ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.group.host.status === 'BANNED' ? 'BANNED' : 
                           report.group.host.warning ? 'WARNED' : 'CLEAN'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Reporter Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Reporter</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Username:</span> {report.reporter.username}</p>
                      <p><span className="font-medium">Email:</span> {report.reporter.email}</p>
                      <p><span className="font-medium">Reporter Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          report.reporter.status === 'BANNED' ? 'bg-red-100 text-red-800' :
                          report.reporter.warning ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.reporter.status === 'BANNED' ? 'BANNED' : 
                           report.reporter.warning ? 'WARNED' : 'CLEAN'}
                        </span>
                      </p>
                      <p><span className="font-medium">Reported On:</span> {formatDate(report.createdAt)}</p>
                      <p><span className="font-medium">Report Types:</span> {JSON.stringify(report.reportTypes)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  {/* Dismiss Report (False Report) */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const action = report.reporter.warning ? "ban" : "warn";
                        if (confirm(`Dismiss report and ${report.reporter.warning ? 'BAN' : 'WARN'} reporter?`)) {
                          handleDismissReport(report.id, action);
                        }
                      }}
                      disabled={processingReport === report.id}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {processingReport === report.id ? 'Processing...' : 
                       `Dismiss Report${report.reporter.warning ? ' & Ban Reporter' : ' & Warn Reporter'}`}
                    </button>
                  </div>

                  {/* Approve Report (Real Report) */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const action = report.group.host.warning ? "ban" : "warn";
                        if (confirm(`Approve report and ${report.group.host.warning ? 'BAN' : 'WARN'} host?`)) {
                          handleApproveReport(report.id, action);
                        }
                      }}
                      disabled={processingReport === report.id}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {processingReport === report.id ? 'Processing...' : 
                       `Approve Report${report.group.host.warning ? ' & Ban Host' : ' & Warn Host'}`}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}