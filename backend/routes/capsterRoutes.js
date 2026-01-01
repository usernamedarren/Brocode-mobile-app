import express from 'express'
import db from '../db.js'

const router = express.Router()

/**
 * @swagger
 * /api/capsters:
 *   get:
 *     summary: Get all capsters (barbers)
 *     tags: [Capsters]
 *     responses:
 *       200:
 *         description: List of capsters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Capster'
 *       500:
 *         description: Server error
 */
// GET /api/capster or /api/capsters
router.get(['/capster', '/capsters'], async (req, res) => {
  try {
    const rows = await db.getCapsters()
    return res.json({ data: rows })
  } catch (err) {
    console.error('GET /api/capster error', err && err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

/**
 * @swagger
 * /api/capster:
 *   post:
 *     summary: Create new capster (barber)
 *     tags: [Capsters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Capster'
 *     responses:
 *       201:
 *         description: Capster created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Capster'
 *       500:
 *         description: Server error
 */
// POST /api/capster  (create new capster) — accepts JSON { name, alias, description, instaacc }
router.post('/capster', async (req, res) => {
  try {
    const payload = req.body || {}
    const row = await db.addCapster(payload)
    if (!row) return res.status(500).json({ error: 'Failed to create capster' })
    return res.status(201).json({ data: row })
  } catch (err) {
    console.error('POST /api/capster error', err && err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
