import express from 'express'
import swaggerSpecs from './swagger.js'
import path from 'path'
import { fileURLToPath } from 'url'
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

// Enable CORS for mobile app - MUST be first
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Middleware
app.use(express.json())

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Swagger UI - Serve static HTML file
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'swagger.html'))
})

// Serve Swagger JSON
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpecs)
})

// Mount API routes
import capsterRoutes from './routes/capsterRoutes.js'
import accountsRoutes from './routes/accountsRoutes.js'
import servicesRoutes from './routes/servicesRoutes.js'
import appointmentsRoutes from './routes/appointmentsRoutes.js'
import authRoutes from './routes/authRoutes.js'

// Log route mounting for debugging
console.log('[ROUTES] Mounting API routes...')
app.use('/api', capsterRoutes)
app.use('/api', accountsRoutes)
app.use('/api', servicesRoutes)
app.use('/api', appointmentsRoutes)
app.use('/api', authRoutes)
console.log('[ROUTES] All routes mounted successfully')

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Barbershop API is running',
        version: '1.0.0',
        documentation: '/api-docs',
        info: 'See /api-docs for full API documentation'
    })
})

// Debug endpoint to list all registered routes
app.get('/api/routes', (req, res) => {
    const routes = []
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            })
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    })
                }
            })
        }
    })
    res.json({ routes })
})

// Diagnostic endpoint to check Supabase configuration
app.get('/api/health', (req, res) => {
    const hasSupabaseUrl = !!process.env.SUPABASE_URL
    const hasAnonKey = !!process.env.SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    res.json({
        status: 'ok',
        supabase: {
            urlConfigured: hasSupabaseUrl,
            anonKeyConfigured: hasAnonKey,
            serviceKeyConfigured: hasServiceKey,
            readyForWrites: hasSupabaseUrl && hasAnonKey && hasServiceKey
        },
        message: !hasSupabaseUrl || !hasAnonKey 
            ? 'Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_ANON_KEY (and preferably SUPABASE_SERVICE_ROLE_KEY for writes)'
            : 'Supabase configured and ready'
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