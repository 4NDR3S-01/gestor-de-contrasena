import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { conectarBaseDatos } from './configuracion/baseDatos';
import rutasAPI from './rutas';

// Configurar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();
const PUERTO = process.env.PORT ?? 5000;

// Conectar a la base de datos
conectarBaseDatos();

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://delightful-mushroom-09d443d1e.6.azurestaticapps.net'] 
    : ['https://delightful-mushroom-09d443d1e.6.azurestaticapps.net', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limitador de velocidad (rate limiting)
const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP cada 15 minutos
  message: {
    exito: false,
    mensaje: 'Demasiadas solicitudes desde esta IP. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const limitadorAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login por IP cada 15 minutos
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
  },
  skipSuccessfulRequests: true,
});

// Middleware básico
app.use(limitadorGeneral);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas de salud y estado
app.get('/api/salud', (req: Request, res: Response) => {
  res.json({
    exito: true,
    mensaje: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Usar rutas de la API
app.use('/api', rutasAPI);

// Middleware para rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada'
  });
});

// Middleware global de manejo de errores
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error del servidor:', error);
  
  res.status(error.status ?? 500).json({
    exito: false,
    mensaje: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Iniciar servidor
app.listen(PUERTO, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PUERTO}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`📚 API disponible en: http://localhost:${PUERTO}/api`);
});

// Manejo elegante del cierre del servidor
process.on('SIGTERM', () => {
  console.log('🔴 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔴 Cerrando servidor...');
  process.exit(0);
});

export default app;
