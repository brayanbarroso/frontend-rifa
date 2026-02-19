# 🎰 Sistema de Rifa Digital

Sistema web completo para gestionar rifas de 100 números (00-99) con registro de compradores.

## 📋 Características

- ✅ Cuadrícula visual de 100 números (10x10)
- ✅ Formulario de compra con validación
- ✅ Base de datos MySQL para almacenar información
- ✅ API REST con Node.js y Express
- ✅ Diseño moderno y responsivo
- ✅ Animaciones y efectos visuales
- ✅ Actualización en tiempo real de estadísticas

## 🛠️ Tecnologías Utilizadas

### Frontend
- HTML5
- CSS3 (con animaciones)
- JavaScript (Vanilla)
- Google Fonts (Bebas Neue, Outfit)

### Backend
- Node.js
- Express.js
- MySQL2

### Base de Datos
- MySQL

## 📦 Instalación

### 1. Requisitos Previos

Asegúrate de tener instalado:
- [Node.js](https://nodejs.org/) (versión 14 o superior)
- [MySQL](https://www.mysql.com/) (versión 5.7 o superior)

### 2. Configurar la Base de Datos

1. Abre MySQL en tu terminal o cliente favorito:
```bash
mysql -u root -p
```

2. Ejecuta el archivo SQL para crear la base de datos:
```bash
mysql -u root -p < database/database.sql
```

O copia y pega el contenido de `database/database.sql` en tu cliente MySQL.

### 3. Configurar el Backend

1. Ve a la carpeta del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

4. Edita el archivo `.env` y actualiza las credenciales:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD_AQUI
DB_NAME=rifa_db
```

5. O edita el archivo `server.js` y actualiza las credenciales directamente:
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'TU_PASSWORD_AQUI',  // ⚠️ CAMBIA ESTO
    database: 'rifa_db'
};
```

6. Inicia el servidor:
```bash
npm start
```

O para desarrollo con auto-recarga:
```bash
npm run dev
```

El servidor estará corriendo en `http://localhost:3000`

### 4. Configurar el Frontend

1. Ve a la carpeta del frontend:
```bash
cd ../frontend
```

2. Abre el archivo `script.js` y verifica que la URL de la API sea correcta:
```javascript
const API_URL = 'http://localhost:3000/api';
```

3. Abre `index.html` en tu navegador o usa un servidor local:

**Opción 1 - Directamente:**
- Doble clic en `frontend/index.html`

**Opción 2 - Con servidor local (recomendado):**
```bash
# Si tienes Python instalado:
python -m http.server 8000

# O con Node.js:
npx http-server -p 8000
```

Luego visita `http://localhost:8000`

## 🚀 Uso

1. **Ver números disponibles:** La cuadrícula muestra todos los números del 00 al 99
2. **Comprar un número:** Haz clic en cualquier número disponible
3. **Llenar formulario:** Completa todos los datos del comprador
4. **Confirmar:** El número se marcará como vendido y no podrá ser seleccionado nuevamente

## 📡 API Endpoints

### GET /api/numbers
Obtiene todos los números con su estado y datos del comprador (si está vendido).

**Respuesta:**
```json
[
  {
    "id": 1,
    "numero": 0,
    "vendido": true,
    "numero_documento": "1234567",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "telefono": "3001234567",
    "correo": "juan@email.com",
    "fecha_compra": "2024-02-04T10:30:00.000Z"
  }
]
```

### GET /api/numbers/:id
Obtiene información de un número específico.

### POST /api/purchase/:id
Registra la compra de un número.

**Body:**
```json
{
  "numero_documento": "1234567",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "telefono": "3001234567",
  "correo": "juan@email.com"
}
```

### GET /api/stats
Obtiene estadísticas generales.

**Respuesta:**
```json
{
  "total": 100,
  "vendidos": 25,
  "disponibles": 75
}
```

### GET /api/buyers
Obtiene la lista de todos los compradores.

### GET /api/health
Verifica el estado de la API.

## 📊 Estructura de la Base de Datos

### Tabla: numeros
- `id` (INT, PK)
- `numero` (INT, UNIQUE)
- `vendido` (BOOLEAN)

### Tabla: compradores
- `id` (INT, PK)
- `numero_id` (INT, FK)
- `numero_documento` (VARCHAR)
- `nombres` (VARCHAR)
- `apellidos` (VARCHAR)
- `telefono` (VARCHAR)
- `correo` (VARCHAR)
- `fecha_compra` (TIMESTAMP)

## 🎨 Personalización

### Cambiar Colores

Edita las variables CSS en `styles.css`:

```css
:root {
    --primary: #FF6B35;      /* Color principal */
    --secondary: #004E89;    /* Color secundario */
    --accent: #F7B801;       /* Color de acento */
    --success: #06D6A0;      /* Color de éxito */
    --bg-main: #0A0E27;      /* Fondo principal */
}
```

### Cambiar Fuentes

Reemplaza las fuentes en el `<head>` de `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=TU_FUENTE&display=swap" rel="stylesheet">
```

## 🔧 Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `server.js`
- Asegúrate de que la base de datos `rifa_db` exista

### Error: "CORS policy"
- Asegúrate de que el backend esté corriendo
- Verifica que la URL en `script.js` sea correcta

### Los números no se cargan
- Abre la consola del navegador (F12)
- Verifica que no haya errores
- Confirma que el servidor backend esté corriendo

## 📝 Consultas SQL Útiles

```sql
-- Ver números disponibles
SELECT numero FROM numeros WHERE vendido = FALSE ORDER BY numero;

-- Ver compradores
SELECT * FROM vista_compradores_completa;

-- Ver estadísticas
SELECT * FROM vista_estadisticas;

-- Buscar por documento
SELECT * FROM compradores WHERE numero_documento = '1234567';

-- Resetear la rifa (eliminar todas las compras)
DELETE FROM compradores;
UPDATE numeros SET vendido = FALSE;
```

## 📄 Estructura del Proyecto

```
proyecto-rifa/
├── frontend/
│   ├── index.html      # Página principal
│   ├── styles.css      # Estilos y animaciones
│   └── script.js       # Lógica del frontend
├── backend/
│   ├── server.js       # Servidor Node.js/Express
│   ├── package.json    # Dependencias
│   └── .env.example    # Variables de entorno
├── database/
│   └── database.sql    # Script de base de datos
├── README.md           # Documentación
└── .gitignore          # Archivos a ignorar
```

## 🤝 Contribuciones

Las mejoras y sugerencias son bienvenidas. Siéntete libre de hacer un fork y enviar pull requests.

## 📜 Licencia

MIT License - Siéntete libre de usar este proyecto para tus propias rifas.

## 💡 Ideas de Mejora

- [ ] Panel de administración
- [ ] Exportar lista de compradores a Excel
- [ ] Enviar emails de confirmación
- [ ] Integración con pasarelas de pago
- [ ] Sorteo automático del ganador
- [ ] Sistema de autenticación
- [ ] Múltiples rifas simultáneas
- [ ] Compartir en redes sociales

---

**¡Buena suerte con tu rifa! 🎉**
