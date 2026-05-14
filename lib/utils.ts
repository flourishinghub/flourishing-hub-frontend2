import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserRole } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    student: 'Student',
    instructor: 'Instructor',
    admin: 'Administrator',
    volunteer: 'Volunteer',
    'associate-instructor': 'Associate Instructor',
  };
  return labels[role] ?? role;
}

export function getRolePath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    student: '/student',
    instructor: '/instructor',
    admin: '/admin',
    volunteer: '/volunteer',
    'associate-instructor': '/associate-instructor',
  };
  return paths[role] ?? '/student';
}

export function formatTime(time: string | Date | undefined): string {
  if (!time) return 'TBD';
  
  // Handle Date object
  if (time instanceof Date) {
    const h = time.getHours();
    const m = time.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  }
  
  // Handle string (HH:MM format)
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'TBD';
  
  // Handle Date object
  if (dateStr instanceof Date) {
    return dateStr.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  
  // Handle string
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6C63FF&color=fff&bold=true`;
}

export function renderStars(rating: number): string {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}
