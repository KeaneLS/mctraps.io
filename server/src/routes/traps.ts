import { Router } from 'express';
import traps from '../dummy-data/traps';

const router = Router();

// GET /api/traps - list all traps
router.get('/traps', (_req, res) => {
  res.json(traps);
});

// GET /api/traps/:id - get a single trap by id
router.get('/traps/:id', (req, res) => {
  const { id } = req.params;
  const trap = traps.find(t => t.id === id);
  if (!trap) return res.status(404).json({ error: 'Trap not found' });
  res.json(trap);
});

export default router;


