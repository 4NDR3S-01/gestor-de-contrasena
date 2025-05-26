"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cerrarBaseDatos = exports.conectarBaseDatos = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configuración de la conexión a MongoDB
const conectarBaseDatos = async () => {
    try {
        const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/gestor-de-contrasena';
        await mongoose_1.default.connect(uri, {
            // Opciones de conexión recomendadas
            maxPoolSize: 10, // Mantener hasta 10 conexiones socket
            serverSelectionTimeoutMS: 5000, // Mantener intentando enviar operaciones por 5 segundos
            socketTimeoutMS: 45000, // Cerrar sockets después de 45 segundos de inactividad
        });
        console.log('✅ Conectado exitosamente a MongoDB');
        // Configurar eventos de conexión
        mongoose_1.default.connection.on('error', (error) => {
            console.error('❌ Error de conexión a MongoDB:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('⚠️  Desconectado de MongoDB');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('🔄 Reconectado a MongoDB');
        });
    }
    catch (error) {
        console.error('❌ Error al conectar con MongoDB:', error);
        process.exit(1);
    }
};
exports.conectarBaseDatos = conectarBaseDatos;
// Función para cerrar la conexión limpiamente
const cerrarBaseDatos = async () => {
    try {
        await mongoose_1.default.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
    }
    catch (error) {
        console.error('❌ Error al cerrar la conexión:', error);
    }
};
exports.cerrarBaseDatos = cerrarBaseDatos;
// Manejar el cierre del proceso
process.on('SIGINT', async () => {
    await (0, exports.cerrarBaseDatos)();
    process.exit(0);
});
