import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = express.Router();

// ==================== Search Master Medications ====================
router.get(
  '/search',
  authenticate, // Ensure user is logged in
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        // Require at least 2 characters for search to avoid overly broad results
        res.status(400).json({ message: 'Search query must be at least 2 characters long' });
        return;
      }

      const searchTerm = query.trim();

      const medications = await prisma.medicationMaster.findMany({
        where: {
          OR: [
            {
              productName: {
                contains: searchTerm,
                mode: 'insensitive', // Case-insensitive search
              },
            },
            {
              saltComposition: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          productName: true,      // Return brand name
          saltComposition: true,  // Return generic name
          manufacturer: true,     // Return manufacturer
        },
        orderBy: {
          // Optionally order by relevance or name
          productName: 'asc', 
        },
        take: 20, // Increase limit slightly for more options
      });

      // Consider adding relevance scoring or prioritizing productName matches if needed later

      res.status(200).json({ medications });
    } catch (error) {
      console.error('Error searching medications:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// Potential future route: Add medication to master list (Admin only?)
// router.post(...) 

export default router;
