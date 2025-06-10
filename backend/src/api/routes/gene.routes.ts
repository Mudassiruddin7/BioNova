import { Router } from 'express';
import { 
  predictSequence, 
  getUserGenes, 
  getGeneById, 
  updateGene, 
  deleteGene,
  addExplanation,
  analyzeCrisprEdit,
  batchAnalyzeCrisprEdits,
  compareAndRankEdits
} from '../../controllers/gene.controller';
import { verifyJWT } from '../../middleware/auth';

const router = Router();

// POST /api/gene/predict
// This route calls the external Python ML service
// JWT verification optional - will save to DB only if authenticated
router.post('/predict', verifyJWT,  predictSequence);

// Routes that require authentication
// GET /api/gene - Get all gene predictions for the authenticated user
router.get('/', verifyJWT, getUserGenes);

// GET /api/gene/:id - Get a specific gene prediction by ID
router.get('/:id', verifyJWT, getGeneById);

// PUT /api/gene/:id - Update a gene prediction's metadata
router.put('/:id', verifyJWT, updateGene);

// DELETE /api/gene/:id - Delete a gene prediction
router.delete('/:id', verifyJWT, deleteGene);

// POST /api/gene/:id/explanation - Add an explanation to a gene prediction
router.post('/:id/explanation', verifyJWT, addExplanation);

// Gene editing routes
// POST /api/gene/analyze - Analyze a single gene edit
router.post('/analyze', verifyJWT, analyzeCrisprEdit);

// POST /api/gene/batch-analyze - Analyze multiple gene edits
router.post('/batch-analyze', verifyJWT, batchAnalyzeCrisprEdits);

// POST /api/gene/compare - Compare and rank multiple edit options
router.post('/compare', verifyJWT, compareAndRankEdits);

export default router; 