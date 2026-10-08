UPDATE ajustes SET valor = '"Varko"', updated_at = now() WHERE clave = 'marca_nombre';
SELECT valor, updated_at FROM ajustes WHERE clave = 'marca_nombre';
SELECT now() AS db_now;
