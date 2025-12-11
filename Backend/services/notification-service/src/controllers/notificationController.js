const Notification = require('../models/Notification');
const { notifyUser } = require('../socket');

// handle events when appointment service posts via HTTP
exports.handleEvent = async (req, res) => {
  try {
    const { event, topic } = req.body; // topic optional
    if (!event) return res.status(400).json({ message: 'No event' });

    // create notification based on event content (same logic as before but persist to DB)
    let notification = null;
    if (event.appointmentId && event.doctorId && event.patientId && topic === 'appointment.created' || event.doctorId) {
      notification = await Notification.create({
        userId: event.doctorId,
        type: 'appointment_created',
        title: 'New Appointment Request',
        message: `${event.patientName} requested an appointment on ${event.date} at ${event.time}`,
        appointmentId: event.appointmentId
      });
      notifyUser(event.doctorId, notification);
    } else if (event.appointmentId && event.patientId && event.date && topic === 'appointment.approved' ) {
      notification = await Notification.create({
        userId: event.patientId,
        type: 'appointment_approved',
        title: 'Appointment Approved',
        message: `Your appointment on ${event.date} at ${event.time} has been approved`,
        appointmentId: event.appointmentId
      });
      notifyUser(event.patientId, notification);
    } else if (event.appointmentId && event.patientId && topic === 'appointment.rejected') {
      notification = await Notification.create({
        userId: event.patientId,
        type: 'appointment_rejected',
        title: 'Appointment Rejected',
        message: `Your appointment request has been rejected`,
        appointmentId: event.appointmentId
      });
      notifyUser(event.patientId, notification);
    }

    res.json({ success: true, notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Not found' });
    if (notif.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    notif.read = true;
    await notif.save();
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
