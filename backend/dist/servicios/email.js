"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarConfiguracionEmail = exports.enviarEmailRecuperacion = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configurar transporter de email
const crearTransporter = () => {
    return nodemailer_1.default.createTransport({
        host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT ?? '587'),
        secure: false, // true para 465, false para otros puertos
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};
// Enviar email de recuperación de contraseña
const enviarEmailRecuperacion = async (email, nombreUsuario, tokenRecuperacion) => {
    try {
        const transporter = crearTransporter();
        // URL del frontend para recuperación (ajustar según tu configuración)
        const urlRecuperacion = process.env.NODE_ENV === 'production'
            ? `https://tu-dominio.com/reset-password?token=${tokenRecuperacion}`
            : `http://localhost:5173/reset-password?token=${tokenRecuperacion}`;
        const opcionesEmail = {
            from: {
                name: 'Gestor de Contraseñas',
                address: process.env.EMAIL_USER ?? 'noreply@gestor-contrasenas.com'
            },
            to: email,
            subject: 'Recuperación de Contraseña - Gestor de Contraseñas',
            html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de Contraseña</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 10px;
              border: 1px solid #ddd;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              color: #4f46e5;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              background: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: #4f46e5;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .warning {
              background: #fef3cd;
              border: 1px solid #faebcc;
              color: #856404;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 Gestor de Contraseñas</div>
              <h2>Recuperación de Contraseña</h2>
            </div>
            
            <div class="content">
              <p>Hola <strong>${nombreUsuario}</strong>,</p>
              
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si realizaste esta solicitud, haz clic en el botón de abajo para crear una nueva contraseña:</p>
              
              <div style="text-align: center;">
                <a href="${urlRecuperacion}" class="button">Restablecer Contraseña</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${urlRecuperacion}
              </p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este enlace expirará en <strong>1 hora</strong></li>
                  <li>Solo puedes usar este enlace una vez</li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                </ul>
              </div>
              
              <p>Si tienes problemas con el enlace, contacta a nuestro equipo de soporte.</p>
              
              <p>Saludos,<br>
              <strong>Equipo de Gestor de Contraseñas</strong></p>
            </div>
            
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a esta dirección.</p>
              <p>© 2025 Gestor de Contraseñas. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
        Hola ${nombreUsuario},

        Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        
        Para crear una nueva contraseña, visita este enlace:
        ${urlRecuperacion}
        
        Este enlace expirará en 1 hora y solo puede usarse una vez.
        
        Si no solicitaste este cambio, ignora este email.
        
        Saludos,
        Equipo de Gestor de Contraseñas
      `
        };
        const resultado = await transporter.sendMail(opcionesEmail);
        console.log('Email de recuperación enviado:', resultado.messageId);
    }
    catch (error) {
        console.error('Error al enviar email de recuperación:', error);
        throw new Error('No se pudo enviar el email de recuperación');
    }
};
exports.enviarEmailRecuperacion = enviarEmailRecuperacion;
// Verificar configuración del email
const verificarConfiguracionEmail = async () => {
    try {
        const transporter = crearTransporter();
        await transporter.verify();
        console.log('✅ Configuración de email verificada correctamente');
        return true;
    }
    catch (error) {
        console.error('❌ Error en configuración de email:', error);
        return false;
    }
};
exports.verificarConfiguracionEmail = verificarConfiguracionEmail;
