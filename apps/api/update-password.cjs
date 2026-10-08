const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// Restablece la contraseña de un usuario del demo.
// Canónicos del seed (ver src/seed.ts y README): admin@crm.local / admin1234
// Uso: ADMIN_EMAIL=... ADMIN_PASSWORD=... node update-password.js
const pool = new Pool({ connectionString: "postgres://crm:crm_dev_password@postgres:5432/crm" });

async function updatePassword() {
  const email = process.env.ADMIN_EMAIL || "admin@crm.local";
  const password = process.env.ADMIN_PASSWORD || "admin1234";
  const hash = await bcrypt.hash(password, 12);
  const { rowCount } = await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email = $2",
    [hash, email],
  );
  if (!rowCount) {
    console.error(`No existe el usuario ${email}`);
    process.exitCode = 1;
  } else {
    console.log(`Password updated for ${email}`);
  }
  await pool.end();
}

updatePassword().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
