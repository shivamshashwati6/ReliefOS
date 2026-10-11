/**
 * RELIEF-OS Safety Updates Page (/safety-updates)
 * 
 * Central hub for drafting, reviewing, publishing, and archiving public safety updates.
 * 
 * STRICT COMPLIANCE:
 * - Command Center: Full control to draft, review, publish, and archive updates.
 * - Department: Read-only access to published safety updates.
 * - Citizen: Public read-only view of published, unexpired notices.
 * - Separation of Concerns: No priority scores, allocation counts, or internal metrics exposed.
 * - Wording: "Simulation Mode" / "Public Safety Information".
 */

import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Archive, 
  Edit3, 
  MapPin, 
  Calendar, 
  History, 
  X,
  Send,
  RotateCcw
} from 'lucide-react';
import { useSafetyUpdate } from '../context/SafetyUpdateContext';
import { useDisaster } from '../context/DisasterContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
import { 
  UPDATE_STATUS, 
  UPDATE_SEVERITY, 
  validateSafetyUpdateInput 
} from '../models/safetyUpdate';

export default function SafetyUpdatesPage() {
  const { currentDisaster } = useDisaster();
  const { role } = useAuth();
  const { 
    disasterUpdates, 
    publishedDisasterUpdates, 
    createDraftUpdate, 
    editDraftUpdate, 
    startReview, 
    returnToDraft, 
    publishUpdate, 
    archiveUpdate 
  } = useSafetyUpdate();

  const isCommandCenter = role === ROLES.COMMAND_CENTER;

  // Active tab filter (Command Center can filter statuses; Citizens/Depts view published only)
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(null);
  const [viewingHistoryUpdate, setViewingHistoryUpdate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    severity: UPDATE_SEVERITY.INFO,
    affectedArea: '',
    expiresAt: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Displayed updates based on role and tab
  const displayUpdates = useMemo(() => {
    if (!isCommandCenter) {
      // Citizens and departments only see active published updates
      return publishedDisasterUpdates;
    }

    if (statusFilter === 'ALL') {
      return disasterUpdates;
    }
    return disasterUpdates.filter(u => u.status === statusFilter);
  }, [isCommandCenter, publishedDisasterUpdates, disasterUpdates, statusFilter]);

  // Handlers for Form Modal
  const handleOpenCreate = () => {
    setEditingUpdate(null);
    setFormData({
      title: '',
      message: '',
      severity: UPDATE_SEVERITY.INFO,
      affectedArea: currentDisaster?.location || 'Morigaon, Assam',
      expiresAt: '',
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleOpenEdit = (update) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      message: update.message,
      severity: update.severity,
      affectedArea: update.affectedArea,
      expiresAt: update.expiresAt ? update.expiresAt.slice(0, 16) : '',
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();

    const validation = validateSafetyUpdateInput(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const payload = {
      title: formData.title,
      message: formData.message,
      severity: formData.severity,
      affectedArea: formData.affectedArea,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    };

    if (editingUpdate) {
      editDraftUpdate(editingUpdate.updateId, payload);
    } else {
      createDraftUpdate(payload);
    }

    setShowCreateModal(false);
  };

  const handleConfirmPublish = () => {
    if (showPublishModal) {
      publishUpdate(showPublishModal.updateId);
      setShowPublishModal(null);
    }
  };

  const handleConfirmArchive = () => {
    if (showArchiveModal) {
      archiveUpdate(showArchiveModal.updateId);
      setShowArchiveModal(null);
    }
  };

  // Severity UI Styling
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case UPDATE_SEVERITY.URGENT:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            URGENT
          </span>
        );
      case UPDATE_SEVERITY.CAUTION:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            CAUTION
          </span>
        );
      case UPDATE_SEVERITY.INFO:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            INFO
          </span>
        );
    }
  };

  // Status UI Styling (Command Center)
  const getStatusBadge = (update) => {
    const isExpired = update.expiresAt && new Date(update.expiresAt) <= new Date();

    if (isExpired && update.status === UPDATE_STATUS.PUBLISHED) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <Clock className="w-3 h-3 text-slate-500" />
          EXPIRED
        </span>
      );
    }

    switch (update.status) {
      case UPDATE_STATUS.PUBLISHED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            PUBLISHED
          </span>
        );
      case UPDATE_STATUS.UNDER_REVIEW:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            UNDER REVIEW
          </span>
        );
      case UPDATE_STATUS.ARCHIVED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="w-3 h-3 text-slate-400" />
            ARCHIVED
          </span>
        );
      case UPDATE_STATUS.DRAFT:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Edit3 className="w-3 h-3 text-slate-500" />
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Bell className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Safety Updates</h1>
                {isCommandCenter ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Simulation Mode
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Public Safety Information
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {isCommandCenter 
                  ? 'Create and publish clear, human-approved information for affected communities.' 
                  : 'Verified official public information and community advisories.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <span className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <strong>Disaster:</strong> {currentDisaster?.name || 'Assam Flood Response'}
            </span>

            {isCommandCenter && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Safety Update</span>
              </button>
            )}
          </div>
        </div>

        {/* Public Notice Banner */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-blue-900">Notice: </span>
            <span>
              All updates published here represent verified community safety advisories. Please follow instructions from local authorities and emergency services.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Command Center Tabs Filter */}
      {isCommandCenter && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Updates', count: disasterUpdates.length },
            { id: UPDATE_STATUS.PUBLISHED, label: 'Published', count: disasterUpdates.filter(u => u.status === UPDATE_STATUS.PUBLISHED).length },
            { id: UPDATE_STATUS.UNDER_REVIEW, label: 'Under Review', count: disasterUpdates.filter(u => u.status === UPDATE_STATUS.UNDER_REVIEW).length },
            { id: UPDATE_STATUS.DRAFT, label: 'Drafts', count: disasterUpdates.filter(u => u.status === UPDATE_STATUS.DRAFT).length },
            { id: UPDATE_STATUS.ARCHIVED, label: 'Archived', count: disasterUpdates.filter(u => u.status === UPDATE_STATUS.ARCHIVED).length },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Safety Updates List */}
      {displayUpdates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No safety updates found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isCommandCenter 
              ? 'No updates match this filter criteria. Click "Create Safety Update" to draft a new community advisory.' 
              : 'There are currently no active public safety notices for this disaster event.'}
          </p>
          {isCommandCenter && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Safety Update</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayUpdates.map(update => {
            const isExpired = update.expiresAt && new Date(update.expiresAt) <= new Date();

            return (
              <div 
                key={update.updateId}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {getSeverityBadge(update.severity)}
                    {isCommandCenter && getStatusBadge(update)}
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {update.updateId}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Area:</strong> {update.affectedArea}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {update.publishedAt 
                        ? `Published ${new Date(update.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : `Created ${new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                </div>

                {/* Title & Message */}
                <div className="space-y-1.5">
                  <h2 className="text-base font-bold text-slate-900">{update.title}</h2>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {update.message}
                  </p>
                </div>

                {/* Expiry callout if present */}
                {update.expiresAt && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isExpired ? 'Expired at: ' : 'Valid until: '}
                      {new Date(update.expiresAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                )}

                {/* Footer and Command Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-slate-500 italic">
                    Please follow instructions from local authorities and emergency services.
                  </div>

                  {/* Command Center Action Buttons */}
                  {isCommandCenter && (
                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setViewingHistoryUpdate(update)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs cursor-pointer font-medium"
                      >
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <span>History</span>
                      </button>

                      {update.status === UPDATE_STATUS.DRAFT && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(update)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs cursor-pointer font-semibold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => startReview(update.updateId)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs cursor-pointer font-semibold shadow-xs"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Start Review</span>
                          </button>
                        </>
                      )}

                      {update.status === UPDATE_STATUS.UNDER_REVIEW && (
                        <>
                          <button
                            type="button"
                            onClick={() => returnToDraft(update.updateId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs cursor-pointer font-medium"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Back to Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPublishModal(update)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs cursor-pointer font-semibold shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Publish Update</span>
                          </button>
                        </>
                      )}

                      {update.status === UPDATE_STATUS.PUBLISHED && (
                        <button
                          type="button"
                          onClick={() => setShowArchiveModal(update)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-xs cursor-pointer font-semibold"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Safety Update */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUpdate ? 'Edit Safety Update' : 'Create Safety Update'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Helper Guidance Notice (Section 6) */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Writing Rule:</strong> Write only clear, verified information that is safe and appropriate for public dissemination. No automated AI content is published.
              </span>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              {/* Title */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Flood Safety Update: Sector 4"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                {formErrors.title && (
                  <p className="text-rose-600 text-[11px] mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Severity & Affected Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Severity <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value={UPDATE_SEVERITY.INFO}>INFO (Blue / Neutral)</option>
                    <option value={UPDATE_SEVERITY.CAUTION}>CAUTION (Orange / Advisory)</option>
                    <option value={UPDATE_SEVERITY.URGENT}>URGENT (Red / Immediate)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Affected Area <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.affectedArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, affectedArea: e.target.value }))}
                    placeholder="e.g., Morigaon Sector 4, Assam"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  {formErrors.affectedArea && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.affectedArea}</p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  placeholder="e.g., Residents in low-lying areas are advised to stay alert and move to safer locations if instructed by local authorities."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
                />
                {formErrors.message && (
                  <p className="text-rose-600 text-[11px] mt-1">{formErrors.message}</p>
                )}
              </div>

              {/* Optional Expiry Time */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Expiry Time <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Updates past expiry automatically retire from the public citizen dashboard.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingUpdate ? 'Save Changes' : 'Save as Draft'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Publish (Section 9) */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Publish Safety Update?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This information will become visible to citizens for the selected disaster ({currentDisaster?.name || 'Assam Flood Response'}).
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{showPublishModal.title}</div>
              <div className="text-slate-600 text-[11px] line-clamp-2">"{showPublishModal.message}"</div>
              <div className="text-slate-400 text-[11px] pt-1">Area: {showPublishModal.affectedArea}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Archive (Section 16) */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                <Archive className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Archive this safety update?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Archiving will immediately remove this update from the Citizen Dashboard. The record will remain preserved in the Command Center audit history.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{showArchiveModal.title}</div>
              <div className="text-slate-500 text-[11px]">ID: {showArchiveModal.updateId}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowArchiveModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View History (Section 22) */}
      {viewingHistoryUpdate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                <h3 className="font-bold text-slate-900 text-base">Decision History</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistoryUpdate(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              History for <strong className="text-slate-800 font-mono">{viewingHistoryUpdate.updateId}</strong>: {viewingHistoryUpdate.title}
            </div>

            <div className="relative pl-6 space-y-4 max-h-72 overflow-y-auto before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {viewingHistoryUpdate.history.map((step, idx) => (
                <div key={step.id || idx} className="relative space-y-0.5">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-slate-200"></span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{step.action}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {step.note && <p className="text-[11px] text-slate-600">{step.note}</p>}
                  <span className="text-[10px] text-slate-400 block">By: {step.actor}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingHistoryUpdate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
