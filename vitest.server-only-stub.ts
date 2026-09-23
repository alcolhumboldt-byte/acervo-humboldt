/**
 * Sustituto de «server-only» durante los tests.
 *
 * Ese paquete existe para que la compilación falle si un componente de
 * navegador importa código de servidor. Vitest no es ninguno de los dos, así
 * que ahí se sustituye por este archivo vacío en lugar de desactivar la
 * protección en el código de la aplicación.
 */
export {};
