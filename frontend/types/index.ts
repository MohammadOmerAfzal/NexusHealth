export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
  specialization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;               // mapped from _id
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  patient?: User;           // populated patient object
  doctor?: User;            // populated doctor object
  createdAt: string;
  updatedAt: string;
}


export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'status_change';
  read: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  specialization?: string;
}

export interface AppointmentFormData {
  doctorId: string;
  date: string;
  time: string;
  reason: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

interface JWTPayload {
  userId: string;
  role: 'patient' | 'doctor';
  email: string;
}
interface NavbarProps {
  user: User | null;
}
interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}