# Feedback Coach AI — Release 4.1.0

Release integrada con el agente real de Feedback Coach en aXet Cloud.

## Cambios principales respecto de 4.0.0
- La Sesión en vivo consume el endpoint real de Feedback Coach en aXet Cloud.
- Cada sesión web crea un `sessionId` único para mantener contexto multi-turno.
- Los fragmentos del proveedor de feedback se envían como `text/plain;charset=UTF-8` para operar desde GitHub Pages sin preflight `OPTIONS`.
- Next Best Question proviene del agente (`nextBestQuestion`).
- Hallazgos en pantalla usan la respuesta estructurada del agente: fortalezas, oportunidades de mejora, evidencia, información pendiente, desafío y compromisos.
- Se muestran fase y confianza del agente durante la sesión.
- Cuando `readyToClose=true`, la interfaz indica que la sesión puede pasar a cierre y revisión humana.
- El borrador final se estructura prioritariamente con la evidencia y compromisos devueltos por el agente.
- Se mantiene revisión humana obligatoria antes de aprobar y consolidar el feedback.

## Endpoint Cloud integrado
La web consume el endpoint corporativo de Feedback Coach publicado en aXet Cloud. No contiene tokens, cookies ni credenciales en el frontend.

## Publicación web
Reemplazar en GitHub Pages:
- `index.html`
- `configure.html`
- `app.js`
- `styles.css`

## Publicación Teams
El paquete Teams 4.1.0 mantiene los mismos contextos de uso y URLs de GitHub Pages. Actualizar la app personalizada con `FeedbackCoachAI-Teams-AllContexts-FINAL-v4.1.0.zip` si se desea mantener la versión del manifiesto alineada con la release web.

## Dependencias y guardrails
- La lectura automática de la transcripción nativa de Teams todavía requiere Microsoft Graph Transcript API y un backend/identidad corporativa autorizada.
- Los registros de UI continúan almacenándose localmente en el navegador; la persistencia multiusuario requiere un repositorio corporativo con RBAC y auditoría.
- CORS limita el uso desde el origen web configurado, pero CORS no sustituye autenticación/autorización. Antes de una publicación amplia se debe proteger el endpoint Cloud con el mecanismo corporativo de identidad/ingress correspondiente.
- Nunca almacenar tokens, cookies, PATs o credenciales en `app.js`, `index.html` o el manifiesto Teams.
