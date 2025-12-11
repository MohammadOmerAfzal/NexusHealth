'use client';
import { useState, useEffect } from 'react';
import { appointmentApi } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { Calendar, Clock, User as UserIcon, FileText, CheckCircle, XCircle } from 'lucide-react';
import { User, Appointment } from '@/types';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext';

export default function DoctorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<Appointment['status'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  const { socket } = useSocket(); // Get socket from context

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (notification: any) => {
      console.log('📨 Doctor received notification:', notification);
      
      // Refresh appointments when new ones arrive or status changes
    if (notification.userId === user.id) {
      // Handle appointment creation
      if (notification.type === 'appointment_created') {
        console.log('🔄 New appointment request, refreshing...');
        fetchAppointments();
      }
      // Handle other appointment updates
      else if (notification.type === 'appointment_updated' || 
               notification.type === 'appointment_approved' ||
               notification.type === 'appointment_rejected') {
        console.log('🔄 Appointment updated, refreshing...');
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
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await fetchAppointments();
      
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
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      // Send PATCH request with status in body
      await appointmentApi.patch(`/api/appointments/${id}`, { status });
      fetchAppointments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update appointment');
    }
  };

  const filteredAppointments =
    filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status];
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length
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
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your patient appointments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Appointments" value={stats.total} color="blue" />
          <StatCard title="Pending" value={stats.pending} color="yellow" />
          <StatCard title="Confirmed" value={stats.confirmed} color="green" />
          <StatCard title="Completed" value={stats.completed} color="purple" />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No {filter !== 'all' ? filter : ''} appointments
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {appointment.patient?.name}
                        </h3>
                        <p className="text-sm text-gray-500">{appointment.patient?.email}</p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-5 w-5" />
                      <span>{new Date(appointment.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-5 w-5" />
                      <span>{appointment.time}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Reason for Visit:
                      </p>
                      <p className="text-sm text-gray-600">{appointment.reason}</p>
                    </div>
                  </div>

                  {appointment.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        <XCircle className="h-5 w-5" />
                        Decline
                      </button>
                    </div>
                  )}

                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Mark as Completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

function StatCard({ title, value, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 ${colors[color]} rounded-lg mb-3`}
      >
        <Calendar className="h-6 w-6" />
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}


// 'use client';
// import { useState, useEffect } from 'react';
// import { appointmentApi } from '@/lib/api';
// import { getCurrentUser } from '@/lib/auth';
// import Navbar from '@/components/Navbar';
// import { Calendar, Clock, User as UserIcon, FileText, CheckCircle, XCircle } from 'lucide-react';
// import { User, Appointment } from '@/types';
// import { useRouter } from 'next/navigation';

// export default function DoctorDashboard() {
//   const [user, setUser] = useState<User | null>(null);
//   const [appointments, setAppointments] = useState<Appointment[]>([]);
//   const [filter, setFilter] = useState<Appointment['status'] | 'all'>('all');
//   const router = useRouter();

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/immutability
//     loadData();
//   }, []);

//   const loadData = async () => {
//     const currentUser = await getCurrentUser();

//     if (!currentUser) {
//       router.push('/login'); // redirect if not logged in
//       return;
//     }

//     setUser(currentUser);
//     fetchAppointments();
//   };

//   const fetchAppointments = async () => {
//     try {
//       const response = await appointmentApi.get<Appointment[]>('/api/appointments/my');
//       setAppointments(response.data);
//     } catch (error) {
//       console.error('Failed to fetch appointments:', error);
//     }
//   };

//   // ... (imports and other functions remain the same)

//   const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
//     try {
//       // FIX: Remove the '/confirm', '/cancel', '/complete' sub-endpoints
//       // Send PATCH request to generic /:id route with status in body
//       await appointmentApi.patch(`/api/appointments/${id}`, { status });
//       fetchAppointments();
//     } catch (error: any) {
//       alert(error.response?.data?.message || 'Failed to update appointment');
//     }
//   };

// // ... (rest of DoctorDashboard.js remains the same)

//   // const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
//   //   try {
//   //     const endpoint =
//   //       status === 'confirmed' ? 'confirm' : status === 'cancelled' ? 'cancel' : 'complete';
//   //     console.log(id)
//   //     await appointmentApi.patch(`/api/appointments/${id}/${endpoint}`);
//   //     fetchAppointments();
//   //   } catch (error: any) {
//   //     alert(error.response?.data?.message || 'Failed to update appointment');
//   //   }
//   // };

//   const filteredAppointments =
//     filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

//   const getStatusColor = (status: Appointment['status']) => {
//     const colors = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       confirmed: 'bg-green-100 text-green-800',
//       cancelled: 'bg-red-100 text-red-800',
//       completed: 'bg-blue-100 text-blue-800'
//     };
//     return colors[status];
//   };

//   const stats = {
//     total: appointments.length,
//     pending: appointments.filter((a) => a.status === 'pending').length,
//     confirmed: appointments.filter((a) => a.status === 'confirmed').length,
//     completed: appointments.filter((a) => a.status === 'completed').length
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar user={user} />

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
//           <p className="text-gray-600 mt-2">Manage your patient appointments</p>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <StatCard title="Total Appointments" value={stats.total} color="blue" />
//           <StatCard title="Pending" value={stats.pending} color="yellow" />
//           <StatCard title="Confirmed" value={stats.confirmed} color="green" />
//           <StatCard title="Completed" value={stats.completed} color="purple" />
//         </div>

//         {/* Filter Tabs */}
//         <div className="bg-white rounded-xl shadow-lg p-6">
//           <div className="flex gap-2 mb-6 overflow-x-auto">
//             {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(
//               (status) => (
//                 <button
//                   key={status}
//                   onClick={() => setFilter(status)}
//                   className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
//                     filter === status
//                       ? 'bg-blue-600 text-white'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}
//                 >
//                   {status.charAt(0).toUpperCase() + status.slice(1)}
//                 </button>
//               )
//             )}
//           </div>

//           {/* Appointments List */}
//           {filteredAppointments.length === 0 ? (
//             <div className="text-center py-12">
//               <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//               <p className="text-gray-500">
//                 No {filter !== 'all' ? filter : ''} appointments
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {filteredAppointments.map((appointment) => (
//                 <div
//                   key={appointment.id}
//                   className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
//                 >
//                   <div className="flex justify-between items-start mb-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
//                         <UserIcon className="h-6 w-6 text-blue-600" />
//                       </div>
//                       <div>
//                         <h3 className="font-semibold text-gray-900 text-lg">
//                           {appointment.patient?.name}
//                         </h3>
//                         <p className="text-sm text-gray-500">{appointment.patient?.email}</p>
//                       </div>
//                     </div>
//                     <div
//                       className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
//                         appointment.status
//                       )}`}
//                     >
//                       {appointment.status.toUpperCase()}
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4 mb-4">
//                     <div className="flex items-center gap-2 text-gray-600">
//                       <Calendar className="h-5 w-5" />
//                       <span>{new Date(appointment.date).toLocaleDateString()}</span>
//                     </div>
//                     <div className="flex items-center gap-2 text-gray-600">
//                       <Clock className="h-5 w-5" />
//                       <span>{appointment.time}</span>
//                     </div>
//                   </div>

//                   <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
//                     <FileText className="h-5 w-5 text-gray-600 mt-1" />
//                     <div>
//                       <p className="text-sm font-semibold text-gray-700 mb-1">
//                         Reason for Visit:
//                       </p>
//                       <p className="text-sm text-gray-600">{appointment.reason}</p>
//                     </div>
//                   </div>

//                   {appointment.status === 'pending' && (
//                     <div className="flex gap-3">
//                       <button
//                         onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
//                         className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
//                       >
//                         <CheckCircle className="h-5 w-5" />
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
//                         className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
//                       >
//                         <XCircle className="h-5 w-5" />
//                         Decline
//                       </button>
//                     </div>
//                   )}

//                   {appointment.status === 'confirmed' && (
//                     <button
//                       onClick={() => handleStatusUpdate(appointment.id, 'completed')}
//                       className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
//                     >
//                       <CheckCircle className="h-5 w-5" />
//                       Mark as Completed
//                     </button>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

// interface StatCardProps {
//   title: string;
//   value: number;
//   color: 'blue' | 'yellow' | 'green' | 'purple';
// }

// function StatCard({ title, value, color }: StatCardProps) {
//   const colors = {
//     blue: 'bg-blue-100 text-blue-600',
//     yellow: 'bg-yellow-100 text-yellow-600',
//     green: 'bg-green-100 text-green-600',
//     purple: 'bg-purple-100 text-purple-600'
//   };
//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6">
//       <div
//         className={`inline-flex items-center justify-center w-12 h-12 ${colors[color]} rounded-lg mb-3`}
//       >
//         <Calendar className="h-6 w-6" />
//       </div>
//       <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
//       <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
//     </div>
//   );
// }
