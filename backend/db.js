import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'

// Node 18+ provides global fetch. If missing (older runtime), throw an explicit error instead of dynamic import.
const fetchImpl = globalThis.fetch || (() => { throw new Error('fetch API not available: please use Node 18+ or add a fetch polyfill.') })()

// We are Supabase-only now: remove Postgres pool logic.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null
// Optional service role key for writes under RLS
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || null

// Helper: choose appropriate key (service role preferred for mutations to avoid RLS blocking inserts)
function supabaseKey(forWrite = false) {
  if (forWrite && SUPABASE_SERVICE_ROLE_KEY) return SUPABASE_SERVICE_ROLE_KEY
  return SUPABASE_ANON_KEY
}

function buildHeaders({ write = false, json = false, preferReturn = false } = {}) {
  const key = supabaseKey(write)
  if (!key) throw new Error('Supabase key missing. Set SUPABASE_ANON_KEY (and optionally SUPABASE_SERVICE_ROLE_KEY).')
  const h = {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
  if (json) h['Content-Type'] = 'application/json'
  if (preferReturn) h['Prefer'] = 'return=representation'
  return h
}

// Removed Postgres pool; stub query for compatibility if accidentally called.
async function query() { throw new Error('query() not available: Postgres disabled, using Supabase only') }

async function getCapsters() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for capster')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/capster?select=*`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method: 'GET', headers: buildHeaders() })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Supabase capster fetch error: ${resp.status} ${text}`)
  }
  return await resp.json()
}

async function addCapster(payload = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for capster insert')
  const body = {
    name: payload.name || null,
    alias: payload.alias || null,
    description: payload.description || null,
    instaAcc: payload.instaAcc || payload.instaacc || payload.insta || null
  }
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/capster`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method: 'POST', headers: buildHeaders({ write: true, json: true, preferReturn: true }), body: JSON.stringify(body) })
  const text = await resp.text()
  if (!resp.ok) throw new Error(`Supabase capster insert error: ${resp.status} ${text}`)
  const data = JSON.parse(text)
  return Array.isArray(data) ? data[0] : data
}

async function updateCapster(id, payload = {}) {
  if (!id) throw new Error('capster id required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for capster update')
  const body = {
    name: payload.name,
    alias: payload.alias,
    description: payload.description,
    instaAcc: payload.instaAcc || payload.instaacc || payload.insta
  }
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/capster?id=eq.${encodeURIComponent(id)}`
  const resp = await fetchImpl(url, { method: 'PATCH', headers: buildHeaders({ write: true, json: true, preferReturn: true }), body: JSON.stringify(body) })
  const txt = await resp.text()
  if (!resp.ok) throw new Error(`Supabase capster update error: ${resp.status} ${txt}`)
  const data = JSON.parse(txt || '{}')
  return Array.isArray(data) ? data[0] : data
}

async function deleteCapster(id) {
  if (!id) throw new Error('capster id required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for capster delete')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/capster?id=eq.${encodeURIComponent(id)}`
  const resp = await fetchImpl(url, { method: 'DELETE', headers: buildHeaders({ write: true }) })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`Supabase capster delete error: ${resp.status} ${t}`)
  }
  return true
}

async function close() { /* no-op: Postgres disabled */ }

export default {
  query,
  getCapsters,
  addCapster,
  updateCapster,
  deleteCapster,
  getServices,
  addService,
  updateService,
  deleteService,
  getAppointments,
  getAppointmentsByDate,
  deletePastAppointments,
  getAppointmentsByUser,
  addAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  createAccount,
  findAccountByEmail,
  updateAccountPasswordWithHash,
  addRiwayatPengguna,
  addListAppointment,
  close
}

// ===================== Accounts Helpers =====================
// Create account with email + password (hashed). Returns { id, email, created_at } (no hash).
async function createAccount({ email, password, name, phone, isAdmin = false }) {
  if (!email || !password) throw new Error('email and password required')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for account create')
  const hash = await bcrypt.hash(password, 10)
  // User's schema: table "account" with fields: email, password, isAdmin, name, phone
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/account`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const payload = { 
    email, 
    password: hash, 
    isAdmin: !!isAdmin
  }
  
  const resp = await fetchImpl(url, { method: 'POST', headers: buildHeaders({ write: true, json: true, preferReturn: true }), body: JSON.stringify(payload) })
  const bodyText = await resp.text()
  if (!resp.ok) {
    const err = new Error(`Supabase account insert error: ${resp.status} ${resp.statusText} - ${bodyText}`)
    err.status = resp.status
    throw err
  }
  const data = JSON.parse(bodyText)
  const row = Array.isArray(data) ? data[0] : data
  return { 
    email: row.email, 
    isAdmin: !!(row.is_admin ?? row.isAdmin)
  }
}

