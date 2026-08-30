# Especificación de Arquitectura 07 · Sembrado de Datos de Prueba (Seeders)

**Fase:** Sembrado de Base de Datos (Bonus)  
**Rama:** `feat/database-seeder`  
**Estado:** Completado  
**Revisión:** Equipo de Ingeniería Vyrtium  

---

## 1. Contexto y Necesidad Técnica

Para facilitar la evaluación técnica y permitir que la Landing Page y el Panel de Administración cuenten con un catálogo comercial realista de inmediato, se implementó un script de sembrado (*Seeder*) ejecutable mediante el comando `pnpm seed`.

El seeder puebla categorías y productos con precios en Pesos Colombianos (COP) e imágenes de alta resolución, manteniendo la tabla de usuarios limpia para que el evaluador cree su propia cuenta y experimente el flujo completo de bienvenida y notificaciones por correo vía Resend.

---

## 2. Decisiones de Arquitectura (ADR)

### ADR 07.1: Idempotencia en la Ejecución
- **Decisión:** Verificar la existencia previa de cada categoría y producto mediante `findOne()` antes de persistir.
- **Justificación:** Permite ejecutar `pnpm seed` múltiples veces sin duplicar registros ni generar violaciones de restricciones únicas en PostgreSQL.

### ADR 07.2: Moneda en Pesos Colombianos (COP)
- **Decisión:** Configurar los precios en COP (ej. `$249.900`, `$135.000`, `$69.900`) para reflejar el mercado colombiano y facilitar el formateo monetario en el frontend (`Intl.NumberFormat('es-CO')`).

### ADR 07.3: Exclusión de Usuarios en el Seeder
- **Decisión:** No incluir usuarios pre-sembrados en el script.
- **Justificación:** Garantiza que cualquier persona que clone el repositorio realice el registro real en `POST /api/auth/registro`, probando la validación de contraseñas, hashing con bcrypt y la recepción del correo transaccional de bienvenida.

---

## 3. Catálogo Sembrado

| Categoría | Producto | Precio (COP) | Stock |
|---|---|---|---|
| **Suplementos Deportivos** | Proteína Whey Isolate 2kg - Chocolate Suizo | $249.900 | 45 |
| **Suplementos Deportivos** | Creatina Monohidratada Micronizada 500g | $135.000 | 60 |
| **Suplementos Deportivos** | Pre-Workout Energy Burst 300g - Blue Raspberry | $119.900 | 30 |
| **Ropa Deportiva** | Camiseta Dry-Fit Performance Pro | $69.900 | 50 |
| **Ropa Deportiva** | Shorts de Entrenamiento con Malla Interna | $79.900 | 40 |
| **Accesorios Fitness** | Set de Bandas de Resistencia (5 Niveles) | $49.900 | 75 |
| **Accesorios Fitness** | Shaker Térmico de Acero Inoxidable 750ml | $54.900 | 80 |
| **Nutrición & Snacks** | Caja de Barras de Proteína (12 uds) - Caramelo & Maní | $85.000 | 35 |

---

## 4. Modo de Uso

```bash
# Poblar la base de datos con el catálogo inicial
pnpm seed
```
