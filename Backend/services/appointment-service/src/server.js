require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const appointmentRoutes = require('./routes/appointmentRoutes');
const { connectProducer } = require('./events/appointmentProducer');

const app = express();
connectDB();

connectProducer().catch(err => console.error('Kafka producer failed:', err));

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/appointments', appointmentRoutes);
app.get('/health', (req, res) => res.json({status:'healthy', service:'appointment'}));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Appointment Service running on ${PORT}`));
module.exports = app;




// const express = require('express');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// const appointmentRoutes = require('./routes/appointmentRoutes');
// const eventEmitter = require('./events/eventEmitter');
// require('dotenv').config();

// const app = express();

// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
// app.use(express.json());
// app.use(cookieParser());

// app.use('/api/appointments', appointmentRoutes);

// app.get('/health', (req, res) => {
//   res.json({ status: 'healthy', service: 'appointment' });
// });

// // Setup event forwarding to notification service
// eventEmitter.setupEventForwarding(process.env.NOTIFICATION_SERVICE_URL);

// const PORT = process.env.PORT || 3002;
// app.listen(PORT, () => {
//   console.log(`Appointment Service running on port ${PORT}`);
// });

// module.exports = app;