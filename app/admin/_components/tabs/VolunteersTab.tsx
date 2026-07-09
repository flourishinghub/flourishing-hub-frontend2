'use client';

import { motion } from 'framer-motion';
import { Download, UserCheck } from 'lucide-react';

interface FilterState {
  role: string;
  department: string;
  programme: string;
  year: string;
  volunteerStatus: string;
  search: string;
}

interface VolunteersTabProps {
  filteredVolunteers: any[];
  filters: FilterState;
  setFilters: (fn: (prev: FilterState) => FilterState) => void;
  exporting: boolean;
  exportVolunteers: () => void;
}

export default function VolunteersTab({
  filteredVolunteers,
  filters,
  setFilters,
  exporting,
  exportVolunteers,
}: VolunteersTabProps) {
  return (
    <div id="volunteers">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Volunteer Management</h3>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportVolunteers}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Volunteers
          </motion.button>
        </div>
      </div>

      {/* Volunteer Status Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white/60">Status:</label>
          <select
            value={filters.volunteerStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, volunteerStatus: e.target.value }))}
            className="filter-select px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
          >
            <option value="">All Volunteers</option>
            <option value="active">Active Volunteers</option>
            <option value="past">Past Volunteers</option>
          </select>
        </div>
        <div className="text-sm text-white/60">
          {filteredVolunteers.length} volunteers found
        </div>
      </div>

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVolunteers.map((volunteer) => (
          <motion.div
            key={volunteer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center text-white font-bold text-sm">
                  {volunteer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{volunteer.name}</p>
                  <p className="text-xs text-white/40">{volunteer.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                volunteer.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'
              }`}>
                {volunteer.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Roll No:</span>
                <span className="text-white/80">{volunteer.rollNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Department:</span>
                <span className="text-white/80">{volunteer.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Programme:</span>
                <span className="text-white/80">{volunteer.programme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Year:</span>
                <span className="text-white/80">{volunteer.yearOfStudy ? `Year ${volunteer.yearOfStudy}` : 'N/A'}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Events Volunteered:</span>
                <span className="text-green-400 font-semibold">{volunteer.totalVolunteerEvents || 0}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredVolunteers.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No volunteers found</p>
          <p className="text-white/30 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
