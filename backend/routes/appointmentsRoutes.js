import express from 'express'
import db from '../db.js'

const router = express.Router()

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments (or filter by user)
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Server error
 */
// GET /api/appointment (singular) or /api/appointments (plural)
router.get(['/appointment', '/appointments'], async (req, res) => {
  try {
    const { user_id } = req.query
    let rows
    
    console.log('GET /api/appointments - user_id:', user_id)
    
    if (user_id) {
      // Filter by user_id if provided
      rows = await db.getAppointmentsByUser(user_id)
    } else {
      rows = await db.getAppointments()
    }
    
    console.log('Appointments fetched:', rows?.length || 0, 'records')
    return res.json({ data: rows })
  } catch (err) {
    console.error('GET /api/appointments error', err && err.message, err && err.stack)
    return res.status(500).json({ error: err?.message || 'Server error' })
  }
})

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Appointment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Server error
 */
// POST /api/appointment or /api/appointments
router.post(['/appointment', '/appointments'], async (req, res) => {
  try {
    const payload = req.body || {}
    
    // Support both mobile app format and web format
    const appointmentData = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      date: payload.date || payload.appointment_date,
      time: payload.time || payload.appointment_time,
      service: payload.service,
      capsterId: payload.capsterId || payload.capster_id,
      capster: payload.capster,
      notes: payload.notes,
      user_id: payload.user_id,
      service_id: payload.service_id,
      status: payload.status || 'pending'
    }
    
    const row = await db.addAppointment(appointmentData)
    if (!row) return res.status(500).json({ error: 'Failed to create appointment' })

    // Best-effort auxiliary inserts (do not block response)
    ;(async () => {
      try {
        await db.addRiwayatPengguna({
          email: row.email,
          name: row.name,
          service: row.service,
          capster: payload.capster || null,
          date: row.date,
          time: row.time
        })
      } catch (e) {
        console.warn('Failed to write riwayat_pengguna:', e && e.message)
      }
      try {
        await db.addListAppointment({ appointment_id: row.id, status: row.status || 'pending' })
      } catch (e) {
        console.warn('Failed to write list_appointment:', e && e.message)
      }
    })()

    return res.status(201).json({ data: row })
  } catch (err) {
    console.error('POST /api/appointments error', err && err.message)
    // Surface Supabase error message to client to ease debugging
    return res.status(500).json({ error: err?.message || 'Server error' })
  }
})

// PATCH /api/appointment/:id/status { status }
router.patch('/appointment/:id/status', async (req,res)=>{
  try {
    const { id } = req.params
    const { status } = req.body || {}
    if (!status) return res.status(400).json({ error: 'status required' })
    await db.updateAppointmentStatus(id, status)
    return res.json({ data: { id, status } })
  } catch(err){
    console.error('PATCH /api/appointment/:id/status error', err && err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/appointment/:id
router.delete('/appointment/:id', async (req,res)=>{
  try {
    const { id } = req.params
    await db.deleteAppointment(id)
    return res.status(204).send()
  } catch(err){
    console.error('DELETE /api/appointment/:id error', err && err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
