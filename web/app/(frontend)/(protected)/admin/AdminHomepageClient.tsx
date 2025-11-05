// app/(frontend)/admin/AdminHomepageClient.tsx
"use client";

import { useState } from 'react';
import { approveReport } from '@/app/(backend)/ReportController/approveReport';
import { dismissReport } from '@/app/(backend)/ReportController/dismissReport';
import { Users, Flag, MapPin, User, Shield, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

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
    tags: {
      id: string;
      name: string;
    }[];
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
  const [selectedActions, setSelectedActions] = useState<{[reportId: string]: {
    groupAction: 'delete' | 'keep';
    userAction: 'warn' | 'ban' | 'none';
  }}>({});
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  const toggleReport = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const handleActionChange = (reportId: string, field: 'groupAction' | 'userAction', value: string) => {
    setSelectedActions(prev => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [field]: value
      }
    }));
  };

  const handleProcessReport = async (reportId: string) => {
    const action = selectedActions[reportId];
    if (!action?.groupAction || !action?.userAction) {
      alert('Please select both group action and user action');
      return;
    }

    setProcessingReport(reportId);
    try {
      if (action.groupAction === 'delete') {
        //if delete group, approve report (target host)
        await approveReport(reportId, action.groupAction, action.userAction);
      } else {
        //if keep group, dismiss report (target reporter)  
        await dismissReport(reportId, action.groupAction, action.userAction);
      }
      
      setReports(reports.filter(report => report.id !== reportId));
      setSelectedActions(prev => {
        const newActions = { ...prev };
        delete newActions[reportId];
        return newActions;
      });
    } catch (error: any) {
      console.error('Error processing report:', error);
      alert(`Failed to process report: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingReport(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, warning: boolean) => {
    if (status === 'BANNED') {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">BANNED</span>;
    } else if (warning) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">WARNED</span>;
    } else {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">CLEAN</span>;
    }
  };

  const getReportTypesPreview = (types: any) => {
    if (Array.isArray(types)) {
      return types.slice(0, 2).join(', ') + (types.length > 2 ? ` +${types.length - 2}` : '');
    }
    return 'Multiple types';
  };

  const getButtonConfig = (reportId: string) => {
    const groupAction = selectedActions[reportId]?.groupAction;
    const userAction = selectedActions[reportId]?.userAction;
    
    if (groupAction === 'delete') {
      return {
        text: 'Approve Report & Delete Group',
        color: 'bg-red-600 hover:bg-red-700',
        description: `Delete group and ${userAction === 'none' ? 'take no action' : userAction + ' host'}`
      };
    } else {
      return {
        text: 'Dismiss Report & Keep Group', 
        color: 'bg-green-600 hover:bg-green-700',
        description: `Keep group and ${userAction === 'none' ? 'take no action' : userAction + ' reporter'}`
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
          </div>
          <p className="text-gray-600 text-sm">
            {reports.length} pending report{reports.length !== 1 ? 's' : ''} to review
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">No pending reports to review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const isExpanded = expandedReports.has(report.id);
              const hasActions = selectedActions[report.id]?.groupAction && selectedActions[report.id]?.userAction;
              const buttonConfig = getButtonConfig(report.id);
              
              return (
                <div key={report.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Flag className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {report.group.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span>by {report.group.host.username}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {report.group.location}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Reported by</div>
                          <div className="text-sm font-medium">{report.reporter.username}</div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* expandable content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {/* group details */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Group Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Time:</span>
                              <div className="text-gray-900">{formatDate(report.group.start)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Host Status:</span>
                              <div>{getStatusBadge(report.group.host.status, report.group.host.warning)}</div>
                            </div>
                            
                            {report.group.tags && report.group.tags.length > 0 && (
                              <div>
                                <span className="text-gray-600">Tags:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {report.group.tags.map(tag => (
                                    <span 
                                      key={tag.id}
                                      className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* reporter details */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-600" />
                            Reporter Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <div className="text-gray-900">{report.reporter.email}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <div>{getStatusBadge(report.reporter.status, report.reporter.warning)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Report Types:</span>
                              <div className="text-gray-900 font-medium">
                                {getReportTypesPreview(report.reportTypes)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* actions */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Shield size={16} />
                          Review Actions
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* group actions */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Group Action</label>
                            <div className="space-y-2">
                              {['delete', 'keep'].map((action) => (
                                <label key={action} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`groupAction-${report.id}`}
                                    value={action}
                                    checked={selectedActions[report.id]?.groupAction === action}
                                    onChange={(e) => handleActionChange(report.id, 'groupAction', e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm capitalize">{action} Group</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* user actions */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {selectedActions[report.id]?.groupAction === 'delete' ? 'Host Action' : 'Reporter Action'}
                            </label>
                            <div className="space-y-2">
                              {['none', 'warn', 'ban'].map((action) => (
                                <label key={action} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`userAction-${report.id}`}
                                    value={action}
                                    checked={selectedActions[report.id]?.userAction === action}
                                    onChange={(e) => handleActionChange(report.id, 'userAction', e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm capitalize">
                                    {action === 'none' ? 'No Action' : `${action} User`}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* action button */}
                      <div className="flex flex-col items-end gap-3">
                        <button
                          onClick={() => {
                            if (!hasActions) {
                              alert('Please select both group and user actions');
                              return;
                            }
                            if (confirm(`Confirm: ${buttonConfig.description}?`)) {
                              handleProcessReport(report.id);
                            }
                          }}
                          disabled={processingReport === report.id || !hasActions}
                          className={`flex items-center gap-2 px-6 py-3 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${buttonConfig.color}`}
                        >
                          {processingReport === report.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              {buttonConfig.text}
                            </>
                          )}
                        </button>

                        {hasActions && (
                          <div className="text-sm text-gray-600 text-center">
                            {buttonConfig.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}