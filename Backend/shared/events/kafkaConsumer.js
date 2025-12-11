const { Kafka } = require('kafkajs');

module.exports = (notifyUser) => {
  const kafka = new Kafka({ clientId: 'notification-service', brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',') });
  const consumer = kafka.consumer({ groupId: 'notification-group' });

  (async () => {
    await consumer.connect();
    console.log('Kafka consumer connected');

    // subscribe to topics we expect:
    await consumer.subscribe({ topic: 'appointment-created', fromBeginning: false });
    await consumer.subscribe({ topic: 'appointment-approved', fromBeginning: false });
    await consumer.subscribe({ topic: 'appointment-rejected', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = JSON.parse(message.value.toString());
        // build notification similar to HTTP route
        // determine userId based on topic
        if (topic === 'appointment-created') {
          const not = { userId: payload.doctorId, title: 'New Appointment', message: `${payload.patientName} requested ...`, appointmentId: payload.appointmentId };
          // persist to DB
          const Notification = require('../../services/notification-service/src/models/Notification');
          const saved = await Notification.create(not);
          notifyUser(saved.userId, saved);
        } else {
          // approved/rejected logic...
        }
      }
    });
  })();
};
