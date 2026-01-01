import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Barbershop Booking API',
      version: '1.0.0',
      description: 'API documentation untuk aplikasi mobile barbershop booking',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5003',
        description: 'Development server',
      },
      {
        url: 'https://brocode-mobile-app.vercel.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
          },
        },
        Capster: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            alias: { type: 'string' },
            description: { type: 'string' },
            experience: { type: 'integer' },
            instaAcc: { type: 'string' },
            image_url: { type: 'string' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            service_id: { type: 'integer' },
            capster_id: { type: 'integer' },
            appointment_date: { type: 'string', format: 'date' },
            appointment_time: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
            notes: { type: 'string' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Services',
        description: 'Barbershop services',
      },
      {
        name: 'Capsters',
        description: 'Barber information',
      },
      {
        name: 'Appointments',
        description: 'Booking appointments',
      },
      {
        name: 'Accounts',
        description: 'User account management (Admin only)',
      },
    ],
  },
  apis: [
    path.join(__dirname, './routes/authRoutes.js'),
    path.join(__dirname, './routes/servicesRoutes.js'),
    path.join(__dirname, './routes/capsterRoutes.js'),
    path.join(__dirname, './routes/appointmentsRoutes.js'),
    path.join(__dirname, './routes/accountsRoutes.js'),
  ],
};

const specs = swaggerJsdoc(options);

export default specs;
