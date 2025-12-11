// notificationConsumer.js - Complete updated file
const { consumer } = require('./kafkaClient');
const Notification = require('../models/Notification');
const { notifyUser } = require('../socket');

async function runConsumer() {
  try {
    await consumer.connect();
    console.log('✅ Notification consumer connected to Kafka');

    const topics = ['appointment.created', 'appointment.updated', 'user.registered'];
    
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`✅ Subscribed to topic: ${topic}`);
    }

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          console.log(`📨 Received Kafka message from ${topic}`);
          const payload = JSON.parse(message.value.toString());
          console.log('Payload:', payload);

          if (topic === 'appointment.created' && payload.doctorId) {
            console.log(`Creating notification for doctor ${payload.doctorId}`);
            const notif = await Notification.create({
              userId: payload.doctorId,
              type: 'appointment_created',
              title: 'New Appointment Request',
              message: `${payload.patientName} requested an appointment on ${payload.date} at ${payload.time}`,
              appointmentId: payload.appointmentId
            });
            console.log('Notification created:', notif._id);
            notifyUser(payload.doctorId, notif.toObject());
          }

          if (topic === 'appointment.updated' && payload.patientId) {
            console.log(`Creating notification for patient ${payload.patientId}`);
            
            let type = 'appointment_updated';
            let title = 'Appointment Update';
            let messageText = `Your appointment status changed to ${payload.status}`;
            
            if (payload.status === 'confirmed') {
              type = 'appointment_approved';
              title = 'Appointment Approved';
              messageText = `Your appointment on ${payload.date} at ${payload.time} has been approved`;
            } else if (payload.status === 'cancelled') {
              type = 'appointment_rejected';
              title = 'Appointment Rejected';
              messageText = `Your appointment request has been rejected`;
            }
            
            const notif = await Notification.create({
              userId: payload.patientId,
              type: type,
              title: title,
              message: messageText,
              appointmentId: payload.appointmentId
            });
            console.log('Notification created:', notif._id);
            notifyUser(payload.patientId, notif.toObject());
          }

          if (topic === 'user.registered' && payload.userId) {
            console.log(`Creating welcome notification for user ${payload.userId}`);
            const notif = await Notification.create({
              userId: payload.userId,
              type: 'welcome',
              title: 'Welcome',
              message: `Welcome ${payload.name}!`
            });
            console.log('Notification created:', notif._id);
            notifyUser(payload.userId, notif.toObject());
          }

        } catch (err) {
          console.error('❌ Error processing kafka message', err);
        }
      }
    });

  } catch (err) {
    console.error('❌ Kafka consumer failed to start:', err);
  }
}

module.exports = { runConsumer };