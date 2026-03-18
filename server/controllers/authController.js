const jwt = require('jsonwebtoken');
const {
  signUpWithEmail,
  signInWithEmail,
  findProfileByEmail,
  findProfileById,
  createProfile,
} = require('../models/userModel');
const jwtConfig = require('../config/jwt');

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const existing = await findProfileByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const signUpResult = await signUpWithEmail({ email, password });
    const authUser = signUpResult?.user;

    if (!authUser?.id) {
      return res.status(500).json({ message: 'Could not create Supabase auth user.' });
    }

    const profile = await createProfile({
      id: authUser.id,
      name,
      email,
      role,
    });

    const user = {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      created_at: profile.created_at,
    };

    const token = generateToken(user);

    return res.status(201).json({ user, token });
  } catch (error) {
    if (error?.statusCode === 429 || /rate limit|security purposes/i.test(error?.message || '')) {
      return res.status(429).json({
        message:
          'Email send rate limit exceeded. Please wait a minute before trying again, or use Login if this email was already registered.',
      });
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const signInResult = await signInWithEmail({ email, password });
    const authUser = signInResult?.user;

    if (!authUser?.id) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const profile = await findProfileById(authUser.id);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this user.' });
    }

    const user = {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      created_at: profile.created_at,
    };

    const token = generateToken(user);

    return res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login };
