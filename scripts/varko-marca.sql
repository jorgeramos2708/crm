UPDATE ajustes SET valor = '"Varko"', updated_at = now() WHERE clave = 'marca_nombre';
UPDATE ajustes SET valor = '""', updated_at = now() WHERE clave IN ('marca_color', 'marca_logo', 'marca_fondo');
UPDATE ajustes SET valor = '{"fondo": "#f3f6fb", "panel": "#e9eef6"}', updated_at = now() WHERE clave = 'marca_tema';
SELECT clave, left(valor::text, 40) FROM ajustes WHERE clave LIKE 'marca%' ORDER BY clave;
