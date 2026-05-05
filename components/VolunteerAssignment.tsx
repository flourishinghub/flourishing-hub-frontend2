'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Check, X } from 'lucide-react';
import { apiCall } from '@/lib/api';
import toast from 'react-hot-toast';

interface VolunteerAssignmentProps {
  eventId: string;
}

interface Volunteer {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    employeeId: string | null;
  };
}

export default function VolunteerAssignment({ eventId }: VolunteerAssignmentProps) {
  const [interested, setInterested] = useState<Volunteer[]>([]);
  const [assigned, setAssigned] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  useEffect(() => {
    fetchVolunteers();
  }, [eventId]);

  const fetchVolunteers = async () => {
    try {
      const response = await apiCall(`/events/${eventId}/volunteers`);
      setInterested(response.data.interested);
      setAssigned(response.data.assigned);
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      setAssigning(userId);
      await apiCall(`/events/${eventId}/volunteers/${userId}/assign`, {
        method: 'POST'
      });
      toast.success('Volunteer assigned!');
      await fetchVolunteers();
    } catch (error) {
      toast.error('Failed to assign volunteer');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      setUnassigning(userId);
      await apiCall(`/events/${eventId}/volunteers/${userId}/unassign`, {
        method: 'DELETE'
      });
      toast.success('Volunteer unassigned!');
      await fetchVolunteers();
    } catch (error) {
      toast.error('Failed to unassign volunteer');
    } finally {
      setUnassigning(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 border-t border-white/5">
        <p className="text-white/40 text-sm">Loading volunteers...</p>
      </div>
    );
  }

  if (interested.length === 0 && assigned.length === 0) {
    return null;
  }

  return (
    <div className="p-6 border-t border-white/5">
      <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <UserCheck className="w-4 h-4" />
        Volunteer Management
      </h4>

      {/* Assigned Volunteers */}
      {assigned.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-2">Assigned Volunteers ({assigned.length})</p>
          <div className="space-y-2">
            {assigned.map((vol) => (
              <div
                key={vol.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
              >
                <div>
                  <p className="text-sm font-medium text-white">{vol.user.name}</p>
                  <p className="text-xs text-white/40">{vol.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Assigned
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUnassign(vol.userId)}
                    disabled={unassigning === vol.userId}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {unassigning === vol.userId ? (
                      <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        Remove
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interested Volunteers */}
      {interested.length > 0 && (
        <div>
          <p className="text-xs text-white/50 mb-2">Interested Volunteers ({interested.length})</p>
          <div className="space-y-2">
            {interested.map((vol) => (
              <div
                key={vol.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{vol.user.name}</p>
                  <p className="text-xs text-white/40">{vol.user.email}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAssign(vol.userId)}
                  disabled={assigning === vol.userId}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {assigning === vol.userId ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Assign'
                  )}
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