// Find account by email, returns full row including password_hash (for auth internal).
async function findAccountByEmail(email) {
  if (!email) throw new Error('email required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for account fetch')
  // User's schema: table "account" (singular)
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/account?email=eq.${encodeURIComponent(email)}&select=*`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method: 'GET', headers: buildHeaders() })
  if (!resp.ok) {
    const text = await resp.text()
    const err = new Error(`Supabase account fetch error: ${resp.status} ${resp.statusText} - ${text}`)
    err.status = resp.status
    throw err
  }
  const rows = await resp.json()
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

// Update an account's password hash.
// For Postgres (local/Railway): updates accounts.password_hash by email.
// For Supabase REST: updates account.password (hash) by email.
async function updateAccountPasswordWithHash(email, hash) {
  if (!email || !hash) throw new Error('email and hash required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for password update')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/account?email=eq.${encodeURIComponent(email)}`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method: 'PATCH', headers: buildHeaders({ write: true, json: true, preferReturn: false }), body: JSON.stringify({ password: hash }) })
  if (!resp.ok) {
    const text = await resp.text()
    const err = new Error(`Supabase account update error: ${resp.status} ${resp.statusText} - ${text}`)
    err.status = resp.status
    throw err
  }
  return true
}

// ===================== Services Helpers =====================
// Schema service: name, description, price, type
async function getServices() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for service fetch')
  // User's schema: table "service" (singular)
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/service?select=*`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method: 'GET', headers: buildHeaders() })
  if (!resp.ok) throw new Error(`Supabase service fetch error: ${resp.status}`)
  return await resp.json()
}

async function addService({ name, description, price, type }) {
  if (!name) throw new Error('service name required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for service insert')
  // User's schema: table "service" (singular)
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/service`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const body = { name, description, price, type }
  const resp = await fetchImpl(url, { method: 'POST', headers: buildHeaders({ write: true, json: true, preferReturn: true }), body: JSON.stringify(body) })
  const txt = await resp.text()
  if (!resp.ok) throw new Error(`Supabase service insert error: ${resp.status} ${txt}`)
  const data = JSON.parse(txt)
  return Array.isArray(data) ? data[0] : data
}

async function updateService(name, payload = {}) {
  if (!name) throw new Error('service name required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for service update')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/service?name=eq.${encodeURIComponent(name)}`
  const body = {
    description: payload.description,
    price: payload.price,
    type: payload.type
  }
  const resp = await fetchImpl(url, { method: 'PATCH', headers: buildHeaders({ write: true, json: true, preferReturn: true }), body: JSON.stringify(body) })
  const txt = await resp.text()
  if (!resp.ok) throw new Error(`Supabase service update error: ${resp.status} ${txt}`)
  const data = JSON.parse(txt || '{}')
  return Array.isArray(data) ? data[0] : data
}

async function deleteService(name) {
  if (!name) throw new Error('service name required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for service delete')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/service?name=eq.${encodeURIComponent(name)}`
  const resp = await fetchImpl(url, { method: 'DELETE', headers: buildHeaders({ write: true }) })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`Supabase service delete error: ${resp.status} ${t}`)
  }
  return true
}

// ===================== Appointments Helpers =====================
const ALLOWED_APPOINTMENT_STATUSES = ['pending', 'approved', 'not approved']

// Helper to enrich appointments with capster names
async function enrichAppointmentsWithCapsterNames(appointments) {
  if (!appointments || appointments.length === 0) return appointments
  
  try {
    // Fetch all capsters
    const capsters = await getCapsters()
    const capsterMap = {}
    capsters.forEach(c => {
      capsterMap[c.id] = c.name || c.alias || 'Unknown'
    })
    
    // Enrich appointments with capster names
    return appointments.map(apt => ({
      ...apt,
      capsterName: capsterMap[apt.capsterId] || 'Unknown'
    }))
  } catch (error) {
    console.error('Error enriching appointments with capster names:', error)
    // Return original appointments if enrichment fails
    return appointments
  }
}

// Build a filtered appointment query for Supabase REST
function buildAppointmentQuery({ date, capsterId, statuses = [], select = '*' }) {
  const params = [`select=${select}`]
  if (date) params.push(`date=eq.${encodeURIComponent(date)}`)
  if (capsterId) params.push(`capsterId=eq.${encodeURIComponent(capsterId)}`)

  const filteredStatuses = (statuses || []).map((s) => String(s).toLowerCase()).filter(Boolean)
  if (filteredStatuses.length) {
    const orClause = filteredStatuses.map((s) => `status.eq.${encodeURIComponent(s)}`).join(',')
    params.push(`or=(${orClause})`)
  }

  const queryString = params.join('&')
  return `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/appointment?${queryString}`
}

