import { Router } from 'express';
import { 
  login,
  loginWithWallet, 
  logout,
  register,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  googleAuth,
  loginAsGuest,
} from '../../controllers/auth.controller';
import { verifyJWT } from '../../middleware/auth';
import config from '../../config';
import { CookieOptions } from 'express';
import logger from '../../utils/logger';

const router = Router();

// Cookie options
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'development' ? 'lax' : 'none',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

// Public routes
router.post('/login', login);
router.post('/login/wallet', loginWithWallet);
router.post('/login/google', googleAuth);
router.post('/login/guest', loginAsGuest);
router.post('/register', register);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', verifyJWT, getCurrentUser);
router.post('/change-password', verifyJWT, changePassword);

export default router; 