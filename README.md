# NexusHealth Healthcare Management System

A full-stack healthcare management platform with microservices architecture, featuring patient-doctor appointment scheduling, authentication, and real-time notifications.

## 📋 System Architecture

### Backend Services
- **Auth Service** (`PORT=3001`): Handles user authentication, registration, and JWT token management
- **Appointment Service** (`PORT=3002`): Manages appointment scheduling, updates, and cancellations
- **Notification Service** (`PORT=3003`): Handles real-time notifications via WebSocket and Kafka events

### Frontend
- **Healthcare Frontend** (`PORT=3000`): Next.js application with patient and doctor dashboards

### Shared Infrastructure
- **MongoDB**: Primary database for all services
- **Apache Kafka/Redpanda**: Event streaming for service communication
- **Shared Libraries**: Common database config and Kafka clients

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (Recommended: Node.js 20)
- MongoDB Atlas account or local MongoDB instance
- Redpanda/Kafka cluster (or use the provided Redpanda cloud instance)
- Git

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repository-url>
cd nexushealth-system

# Install dependencies for all services
cd services/auth-service && npm install
cd ../appointment-service && npm install
cd ../notification-service && npm install
cd ../../frontend && npm install

### 2.Environment Configuration
Backend Services
Create .env files in each service directory with the following structure:

Auth Service (services/auth-service/.env):

env
PORT=3001
MONGO_URI='mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority'
FRONTEND_URL=http://localhost:3000
KAFKA_BROKER=your-kafka-broker:9092
KAFKA_SSL=true
KAFKA_SASL_MECHANISM=scram-sha-256
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key

Appointment Service (services/appointment-service/.env):

env
PORT=3002
MONGO_URI='mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority'
FRONTEND_URL=http://localhost:3000
KAFKA_BROKER=your-kafka-broker:9092
KAFKA_SSL=true
KAFKA_SASL_MECHANISM=scram-sha-256
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key

Notification Service (services/notification-service/.env):

env
PORT=3003
MONGO_URI='mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority'
FRONTEND_URL=http://localhost:3000
EVENT_DRIVER=kafka
KAFKA_BROKER=your-kafka-broker:9092
KAFKA_SSL=true
KAFKA_SASL_MECHANISM=scram-sha-256
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key

Frontend Configuration
Create .env.local in frontend/:
env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3003
NEXT_PUBLIC_APPOINTMENT_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_JWT_SECRET=your-super-secret-jwt-key

### 3.Folder Structure
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── authController.js
│   │   │   ├── models/
│   │   │   │   └── User.js
│   │   │   ├── events/
│   │   │   │   └── userProducer.js
│   │   │   ├── middleware/
│   │   │   │   └── authMiddleware.js
│   │   │   ├── routes/
│   │   │   │   └── authRoutes.js
│   │   │   ├── utils/
│   │   │   │   └── jwt.js
│   │   │   └── server.js
│   │   ├── .env
│   │   ├── package.json
│   │   └── vercel.json
│   │
│   ├── appointment-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── appointmentController.js
│   │   │   ├── models/
│   │   │   │   └── Appointment.js
│   │   │   ├── middleware/
│   │   │   │   └── authMiddleware.js
│   │   │   ├── routes/
│   │   │   │   └── appointmentRoutes.js
│   │   │   ├── events/
│   │   │   │   └── appointment.js
│   │   │   └── server.js
│   │   ├── .env
│   │   ├── package.json
│   │   └── vercel.json
│   │
│   └── notification-service/
│       ├── src/
│       │   ├── controllers/
│       │   │   └── notificationController.js
│       │   ├── models/
│       │   │   └── Notification.js
│       │   ├── middleware/
│       │   │   └── authMiddleware.js
│       │   ├── routes/
│       │   │   └── notificationRoutes.js
│       │   ├── events/
│       │   │   └── notificationConsumer.js
│       │   └── server.js
│       │   └── socket.js
│       ├── .env
│       ├── package.json
│       └── vercel.json
│
├── shared/
│   ├── config/
│   │   └── database.js
│   └── events/
│       └── KafkaClient.js
│       └── KafkaConsumer.js
│       └── KafkaProducer.js

frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.js
│   │   │   └── register/
│   │   │       └── page.js
│   │   ├── (dashboard)/
│   │   │   ├── patient/
│   │   │   │   └── page.js
│   │   │   └── doctor/
│   │   │       └── page.js
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── logout/
│   │   │           └── route.js
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── AppointmentForm.js
│   │   ├── AppointmentList.js
│   │   └── NotificationBell.js
│   ├── lib/
│   │   ├── api.js
│   │   └── auth.js
│   └── middleware.js
├── .env.local
├── next.config.js
├── package.json
└── tailwind.config.js