// Schema appointment: name, email, phone, date, time, service, capsterId, status, notes, timestamp
async function getAppointments() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for appointment fetch')
  // User's schema: table "appointment" (singular)
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/appointment?select=*`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method:'GET', headers: buildHeaders() })
  if (!resp.ok) {
    const errorText = await resp.text()
    console.error(`Supabase appointment fetch error: ${resp.status}`, errorText)
    throw new Error(`Supabase appointment fetch error: ${resp.status} ${errorText}`)
  }
  const appointments = await resp.json()
  return await enrichAppointmentsWithCapsterNames(appointments)
}

// Fetch appointments by date and optional capster/status filters (used for availability checks)
async function getAppointmentsByDate({ date, capsterId, statuses = [] }) {
  if (!date) throw new Error('date required for appointment filter')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for appointment fetch')

  const url = buildAppointmentQuery({ date, capsterId, statuses })
  const resp = await fetchImpl(url, { method: 'GET', headers: buildHeaders() })
  if (!resp.ok) {
    const errorText = await resp.text()
    console.error(`Supabase appointment filtered fetch error: ${resp.status}`, errorText)
    throw new Error(`Supabase appointment fetch error: ${resp.status} ${errorText}`)
  }
  const appointments = await resp.json()
  return await enrichAppointmentsWithCapsterNames(appointments)
}

// Delete appointments whose date is before today (cleanup helper)
async function deletePastAppointments(referenceDate = new Date()) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for appointment cleanup')
  const todayStr = referenceDate.toISOString().split('T')[0]
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/appointment?date=lt.${todayStr}`
  const resp = await fetchImpl(url, { method: 'DELETE', headers: buildHeaders({ write: true }) })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`Supabase cleanup error: ${resp.status} ${t}`)
  }
  return true
}

async function getAppointmentsByUser(userEmail) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for appointment fetch')
  // Filter by email since user_id column doesn't exist
  // userEmail can be either email string or will be treated as user identifier
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/appointment?email=eq.${encodeURIComponent(userEmail)}&select=*&order=date.desc,time.desc`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method:'GET', headers: buildHeaders() })
  if (!resp.ok) {
    const errorText = await resp.text()
    console.error(`Supabase appointment fetch error: ${resp.status}`, errorText)
    throw new Error(`Supabase appointment fetch error: ${resp.status} ${errorText}`)
  }
  const appointments = await resp.json()
  return await enrichAppointmentsWithCapsterNames(appointments)
}

async function addAppointment({ name, email, phone, date, time, service, capsterId, status = 'pending', notes, timestamp, user_id, service_id, appointment_date, appointment_time }) {
  // Support both web and mobile formats
  const appointmentData = {
    name: name || null,
    email: email || null,
    phone: phone || null,
    date: date || appointment_date,
    time: time || appointment_time,
    service: service || null,
    capsterId: capsterId || null,
    status: (status && ALLOWED_APPOINTMENT_STATUSES.includes(String(status).toLowerCase()))
      ? String(status).toLowerCase()
      : 'pending',
    notes: notes || null,
    timestamp: timestamp || new Date().toISOString()
  }
  
  if (!appointmentData.date || !appointmentData.time) {
    throw new Error('Missing required appointment fields: date and time')
  }

  // Prevent double-booking: if the capster already has an approved/confirmed slot at the same time, block it
  if (appointmentData.capsterId) {
    const conflicting = await getAppointmentsByDate({
      date: appointmentData.date,
      capsterId: appointmentData.capsterId,
      statuses: ['approved']
    })
    const hasSameTime = (conflicting || []).some((apt) => apt.time === appointmentData.time)
    if (hasSameTime) {
      const err = new Error('Waktu sudah dibooking untuk capster ini')
      err.code = 'TIME_SLOT_TAKEN'
      throw err
    }
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for appointment insert')
  // User's schema: table "appointment" (singular). Column may be camelCase `capsterId`.
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/appointment`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  
  // Use service role key for writes (to bypass RLS if necessary)
  const resp = await fetchImpl(url, { 
    method:'POST', 
    headers: buildHeaders({ write: true, json: true, preferReturn: true }), 
    body: JSON.stringify(appointmentData) 
  })
  const txt = await resp.text()
  if (!resp.ok) {
    console.error('Appointment insert error response:', resp.status, txt)
    throw new Error(`Supabase appointment insert error: ${resp.status} ${txt}`)
  }
  const data = JSON.parse(txt)
  const row = Array.isArray(data) ? data[0] : data
  // Normalize field names
  return { 
    id: row.id, 
    name: row.name, 
    email: row.email, 
    phone: row.phone, 
    date: row.date, 
    time: row.time, 
    service: row.service,
    capsterId: row.capsterId, 
    status: row.status, 
    notes: row.notes, 
    timestamp: row.timestamp ?? row.created_at,
    appointment_date: row.date,
    appointment_time: row.time
  }
}

