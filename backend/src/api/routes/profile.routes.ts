import { Router } from 'express';
import { 
  getProfile, 
  updateOnboardingProfile, 
  updatePreferences, 
  addRecentActivity 
} from '../../controllers/profile.controller';
import { verifyJWT } from '../../middleware/auth';

const router = Router();

// All routes are protected
router.use(verifyJWT);

router.get('/', getProfile);
router.put('/onboarding', updateOnboardingProfile);
router.put('/preferences', updatePreferences);
router.post('/activity', addRecentActivity);

export default router; 