'use client'

import React, { useEffect, useState } from 'react';
import { useSynapse } from '../../../lib/hooks/synapse/SynapseProvider';
import { MessageSquare, PlusCircle, Trash2, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../../lib/api';

interface DeleteConfirmationProps {
  isOpen: boolean;
  sessionId: string;
  sessionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  sessionId,
  sessionTitle,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-red-500/30 rounded-lg p-4 max-w-xs w-full shadow-xl">
        <div className="flex items-center gap-2 text-red-400 mb-3">
          <AlertCircle size={18} />
          <h3 className="font-medium">Delete Confirmation</h3>
        </div>
        <p className="text-slate-300 text-sm mb-4">
          Are you sure you want to delete this conversation?
          <span className="block mt-1 font-medium text-indigo-300 truncate">{sessionTitle}</span>
        </p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-md text-sm bg-red-600/40 hover:bg-red-600/60 text-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const SynapseSessionHistory: React.FC = () => {
  const { 
    sessionId, 
    startNewSession,
    loadSession,
    isLoading,
    sessions,
    loadSessions,
    isLoadingSessions: loadingHistory,
    deleteSession,
    error: synapseError,
    sessionsError
  } = useSynapse();
  
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    sessionId: string;
    sessionTitle: string;
  }>({
    isOpen: false,
    sessionId: '',
    sessionTitle: ''
  });
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  // Update local error state when Synapse errors change
  useEffect(() => {
    if (synapseError) {
      setError(synapseError);
    } else if (sessionsError) {
      setError(sessionsError);
    }
  }, [synapseError, sessionsError]);

  // Load sessions when component mounts or when sessionId changes (to refresh after creating new sessions)
  useEffect(() => {
    loadSessions();
  }, [sessionId, loadSessions]);

  const handleNewChat = () => {
    startNewSession();
  };

  const handleSelectSession = (id: string) => {
    loadSession(id);
  };
  
  const handleDeleteClick = (e: React.MouseEvent, sessionId: string, sessionTitle: string) => {
    e.stopPropagation(); // Prevent triggering the session selection
    setDeleteConfirmation({
      isOpen: true,
      sessionId,
      sessionTitle
    });
  };
  
  const confirmDelete = async () => {
    const { sessionId: deleteSessionId } = deleteConfirmation;
    
    try {
      setDeletingSession(deleteSessionId);
      await deleteSession(deleteSessionId);
      
      // Refresh the sessions list after deletion
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session');
    } finally {
      setDeletingSession(null);
      cancelDelete();
    }
  };
  
  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      sessionId: '',
      sessionTitle: ''
    });
  };
  
  const formatDate = (dateStr: Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-2 h-full flex flex-col relative">
      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        sessionId={deleteConfirmation.sessionId}
        sessionTitle={deleteConfirmation.sessionTitle}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      
      <div className="flex justify-between items-center mb-3 px-2">
        <h3 className="text-sm font-medium text-indigo-200">Chat History</h3>
        <div className="flex gap-1">
          <button
            onClick={loadSessions}
            className="p-1.5 rounded-md text-indigo-300 hover:text-indigo-100 hover:bg-indigo-700/50 transition-all"
            title="Refresh history"
            disabled={loadingHistory}
          >
            <RefreshCw size={16} className={loadingHistory ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-md text-indigo-300 hover:text-indigo-100 hover:bg-indigo-700/50 transition-all"
            title="New chat"
          >
            <PlusCircle size={16} />
          </button>
        </div>
      </div>
      
      {loadingHistory ? (
        <div className="flex items-center justify-center h-24 text-indigo-300">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm p-2">{error}</div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="text-indigo-400 text-sm p-2 italic">No previous chats</div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1">
          {Array.isArray(sessions) && sessions.map((session) => (
            <div
              key={session.id}
              className={`w-full text-left p-2 rounded-lg text-sm flex items-start group transition-all cursor-pointer ${
                sessionId === session.id
                  ? 'bg-indigo-700/50 text-indigo-100'
                  : 'hover:bg-indigo-800/30 text-indigo-300'
              }`}
              onClick={() => handleSelectSession(session.id)}
            >
              <MessageSquare size={14} className="mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1 overflow-hidden">
                <div className="truncate font-medium">{session.title}</div>
                <div className="flex items-center text-xs opacity-70">
                  <Clock size={12} className="mr-1" />
                  {formatDate(session.lastUpdated || session.updatedAt)}
                </div>
              </div>
              {deletingSession === session.id ? (
                <div className="ml-1">
                  <Loader2 size={14} className="animate-spin text-red-400" />
                </div>
              ) : (
                <div 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the session selection
                    handleDeleteClick(e, session.id, session.title);
                  }}
                  className="ml-1 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-900/30 hover:text-red-400 text-slate-400 cursor-pointer"
                  title="Delete session"
                >
                  <Trash2 size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SynapseSessionHistory;