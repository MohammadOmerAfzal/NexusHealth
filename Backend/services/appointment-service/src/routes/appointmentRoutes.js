const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

router.post('/', authenticate, authorizeRole('patient'), appointmentController.createAppointment);
router.get('/my', authenticate, appointmentController.getMyAppointments);
router.patch('/:id', authenticate, authorizeRole(['doctor', 'patient']), appointmentController.updateAppointmentStatus);
router.delete('/:id', authenticate, appointmentController.deleteAppointment);

module.exports = router;