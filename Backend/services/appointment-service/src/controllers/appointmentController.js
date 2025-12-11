const Appointment = require('../models/Appointment');
const { emitAppointmentCreated, emitAppointmentUpdated } = require('../events/appointmentProducer')
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Helper to get doctor info from Auth Service
const getDoctorInfo = async (doctorId) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/users/${doctorId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch doctor info:', error.message);
    return null;
  }
};

// Transform appointment for frontend
const transformAppointment = (appointment) => {
  const obj = appointment.toObject ? appointment.toObject() : appointment;
  
  return {
    id: obj._id.toString(),
    _id: obj._id.toString(),
    patientId: obj.patientId,
    doctorId: obj.doctorId,
    date: obj.date,
    time: obj.time,
    reason: obj.reason,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    // Embedded user data
    patient: {
      id: obj.patientId,
      name: obj.patientName,
      email: obj.patientEmail
    },
    doctor: {
      id: obj.doctorId,
      name: obj.doctorName,
      specialization: obj.doctorSpecialization
    }
  };
};

// Create appointment
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    
    console.log('Creating appointment:', { doctorId, date, time, reason });
    console.log('User:', req.user);
    
    if (!doctorId || !date || !time || !reason) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // Get doctor info from Auth Service
    const doctorInfo = await getDoctorInfo(doctorId);
    if (!doctorInfo) {
      return res.status(400).json({ message: 'Doctor not found' });
    }

    // Create appointment with denormalized data
    const appointment = await Appointment.create({
      patientId: req.user.id,
      patientName: req.user.name,
      patientEmail: req.user.email,
      doctorId: doctorId,
      doctorName: doctorInfo.name,
      doctorSpecialization: doctorInfo.specialization,
      date,
      time,
      reason,
      status: 'pending'
    });

    console.log('Appointment created:', appointment._id);

    // Emit event
    await emitAppointmentCreated({
      appointmentId: appointment._id.toString(),
      doctorId: doctorId,
      patientId: req.user.id,
      patientName: req.user.name,
      date,
      time,
      reason
    });

    res.status(201).json(transformAppointment(appointment));
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get my appointments
exports.getMyAppointments = async (req, res) => {
  try {
    console.log('Getting appointments for user:', req.user.id, 'Role:', req.user.role);
    
    const query = req.user.role === 'patient' 
      ? { patientId: req.user.id } 
      : { doctorId: req.user.id };
    
    const list = await Appointment.find(query).sort({ createdAt: -1 });

    console.log('Found appointments:', list.length);

    res.json(list.map(transformAppointment));
  } catch (err) {
    console.error('Get appointments error:', err);
    res.status(500).json({ message: err.message });
  }
};


// ... (rest of appointmentController.js remains the same)

// Update appointment status (doctor or patient for cancel)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // status: 'confirmed', 'cancelled', 'completed', etc.
    
    // Ensure a status is provided
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    
    // --- FIX: REVISED AUTHORIZATION LOGIC ---
    let authorized = false;

    // 1. Doctor Authorization: Can update status if they own the appointment.
    if (userRole === 'doctor' && appointment.doctorId === userId) {
      authorized = true;
    } 
    // 2. Patient Authorization: Can only cancel their own pending appointment.
    else if (userRole === 'patient' && appointment.patientId === userId) {
        // Patient can only set the status to 'cancelled'
        if (status === 'cancelled' && appointment.status === 'pending') {
            authorized = true;
        } else {
            // Patient attempted a status change other than cancelling a pending appointment
            return res.status(403).json({ message: 'Patients can only cancel their pending appointments.' });
        }
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to perform this status update.' });
    }
    // --- END REVISED AUTHORIZATION LOGIC ---

    appointment.status = status;
    await appointment.save();

    // Emit events
    if (status === 'confirmed') {
      await emitAppointmentUpdated({
        appointmentId: appointment._id.toString(),
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        date: appointment.date,
        time: appointment.time,
        status: 'confirmed'
      });
    } else if (status === 'cancelled') {
      await emitAppointmentUpdated({
        appointmentId: appointment._id.toString(),
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        status: 'cancelled'
      });
    } 
    // Add event emission for 'completed' if necessary
    // else if (status === 'completed') { ... }

    res.json(transformAppointment(appointment));
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ... (rest of appointmentController.js remains the same)

