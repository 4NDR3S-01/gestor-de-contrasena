import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a MongoDB
export const conectarBaseDatos = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/gestor-de-contrasena';
    
    await mongoose.connect(uri, {
      // Opciones de conexión recomendadas
      maxPoolSize: 10, // Mantener hasta 10 conexiones socket
      serverSelectionTimeoutMS: 5000, // Mantener intentando enviar operaciones por 5 segundos
      socketTimeoutMS: 45000, // Cerrar sockets después de 45 segundos de inactividad
    });

    console.log('✅ Conectado exitosamente a MongoDB');
    
    // Configurar eventos de conexión
    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de conexión a MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Desconectado de MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Reconectado a MongoDB');
    });

  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error);
    process.exit(1);
  }
};

// Función para cerrar la conexión limpiamente
export const cerrarBaseDatos = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error);
  }
};

// Manejar el cierre del proceso
process.on('SIGINT', async () => {
  await cerrarBaseDatos();
  process.exit(0);
});
