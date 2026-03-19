# 🔧 TallerControl — Guía de Configuración y Despliegue

## Stack
- **Android:** Kotlin + Jetpack Compose + Retrofit + MVVM
- **Backend:** Node.js + Express
- **Base de datos:** MongoDB Atlas
- **Deploy:** Render.com (gratis)

---

## PASO 1 — Configurar MongoDB Atlas

1. Ve a [mongodb.com/atlas](https://www.mongodb.com/atlas) → **Try Free**
2. Crea un cluster gratuito (M0 Free Tier)
3. En **Database Access** → Add New User:
   - Username: `tallercontrol`
   - Password: (genera una segura)
   - Role: `readWriteAnyDatabase`
4. En **Network Access** → Add IP Address → `0.0.0.0/0` (allow all)
5. En **Database** → Connect → **Drivers** → copia la URI:
   ```
   mongodb+srv://tallercontrol:<password>@cluster0.xxxxx.mongodb.net/tallercontrol
   ```

---

## PASO 2 — Configurar y desplegar Backend en Render.com

### Opción A: Deploy desde GitHub (recomendado)

1. Sube la carpeta `tallercontrol-backend/` a un repositorio de GitHub
2. Ve a [render.com](https://render.com) → **New Web Service**
3. Conecta tu repositorio
4. Configura:
   - **Name:** `tallercontrol-api`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. En **Environment Variables** agrega:
   ```
   MONGODB_URI = mongodb+srv://...tu URI de Atlas...
   JWT_SECRET  = una_clave_muy_larga_y_secreta_123456
   JWT_EXPIRES_IN = 7d
   PORT = 3000
   ```
6. Haz clic en **Deploy** — en ~2 minutos tendrás una URL como:
   ```
   https://tallercontrol-api.onrender.com
   ```

### Opción B: Deploy local para pruebas

```bash
cd tallercontrol-backend
cp .env.example .env
# Edita .env con tu URI de MongoDB y JWT_SECRET
npm install
npm run dev
```
Usa `http://10.0.2.2:3000/` como BASE_URL en el emulador de Android.

---

## PASO 3 — Configurar el proyecto Android

### 3.1 Requisitos
- Android Studio Hedgehog (2023.1.1) o superior
- JDK 17
- SDK Android 26+

### 3.2 Abrir el proyecto
1. Abre Android Studio → **Open** → selecciona `tallercontrol-android/`
2. Espera que Gradle sincronice (puede tardar ~3 min la primera vez)

### 3.3 Cambiar la URL del backend
Abre el archivo:
```
app/src/main/java/com/tallercontrol/data/network/ApiClient.kt
```
Cambia la `BASE_URL` a la URL de Render:
```kotlin
private const val BASE_URL = "https://tallercontrol-api.onrender.com/"
```
> Para desarrollo local con emulador usa: `"http://10.0.2.2:3000/"`

### 3.4 Ejecutar la app
- Conecta un dispositivo físico o inicia el emulador
- Haz clic en ▶️ **Run** en Android Studio

---

## PASO 4 — Probar la API (opcional)

Puedes probar los endpoints con [Postman](https://postman.com) o **curl**:

```bash
# Registrar usuario
curl -X POST https://tallercontrol-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","apellido":"López","email":"juan@test.com","password":"123456"}'

# Login
curl -X POST https://tallercontrol-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@test.com","password":"123456"}'

# Con el token obtenido, listar órdenes:
curl https://tallercontrol-api.onrender.com/api/orders \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## Estructura del proyecto

```
tallercontrol-backend/
├── src/
│   ├── index.js              ← Servidor Express principal
│   ├── middleware/auth.js    ← Verificación JWT
│   ├── models/
│   │   ├── User.js           ← Modelo usuario MongoDB
│   │   ├── Order.js          ← Modelo orden de reparación
│   │   └── Inventory.js      ← Modelo inventario
│   └── routes/
│       ├── auth.js           ← POST /register, /login, GET /me
│       ├── orders.js         ← CRUD órdenes de reparación
│       └── inventory.js      ← CRUD inventario
├── package.json
├── render.yaml               ← Config deploy Render
└── .env.example              ← Variables de entorno

tallercontrol-android/app/src/main/java/com/tallercontrol/
├── MainActivity.kt           ← Entrada de la app
├── data/
│   ├── model/Models.kt       ← Data classes Kotlin
│   ├── network/
│   │   ├── TallerControlApi.kt ← Interfaz Retrofit
│   │   └── ApiClient.kt      ← Configuración HTTP + token
│   └── repository/
│       └── Repositories.kt   ← Lógica de datos
├── navigation/NavGraph.kt    ← Rutas de navegación
└── ui/
    ├── theme/                ← Colores, tipografía, tema
    ├── components/           ← Componentes reutilizables
    ├── auth/AuthScreens.kt   ← Login, Register, ForgotPassword
    ├── home/HomeScreen.kt    ← Dashboard principal
    ├── orders/OrderScreens.kt← Lista, Detalle, Nueva, Editar orden
    ├── inventory/            ← Inventario y agregar producto
    └── account/AccountScreen.kt ← Configuración / Cerrar sesión
```

---

## API Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | /api/auth/register | Crear cuenta | No |
| POST | /api/auth/login | Iniciar sesión | No |
| GET | /api/auth/me | Perfil del usuario | Sí |
| GET | /api/orders | Listar órdenes | Sí |
| GET | /api/orders/summary | Resumen dashboard | Sí |
| GET | /api/orders/:id | Detalle de orden | Sí |
| POST | /api/orders | Crear orden | Sí |
| PUT | /api/orders/:id | Editar orden | Sí |
| PATCH | /api/orders/:id/status | Cambiar estatus | Sí |
| DELETE | /api/orders/:id | Eliminar orden | Sí |
| GET | /api/inventory | Listar inventario | Sí |
| POST | /api/inventory | Crear producto | Sí |
| PUT | /api/inventory/:id | Editar producto | Sí |
| DELETE | /api/inventory/:id | Eliminar producto | Sí |

---

## Notas importantes

- 🔑 Nunca subas tu `.env` a GitHub (está en `.gitignore`)
- 🌐 El plan gratuito de Render "duerme" el servidor tras 15 min de inactividad; la primera request tardará ~30 seg en "despertar"
- 📱 Para instalar en dispositivo físico: **Build → Generate APK** en Android Studio
- 🔧 Si el emulador no conecta al backend local, verifica que usas `10.0.2.2` y no `localhost`
