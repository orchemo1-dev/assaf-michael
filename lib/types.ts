export type EventType = 'gig' | 'studio' | 'meeting' | 'other'
export type PaymentStatus = 'closing' | 'unpaid' | 'advance' | 'done'
export type TaskStatus = 'open' | 'in_progress' | 'done'

export interface Event {
  id: string
  type: EventType
  title: string
  date: string
  start_time?: string
  end_time?: string
  price?: number
  advance_paid?: number
  advance_received?: boolean
  contact_name?: string
  contact_phone?: string
  lineup?: string
  equipment?: string
  payment_status?: PaymentStatus
  venue_capacity?: number
  location?: string
  audience_count?: number
  rating?: number
  notes?: string
  attendees?: string
  meeting_topic?: string
  meeting_goals?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface Task {
  id: string
  title: string
  category: string
  description?: string
  status: TaskStatus
  due_date?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface MarketingItem {
  id: string
  type: string
  title: string
  description?: string
  url?: string
  created_by?: string
  created_at?: string
}

export interface Contact {
  id: string
  name: string
  role?: string
  company?: string
  category: string
  phone?: string
  email?: string
  notes?: string
  created_by?: string
  created_at?: string
}

export interface EpkData {
  id: string
  field_name: string
  field_value?: string
  updated_by?: string
  updated_at?: string
}

export interface UserProfile {
  id: string
  email: string
  role: 'artist' | 'manager'
  name: string
  color: string
  initials: string
}

export const USERS: UserProfile[] = [
  { id: 'assaf', email: 'assaf@assafmichael.com', role: 'artist', name: 'אסף', color: '#e24b4a', initials: 'א' },
  { id: 'manager1', email: 'manager1@assafmichael.com', role: 'manager', name: 'מנהל 1', color: '#534ab7', initials: 'מ1' },
  { id: 'manager2', email: 'manager2@assafmichael.com', role: 'manager', name: 'מנהל 2', color: '#27a566', initials: 'מ2' },
]
