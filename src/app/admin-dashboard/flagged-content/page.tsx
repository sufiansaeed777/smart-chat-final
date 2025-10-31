'use client';

import React, { useState, useEffect } from 'react';
import {
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  User,
  Bot,
  Calendar,
  Filter,
  Search,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface FlaggedContent {
  id: string;
  botName: string;
  botId: string;
  userName: string;
  userId: string;
  flagReason: string;
  flaggedBy: string;
  flaggedAt: string;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'resolved';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  messageCount: number;
  messages: Array<{
    id: string;
    sender: string;
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
}

interface FlaggedContentData {
  flaggedContent: FlaggedContent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    resolved: number;
    total: number;
  };
}

const FlaggedContentPage: React.FC = () => {
  const [data, setData] = useState<FlaggedContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'resolved' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadFlaggedContent();
  }, [statusFilter, page]);

  const loadFlaggedContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/flagged-content?status=${statusFilter}&page=${page}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('Failed to load flagged content:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading flagged content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedContent || !reviewAction) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/flagged-content/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: selectedContent.id,
          action: reviewAction,
          notes: reviewNotes
        })
      });

      if (response.ok) {
        setSelectedContent(null);
        setReviewAction(null);
        setReviewNotes('');
        loadFlaggedContent();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to review content'}`);
      }
    } catch (error) {
      console.error('Error reviewing content:', error);
      alert('Failed to review content');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'resolved':
        return <Badge className="bg-blue-100 text-blue-800">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Flag className="w-8 h-8 mr-3 text-[#6566F1]" />
            Flagged Content Review
          </h1>
          <p className="text-gray-600 mt-2">Review and moderate flagged conversations</p>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border border-gray-200 bg-white rounded-2xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{data.counts.total}</p>
                </div>
                <Flag className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white rounded-2xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('pending')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{data.counts.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white rounded-2xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('approved')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{data.counts.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white rounded-2xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('rejected')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{data.counts.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white rounded-2xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('resolved')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-blue-600">{data.counts.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Section */}
      <Card className="border border-gray-200 bg-white rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Filter by Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
          </div>
        </CardContent>
      </Card>

      {/* Flagged Content List */}
      <div className="space-y-4">
        {data && data.flaggedContent.length > 0 ? (
          data.flaggedContent.map((content) => (
            <Card key={content.id} className="border border-gray-200 bg-white rounded-2xl hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="text-lg font-bold text-gray-900">Flagged Conversation</h3>
                      {getStatusBadge(content.reviewStatus)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Bot:</span>
                        <span className="text-sm font-medium text-gray-900">{content.botName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">User:</span>
                        <span className="text-sm font-medium text-gray-900">{content.userName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Messages:</span>
                        <span className="text-sm font-medium text-gray-900">{content.messageCount}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Flagged:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(content.flaggedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-sm font-semibold text-gray-700">Reason: </span>
                      <span className="text-sm text-gray-900">{content.flagReason}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      Flagged by: <span className="font-medium">{content.flaggedBy}</span>
                    </div>

                    {content.reviewedBy && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Reviewed by:</span> {content.reviewedBy}
                        </div>
                        {content.reviewedAt && (
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">Reviewed at:</span>{' '}
                            {new Date(content.reviewedAt).toLocaleString()}
                          </div>
                        )}
                        {content.reviewNotes && (
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">Notes:</span> {content.reviewNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={() => setSelectedContent(content)}
                      className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-xl"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border border-gray-200 bg-white rounded-2xl">
            <CardContent className="p-12 text-center">
              <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No flagged content found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page === data.pagination.totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Next
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={selectedContent !== null} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Flagged Content</DialogTitle>
            <DialogDescription>
              Review the conversation and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedContent && (
            <div className="space-y-6">
              {/* Content Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold">Bot:</span>
                  <span className="text-sm text-gray-900">{selectedContent.botName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold">User:</span>
                  <span className="text-sm text-gray-900">{selectedContent.userName}</span>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Flag Reason: </span>
                  <span className="text-sm text-gray-900">{selectedContent.flagReason}</span>
                </div>
              </div>

              {/* Messages */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Conversation Messages</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {selectedContent.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender === 'visitor' || message.sender === 'user'
                          ? 'bg-blue-50 ml-8'
                          : 'bg-gray-100 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700 capitalize">
                          {message.sender}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{message.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Review Notes (Optional)
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your review decision..."
                  className="w-full min-h-[100px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <Button
                  onClick={() => {
                    setReviewAction('approved');
                    handleReview();
                  }}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setReviewAction('rejected');
                    handleReview();
                  }}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setReviewAction('resolved');
                    handleReview();
                  }}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve
                </Button>
                <Button
                  onClick={() => {
                    setSelectedContent(null);
                    setReviewNotes('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlaggedContentPage;
