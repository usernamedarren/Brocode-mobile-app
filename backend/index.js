import express from 'express'
// Import DB so it initializes on server start (connects to Railway when DATABASE_URL is present)
import db from './db.js'
// Diagnostic: log key env presence to help debug startup exits (no secrets leaked)
console.log('[BOOT] SUPABASE_URL present?', !!process.env.SUPABASE_URL, 'SUPABASE_ANON_KEY present?', !!process.env.SUPABASE_ANON_KEY)

const app = express()
const PORT = process.env.PORT || 5003

// Global handlers to log unexpected errors and process exit reasons during local debugging.
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION', err && (err.stack || err))
})
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION', reason && (reason.stack || reason))
})
process.on('exit', (code) => {
    console.log('PROCESS EXIT', code)
})

// Middleware
app.use(express.json())

// Enable CORS for mobile app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Mount API routes
import capsterRoutes from './routes/capsterRoutes.js'
import accountsRoutes from './routes/accountsRoutes.js'
import servicesRoutes from './routes/servicesRoutes.js'
import appointmentsRoutes from './routes/appointmentsRoutes.js'
import authRoutes from './routes/authRoutes.js'

app.use('/api', capsterRoutes)
app.use('/api', accountsRoutes)
app.use('/api', servicesRoutes)
app.use('/api', appointmentsRoutes)
app.use('/api', authRoutes)

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Barbershop API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/login, /api/register',
            services: '/api/services',
            capsters: '/api/capsters',
            appointments: '/api/appointments',
            accounts: '/api/accounts'
        }
    })
})

// In Vercel serverless, we don't start a listener. Vercel sets VERCEL=1.
if (!process.env.VERCEL) {
    try {
        app.listen(PORT, () => {
            console.log(`Server has started on port: ${PORT}`)
        })
    } catch (e) {
        console.error('[BOOT] Failed to start server:', e)
    }
}

// Export handler for Vercel Serverless Functions
export default app