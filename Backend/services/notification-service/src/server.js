const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./config/db');
const notificationRoutes = require('./routes/notificationRoutes');
const { init, notifyUser } = require('./socket');

const { runConsumer } = require('./events/notificationConsumer');

const app = express();
connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/notifications', notificationRoutes);

const server = http.createServer(app);
init(server);

runConsumer(notifyUser).catch(err => console.error('Kafka consumer failed:', err));

// Start event consumer (Kafka or Redis)
// const eventDriver = process.env.EVENT_DRIVER || 'http';
// if (eventDriver === 'kafka') {
//   require('./events/notificationEvents').runConsumer();
// } else if (eventDriver === 'redis') {
//   require('../../../shared/events/redisSub')(notifyUser);
// } else {
//   console.log('Notification service using HTTP forwarder mode');
// }

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'notification' }));

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => console.log(`Notification Service running on ${PORT}`));

module.exports = app;
