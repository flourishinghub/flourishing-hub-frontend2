"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, X, Check, Mail, Calendar, User } from "lucide-react";
import { apiCall } from "@/lib/api";
import toast from "react-hot-toast";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  studentProfile?: {
    rollNumber: string;
    department: string;
    programme: string;
  };
  instructorProfile?: {
    department: string;
  };
}

interface Props {
  pendingUsers: PendingUser[];
  onUpdate: () => void;
}

export default function PendingApprovalsTab({ pendingUsers, onUpdate }: Props) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (userId: string, userName: string) => {
    try {
      setProcessing(userId);
      await apiCall(`/admin/users/${userId}/approve`, {
        method: "POST"
      });
      toast.success(`${userName}'s account approved successfully!`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve user");
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (userId: string, userName: string) => {
    const reason = prompt("Enter reason for declining (optional):");
    if (reason === null) return; // user clicked Cancel — abort the decline

    try {
      setProcessing(userId);
      await apiCall(`/admin/users/${userId}/decline`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined })
      });
      toast.success(`${userName}'s account declined`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to decline user");
    } finally {
      setProcessing(null);
    }
  };

  if (pendingUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-8 h-8 text-white/40" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Pending Approvals</h3>
        <p className="text-white/60 text-sm">All user registrations have been processed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Pending Approvals</h3>
          <p className="text-sm text-white/60 mt-1">{pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval</p>
        </div>
      </div>

      <div className="grid gap-4">
        {pendingUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              {/* User Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#ffffff]" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">{user.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-3.5 h-3.5 text-white/40" />
                      <p className="text-sm text-white/60">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 pl-13">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Role</p>
                    <p className="text-sm text-white font-medium capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                  
                  {user.studentProfile && (
                    <>
                      <div>
                        <p className="text-xs text-white/40 mb-1">Roll Number</p>
                        <p className="text-sm text-white font-medium">{user.studentProfile.rollNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-1">Department</p>
                        <p className="text-sm text-white font-medium">{user.studentProfile.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-1">Programme</p>
                        <p className="text-sm text-white font-medium">{user.studentProfile.programme}</p>
                      </div>
                    </>
                  )}
                  
                  {user.instructorProfile && (
                    <div>
                      <p className="text-xs text-white/40 mb-1">Department</p>
                      <p className="text-sm text-white font-medium">{user.instructorProfile.department}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-white/40 mb-1">Registered</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-white/40" />
                      <p className="text-sm text-white font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleApprove(user.id, user.name)}
                  disabled={processing === user.id}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/30"
                >
                  <Check className="w-4 h-4" />
                  {processing === user.id ? "Processing..." : "Approve"}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDecline(user.id, user.name)}
                  disabled={processing === user.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                >
                  <X className="w-4 h-4" />
                  Decline
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
