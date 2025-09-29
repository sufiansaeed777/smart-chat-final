'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Upload, 
  Search, 
  FileText, 
  File, 
  FileImage, 
  Trash2, 
  Download, 
  Check,
  Plus,
  Filter,
  Grid,
  List,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  BookOpen,
  FolderOpen,
  Clock
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  content?: string;
  url?: string;
}

const KnowledgeBasePage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [checkedDocuments, setCheckedDocuments] = useState<string[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentsToDelete, setDocumentsToDelete] = useState<Document[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [isFilterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load documents from API
  const loadDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch('/api/manager/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Memoized total size calculation
  const totalSize = useMemo(() => {
    return documents.reduce((acc, doc) => acc + (Number(doc.size) || 0), 0);
  }, [documents]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'docx':
      case 'doc':
        return <File className="w-8 h-8 text-blue-500" />;
      case 'txt':
        return <FileText className="w-8 h-8 text-gray-500" />;
      default:
        return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('documents', file);
      });

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              setDocuments(prev => [...(data.documents || []), ...prev]);
              setUploadProgress(100);
              setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                setShowUploadModal(false);
              }, 500); // Small delay to show 100% completion
              resolve();
            } catch (error) {
              console.error('Error parsing response:', error);
              alert('Upload failed: Invalid response');
              setIsUploading(false);
              setUploadProgress(0);
              reject(error);
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              console.error('Upload failed:', errorData.error);
              alert('Upload failed: ' + errorData.error);
            } catch {
              alert('Upload failed: ' + xhr.statusText);
            }
            setIsUploading(false);
            setUploadProgress(0);
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('Upload error');
          alert('Upload failed: Network error');
          setIsUploading(false);
          setUploadProgress(0);
          reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
          console.log('Upload aborted');
          setIsUploading(false);
          setUploadProgress(0);
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', '/api/manager/documents');
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDeleteDocument = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/manager/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        setSelectedDocuments(prev => prev.filter(docId => docId !== id));
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData.error);
        alert('Delete failed: ' + errorData.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed: ' + error);
    }
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedDocuments.length === 0) return;

    // Get the documents to be deleted for confirmation
    const docsToDelete = documents.filter(doc => selectedDocuments.includes(doc.id));
    setDocumentsToDelete(docsToDelete);
    setShowDeleteConfirm(true);
  }, [selectedDocuments, documents]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedDocuments.length === 0) return;

    try {
      setIsDeleting(true);
      const response = await fetch('/api/manager/documents/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentIds: selectedDocuments }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
        setSelectedDocuments([]);
        setCheckedDocuments([]);
        setShowDeleteConfirm(false);
        setDocumentsToDelete([]);
        setModalMessage(data.message);
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        console.error('Bulk delete failed:', errorData.error);
        setModalMessage('Bulk delete failed: ' + errorData.error);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Bulk delete failed: ' + error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedDocuments]);

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments(prev => 
      prev.includes(id) 
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    );
    setCheckedDocuments(prev => 
      prev.includes(id) 
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    );
  };

  const selectAllDocuments = () => {
    const allDocIds = filteredDocuments.map(doc => doc.id);
    setSelectedDocuments(allDocIds);
    setCheckedDocuments(allDocIds);
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
    setCheckedDocuments([]);
  };

  const filterOptions = [
    { value: 'all', label: 'All Types', icon: '📄' },
    { value: 'pdf', label: 'PDF', icon: '📕' },
    { value: 'docx', label: 'Word', icon: '📘' },
    { value: 'txt', label: 'Text', icon: '📝' }
  ];

  const handleFilterSelect = (value: string) => {
    setFilterType(value);
    setFilterDropdownOpen(false);
  };

  const toggleFilterDropdown = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setFilterDropdownOpen(!isFilterDropdownOpen);
  };

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current && 
        !filterDropdownRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDownloadDocument = useCallback(async (doc: Document) => {
    try {
      const response = await fetch(`/api/manager/documents/${doc.id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        console.error('Download failed:', errorData.error);
        alert('Download failed: ' + errorData.error);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed: ' + error);
    }
  }, []);

  const handleCheckboxToggle = useCallback((docId: string) => {
    setCheckedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  }, []);

  const handleViewDocument = useCallback((doc: Document) => {
    setViewingDocument(doc);
    setShowViewerModal(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
              <p className="text-gray-600">Manage and organize your documents</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                  <p className="text-sm text-gray-600">Total Documents</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{filteredDocuments.length}</p>
                  <p className="text-sm text-gray-600">Filtered Results</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.filter(doc => doc.type === 'pdf').length}
                  </p>
                  <p className="text-sm text-gray-600">PDF Files</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatFileSize(totalSize)}
                  </p>
                  <p className="text-sm text-gray-600">Total Size</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-200/40 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium placeholder-gray-500"
                />
              </div>
              
              <div className="relative" ref={filterDropdownRef}>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  ref={filterButtonRef}
                  onClick={toggleFilterDropdown}
                  className="pl-10 pr-8 py-2 border-2 border-gray-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium cursor-pointer w-full text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>{filterOptions.find(opt => opt.value === filterType)?.icon}</span>
                    <span>{filterOptions.find(opt => opt.value === filterType)?.label}</span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isFilterDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-indigo-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-indigo-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedDocuments.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedDocuments.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={() => setShowUploadModal(true)}
                disabled={isUploading}
                className={`px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium ${
                  isUploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Upload Files
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Select All - Only show when documents are selected */}
          {selectedDocuments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedDocuments.length} of {filteredDocuments.length} selected
                    </span>
                  </div>
                </div>
                <button
                  onClick={selectedDocuments.length === filteredDocuments.length ? clearSelection : selectAllDocuments}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                    selectedDocuments.length === filteredDocuments.length
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25'
                  }`}
                >
                  {selectedDocuments.length === filteredDocuments.length ? (
                    <>
                      <X className="w-4 h-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Select All
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Documents Grid/List */}
        {loadingDocuments ? (
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/80 shadow-lg shadow-gray-200/30 p-4 animate-pulse"
              >
                {viewMode === 'grid' ? (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/60">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-1/3"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-200/40 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first document to get started'
              }
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Documents
            </button>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`bg-white/90 backdrop-blur-xl rounded-2xl border shadow-lg shadow-gray-200/30 p-4 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer group ${
                  selectedDocuments.includes(doc.id) 
                    ? 'border-blue-400 ring-2 ring-blue-500 bg-blue-50/50' 
                    : 'border-gray-200/80'
                }`}
                onClick={() => toggleDocumentSelection(doc.id)}
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      {getFileIcon(doc.type)}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        {formatFileSize(doc.size)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {doc.uploadDate}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/60">
                      <div className="flex items-center gap-2">
                        {checkedDocuments.includes(doc.id) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckboxToggle(doc.id);
                            }}
                            className="p-1.5 text-blue-600 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100"
                          >
                            <Check className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                        {doc.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  // List View
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                        {doc.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{doc.uploadDate}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                          {doc.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {checkedDocuments.includes(doc.id) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckboxToggle(doc.id);
                          }}
                          className="p-2 text-blue-600 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100"
                        >
                          <Check className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDocument(doc);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(doc);
                        }}
                        className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-red-600">Confirm Deletion</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete the following {documentsToDelete.length} document(s)? This action cannot be undone.
                </p>
                
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {documentsToDelete.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-b-0">
                      {getFileIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.type.toUpperCase()} • {formatFileSize(doc.size)} • {doc.uploadDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Documents
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {showViewerModal && viewingDocument && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {getFileIcon(viewingDocument.type)}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{viewingDocument.name}</h3>
                    <p className="text-sm text-gray-500">
                      {viewingDocument.type.toUpperCase()} • {formatFileSize(viewingDocument.size)} • {viewingDocument.uploadDate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewerModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                {viewingDocument.content ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
                      {viewingDocument.content}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <FileText className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No content available</p>
                    <p className="text-sm text-center">
                      This document doesn't have extractable text content. 
                      You can download the file to view it with an appropriate application.
                    </p>
                    <button
                      onClick={() => handleDownloadDocument(viewingDocument)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewerModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadDocument(viewingDocument)}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Upload Documents</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop files here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX, TXT files
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  Choose Files
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portal-based Filter Dropdown */}
        {isFilterDropdownOpen && typeof window !== 'undefined' && createPortal(
          <div
            ref={filterDropdownRef}
            className="fixed bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-xl shadow-xl shadow-gray-200/40 overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999
            }}
          >
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterSelect(option.value)}
                className={`w-full px-4 py-3 text-left hover:bg-indigo-50/80 transition-colors duration-200 flex items-center gap-3 ${
                  filterType === option.value 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 text-indigo-700 font-medium' 
                    : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
                {filterType === option.value && (
                  <CheckCircle className="w-4 h-4 text-indigo-600 ml-auto" />
                )}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
