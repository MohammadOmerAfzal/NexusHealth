const { producer } = require('./kafkaClient');

async function connectProducer() {
  await producer.connect();
  console.log('Appointment producer connected to Kafka');
}

async function emitAppointmentCreated(payload) {
  await producer.send({
    topic: 'appointment.created',
    messages: [{ value: JSON.stringify(payload) }]
  });
}

async function emitAppointmentUpdated(payload) {
  await producer.send({
    topic: 'appointment.updated',
    messages: [{ value: JSON.stringify(payload) }]
  });
}

module.exports = { connectProducer, emitAppointmentCreated, emitAppointmentUpdated };
