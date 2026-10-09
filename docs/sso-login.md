# Login con Google y Microsoft (SSO)

Los botones del login usan OAuth 2.0 contra Google y Microsoft Entra. Solo
pueden entrar usuarios **ya creados y activos** en el CRM (match por email);
el SSO no crea cuentas.

## 1. Crear las apps

### Google Cloud (`console.cloud.google.com`)

1. APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth.
2. Tipo de aplicación: **Web**.
3. En **URIs de redirección autorizados** agrega las dos que muestra
   Configuración → Credencial Google global (conexión + login).
4. Copia Client ID y Client Secret. Si la app está en modo prueba, añade a
   los empleados como usuarios de prueba.

### Microsoft Entra (`entra.microsoft.com`)

1. Aplicaciones → Registros → Nuevo registro (single-tenant u
   `organizations` según el caso).
2. Copia el ID de aplicación (cliente) y crea un secreto en Certificados y
   secretos.
3. En Autenticación agrega las dos URIs de redirección que muestra
   Configuración → Credencial Microsoft global.
4. En Permisos de API agrega delegados `openid profile email offline_access
User.Read` (el login solo pide identidad) más los de buzón si se usa
   Outlook (`Mail.Read`, `Mail.Send`, `Calendars.Read`), y otorga
   consentimiento de administrador.

## 2. Guardar en el CRM

Configuración (admin) → Credencial Google/Microsoft global: pega Client ID,
Secret, Tenant ID (Microsoft) y la Redirect URI de **conexión**. Las URIs de
**login** se derivan de `FRONTEND_URL` y deben coincidir con las registradas.

## 3. Cómo funciona

- `GET /api/auth/:proveedor/login` crea un nonce en Redis (10 min) y redirige
  al IdP con `redirect_uri=.../login/callback` y scopes mínimos de identidad.
- El callback valida nonce (un solo uso), intercambia el código, lee el email
  (`userinfo` / Graph `/me`), busca usuario activo por email, emite JWT en
  cookie HttpOnly y redirige a `/`.
- Errores vuelven a `/login?error=sso_*` con mensaje (cancelado, no
  configurado, sin cuenta, inactivo, sin email).
- `GET /api/auth/sso/status` (público, sin secretos) indica qué botones
  habilitar y los callbacks exactos vigentes.

## 4. Producción

- `FRONTEND_URL=https://<dominio>` debe ser el origen público (los callbacks
  se construyen con él y el IdP exige coincidencia exacta).
- `http://localhost` solo vale para demo (ambos IdP lo permiten en local).
- Tras cambiar secretos o `FRONTEND_URL`, no hay que reiniciar (config en BD).
