'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Save, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

interface InstructorProfile {
  name: string;
  email: string;
  employeeId?: string;
  department: string;
  designation: string;
  profilePicture?: string;
}

export default function InstructorProfilePage() {
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<InstructorProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Fetch profile from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch profile');
      }

      const userData = result.data;
      
      const profileData: InstructorProfile = {
        name: userData.name,
        email: userData.email,
        employeeId: userData.employeeId,
        department: userData.instructorProfile?.department || '',
        designation: userData.instructorProfile?.designation || '',
        profilePicture: userData.profileImageUrl,
      };

      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedProfile) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedProfile.name,
          instructorProfile: {
            department: editedProfile.department,
            designation: editedProfile.designation,
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      setProfile(editedProfile);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleProfilePictureUpload = async () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Convert to base64 for now (in production, upload to cloud storage)
      const reader = new FileReader();
      reader.onloadend = async () => {
        // This callback fires asynchronously outside any surrounding try/catch,
        // so errors thrown here must be caught locally or they become an
        // unhandled rejection with no user-facing feedback.
        try {
          const base64String = reader.result as string;

          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Please login first');
            return;
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profileImageUrl: base64String,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Failed to upload image');
          }

          setProfile({ ...profile!, profilePicture: base64String });
          setEditedProfile({ ...editedProfile!, profilePicture: base64String });
          toast.success('Profile picture updated!');
        } catch (error) {
          console.error('Image upload error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to upload image');
        }
      };

      reader.onerror = () => {
        console.error('Image read error:', reader.error);
        toast.error('Failed to read image file');
      };

      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-white/50">Failed to load profile</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-sm text-white/50 mt-1">Manage your personal information</p>
          </div>
          {!editing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(true)}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              Edit Profile
            </motion.button>
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditedProfile(profile);
                  setEditing(false);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
              >
                <X className="w-4 h-4 inline mr-1" />
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Save className="w-4 h-4 inline mr-1" />
                Save
              </motion.button>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/5">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                )}
              </div>
              <button
                onClick={handleProfilePictureUpload}
                className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-[#ffffff] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/40 mt-3">Click camera icon to upload photo</p>
          </div>

          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-white mb-4">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={editing ? editedProfile?.name : profile.name}
                  onChange={(e) => editing && setEditedProfile({ ...editedProfile!, name: e.target.value })}
                  disabled={!editing}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block uppercase tracking-wider">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm opacity-60 cursor-not-allowed"
                />
                <p className="text-[10px] text-white/30 mt-1">Email cannot be changed</p>
              </div>

              {/* Instructor ID */}
              {profile.employeeId && (
                <div>
                  <label className="text-xs font-medium text-white/60 mb-2 block uppercase tracking-wider">
                    Instructor ID
                  </label>
                  <input
                    type="text"
                    value={profile.employeeId}
                    disabled
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm opacity-60 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-white/30 mt-1">Read-only</p>
                </div>
              )}

              {/* Specialization */}
              {profile.department && 
               profile.department !== 'Humanities and Social Sciences' && 
               profile.department !== 'Humanities & Social Sciences' && (
                <div>
                  <label className="text-xs font-medium text-white/60 mb-2 block uppercase tracking-wider">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={editing ? editedProfile?.department : profile.department}
                    onChange={(e) => editing && setEditedProfile({ ...editedProfile!, department: e.target.value })}
                    disabled={!editing}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
              )}

              {/* Role */}
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block uppercase tracking-wider">
                  Role
                </label>
                <input
                  type="text"
                  value="Instructor"
                  disabled
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm opacity-60 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
