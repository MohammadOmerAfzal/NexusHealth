const { producer } = require('./kafkaClient');

async function connectProducer() {
  await producer.connect();
  console.log('Auth producer connected to Kafka');
}

async function emitUserRegistered(payload) {
  await producer.send({
    topic: 'user.registered',
    messages: [{ value: JSON.stringify(payload) }]
  });
}

module.exports = { connectProducer, emitUserRegistered };
