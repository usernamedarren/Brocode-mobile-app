import express from 'express'
import db from '../db.js'

const router = express.Router()

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *       500:
 *         description: Server error
 */
// GET /api/service or /api/services
router.get(['/service', '/services'], async (req, res) => {
  try {
    const rows = await db.getServices()
    return res.json({ data: rows })
  } catch (err) {
    console.error('GET /api/service error', err && err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

/**
 * @swagger
 * /api/service:
 *   post:
 *     summary: Create new service
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       201:
 *         description: Service created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       500:
 *         description: Server error
 */
// POST /api/service
router.post('/service', async (req, res) => {
  try {
    const payload = req.body || {}
    const row = await db.addService(payload)
    if (!row) return res.status(500).json({ error: 'Failed to create service' })
    return res.status(201).json({ data: row })
  } catch (err) {
    console.error('POST /api/service error', err && err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