// Update appointment fields (admin use)
async function updateAppointment(id, payload = {}) {
  if (!id) throw new Error('appointment id required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for appointment update')

  const normalizedStatus = payload.status
    ? String(payload.status).toLowerCase()
    : undefined
  if (normalizedStatus && !ALLOWED_APPOINTMENT_STATUSES.includes(normalizedStatus)) {
    throw new Error('Invalid status')
  }

  const body = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    date: payload.date,
    time: payload.time,
    status: normalizedStatus,
    capsterId: payload.capsterId,
    service: payload.service,
    service_id: payload.service_id,
    notes: payload.notes
  }

  // Double-booking check if date/time/capsterId present and status to approved
  if (body.capsterId && body.date && body.time && (body.status ? body.status === 'approved' : true)) {
    const conflicting = await getAppointmentsByDate({
      date: body.date,
      capsterId: body.capsterId,
      statuses: ['approved']
    })
    const hasSameTime = (conflicting || []).some((apt) => apt.time === body.time && String(apt.id) !== String(id))
    if (hasSameTime) {
      const err = new Error('Waktu sudah dibooking untuk capster ini')
      err.code = 'TIME_SLOT_TAKEN'
      throw err
    }
  }

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/appointment?id=eq.${encodeURIComponent(id)}`
  const resp = await fetchImpl(url, { method:'PATCH', headers: buildHeaders({ write:true, json:true, preferReturn: true }), body: JSON.stringify(body) })
  const txt = await resp.text()
  if (!resp.ok) throw new Error(`Supabase appointment update error: ${resp.status} ${txt}`)
  try {
    const data = JSON.parse(txt || '{}')
    return Array.isArray(data) ? data[0] : data
  } catch(_){ return true }
}

// Insert a row into riwayat_pengguna (user history). Accepts { email, name, service, capster, date, time }
async function addRiwayatPengguna({ email, name, service, capster, date, time }){
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for riwayat_pengguna insert')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/riwayat_pengguna`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method:'POST', headers: buildHeaders({ write:true, json:true, preferReturn:true }), body: JSON.stringify({ email, name, service, capster, date, time }) })
  const txt = await resp.text()
  if (!resp.ok) {
    console.warn(`Supabase riwayat_pengguna insert error: ${resp.status} ${txt}`)
    // Don't throw - this is auxiliary, let it fail silently
    return null
  }
  const data = JSON.parse(txt)
  return Array.isArray(data) ? data[0] : data
}

// Insert a row into list_appointment. Accepts { appointment_id, status }
async function addListAppointment({ appointment_id, status }){
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for list_appointment insert')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/list_appointment`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method:'POST', headers: buildHeaders({ write:true, json:true, preferReturn:true }), body: JSON.stringify({ appointment_id, status }) })
  const txt = await resp.text()
  if (!resp.ok) {
    console.warn(`Supabase list_appointment insert error: ${resp.status} ${txt}`)
    // Don't throw - this is auxiliary, let it fail silently
    return null
  }
  const data = JSON.parse(txt)
  return Array.isArray(data) ? data[0] : data
}

// ============ Auxiliary Tables ============
// riwayat_pengguna: simple log of user bookings
// Removed legacy addUserHistory/addListAppointment variants with full appointment details.

// Update appointment status (e.g., pending -> accepted/rejected)
async function updateAppointmentStatus(id, status){
  const normalizedStatus = String(status || '').toLowerCase()
  if (!ALLOWED_APPOINTMENT_STATUSES.includes(normalizedStatus)) {
    throw new Error('Invalid status')
  }
  if (!id) throw new Error('appointment id required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for status update')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/appointment?id=eq.${encodeURIComponent(id)}`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method:'PATCH', headers: buildHeaders({ write:true, json:true, preferReturn: true }), body: JSON.stringify({ status: normalizedStatus }) })
  if (!resp.ok){ const t=await resp.text(); throw new Error(`Supabase appointment update error: ${resp.status} ${t}`) }
  // If Prefer return=representation is honored, return the updated row for convenience
  try {
    const data = await resp.json()
    return Array.isArray(data) ? data[0] : data
  } catch(_) { return true }
}

// Delete appointment
async function deleteAppointment(id){
  if (!id) throw new Error('appointment id required')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing for appointment delete')
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/appointment?id=eq.${encodeURIComponent(id)}`
  if (!fetchImpl) throw new Error('No fetch implementation available')
  const resp = await fetchImpl(url, { method:'DELETE', headers: buildHeaders({ write:true }) })
  if (!resp.ok){ const t=await resp.text(); throw new Error(`Supabase appointment delete error: ${resp.status} ${t}`) }
  return true
}
