'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, FileSpreadsheet, Filter, Search, Shield } from 'lucide-react';
import type { MemberDirectory, UserRole } from '@/types';

const ROLES: UserRole[] = ['student', 'instructor', 'admin', 'volunteer', 'associate-instructor'];

interface FilterState {
  role: string;
  department: string;
  programme: string;
  year: string;
  volunteerStatus: string;
  search: string;
}

interface RolesTabProps {
  members: MemberDirectory[];
  filteredMembers: MemberDirectory[];
  filters: FilterState;
  setFilters: (fn: (prev: FilterState) => FilterState) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  exporting: boolean;
  exportAllMembers: () => void;
  exportStudents: () => void;
  clearFilters: () => void;
  uniqueDepartments: string[];
  uniqueProgrammes: string[];
  uniqueYears: (number | undefined)[];
  handleRoleChange: (memberId: string, newRole: UserRole) => void;
}

export default function RolesTab({
  members,
  filteredMembers,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  exporting,
  exportAllMembers,
  exportStudents,
  clearFilters,
  uniqueDepartments,
  uniqueProgrammes,
  uniqueYears,
  handleRoleChange,
}: RolesTabProps) {
  return (
    <div id="roles">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Role Management</h3>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportAllMembers}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export All
          </motion.button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Name, email, ID..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-primary/50 focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="filter-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Admin</option>
                  <option value="associate-instructor">Associate Instructor</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="filter-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Programme Filter */}
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block">Programme</label>
                <select
                  value={filters.programme}
                  onChange={(e) => setFilters(prev => ({ ...prev, programme: e.target.value }))}
                  className="filter-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                >
                  <option value="">All Programmes</option>
                  {uniqueProgrammes.map(prog => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                  className="filter-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                >
                  <option value="">All Years</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year?.toString() || ''}>Year {year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                Showing {filteredMembers.length} of {members.length} members
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Clear Filters
                </button>
                <button
                  onClick={exportStudents}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  Export Students
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Management Cards */}
      <div className="space-y-3">
        {filteredMembers.map((member) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center flex-wrap justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-semibold text-white">{member.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.role === 'admin' ? 'badge-red' :
                    member.role === 'instructor' ? 'badge-purple' :
                    member.role === 'volunteer' ? 'badge-green' :
                    member.role === 'associate-instructor' ? 'badge-yellow' : 'badge-blue'
                  }`}>
                    {member.role}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>{member.email}</span>
                  {member.department && <span>• {member.department}</span>}
                  {member.programme && <span>• {member.programme}</span>}
                  {member.year && <span>• Year {member.year}</span>}
                  {(member.rollNo || member.empId) && <span>• {member.rollNo || member.empId}</span>}
                </div>
              </div>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                className="filter-select w-full sm:w-auto px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm sm:min-w-[160px]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r.replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No members found</p>
          <p className="text-white/30 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
