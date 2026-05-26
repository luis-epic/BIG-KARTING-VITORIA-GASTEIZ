# 🏎️ Big Karting Vitoria-Gasteiz — Sitio Web WebGL 3D Premium

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r158+-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Premium-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![Build Status](https://img.shields.io/badge/Build-Success-28a745?style=for-the-badge)](https://github.com/luis-epic/BIG-KARTING-VITORIA-GASTEIZ)

Una experiencia digital inmersiva e interactiva de primer nivel para **Big Karting Vitoria-Gasteiz**, el mejor circuito indoor de karting en Álava y el único trazado exclusivo de **Drift** en el Norte de España.

Este proyecto web está diseñado bajo estándares de nivel senior, fusionando un entorno gráfico interactivo tridimensional (WebGL) con una arquitectura multi-página (MPA) ágil, ultra-responsiva y totalmente independiente de plataformas de terceros.

---

## 💎 Características Principales

### 🖥️ Diseño "Hero Split" Porsche/Lamborghini & Responsividad
* **Estructura Split-Screen en Escritorio**: Una disposición asimétrica premium. La mitad izquierda presenta un panel glassmórfico vertical translúcido enfocado en los copys y CTAs. La mitad derecha se reserva íntegramente para lucir el karting 3D desplazado mediante matemáticas en JS (`x = 1.8`).
* **Interactividad de Dirección (Steering Yaw)**: El modelo 3D del kart reacciona con inercia al movimiento horizontal del puntero del mouse, simulando que el usuario conduce y gira las ruedas y el chasis en tiempo real.
* **Mobile-First Dinámico**: En teléfonos móviles y tablets (`<= 900px`), el diseño transmuta automáticamente a una tarjeta central centrada, y el motor de Three.js reubica el kart y el foco de cámara de forma automática en el centro exacto (`x = 0`) para una visualización perfecta.

### 🛣️ Entorno 3D de Autopista Infinita Neón (Infinite Highway)
* El kart flota sobre una **autopista de velocidad infinita** equipada con marcas viales de neón rojo y arcos de meta elípticos amarillos espaciados en Z.
* **Aceleración por Scroll**: La velocidad de avance de los elementos de la autopista y los arcos neón se multiplica dinámicamente (`speedMultiplier`) según el desplazamiento vertical (scroll) del usuario, emulando aceleración física.

### 🎥 Trayectoria Cinemática Orbital 360°
* La cámara vuela en una órbita elíptica tridimensional sincronizada con el scroll a través de **4 fases cinemáticas**:
  * **Fase 1 (Hero)**: Plano bajo frontal interactivo con paralaje de ratón.
  * **Fase 2 (Modalidades)**: Acercamiento macro en diagonal al motor Honda y pontón.
  * **Fase 3 (Drift)**: Plano rasante trasero bajo enfocando los neumáticos de derrape.
  * **Fase 4 (Contacto y Footer)**: Plano cenital vertical directo mirando hacia abajo en la rejilla.
* Suspensión senoidal de amortiguación constante que genera una levitación constante y realista del kart.

### 🎵 Sonido Cyber-HUD y Autoplay Seamless (Sin Roadblocks)
* **Cargador Ciberpunk HUD**: Barra de carga HUD con telemetría de porcentaje y estados dinámicos que se desvanece automáticamente (600ms) al finalizar la carga del modelo 3D.
* **Autoplay Inteligente**: Supera la restricción de autoplay de navegadores de forma invisible. La música se desbloquea en la primera interacción física del usuario en el sitio (clic, toque o pulsación de tecla) y se reproduce con una rampa Lerp suave de fade-in gradual.
* **Pista de Alto Rendimiento**: Equipado con una canción enérgica de sintetizadores y rock de carreras de SoundHelix, compatible con CORS y optimizada para todos los navegadores.

### 📑 Estructura Multi-Página (MPA) Local e Independiente
* Migración completa de enlaces externos a **8 páginas locales e independientes** diseñadas a medida, compartiendo el mismo motor 3D y cursor personalizado interactivo:
  * `index.html` — Landing page inmersiva principal.
  * `carreras.html` — Información, specs y precios de Karts clásicos.
  * `drift.html` — Página dedicada al circuito exclusivo de drift.
  * `infantil.html` — Actividades infantiles, cursillos y cumpleaños.
  * `grupos.html` — Packs detallados para teambuilding y despedidas.
  * `tienda.html` — Tienda online integrada para reservas directas.
  * `contacto.html` — Formulario de reservas y contacto.
  * `legal.html` — Aviso legal, privacidad y cookies.

### 📊 Simetría Estética y Tarifas Reales
* **Tarjetas Simétricas**: Ajustadas a 5 columnas idénticas y homogéneas en desktop y apiladas en 1 columna en móvil en la sección "Especialistas en Grupos", logrando consistencia visual.
* **Tarifas Oficiales Actualizadas**: Incorporación de los precios y condiciones reales del negocio para Sesiones Individuales y Campeonatos de Grupo (Sprint Race, Mini GP y Gran Premio).

---

## 🛠️ Stack Tecnológico

* **Core**: HTML5, Vanilla JavaScript (ES6+), CSS3 (Modern Vanilla).
* **Motor 3D**: [Three.js](https://threejs.org/) (WebGL) + `GLTFLoader`.
* **Empaquetador**: [Vite](https://vite.dev/) para optimización, minificación y hot-reload ultra veloz.
* **Fuentes**: Google Fonts (Bebas Neue, Rajdhani, Exo 2).

---

## 📁 Estructura del Proyecto

```text
bigkarting/
├── assets/                  # Activos de imágenes estáticas optimizadas
├── public/                  # Recursos públicos servidos en la raíz por Vite
│   ├── models/              # Modelos 3D (.glb / .gltf)
│   └── *.png                # Fotos reales de la galería
├── src/
│   ├── main.js              # Inicialización de Three.js, físicas de scroll e interactividad
│   └── style.css            # Estilos ciberpunk, glassmorphism y responsive
├── index.html               # Página de inicio
├── carreras.html            # Subpágina de Karting Clásico
├── drift.html               # Subpágina de Drift
├── infantil.html            # Subpágina de Karting Infantil
├── grupos.html              # Subpágina de Eventos de Grupo
├── tienda.html              # Subpágina de Tienda Online
├── contacto.html            # Subpágina de Contacto y Reservas
├── legal.html               # Subpágina de Aspectos Legales
├── vite.config.js           # Puntos de entrada multi-página y optimización de Vite
├── .gitignore               # Exclusiones de Git (node_modules, dist, etc.)
└── README.md                # Documentación técnica oficial
```

---

## 🚀 Instalación y Desarrollo Local

Sigue estos sencillos pasos para levantar el entorno de desarrollo en tu máquina local:

### Requisitos Previos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

### 1. Clonar el repositorio
```bash
git clone https://github.com/luis-epic/BIG-KARTING-VITORIA-GASTEIZ.git
cd BIG-KARTING-VITORIA-GASTEIZ
```

### 2. Instalar dependencias
Instala las dependencias necesarias de Three.js y Vite:
```bash
npm install
```

### 3. Levantar el servidor de desarrollo
Inicia el servidor local de Vite con recarga en caliente:
```bash
npm run dev
```
Abre tu navegador en `http://localhost:5173` para disfrutar de la experiencia.

### 4. Compilar para producción
Para optimizar el código, minificar las hojas de estilos e inyectar el JavaScript empaquetado para producción:
```bash
npm run build
```
Los archivos finales compilados y listos para subir a hosting se generarán en la carpeta `/dist`.

---

## 📈 SEO y Buenas Prácticas
* **Datos Estructurados (JSON-LD)**: Inyección de esquema `SportsActivityLocation` de Schema.org en `index.html` para un SEO Local inmejorable en Google Maps.
* **Metadatos Optimistas**: Títulos únicos, descripciones persuasivas y etiquetas `Open Graph` (OG) configuradas de forma independiente en las 8 páginas para previsualizaciones impecables en redes sociales (WhatsApp, Instagram, Facebook).
* **Marcado Semántico HTML5**: Uso correcto de elementos semánticos (`<main>`, `<section>`, `<header>`, `<footer>`) para máxima accesibilidad y rastreo de arañas de búsqueda.

---

## ⚖️ Licencia
Desarrollado bajo licencia privativa exclusiva para **Big Karting Vitoria-Gasteiz**. Todos los derechos reservados. 2026.
