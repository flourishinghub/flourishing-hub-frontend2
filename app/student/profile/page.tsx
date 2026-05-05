'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Save, X, Mail, Phone, MapPin, Calendar, Book, Users, GraduationCap, Hash } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getCurrentUser, apiCall } from '@/lib/api';
import type { AuthPayload } from '@/types';
import toast from 'react-hot-toast';

interface ProfileData {
  name: string;
  email: string;
  rollNumber?: string;
  programme?: string;
  department?: string;
  yearOfStudy?: number;
  cohort?: string;
  section?: string;
  designation?: string;
  employeeId?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    rollNumber: '',
    programme: '',
    department: '',
    yearOfStudy: undefined,
    cohort: '',
    section: '',
    designation: '',
    employeeId: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("❌ No token found");
          setLoading(false);
          return;
        }

        // Fetch complete user profile from backend
        console.log("🔄 Fetching user profile from backend...");
        const response = await apiCall('/profile');
        const userData = response.data;
        
        console.log("📦 Profile data received:", userData);
        
        // Set user state
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role.toLowerCase(),
          rollNo: userData.studentProfile?.rollNumber,
          empId: userData.employeeId || userData.adminProfile?.employeeId,
          department: userData.studentProfile?.department || userData.instructorProfile?.department,
          year: userData.studentProfile?.yearOfStudy,
          batch: userData.studentProfile?.cohort,
          programme: userData.studentProfile?.programme,
          iat: Date.now(),
        });
        
        // Initialize profile data from backend response
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          rollNumber: userData.studentProfile?.rollNumber || '',
          programme: userData.studentProfile?.programme || '',
          department: userData.studentProfile?.department || userData.instructorProfile?.department || '',
          yearOfStudy: userData.studentProfile?.yearOfStudy || undefined,
          cohort: userData.studentProfile?.cohort || '',
          section: userData.studentProfile?.section || '',
          designation: userData.instructorProfile?.designation || '',
          employeeId: userData.employeeId || userData.adminProfile?.employeeId || '',
        });

        console.log("✅ Profile data loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load profile data:", error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("🔄 Saving profile data:", profileData);
      
      // Prepare update payload based on user role
      const updatePayload: any = {
        name: profileData.name,
        email: profileData.email,
      };

      // Add role-specific profile data
      if (user?.role === 'student') {
        updatePayload.studentProfile = {
          department: profileData.department,
          yearOfStudy: profileData.yearOfStudy,
          programme: profileData.programme,
          section: profileData.section,
          cohort: profileData.cohort,
        };
      } else if (user?.role === 'instructor') {
        updatePayload.instructorProfile = {
          designation: profileData.designation,
          department: profileData.department,
        };
      }

      const response = await apiCall('/profile', {
        method: 'PUT',
        body: updatePayload
      });

      if (response.success) {
        const updatedUserData = response.data;
        
        // Update user state
        const updatedUser = {
          id: updatedUserData.id,
          email: updatedUserData.email,
          name: updatedUserData.name,
          role: updatedUserData.role.toLowerCase(),
          rollNo: updatedUserData.studentProfile?.rollNumber,
          empId: updatedUserData.employeeId || updatedUserData.adminProfile?.employeeId,
          department: updatedUserData.studentProfile?.department || updatedUserData.instructorProfile?.department,
          year: updatedUserData.studentProfile?.yearOfStudy,
          batch: updatedUserData.studentProfile?.cohort,
          programme: updatedUserData.studentProfile?.programme,
          iat: Date.now(),
        };
        
        setUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setEditing(false);
        toast.success('Profile updated successfully!');
        console.log("✅ Profile updated successfully");
      }
    } catch (error) {
      console.error("❌ Failed to save profile:", error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        rollNumber: user.rollNo || '',
        programme: user.programme || '',
        department: user.department || '',
        yearOfStudy: user.year || undefined,
        cohort: user.batch || '',
        section: profileData.section, // Keep current section as it's not in user state
        designation: profileData.designation, // Keep current designation
        employeeId: user.empId || '',
      });
    }
    setEditing(false);
  };

  const ProfileField = ({ 
    label, 
    value, 
    field, 
    icon: Icon, 
    type = 'text',
    placeholder,
    disabled = false,
    options = null
  }: { 
    label: string; 
    value: string | number | undefined; 
    field: keyof ProfileData; 
    icon: React.ElementType;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    options?: { value: string; label: string }[] | null;
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-white/70">
        <Icon className="w-4 h-4" />
        {label}
        {disabled && <span className="text-xs text-white/40">(Read-only)</span>}
      </label>
      {editing && !disabled ? (
        options ? (
          <select
            value={value || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors"
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value} className="bg-[#1A1A2E] text-white">
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'number' ? (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleInputChange(field, e.target.value ? parseInt(e.target.value) : 0)}
            placeholder={placeholder}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-primary/50 focus:outline-none transition-colors"
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-primary/50 focus:outline-none transition-colors"
          />
        )
      ) : (
        <p className={`px-4 py-2 rounded-lg border min-h-[40px] flex items-center ${
          disabled 
            ? 'bg-white/[0.01] border-white/5 text-white/40' 
            : 'bg-white/[0.03] border-white/5 text-white'
        }`}>
          {value || <span className="text-white/40">Not provided</span>}
        </p>
      )}
    </div>
  );

  const programmeOptions = [
    { value: 'BTECH', label: 'B.Tech' },
    { value: 'MTECH', label: 'M.Tech' },
    { value: 'PHD', label: 'PhD' },
    { value: 'MSC', label: 'M.Sc' },
    { value: 'MA', label: 'M.A' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <DashboardLayout user={user} loading={loading}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-white">Profile</h1>
              <p className="text-sm text-white/50">Manage your personal information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </motion.button>
              </>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditing(true)}
                className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">
                {profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">{profileData.name || 'User'}</h2>
            <p className="text-sm text-white/50 capitalize">{user?.role || 'User'}</p>
            <p className="text-xs text-white/40 mt-1">{profileData.department || 'IIT Bombay'}</p>
          </div>

          <div className="space-y-3">
            {user?.role === 'student' && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Roll Number</span>
                  <span className="text-white font-medium">{profileData.rollNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Year</span>
                  <span className="text-white font-medium">Year {profileData.yearOfStudy || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Batch</span>
                  <span className="text-white font-medium">{profileData.cohort || 'N/A'}</span>
                </div>
              </>
            )}
            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Employee ID</span>
                <span className="text-white font-medium">{profileData.employeeId || 'N/A'}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Editable Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField
              label="Full Name"
              value={profileData.name}
              field="name"
              icon={User}
              placeholder="Enter your full name"
            />
            
            <ProfileField
              label="Email Address"
              value={profileData.email}
              field="email"
              icon={Mail}
              type="email"
              placeholder="Enter your email"
            />

            {user?.role === 'student' && (
              <>
                <ProfileField
                  label="Roll Number"
                  value={profileData.rollNumber}
                  field="rollNumber"
                  icon={Hash}
                  placeholder="Enter your roll number"
                  disabled={true}
                />
                
                <ProfileField
                  label="Programme"
                  value={profileData.programme}
                  field="programme"
                  icon={GraduationCap}
                  options={programmeOptions}
                />
                
                <ProfileField
                  label="Department"
                  value={profileData.department}
                  field="department"
                  icon={Users}
                  placeholder="Enter your department"
                />
                
                <ProfileField
                  label="Year of Study"
                  value={profileData.yearOfStudy}
                  field="yearOfStudy"
                  icon={Calendar}
                  type="number"
                  placeholder="Enter year (1-5)"
                />
                
                <ProfileField
                  label="Section"
                  value={profileData.section}
                  field="section"
                  icon={Book}
                  placeholder="Enter your section"
                />
                
                <ProfileField
                  label="Batch/Cohort"
                  value={profileData.cohort}
                  field="cohort"
                  icon={Users}
                  placeholder="Enter your batch"
                />
              </>
            )}

            {user?.role === 'instructor' && (
              <>
                <ProfileField
                  label="Designation"
                  value={profileData.designation}
                  field="designation"
                  icon={Book}
                  placeholder="Enter your designation"
                />
                
                <ProfileField
                  label="Department"
                  value={profileData.department}
                  field="department"
                  icon={Users}
                  placeholder="Enter your department"
                />
                
                <ProfileField
                  label="Employee ID"
                  value={profileData.employeeId}
                  field="employeeId"
                  icon={Hash}
                  placeholder="Enter your employee ID"
                  disabled={true}
                />
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <ProfileField
                  label="Employee ID"
                  value={profileData.employeeId}
                  field="employeeId"
                  icon={Hash}
                  placeholder="Enter your employee ID"
                  disabled={true}
                />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}