// Update appointment status (doctor only)
// exports.updateAppointmentStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const appointment = await Appointment.findById(id);
//     if (!appointment) {
//       return res.status(404).json({ message: 'Appointment not found' });
//     }

//     // Check authorization
//     if (req.user.role !== 'doctor' || appointment.doctorId !== req.user.id) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     appointment.status = status;
//     await appointment.save();

//     // Emit events
//     if (status === 'confirmed') {
//       await emitAppointmentUpdated({
//         appointmentId: appointment._id.toString(),
//         patientId: appointment.patientId,
//         patientName: appointment.patientName,
//         date: appointment.date,
//         time: appointment.time,
//         status: 'confirmed'
//       });
//     } else if (status === 'cancelled') {
//       await emitAppointmentUpdated({
//         appointmentId: appointment._id.toString(),
//         patientId: appointment.patientId,
//         patientName: appointment.patientName,
//         status: 'cancelled'
//       });
//     }

//     res.json(transformAppointment(appointment));
//   } catch (err) {
//     console.error('Update status error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && appointment.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    console.error('Delete appointment error:', err);
    res.status(500).json({ message: err.message });
  }
};

// const Appointment = require('../models/Appointment');
// const eventBus = require('../events/eventBus');

// // Create a new appointment
// exports.createAppointment = async (req, res) => {
//   try {
//     const { doctorId, date, time, reason } = req.body;
//     if (!doctorId || !date || !time || !reason) {
//       return res.status(400).json({ message: 'All fields required' });
//     }

//     const appointment = await Appointment.create({
//       patientId: req.user._id,
//       doctorId,
//       date,
//       time,
//       reason,
//       status: 'pending'
//     });

//     const populatedAppointment = await Appointment.findById(appointment._id)
//       .populate('doctorId', 'name specialization')
//       .populate('patientId', 'name email');

//     // Emit an event through eventBus
//     await eventBus.publish('appointment.created', {
//       appointmentId: appointment._id,
//       doctorId,
//       patientId: req.user._id,
//       date,
//       time,
//       reason
//     });

//     res.status(201).json(populatedAppointment);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // Get appointments for current user (patient or doctor)
// exports.getMyAppointments = async (req, res) => {
//   try {
//     const query = req.user.role === 'patient' ? { patientId: req.user._id } : { doctorId: req.user._id };
//     const list = await Appointment.find(query)
//       .sort({ createdAt: -1 })
//       .populate('doctorId', 'name specialization')
//       .populate('patientId', 'name email');

//     res.json(list);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // Update appointment status (doctor only)
// exports.updateAppointmentStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const appointment = await Appointment.findById(id);
//     if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

//     if (req.user.role !== 'doctor' || appointment.doctorId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     appointment.status = status;
//     await appointment.save();

//     // Emit events for approved/rejected appointments
//     if (status === 'approved') {
//       await eventBus.publish('appointment.approved', {
//         appointmentId: appointment._id,
//         patientId: appointment.patientId,
//         date: appointment.date,
//         time: appointment.time
//       });
//     } else if (status === 'rejected') {
//       await eventBus.publish('appointment.rejected', {
//         appointmentId: appointment._id,
//         patientId: appointment.patientId
//       });
//     }

//     const populatedAppointment = await Appointment.findById(id)
//       .populate('doctorId', 'name specialization')
//       .populate('patientId', 'name email');

//     res.json(populatedAppointment);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Delete appointment (patient only)
// exports.deleteAppointment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const appointment = await Appointment.findById(id);
//     if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

//     if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     await appointment.deleteOne();
//     res.json({ message: 'Appointment deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
