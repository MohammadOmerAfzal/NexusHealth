const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { emitUserRegistered } = require('../events/userProducer');

exports.register = async (req, res) => {
  try {
    const { email, password, role, name, specialization } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'All fields required' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    user = await User.create({ email, password: hashed, role: role || 'patient', name, specialization });

    await emitUserRegistered({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      specialization: user.specialization
    })

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ user: { id: user.id, email: user.email, role: user.role, name: user.name, specialization: user.specialization } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ message: 'Invalid credentials' });

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

//     const token = generateToken(user);
//     res.cookie('token', token, {
//       httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7*24*60*60*1000
//     });
//     res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name, specialization: user.specialization } });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Fetching user by ID:', id);
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id.toString(), // ✅ Frontend expects 'id'
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        specialization: user.specialization
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { generateToken } = require('../utils/jwt');
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Return user with both id and _id
    const userResponse = {
      id: user._id.toString(), // ✅ Frontend expects 'id'
      _id: user._id.toString(), // Keep for compatibility
      email: user.email,
      name: user.name,
      role: user.role,
      specialization: user.specialization
    };

    res.json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    
    // Transform _id to id for frontend consistency
    const doctorsWithId = doctors.map(doctor => ({
      id: doctor._id.toString(), // ✅ Convert _id to id
      _id: doctor._id.toString(), // Keep _id for compatibility
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      specialization: doctor.specialization
    }));
    
    console.log('Doctors fetched:', doctorsWithId.length);
    res.json(doctorsWithId);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// exports.getMe = (req, res) => res.json({ user: req.user });

// exports.getDoctors = async (req, res) => {
//   try {
//     const doctors = await User.find({ role: 'doctor' }).select('name email specialization');
//     res.json(doctors);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
