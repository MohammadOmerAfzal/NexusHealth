'use client';
import { useState, useEffect } from 'react';
import { appointmentApi, authApi } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { Calendar, Clock, User as UserIcon, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { User, Appointment, AppointmentFormData } from '@/types';
import { useSocket } from '@/contexts/SocketContext';

export default function PatientDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [formData, setFormData] = useState<AppointmentFormData>({
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { socket } = useSocket(); // Get socket from context

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (notification: any) => {
      console.log('📨 Patient received notification:', notification);
      
        // Refresh appointments when status changes
      if (notification.userId === user.id) {
        // Handle appointment status updates
        if (notification.type === 'appointment_approved' || 
            notification.type === 'appointment_rejected' ||
            notification.type === 'appointment_updated') {
          console.log('🔄 Appointment status changed, refreshing...');
          fetchAppointments();
        }
      }
    };

    socket.on('notification', handleNotification);

    // Cleanup listener on unmount
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, user]); // Re-run when socket changes

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return; // API interceptor will redirect to login
      }
      
      setUser(currentUser);
      
      // Load data in parallel
      await Promise.all([
        fetchAppointments(),
        fetchDoctors()
      ]);
      
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentApi.get<Appointment[]>('/api/appointments/my');
      setAppointments(response.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Failed to fetch appointments:', error);
      }
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await authApi.get<User[]>('/api/auth/doctors');
      setDoctors(response.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Failed to fetch doctors:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await appointmentApi.post('/api/appointments', formData);
      alert('Appointment requested successfully!');
      setFormData({ doctorId: '', date: '', time: '', reason: '' });
      fetchAppointments();
    } catch (error: any) {
      if (error.response?.status !== 401) {
        alert(error.response?.data?.message || 'Failed to book appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      // Send PATCH request with status in body
      await appointmentApi.patch(`/api/appointments/${id}`, { status: 'cancelled' });
      fetchAppointments();
    } catch (error: any) {
      if (error.response?.status !== 401) {
        alert(error.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status];
  };

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2">Book and manage your appointments</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Appointment Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Book Appointment</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor
                  </label>
                  <select
                    required
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your symptoms..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </div>
          </div>

          {/* Appointments List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Appointments</h2>
              
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments yet</p>
                  <p className="text-sm text-gray-400 mt-2">Book your first appointment to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-gray-600" />
                          <span className="font-semibold text-gray-900">
                            Dr. {appointment.doctor?.name}
                          </span>
                          {appointment.doctor?.specialization && (
                            <span className="text-sm text-gray-500">
                              ({appointment.doctor.specialization})
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status.toUpperCase()}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(appointment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{appointment.time}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 mb-4">
                        <FileText className="h-4 w-4 text-gray-600 mt-1" />
                        <p className="text-sm text-gray-700">{appointment.reason}</p>
                      </div>

                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(appointment.id)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-semibold"
                        >
                          <Trash2 className="h-4 w-4" />
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 'use client';
// import { useState, useEffect } from 'react';
// import { appointmentApi, authApi } from '@/lib/api';
// import { getCurrentUser } from '@/lib/auth';
// import Navbar from '@/components/Navbar';
// import { Calendar, Clock, User as UserIcon, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react';
// import { User, Appointment, AppointmentFormData } from '@/types';
// import { useSocket } from '@/contexts/SocketContext';

// // CRITICAL: Move this OUTSIDE the component to prevent recreating on every render
// let hasInitialized = false;

// export default function PatientDashboard() {
//   const [user, setUser] = useState<User | null>(null);
//   const [appointments, setAppointments] = useState<Appointment[]>([]);
//   const [doctors, setDoctors] = useState<User[]>([]);
//   const [formData, setFormData] = useState<AppointmentFormData>({
//     doctorId: '',
//     date: '',
//     time: '',
//     reason: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const { socket } = useSocket();

//   useEffect(() => {
//     // CRITICAL: Only run once per page load
//     if (hasInitialized) {
//       return;
//     }
    
//     hasInitialized = true;
//     loadData();
    
//     // Cleanup function to reset on unmount
//     return () => {
//       hasInitialized = false;
//     };
//   }, []); // Empty dependency array - run only once

//   const loadData = async () => {
//     try {
//       setIsLoading(true);
      
//       const currentUser = await getCurrentUser();
//       if (!currentUser) {
//         // User will be redirected by the API interceptor
//         return;
//       }
      
//       setUser(currentUser);
      
//       // Load data in parallel
//       await Promise.all([
//         fetchAppointments(),
//         fetchDoctors()
//       ]);
      
//     } catch (error) {
//       console.error('Failed to load dashboard:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchAppointments = async () => {
//     try {
//       const response = await appointmentApi.get<Appointment[]>('/api/appointments/my');
//       setAppointments(response.data);
//     } catch (error: any) {
//       if (error.response?.status !== 401) {
//         console.error('Failed to fetch appointments:', error);
//       }
//     }
//   };

//   const fetchDoctors = async () => {
//     try {
//       const response = await authApi.get<User[]>('/api/auth/doctors');
//       setDoctors(response.data);
//     } catch (error: any) {
//       if (error.response?.status !== 401) {
//         console.error('Failed to fetch doctors:', error);
//       }
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       await appointmentApi.post('/api/appointments', formData);
//       alert('Appointment requested successfully!');
//       setFormData({ doctorId: '', date: '', time: '', reason: '' });
//       fetchAppointments();
//     } catch (error: any) {
//       if (error.response?.status !== 401) {
//         alert(error.response?.data?.message || 'Failed to book appointment');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };


//   // ... (imports and other functions remain the same)

//   const handleCancel = async (id: string) => {
//     if (!confirm('Are you sure you want to cancel this appointment?')) return;

//     try {
//       // FIX: Send PATCH request to generic /:id route with status in body
//       await appointmentApi.patch(`/api/appointments/${id}`, { status: 'cancelled' });
//       fetchAppointments();
//     } catch (error: any) {
//       if (error.response?.status !== 401) {
//         alert(error.response?.data?.message || 'Failed to cancel appointment');
//       }
//     }
//   };

// // ... (rest of PatientDashboard.js remains the same)

//   // const handleCancel = async (id: string) => {
//   //   if (!confirm('Are you sure you want to cancel this appointment?')) return;

//   //   try {
//   //     await appointmentApi.patch(`/api/appointments/${id}/cancel`);
//   //     fetchAppointments();
//   //   } catch (error: any) {
//   //     if (error.response?.status !== 401) {
//   //       alert(error.response?.data?.message || 'Failed to cancel appointment');
//   //     }
//   //   }
//   // };

//   const getStatusColor = (status: Appointment['status']) => {
//     const colors = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       confirmed: 'bg-green-100 text-green-800',
//       cancelled: 'bg-red-100 text-red-800',
//       completed: 'bg-blue-100 text-blue-800'
//     };
//     return colors[status];
//   };

//   const getStatusIcon = (status: Appointment['status']) => {
//     switch (status) {
//       case 'confirmed':
//         return <CheckCircle className="h-5 w-5" />;
//       case 'cancelled':
//         return <XCircle className="h-5 w-5" />;
//       default:
//         return <Clock className="h-5 w-5" />;
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading your dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar user={user} />
      
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
//           <p className="text-gray-600 mt-2">Book and manage your appointments</p>
//         </div>

//         <div className="grid lg:grid-cols-3 gap-8">
//           {/* Appointment Form */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-xl shadow-lg p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Book Appointment</h2>
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Select Doctor
//                   </label>
//                   <select
//                     required
//                     value={formData.doctorId}
//                     onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   >
//                     <option value="">Choose a doctor</option>
//                     {doctors.map((doctor) => (
//                       <option key={doctor.id} value={doctor.id}>
//                         {doctor.name} - {doctor.specialization}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Date
//                   </label>
//                   <input
//                     type="date"
//                     required
//                     value={formData.date}
//                     onChange={(e) => setFormData({ ...formData, date: e.target.value })}
//                     min={new Date().toISOString().split('T')[0]}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Time
//                   </label>
//                   <input
//                     type="time"
//                     required
//                     value={formData.time}
//                     onChange={(e) => setFormData({ ...formData, time: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Reason for Visit
//                   </label>
//                   <textarea
//                     required
//                     value={formData.reason}
//                     onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
//                     rows={3}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="Describe your symptoms..."
//                   />
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
//                 >
//                   {loading ? 'Booking...' : 'Book Appointment'}
//                 </button>
//               </form>
//             </div>
//           </div>

//           {/* Appointments List */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-lg p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">My Appointments</h2>
              
//               {appointments.length === 0 ? (
//                 <div className="text-center py-12">
//                   <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//                   <p className="text-gray-500">No appointments yet</p>
//                   <p className="text-sm text-gray-400 mt-2">Book your first appointment to get started</p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {appointments.map((appointment) => (
//                     <div
//                       key={appointment.id}
//                       className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
//                     >
//                       <div className="flex justify-between items-start mb-3">
//                         <div className="flex items-center gap-2">
//                           <UserIcon className="h-5 w-5 text-gray-600" />
//                           <span className="font-semibold text-gray-900">
//                             Dr. {appointment.doctor?.name}
//                           </span>
//                           {appointment.doctor?.specialization && (
//                             <span className="text-sm text-gray-500">
//                               ({appointment.doctor.specialization})
//                             </span>
//                           )}
//                         </div>
//                         <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}>
//                           {getStatusIcon(appointment.status)}
//                           {appointment.status.toUpperCase()}
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-2 gap-4 mb-3">
//                         <div className="flex items-center gap-2 text-gray-600">
//                           <Calendar className="h-4 w-4" />
//                           <span className="text-sm">
//                             {new Date(appointment.date).toLocaleDateString()}
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2 text-gray-600">
//                           <Clock className="h-4 w-4" />
//                           <span className="text-sm">{appointment.time}</span>
//                         </div>
//                       </div>

//                       <div className="flex items-start gap-2 mb-4">
//                         <FileText className="h-4 w-4 text-gray-600 mt-1" />
//                         <p className="text-sm text-gray-700">{appointment.reason}</p>
//                       </div>

//                       {appointment.status === 'pending' && (
//                         <button
//                           onClick={() => handleCancel(appointment.id)}
//                           className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-semibold"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                           Cancel Appointment
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }