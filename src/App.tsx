import { useState, useEffect } from 'react';
import { User, Lead, LeadStatus, ViewTab } from './types';
import { apiService, testConnection } from './services/api';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LeadsTable } from './components/LeadsTable';
import { PipelineBoard } from './components/PipelineBoard';
import { LeadFormModal } from './components/LeadFormModal';
import { LeadStatusModal } from './components/LeadStatusModal';
import { LeadDetailsModal } from './components/LeadDetailsModal';
import { UserManagement } from './components/UserManagement';
import { RegionalMetrics } from './components/RegionalMetrics';
import { LeadReports } from './components/LeadReports';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LoginPage } from './components/LoginPage';
import { PlusCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<ViewTab>('all-leads');
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Modals state
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [statusModalLead, setStatusModalLead] = useState<Lead | null>(null);
  const [detailsModalLead, setDetailsModalLead] = useState<Lead | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUserToEdit, setProfileUserToEdit] = useState<User | null>(null);

  // Auto-dismiss notification toasts
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Load online database users and leads
  const loadData = async () => {
    try {
      await testConnection();
      const [fetchedUsers, fetchedLeads] = await Promise.all([
        apiService.getUsers(),
        apiService.getLeads(),
      ]);
      setUsers(fetchedUsers);
      setLeads(fetchedLeads);
    } catch (err) {
      console.error('Failed to load online database:', err);
      showFeedback('Failed to reach online database. Please check connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
  };

  // Auth actions
  const handleLogin = async (username: string, password?: string) => {
    const res = await apiService.login(username, password);
    setCurrentUser(res.user);
    showFeedback(`Welcome, ${res.user.name} (${res.user.designation})`);

    // Default tab based on role
    if (res.user.role === 'regional_incharge') {
      setActiveTab('assigned-leads');
    } else if (res.user.role === 'area_incharge') {
      setActiveTab('assigned-leads');
    } else {
      setActiveTab('all-leads');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showFeedback('You have been securely logged out.', 'info');
  };

  const handleSwitchUser = (user: User) => {
    if (user.status === 'inactive') {
      showFeedback(`Cannot switch to ${user.name}: Account is inactive.`, 'error');
      return;
    }
    setCurrentUser(user);
    showFeedback(`Switched to ${user.name} (${user.designation})`);
  };

  // Lead CRUD actions
  const handleCreateOrUpdateLead = async (
    leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingLead) {
      const updated = await apiService.updateLead(editingLead.id, leadData);
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showFeedback(`Lead "${updated.name}" updated in online database.`);
      setEditingLead(null);
    } else {
      const created = await apiService.createLead(leadData);
      setLeads((prev) => [created, ...prev]);
      showFeedback(`New lead "${created.name}" stored in online database.`);
    }
    setIsAddLeadModalOpen(false);
  };

  const handleSaveStatus = async (
    id: string,
    newStatus: LeadStatus,
    remarks: string,
    otherStatusNarration?: string
  ) => {
    const updated = await apiService.updateLeadStatus(
      id,
      newStatus,
      remarks,
      otherStatusNarration
    );
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    showFeedback(`Lead "${updated.name}" status updated to "${newStatus}".`);
  };

  const handleDeleteLead = async (id: string) => {
    await apiService.deleteLead(id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    showFeedback('Lead deleted permanently from online database.');
  };

  const handleQuickMoveStatus = async (id: string, newStatus: LeadStatus) => {
    const updated = await apiService.updateLeadStatus(id, newStatus);
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    showFeedback(`Moved to ${newStatus}.`);
  };

  // User Management actions (Only Head can create users)
  const handleAddUser = async (userData: {
    username: string;
    password?: string;
    name: string;
    designation: string;
    role: User['role'];
    region: string;
    createdBy: string;
    creatorRole: string;
  }) => {
    const created = await apiService.createUser(userData);
    setUsers((prev) => [...prev, created]);
    showFeedback(`User account @${created.username} for ${created.name} created in online database.`);
  };

  const handleToggleUserStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    const updated = await apiService.updateUserStatus(userId, newStatus);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    showFeedback(`Account for ${updated.name} marked as ${newStatus}.`);
  };

  const handleDeleteUser = async (userId: string) => {
    await apiService.deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showFeedback('User account deleted from online database.');
  };

  // User Profile Update (Head profile or other user profile)
  const handleSaveUserProfile = async (
    userId: string,
    profileData: {
      name: string;
      designation: string;
      region: string;
      username: string;
    }
  ) => {
    const updated = await apiService.updateUserProfile(userId, profileData);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
    // Refresh leads to synchronize any updated officer names/designations
    const freshLeads = await apiService.getLeads();
    setLeads(freshLeads);
    showFeedback(`Profile for @${updated.username} updated in online database.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <h2 className="text-sm font-bold text-slate-800">Connecting to Online Database...</h2>
          <p className="text-xs text-slate-500">Lead Information System</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show single unified login screen ("one login")
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Calculate assigned leads for current user
  const assignedLeads = leads.filter((l) => {
    if (currentUser.role === 'regional_incharge') {
      return l.assignedRegion.toLowerCase() === currentUser.region.toLowerCase();
    }
    if (currentUser.role === 'area_incharge') {
      return (
        l.addedByUserId === currentUser.id ||
        l.assignedTeamMember === currentUser.name ||
        l.assignedRegion.toLowerCase() === currentUser.region.toLowerCase()
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Toast Notification Alert */}
      {feedbackMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg shadow-xl border text-xs font-semibold flex items-center gap-2 ${
              feedbackMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : feedbackMessage.type === 'info'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-emerald-900 text-emerald-100 border-emerald-700'
            }`}
          >
            <span>{feedbackMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenEditProfile={() => {
          setProfileUserToEdit(currentUser);
          setIsProfileModalOpen(true);
        }}
      />

      {/* Role Navigation Bar */}
      <Navigation
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'add-lead') {
            setEditingLead(null);
            setIsAddLeadModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        leadsCount={leads.length}
        assignedCount={assignedLeads.length}
      />

      {/* Main Content Area - White Professional Windows Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: All Leads Directory ("the all user lead will show all user") */}
        {activeTab === 'all-leads' && (
          <LeadsTable
            leads={leads}
            currentUser={currentUser}
            onViewLead={(lead) => setDetailsModalLead(lead)}
            onUpdateStatus={(lead) => setStatusModalLead(lead)}
            onEditLead={(lead) => {
              setEditingLead(lead);
              setIsAddLeadModalOpen(true);
            }}
            onDeleteLead={handleDeleteLead}
            onAddNewLead={() => {
              setEditingLead(null);
              setIsAddLeadModalOpen(true);
            }}
            title="All Leads Directory"
            subtitle="Universal lead database visible across all user accounts"
          />
        )}

        {/* VIEW 2: Assigned Leads (Regional Incharge & Area Incharge) */}
        {activeTab === 'assigned-leads' && (
          <LeadsTable
            leads={assignedLeads}
            currentUser={currentUser}
            onViewLead={(lead) => setDetailsModalLead(lead)}
            onUpdateStatus={(lead) => setStatusModalLead(lead)}
            onEditLead={(lead) => {
              setEditingLead(lead);
              setIsAddLeadModalOpen(true);
            }}
            onDeleteLead={handleDeleteLead}
            onAddNewLead={() => {
              setEditingLead(null);
              setIsAddLeadModalOpen(true);
            }}
            title={
              currentUser.role === 'regional_incharge'
                ? `Assigned Leads: ${currentUser.region}`
                : `Assigned Leads: ${currentUser.name}`
            }
            subtitle={
              currentUser.role === 'regional_incharge'
                ? `Filtering exclusively to leads located within your regional division`
                : `Your personal and assigned area portfolio`
            }
          />
        )}

        {/* VIEW 3: Lead Status Pipeline Board */}
        {activeTab === 'lead-status-pipeline' && (
          <PipelineBoard
            leads={
              currentUser.role === 'regional_incharge'
                ? leads.filter((l) => l.assignedRegion.toLowerCase() === currentUser.region.toLowerCase())
                : leads
            }
            currentUser={currentUser}
            onViewLead={(lead) => setDetailsModalLead(lead)}
            onUpdateStatus={(lead) => setStatusModalLead(lead)}
            onEditLead={(lead) => {
              setEditingLead(lead);
              setIsAddLeadModalOpen(true);
            }}
            onDeleteLead={handleDeleteLead}
            onQuickMoveStatus={handleQuickMoveStatus}
          />
        )}

        {/* VIEW 4: User Management (Head & Regional Incharge) */}
        {activeTab === 'user-management' && (
          <UserManagement
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onToggleStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
            onEditUserProfile={(user) => {
              setProfileUserToEdit(user);
              setIsProfileModalOpen(true);
            }}
          />
        )}

        {/* VIEW 5: Regional Performance Metrics (Head & Regional Incharge) */}
        {activeTab === 'regional-metrics' && (
          <RegionalMetrics
            leads={leads}
            users={users}
            currentUser={currentUser}
          />
        )}

        {/* VIEW 6: Overall Lead Report & Download Hub (Status-wise and Regional-wise) */}
        {activeTab === 'lead-reports' && (
          <LeadReports
            leads={leads}
            currentUser={currentUser}
            onViewLead={(lead) => setDetailsModalLead(lead)}
          />
        )}
      </main>

      {/* Floating Action Button for Quick Lead Addition for authorized roles */}
      {(currentUser.role === 'head' || currentUser.role === 'area_incharge') && (
        <button
          onClick={() => {
            setEditingLead(null);
            setIsAddLeadModalOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer border border-slate-700"
          title="Add New Lead Information"
        >
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          <span className="hidden sm:inline">Add Lead</span>
        </button>
      )}

      {/* MODAL 1: Lead Information Form Modal (Add / Edit) */}
      <LeadFormModal
        isOpen={isAddLeadModalOpen}
        onClose={() => {
          setIsAddLeadModalOpen(false);
          setEditingLead(null);
        }}
        onSubmit={handleCreateOrUpdateLead}
        currentUser={currentUser}
        users={users}
        initialData={editingLead}
      />

      {/* MODAL 2: Lead Status Form Modal */}
      <LeadStatusModal
        lead={statusModalLead}
        onClose={() => setStatusModalLead(null)}
        onSaveStatus={handleSaveStatus}
      />

      {/* MODAL 3: Lead Details Dossier Modal */}
      <LeadDetailsModal
        lead={detailsModalLead}
        onClose={() => setDetailsModalLead(null)}
        onOpenStatusModal={(lead) => setStatusModalLead(lead)}
        onOpenEditModal={(lead) => {
          setEditingLead(lead);
          setIsAddLeadModalOpen(true);
        }}
      />

      {/* MODAL 4: Change Password Modal for All Incharges */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          showFeedback('Your password has been updated in online database.');
        }}
      />

      {/* MODAL 5: User Profile Update Modal (Head profile and other users profile) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileUserToEdit(null);
        }}
        user={profileUserToEdit}
        onSaveProfile={handleSaveUserProfile}
        isEditingSelf={currentUser.id === profileUserToEdit?.id}
      />
    </div>
  );
}
