export function welcomeEmailTemplate(
  data: Record<string, string>
): { html: string; text: string } {
  const {
    name = 'Usuario',
    email = '',
    loginUrl = 'http://localhost:3000/login',
  } = data;

  return {
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Vyrtium</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 48px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); padding: 40px 36px; text-align: left;">
          
          <!-- Logo / Header -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">VYRTIUM</span>
              <span style="font-size: 12px; font-weight: 600; color: #6366f1; background-color: #eef2ff; padding: 3px 8px; border-radius: 6px; margin-left: 8px; vertical-align: middle;">ECOMMERCE</span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding-top: 28px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">¡Hola, ${name}! 👋</h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Tu cuenta ha sido creada exitosamente con el correo <strong style="color: #0f172a;">${email}</strong>. Ya puedes acceder al panel para gestionar tu catálogo comercial.
              </p>

              <!-- Feature Highlights -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 18px 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #334155;">Con tu cuenta podrás:</p>
                <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: #64748b; line-height: 1.7;">
                  <li>Explorar y consultar el catálogo de productos.</li>
                  <li>Gestionar categorías con validaciones relacionales.</li>
                  <li>Administrar inventario, precios y stock en tiempo real.</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; padding: 13px 24px; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">Ir al Panel de Control</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
                Si no realizaste este registro, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; margin-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2026 Vyrtium Ecommerce. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `
¡Hola, ${name}!

Tu cuenta ha sido creada exitosamente en Vyrtium con el correo ${email}.
Puedes iniciar sesión en la plataforma accediendo a: ${loginUrl}

© 2026 Vyrtium Ecommerce. Todos los derechos reservados.
    `.trim(),
  };
}
