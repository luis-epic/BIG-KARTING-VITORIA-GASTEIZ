import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { initLoader } from './loader.js';

export function init3DScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  // Detectar subpágina para posicionar y redimensionar el lienzo 3D
  const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.endsWith('/');
  if (!isHomePage) {
    document.body.classList.add('is-subpage');
    if (window.location.pathname.includes('legal')) {
      document.body.classList.add('legal');
    }
  }

  try {
    const scene = new THREE.Scene();
    // Niebla lineal limpia — funde el vacío detrás del kart sin bordes
    scene.fog = new THREE.Fog(0x03030a, 10, 55);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 1.5, 6);

    // Renderer con tone mapping para look de fotografía profesional
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setClearColor(0x03030a, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // === FONDO ESTUDIO PROFESIONAL ===
    // Degradado radial oscuro (vignette) simulado con un plano posterior enorme
    const bgGeom = new THREE.PlaneGeometry(2, 2);
    const bgMat = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime:       { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec2  uResolution;
        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution;
          vec2 centered = uv - 0.5;

          // Vignette suave
          float vignette = 1.0 - dot(centered * 1.5, centered * 1.5);
          vignette = clamp(vignette, 0.0, 1.0);
          vignette = pow(vignette, 1.8);

          // Base: negro profundo con tono muy sutil a azul marino
          vec3 dark = vec3(0.010, 0.010, 0.016);

          // Glow naranja firma BigKarting — muy sutil, solo debajo del kart
          float glowY  = smoothstep(0.5, 0.0, uv.y);          // solo mitad inferior
          float glowX  = 1.0 - smoothstep(0.0, 0.35, abs(centered.x));
          float pulse   = 0.8 + 0.2 * sin(uTime * 0.4);       // leve pulso
          vec3 orangeGlow = vec3(0.12, 0.04, 0.0) * glowY * glowX * pulse;

          vec3 col = dark + orangeGlow;
          col *= mix(0.25, 1.0, vignette);   // oscurecer bordes
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const bgMesh = new THREE.Mesh(bgGeom, bgMat);
    bgMesh.renderOrder = -1;
    scene.add(bgMesh);

    // === SUELO ESPEJO OSCURO (Estudio fotográfico) ===
    // Un plano que refleja las luces como asfalto mojado pulido con clearcoat de automoción premium
    const floorGeom = new THREE.PlaneGeometry(35, 35);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x020206,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Línea de luz naranja en el suelo (efecto split-lighting profesional)
    const stripGeom = new THREE.PlaneGeometry(0.04, 22);
    const stripMat = new THREE.MeshBasicMaterial({
      color: 0xff5a00,
      transparent: true,
      opacity: 0.55,
    });
    const stripL = new THREE.Mesh(stripGeom, stripMat);
    stripL.rotation.x = -Math.PI / 2;
    stripL.position.set(-3.5, -2.09, -4);
    const stripR = stripL.clone();
    stripR.position.x = 3.5;

    // === ILUMINACIÓN PROFESIONAL DE TRES PUNTOS (Fotografía automotriz) ===

    // 1. Luz clave — fuerte desde arriba-derecha-frontal (simula softbox)
    const keyLight = new THREE.DirectionalLight(0xfff0e8, 5.0);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // 2. Relleno — suave desde la izquierda, muy tenue (evita sombras duras)
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 1.8);
    fillLight.position.set(-6, 3, 2);
    scene.add(fillLight);

    // 3. Borde/Rim — contraluz naranja desde atrás (firma de marca BigKarting)
    const rimLight = new THREE.PointLight(0xff5a00, 8.0, 18);
    rimLight.position.set(0, 1.5, -4.5);
    scene.add(rimLight);

    // 4. Luz de suelo — rebote bajo muy sutil (simula reflejo del suelo pulido)
    const groundBounce = new THREE.PointLight(0x080408, 2.5, 10);
    groundBounce.position.set(0, -1.5, 1);
    scene.add(groundBounce);

    // 5. Ambient muy bajo (sin aplastamiento de sombras)
    const ambientLight = new THREE.AmbientLight(0x08080f, 1.0);
    scene.add(ambientLight);

    // 6. HemisphereLight de alta calidad para evitar modelos oscuros/negros en moviles sin envMap
    const hemiLight = new THREE.HemisphereLight(0xfff5ea, 0x080815, 3.5);
    scene.add(hemiLight);

    // === MODELO DE KART 3D (MIGRACIÓN GLB CON FALLBACK HUD) ===
    const kartGroup = new THREE.Group();
    scene.add(kartGroup);

    const wheels = [];
    const glowMeshes = [];

    // Inicializar cargador HUD Cyber-Loader
    const { updateLoader, removeLoader, loadingMessages } = initLoader();

    let hasLoadedModel = false;

    // Timeout de seguridad de 15 segundos
    const loadTimeout = setTimeout(() => {
      if (!hasLoadedModel) {
        console.warn("La carga del modelo 3D GLB excedió el tiempo límite. Mostrando escena de fondo...");
        hasLoadedModel = true;
        if (canvas) canvas.classList.add('visible');
        removeLoader();
      }
    }, 15000);

    // Cargar modelo real GLTF/GLB de go-karting fotorrealista en todos los dispositivos
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/go-kart 3d model.glb',
      (gltf) => {
        clearTimeout(loadTimeout);
        if (hasLoadedModel) return;
        hasLoadedModel = true;

        const model = gltf.scene;

        // 1. Obtener la caja de límites del modelo original para calcular el escalado
        const originalBox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        originalBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredLength = 3.5;
        const scaleFactor = desiredLength / maxDim;
        
        // 2. Aplicar escala al modelo primero
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // 3. Obtener la caja de límites y centro geométrico del modelo ya escalado
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);
        
        // 4. Centrar en X y Z en la escena, y subir en Y para que la parte más baja de los neumáticos esté a 0 local
        model.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z); 

        const modelContainer = new THREE.Group();
        modelContainer.add(model);
        modelContainer.position.y = 0; // Pivote base alineado en Y = 0 local
        modelContainer.rotation.y = Math.PI; // Encarar dirección de avance

        // Recorrido (traverse) para sombras, materiales realistas y ruedas
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Desactivar culling para forzar pre-carga total en la GPU y evitar tirones al rotar la cámara

            if (child.material) {
              child.material.roughness = isMobile ? 0.38 : 0.15;
              child.material.metalness = isMobile ? 0.35 : 0.85;

              // Añadir emisividad para partes incandescentes/neon
              const name = child.name.toLowerCase();
              if (name.includes('neon') || name.includes('glow') || name.includes('led') || name.includes('luz')) {
                // Clonar material para evitar cambiar otros elementos no emisivos compartidos
                child.material = child.material.clone();
                child.material.emissive = child.material.color || new THREE.Color(0xff5a00);
                child.material.emissiveIntensity = 2.5;
                glowMeshes.push(child);
              }
            }

            // Identificación y captura dinámica de ruedas
            const name = child.name.toLowerCase();
            if (name.includes('wheel') || name.includes('rueda') || name.includes('tire') || name.includes('llanta') || name.includes('rim')) {
              // Si la malla está agrupada, rotamos el grupo padre para mayor estabilidad geométrica
              if (child.parent && child.parent.isGroup && child.parent !== model) {
                if (!wheels.includes(child.parent)) {
                  wheels.push(child.parent);
                }
              } else {
                wheels.push(child);
              }
            }
          }
        });

        kartGroup.add(modelContainer);
        console.log(`Modelo 3D cargado con éxito. Ruedas animables: ${wheels.length}`);

        // Pre-compilar y pre-renderizar una vez de forma diferida fuera del loop principal para evitar bloquear la carga inicial y eliminar violaciones de rendimiento
        setTimeout(() => {
          if (renderer && scene && camera && canvas) {
            renderer.compile(scene, camera);
            renderer.render(scene, camera);
            canvas.classList.add('visible');
          }
        }, 100);

        updateLoader(100, "CONEXIÓN ESTABLECIDA");
        removeLoader();
      },
      (xhr) => {
        if (hasLoadedModel) return;
        const total = xhr.total || 31646280;
        const percent = (xhr.loaded / total) * 100;
        const msgIdx = Math.min(Math.floor(percent / 20), loadingMessages.length - 1);
        updateLoader(percent, loadingMessages[msgIdx]);
      },
      (error) => {
        console.error("Error cargando el modelo 3D GLB:", error);
        clearTimeout(loadTimeout);
        if (!hasLoadedModel) {
          hasLoadedModel = true;
          canvas.classList.add('visible');
          removeLoader();
        }
      }
    );

    // Halo de neón en el suelo bajo el kart
    const haloGeom = new THREE.RingGeometry(0.6, 2.2, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xff5a00,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = -2.08;
    scene.add(haloMesh);

    // === ESCENA ESTUDIO: LÍNEAS DE LUZ EN EL SUELO ===
    // (reemplaza el grid/arcos — look más premium)
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // Añadir las tiras de luz reflectante al grupo de la pista
    trackGroup.add(stripL);
    trackGroup.add(stripR);

    // Rejilla muy sutil de líneas (apenas visibles, efecto marca de agua)
    const studioGrid = new THREE.GridHelper(20, 20, 0x1a0a0a, 0x0e0a0a);
    studioGrid.position.y = -2.09;
    studioGrid.material.transparent = true;
    studioGrid.material.opacity = 0.35;
    trackGroup.add(studioGrid);

    // Líneas discontinuas centrales neón para la sensación de pista infinita
    const dashCount = 8;
    const dashes = [];
    const dashGeom = new THREE.PlaneGeometry(0.1, 1.4);
    const dashMat = new THREE.MeshBasicMaterial({
      color: 0xff5a00,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    for (let i = 0; i < dashCount; i++) {
      const dash = new THREE.Mesh(dashGeom, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, -2.095, -16 + i * 4);
      trackGroup.add(dash);
      dashes.push(dash);
    }

    // === SISTEMA DE PARTÍCULAS: POLVO DE ESTUDIO ===
    // Partículas muy sutiles y lentas (polvo en el aire, look profesional)
    const particleCount = 80;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3]     = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 6 + 1;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const speedParticles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(speedParticles);

    // === SISTEMA DE PARTÍCULAS: FLAMA DE ESCAPE REACTIVA (BACKFIRE) ===
    const flameMaxCount = 150;
    const flameGeometry = new THREE.BufferGeometry();
    const flamePositions = new Float32Array(flameMaxCount * 3);
    const flameColors = new Float32Array(flameMaxCount * 3);

    // Inicializar posiciones y colores (todos en 0 por defecto / ocultos)
    for (let i = 0; i < flameMaxCount; i++) {
      flamePositions[i * 3] = 0;
      flamePositions[i * 3 + 1] = -999; // Ocultar debajo del mapa
      flamePositions[i * 3 + 2] = 0;
      
      flameColors[i * 3] = 1.0;
      flameColors[i * 3 + 1] = 0.8;
      flameColors[i * 3 + 2] = 0.0;
    }

    flameGeometry.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    flameGeometry.setAttribute('color', new THREE.BufferAttribute(flameColors, 3));

    // Material de partículas con mezcla aditiva para un brillo de fuego incandescente
    const flameMaterial = new THREE.PointsMaterial({
      size: 0.28,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    const exhaustFlames = new THREE.Points(flameGeometry, flameMaterial);
    scene.add(exhaustFlames);

    // Estado del ciclo de vida de cada partícula de fuego
    const flameParticles = [];
    for (let i = 0; i < flameMaxCount; i++) {
      flameParticles.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0,
        maxLife: 0
      });
    }

    // === SISTEMA DE PARTÍCULAS: CHISPAS DE DERRAPE (DRIFT SPARKS) ===
    const sparkMaxCount = 200;
    const sparkGeometry = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkMaxCount * 3);
    const sparkColors = new Float32Array(sparkMaxCount * 3);

    for (let i = 0; i < sparkMaxCount; i++) {
      sparkPositions[i * 3] = 0;
      sparkPositions[i * 3 + 1] = -999;
      sparkPositions[i * 3 + 2] = 0;

      sparkColors[i * 3] = 0.0;
      sparkColors[i * 3 + 1] = 0.8;
      sparkColors[i * 3 + 2] = 1.0;
    }

    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    sparkGeometry.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

    const sparkMaterial = new THREE.PointsMaterial({
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    const driftSparks = new THREE.Points(sparkGeometry, sparkMaterial);
    scene.add(driftSparks);

    const sparkParticles = [];
    for (let i = 0; i < sparkMaxCount; i++) {
      sparkParticles.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0,
        maxLife: 0,
      });
    }
    const arches = []; // vacío — solo para compatibilidad

    // === SISTEMAS DE CAPTURA DE MOUSE & SCROLL ===
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let scrollPercent = 0;
    let isTurbo = false; // Estado para el Turbo Boost en móviles

    // === INTERACTIVIDAD DRAG-TO-ROTATE (ELEMENTO 3D REACTIVO Y) ===
    const heroSection = document.getElementById('hero');
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragRotationY = 0;

    // Registrar eventos táctiles globales en window/document para esquivar solapamiento de capas en móvil
    let touchStartTime = 0;
    let turboTimer = null;

    window.addEventListener('touchstart', (e) => {
      // Solo actuar si estamos en la zona superior (dentro de los primeros 420px del Hero)
      if (window.scrollY > 150) return;
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('nav') || e.target.closest('#mobileMenu')) return;
      
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        touchStartTime = Date.now();
        if (turboTimer) clearTimeout(turboTimer);
        
        turboTimer = setTimeout(() => {
          if (isDragging && !isTurbo) {
            isTurbo = true;
            if (navigator.vibrate) {
              navigator.vibrate([60, 40, 60]);
            }
          }
        }, 120); // Retraso de 120ms más reactivo
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      
      const deltaX = Math.abs(e.touches[0].clientX - previousMousePosition.x);
      const deltaY = Math.abs(e.touches[0].clientY - previousMousePosition.y);
      
      if (deltaY > deltaX * 1.1) {
        isDragging = false;
        isTurbo = false;
        if (turboTimer) clearTimeout(turboTimer);
        return;
      }

      if (deltaX > 8) {
        if (turboTimer) clearTimeout(turboTimer);
      }

      const deltaMove = {
        x: e.touches[0].clientX - previousMousePosition.x,
        y: e.touches[0].clientY - previousMousePosition.y
      };

      dragRotationY = Math.max(-0.78, Math.min(0.78, dragRotationY + deltaMove.x * 0.009));
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    const endTouchHandler = () => {
      isDragging = false;
      isTurbo = false;
      if (turboTimer) {
        clearTimeout(turboTimer);
        turboTimer = null;
      }
    };

    window.addEventListener('touchend', endTouchHandler);
    window.addEventListener('touchcancel', endTouchHandler);

    if (canvas) {
      // Cambiar cursor estético sobre el Canvas para sugerir interactividad
      canvas.style.cursor = 'grab';

      canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        };

        // Sumar rotación interactiva horizontal (CON LIMITADOR FÍSICO / CLAMPING ESTÉTICO A ±45 grados (~0.78 rad))
        dragRotationY = Math.max(-0.78, Math.min(0.78, dragRotationY + deltaMove.x * 0.007));

        previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          canvas.style.cursor = 'grab';
        }
      });
    }

    document.addEventListener('mousemove', e => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const heroEl = document.getElementById('hero') || document.getElementById('section-hero');
    let cachedDocHeight = 0;
    let isMobile = window.innerWidth <= 900;
    let heroThreshold = 0;
    let isCanvasVisible = true; // Caché del estado de visibilidad del lienzo para evitar consultas DOM en caliente

    const recalculatePageMetrics = () => {
      if (typeof document !== 'undefined') {
        cachedDocHeight = document.documentElement.scrollHeight - window.innerHeight;
        isMobile = window.innerWidth <= 900;
        heroThreshold = heroEl ? heroEl.offsetHeight : (window.innerHeight * 0.5);
      }
    };

    const updateCanvasVisibility = () => {
      if (canvas && !isCanvasVisible) {
        canvas.classList.remove('hidden');
        isCanvasVisible = true;
      }
    };

    window.addEventListener('scroll', () => {
      if (isHomePage && !isMobile && cachedDocHeight > 0) {
        scrollPercent = window.scrollY / cachedDocHeight;
      } else {
        scrollPercent = 0;
      }
      
      // Control de visibilidad del canvas en móvil al hacer scroll
      if (isMobile) {
        // Hitos de holgura: desvanecer canvas de forma instantánea al iniciar el scroll (80px)
        if (window.scrollY > 80) {
          if (isCanvasVisible) {
            canvas.classList.add('hidden');
            isCanvasVisible = false;
            isTurbo = false; // Desactivar turbo si hace scroll
          }
        } else {
          if (!isCanvasVisible) {
            canvas.classList.remove('hidden');
            isCanvasVisible = true;
          }
        }
      } else {
        updateCanvasVisibility();
      }
    });

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      // Actualizar resolución del shader de fondo
      bgMat.uniforms.uResolution.value.set(rect.width, rect.height);
    };

    window.addEventListener('resize', () => {
      resizeCanvas();
      recalculatePageMetrics();
      updateCanvasVisibility();
    });
    resizeCanvas();
    recalculatePageMetrics();
    updateCanvasVisibility();

    // === BUCLE DE ANIMACIÓN (INTERPOLACIÓN SCROLL) ===
    const startTime = performance.now();

    // Variables persistentes para el suavizado Lerp de la cámara (Dron) y físicas de scroll
    let currentCamX = 0;
    let currentCamY = 1.5;
    let currentCamZ = 6.0;

    let currentLookX = 0;
    let currentLookY = 0.2;
    let currentLookZ = 0;

    let lastScrollPercent = 0;
    let scrollSpeed = 0;

    function animate() {
      requestAnimationFrame(animate);

      const time = (performance.now() - startTime) / 1000;

      // Retorno elástico suave a la posición neutra original de scroll
      if (!isDragging) {
        dragRotationY += (0 - dragRotationY) * 0.05;
      }

      // Actualizar uTime del shader de fondo
      bgMat.uniforms.uTime.value = time;

      // A. Girar ruedas del kart constantemente y animar luces neon pulsantes
      const wheelSpeed = isHomePage ? (isTurbo ? -0.45 : -0.18) : -0.32;
      wheels.forEach(wheel => {
        wheel.rotateX(wheelSpeed);
      });
      glowMeshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.emissiveIntensity = (isTurbo ? 4.5 : 2.2) + Math.sin(time * (isTurbo ? 9.0 : 3.0)) * (isTurbo ? 2.5 : 1.2);
        }
      });

      // Animar tira de luz led del suelo con efecto latido de competicion
      stripMat.opacity = 0.45 + Math.sin(time * 2.0) * 0.20;

      // B. Flujo dinámico del Circuito de Velocidad Infinito (arcos y rejilla)
      const baseFlowSpeed = isHomePage ? (isTurbo ? 0.45 : 0.18) : (isTurbo ? 0.65 : 0.38);
      const speedMultiplier = 1.0 + Math.abs(scrollSpeed) * 35.0;
      const flow = baseFlowSpeed * speedMultiplier;

      arches.forEach(arch => {
        arch.position.z += flow * 1.5;
        if (arch.position.z > 8) {
          arch.position.z = -90;
        }
      });

      // Sincronizar posición horizontal de la pista y el fondo con el coche para un centrado perfecto
      trackGroup.position.x = kartGroup.position.x;

      studioGrid.position.z += flow;
      if (studioGrid.position.z > 2) {
        studioGrid.position.z = 0;
      }
      
      dashes.forEach(dash => {
        dash.position.z += flow * 1.5;
        if (dash.position.z > 8) {
          dash.position.z = -24;
        }
      });
      trackGroup.rotation.y = currentMouseX * 0.02;

      // Halo bajo el kart — pulso sutil y sincronización de posición para alineación perfecta
      haloMesh.position.x = kartGroup.position.x;
      haloMesh.position.z = kartGroup.position.z;
      haloMesh.material.opacity = (isTurbo ? 0.15 : 0.06) + Math.sin(time * 1.2) * 0.04;
      haloMesh.scale.setScalar((isTurbo ? 1.25 : 1.0) + Math.sin(time * 0.9) * 0.06);

      // C. Partículas de polvo (drift muy lento, efecto estudio)
      const positions = speedParticles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        // Movimiento sinusoidal muy suave hacia arriba (más rápido en turbo)
        positions[i * 3 + 1] += isTurbo ? 0.012 : 0.0015;
        positions[i * 3]     += Math.sin(time * 0.3 + i) * 0.0005;
        // Resetear cuando salen del campo visual
        if (positions[i * 3 + 1] > 5) {
          positions[i * 3 + 1] = -3;
          positions[i * 3]     = (Math.random() - 0.5) * 12;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
        }
      }
      speedParticles.geometry.attributes.position.needsUpdate = true;

      // F. Actualizar partículas de fuego (Backfire de escape reactiva al scroll o turbo)
      // Erupción basada en velocidad de scroll, turbo o pequeña llama ralentí
      const currentScrollSpeedVal = Math.abs(scrollSpeed);
      let flamesToEmit = 0;
      if (isTurbo) {
        // Emitir intensas llamas de escape en turbo
        flamesToEmit = Math.random() < 0.85 ? 3 : 2;
      } else if (!isHomePage) {
        // En subpáginas, emitir llamas constantes de carrera de alta velocidad
        flamesToEmit = Math.random() < 0.45 ? 2 : 1;
      } else if (currentScrollSpeedVal > 0.0002) {
        flamesToEmit = Math.min(8, Math.floor(currentScrollSpeedVal * 350) + 1);
      } else if (Math.random() < 0.08) {
        flamesToEmit = 1; // ralentí/chispa de motor encendido
      }

      // Emitir partículas
      for (let k = 0; k < flamesToEmit; k++) {
        // Encontrar una partícula inactiva
        const p = flameParticles.find(part => !part.active);
        if (p) {
          p.active = true;
          
          // Posición local del escape (Z+ en modelo encarado en Math.PI)
          const localPos = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            -0.05 + (Math.random() - 0.5) * 0.04, // Nivel de la salida de escape
            1.25
          );
          
          // Escalar la posición con el chasis del karting
          localPos.multiplyScalar(kartGroup.scale.x);
          localPos.applyEuler(kartGroup.rotation);
          localPos.add(kartGroup.position);
          
          p.x = localPos.x;
          p.y = localPos.y;
          p.z = localPos.z;

          // Velocidad hacia atrás (Z+ local) - mucho más rápido en Turbo
          const localVel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.3 + (isTurbo ? 0.3 : 0.1),
            (isTurbo ? 3.5 : 1.4) + Math.random() * 2.5 + (currentScrollSpeedVal * 12.0)
          );
          localVel.applyEuler(kartGroup.rotation);
          
          p.vx = localVel.x;
          p.vy = localVel.y;
          p.vz = localVel.z;

          p.life = 0;
          p.maxLife = isTurbo ? (0.25 + Math.random() * 0.4) : (currentScrollSpeedVal > 0.0002 ? (0.2 + Math.random() * 0.35) : (0.1 + Math.random() * 0.15));
        }
      }

      // Actualizar posiciones de las partículas de fuego activas
      const flamePositionsArray = exhaustFlames.geometry.attributes.position.array;
      const flameColorsArray = exhaustFlames.geometry.attributes.color.array;

      for (let i = 0; i < flameMaxCount; i++) {
        const p = flameParticles[i];
        if (p.active) {
          p.life += 0.016; // aprox 1 cuadro a 60fps
          
          if (p.life >= p.maxLife) {
            p.active = false;
            flamePositionsArray[i * 3 + 1] = -999; // Ocultar debajo de la escena
          } else {
            // Aplicar velocidad y fricción leve del aire
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.z += p.vz * 0.016;

            p.vx *= 0.95;
            p.vy *= 0.95;
            p.vz *= 0.95;

            flamePositionsArray[i * 3]     = p.x;
            flamePositionsArray[i * 3 + 1] = p.y;
            flamePositionsArray[i * 3 + 2] = p.z;

            // Ciclo de color: Blanco -> Amarillo -> Naranja -> Rojo -> Negro (Fade)
            const ratio = p.life / p.maxLife;
            if (ratio < 0.15) {
              // Blanco incandescente (Llama inicial)
              flameColorsArray[i * 3]     = 1.0;
              flameColorsArray[i * 3 + 1] = 1.0;
              flameColorsArray[i * 3 + 2] = 0.9;
            } else if (ratio >= 0.15 && ratio < 0.45) {
              // Amarillo brillante
              flameColorsArray[i * 3]     = 1.0;
              flameColorsArray[i * 3 + 1] = 0.85;
              flameColorsArray[i * 3 + 2] = 0.0;
            } else if (ratio >= 0.45 && ratio < 0.75) {
              // Naranja de combustión
              flameColorsArray[i * 3]     = 0.95;
              flameColorsArray[i * 3 + 1] = 0.35;
              flameColorsArray[i * 3 + 2] = 0.0;
            } else {
              // Rojo y desvanecimiento final a humo oscuro
              flameColorsArray[i * 3]     = 0.85 * (1.0 - ratio) / 0.25;
              flameColorsArray[i * 3 + 1] = 0.05 * (1.0 - ratio) / 0.25;
              flameColorsArray[i * 3 + 2] = 0.0;
            }
          }
        }
      }
      exhaustFlames.geometry.attributes.position.needsUpdate = true;
      exhaustFlames.geometry.attributes.color.needsUpdate = true;

      // G. Emitir y actualizar chispas de derrape (Drift Sparks)
      let sparksToEmit = 0;
      if (isDragging && Math.abs(dragRotationY) > 0.08) {
        sparksToEmit = Math.min(6, Math.floor(Math.abs(dragRotationY) * 22) + 1);
      }

      const currentScaleVal = kartGroup.scale.x;

      for (let k = 0; k < sparksToEmit; k++) {
        const side = k % 2 === 0 ? -1 : 1;
        const p = sparkParticles.find(part => !part.active);
        if (p) {
          p.active = true;

          const localPos = new THREE.Vector3(
            side * 0.58,
            -0.08,
            0.75
          );
          localPos.multiplyScalar(currentScaleVal);
          localPos.applyEuler(kartGroup.rotation);
          localPos.add(kartGroup.position);

          p.x = localPos.x;
          p.y = localPos.y;
          p.z = localPos.z;

          const dragDir = dragRotationY > 0 ? 1 : -1;
          const localVel = new THREE.Vector3(
            (Math.random() - 0.2) * 2.2 * -dragDir * side,
            0.8 + Math.random() * 1.5,
            1.5 + Math.random() * 2.5
          );
          localVel.applyEuler(kartGroup.rotation);

          p.vx = localVel.x;
          p.vy = localVel.y;
          p.vz = localVel.z;

          p.life = 0;
          p.maxLife = 0.15 + Math.random() * 0.25;
          p.colorType = Math.random() < 0.5 ? 'cyan' : 'orange';
        }
      }

      const sparkPositionsArray = driftSparks.geometry.attributes.position.array;
      const sparkColorsArray = driftSparks.geometry.attributes.color.array;

      for (let i = 0; i < sparkMaxCount; i++) {
        const p = sparkParticles[i];
        if (p.active) {
          p.life += 0.016;

          if (p.life >= p.maxLife) {
            p.active = false;
            sparkPositionsArray[i * 3 + 1] = -999;
          } else {
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.z += p.vz * 0.016;

            p.vy -= 4.2 * 0.016;
            p.vx *= 0.94;
            p.vz *= 0.94;

            sparkPositionsArray[i * 3]     = p.x;
            sparkPositionsArray[i * 3 + 1] = p.y;
            sparkPositionsArray[i * 3 + 2] = p.z;

            const ratio = p.life / p.maxLife;
            const factor = 1.0 - ratio;
            if (p.colorType === 'cyan') {
              sparkColorsArray[i * 3]     = 0.0 * factor;
              sparkColorsArray[i * 3 + 1] = 0.9 * factor;
              sparkColorsArray[i * 3 + 2] = 1.0 * factor;
            } else {
              sparkColorsArray[i * 3]     = 1.0 * factor;
              sparkColorsArray[i * 3 + 1] = 0.4 * factor;
              sparkColorsArray[i * 3 + 2] = 0.0 * factor;
            }
          }
        }
      }
      driftSparks.geometry.attributes.position.needsUpdate = true;
      driftSparks.geometry.attributes.color.needsUpdate = true;

      // D. Cálculo de Órbita de Cámara y Foco según el SCROLL
      if (!isHomePage || isMobile) {
        scrollPercent = 0;
      }
      scrollSpeed = scrollPercent - lastScrollPercent;
      lastScrollPercent = scrollPercent;

      let targetCamX = 0;
      let targetCamY = isTurbo ? 1.0 : 1.5;
      let targetCamZ = isTurbo ? 4.2 : 6.0;

      let targetLookX = 0;
      let targetLookY = isTurbo ? 0.0 : 0.2;
      let targetLookZ = 0;

      let targetKartY = -2.09 + Math.sin(time * 2.5) * 0.008; // Suspensión sutil del motor al ralentí (8 milímetros)
      let targetKartRotX = -scrollSpeed * 8.0;       // Inclinación física de inercia longitudinal al acelerar
      let targetKartRotY = Math.PI - 0.4 + currentMouseX * 0.18; // Giro suave reactivo al ratón (volante)
      let targetKartRotZ = scrollSpeed * 4.0 - currentMouseX * 0.08 - dragRotationY * 0.28; // Inclinación lateral con inercia de giro
      let targetScale = isMobile ? 0.65 : 1.0;

      // Vibración del motor/chasis (se intensifica a 88Hz en turbo)
      if (isTurbo) {
        targetKartY += Math.sin(time * 88.0) * 0.015;
        targetKartRotX += Math.cos(time * 78.0) * 0.012;
      }

      let subpageSwayX = 0;
      let subpageSwayRotY = 0;
      if (!isHomePage) {
        // 1. Vibración de alta frecuencia (Motor Honda 270cc Rígido a altas revoluciones)
        targetKartY += Math.sin(time * 52.0) * 0.005;
        targetKartRotX += Math.cos(time * 44.0) * 0.004;

        // 2. Vaivén de dirección automática (Sinuosidad en recta de pista)
        subpageSwayX = Math.sin(time * 1.5) * 0.12; // Desplazamiento lateral de 12cm
        subpageSwayRotY = Math.cos(time * 1.5) * 0.04; // Pequeño ajuste angular de dirección de llantas
      }

      // Transición fluida por fases de órbita elíptica (Esquiva y Acompañamiento 3D Completo)
      const isDesk = !isMobile;
      let targetKartX = 0;

      if (scrollPercent < 0.28) {
        // FASE 1: HERO (Texto a la izquierda -> Kart a la DERECHA)
        const p = scrollPercent / 0.28;
        const angle = THREE.MathUtils.lerp(0.3, Math.PI / 3, p);
        const radius = 5.0; 
        targetCamX = Math.sin(angle) * radius + (isDesk ? 0.8 : 0);
        targetCamY = THREE.MathUtils.lerp(0.6, 1.6, p);
        targetCamZ = Math.cos(angle) * radius;
        
        targetLookX = isDesk ? 1.5 : 0;
        targetLookY = THREE.MathUtils.lerp(-0.6, 0.15, p);
        targetLookZ = 0;
        
        targetKartRotY = Math.PI - 0.4 + currentMouseX * 0.25;
        targetScale = THREE.MathUtils.lerp(isMobile ? 0.65 : 1.05, isMobile ? 0.46 : 1.0, p);
        targetKartX = isDesk ? 1.5 : 0;
      } else if (scrollPercent >= 0.28 && scrollPercent < 0.52) {
        // FASE 2: MODALIDADES (Texto a la derecha -> Kart a la IZQUIERDA)
        const p = (scrollPercent - 0.28) / 0.24;
        const angle = THREE.MathUtils.lerp(Math.PI / 3, Math.PI / 1.7, p);
        const radius = THREE.MathUtils.lerp(5.0, 3.0, p);
        targetCamX = Math.sin(angle) * radius - (isDesk ? 0.8 : 0);
        targetCamY = THREE.MathUtils.lerp(1.8, 0.85, p);
        targetCamZ = Math.cos(angle) * radius;
        
        targetLookX = isDesk ? -1.5 : 0;
        targetLookY = THREE.MathUtils.lerp(0.25, 0.15, p);
        targetLookZ = THREE.MathUtils.lerp(0, -0.15, p);
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI - 0.4, Math.PI - 0.9 + currentMouseX * 0.1, p);
        targetScale = THREE.MathUtils.lerp(isMobile ? 0.46 : 1.0, isMobile ? 0.55 : 1.25, p);
        targetKartX = isDesk ? -1.5 : 0;
      } else if (scrollPercent >= 0.52 && scrollPercent < 0.70) {
        // FASE 3: DRIFT (Texto a la izquierda -> Kart a la DERECHA)
        const p = (scrollPercent - 0.52) / 0.18;
        const angle = THREE.MathUtils.lerp(Math.PI / 1.7, Math.PI * 1.15, p);
        const radius = THREE.MathUtils.lerp(3.0, 4.4, p);
        targetCamX = Math.sin(angle) * radius + (isDesk ? 0.8 : 0);
        targetCamY = THREE.MathUtils.lerp(0.85, 0.45, p);
        targetCamZ = Math.cos(angle) * radius;
        
        targetLookX = isDesk ? 1.5 : 0;
        targetLookY = THREE.MathUtils.lerp(0.15, 0.25, p);
        targetLookZ = THREE.MathUtils.lerp(-0.15, 0.25, p);
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI - 0.9, Math.PI / 2.5 + currentMouseX * 0.18, p);
        targetScale = THREE.MathUtils.lerp(isMobile ? 0.55 : 1.25, isMobile ? 0.42 : 1.15, p);
        targetKartX = isDesk ? 1.5 : 0;
      } else if (scrollPercent >= 0.70 && scrollPercent < 0.82) {
        // FASE 4: GRUPOS (Plano Cenital Espectacular, Kart Centrado)
        const p = (scrollPercent - 0.70) / 0.12;
        const angle = THREE.MathUtils.lerp(Math.PI * 1.15, Math.PI * 1.5, p);
        const radius = THREE.MathUtils.lerp(4.4, 5.8, p);
        targetCamX = Math.sin(angle) * radius * (1 - p);
        targetCamY = THREE.MathUtils.lerp(0.45, 4.8, p); // elevar cámara arriba
        targetCamZ = Math.cos(angle) * radius * (1 - p) + THREE.MathUtils.lerp(0, 0.01, p); // mirar casi vertical
        
        targetLookX = 0;
        targetLookY = THREE.MathUtils.lerp(0.25, 0.0, p);
        targetLookZ = 0;
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI / 2.5, Math.PI * 1.5 + time * 0.08, p); // suave auto-rotación estética
        targetScale = THREE.MathUtils.lerp(isMobile ? 0.42 : 1.15, isMobile ? 0.55 : 1.20, p);
        targetKartX = 0;
      } else if (scrollPercent >= 0.82 && scrollPercent < 0.90) {
        // FASE 5: TARIFAS (Zoom Lateral de Catálogo, Kart Centrado)
        const p = (scrollPercent - 0.82) / 0.08;
        targetCamX = THREE.MathUtils.lerp(0, -2.6, p); // plano lateral
        targetCamY = THREE.MathUtils.lerp(4.8, 0.6, p);  // bajar cámara
        targetCamZ = THREE.MathUtils.lerp(0.01, 1.4, p); // acercar
        
        targetLookX = 0;
        targetLookY = THREE.MathUtils.lerp(0, 0.1, p);
        targetLookZ = 0;
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI * 1.5, Math.PI + Math.PI / 4, p); // diagonal
        targetScale = THREE.MathUtils.lerp(isMobile ? 0.55 : 1.20, isMobile ? 0.6 : 1.30, p); // gran tamaño
        targetKartX = 0;
      } else if (scrollPercent >= 0.90 && scrollPercent < 0.96) {
        // FASE 6: HORARIOS Y CONTACTO (Detalle Frontal, Cockpit/Volante)
        const p = (scrollPercent - 0.90) / 0.06;
        targetCamX = THREE.MathUtils.lerp(-2.6, 0.0, p);
        targetCamY = THREE.MathUtils.lerp(0.6, 0.9, p);
        targetCamZ = THREE.MathUtils.lerp(1.4, 2.5, p);
        
        targetLookX = 0;
        targetLookY = 0.15;
        targetLookZ = 0;
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI + Math.PI / 4, Math.PI * 2 - 0.3, p); // de cara al piloto
        targetScale = THREE.MathUtils.lerp(isMobile ? 0.6 : 1.30, isMobile ? 0.5 : 1.10, p);
        targetKartX = 0;
      } else {
        // FASE 7: FOOTER (Alejamiento Cenital Amplio)
        const p = Math.min((scrollPercent - 0.96) / 0.04, 1.0);
        targetCamX = 0;
        targetCamY = THREE.MathUtils.lerp(0.9, 3.8, p);
        targetCamZ = THREE.MathUtils.lerp(2.5, 4.8, p);
        
        targetLookX = 0;
        targetLookY = THREE.MathUtils.lerp(0.15, 0.0, p);
        targetLookZ = 0;
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI * 2 - 0.3, Math.PI * 2 + time * 0.1, p); // rotación infinita en footer
        targetScale = THREE.MathUtils.lerp(isMobile ? 0.5 : 1.10, isMobile ? 0.3 : 0.60, p); // pequeño y elegante
        targetKartX = 0;
      }

      // Aplicar amortiguación Lerp tipo Dron a la Cámara y Foco (6% por cuadro)
      const lerpFactor = 0.06;
      currentCamX += (targetCamX - currentCamX) * lerpFactor;
      currentCamY += (targetCamY - currentCamY) * lerpFactor;
      currentCamZ += (targetCamZ - currentCamZ) * lerpFactor;

      currentLookX += (targetLookX - currentLookX) * lerpFactor;
      currentLookY += (targetLookY - currentLookY) * lerpFactor;
      currentLookZ += (targetLookZ - currentLookZ) * lerpFactor;

      // Aplicar Lerp al KART (suspensión senoidal y rotaciones fijas)
      const currentTargetKartX = targetKartX + subpageSwayX;
      kartGroup.position.x += (currentTargetKartX - kartGroup.position.x) * 0.07;
      kartGroup.position.y += (targetKartY - kartGroup.position.y) * 0.07;
      kartGroup.position.z += (0 - kartGroup.position.z) * 0.07;

      const finalKartRotY = targetKartRotY + dragRotationY + subpageSwayRotY;

      kartGroup.rotation.x += (targetKartRotX - kartGroup.rotation.x) * 0.07;
      kartGroup.rotation.y += (finalKartRotY - kartGroup.rotation.y) * 0.07;
      kartGroup.rotation.z += (targetKartRotZ - kartGroup.rotation.z) * 0.07;

      const s = kartGroup.scale.x + (targetScale - kartGroup.scale.x) * 0.07;
      kartGroup.scale.set(s, s, s);

      // E. Suavizado Lerp del puntero con la cámara (Paralaje aditivo de interacción)
      currentMouseX += (targetMouseX - currentMouseX) * 0.08;
      currentMouseY += (targetMouseY - currentMouseY) * 0.08;

      // Ajuste de encuadre en móviles
      let finalCamX = currentCamX;
      let finalCamY = currentCamY;
      let finalLookX = currentLookX;
      if (isMobile) {
        finalCamX *= 0.35;
        finalLookX *= 0.35;
        if (isHomePage) {
          // Si estamos en turbo boost, queremos una vista baja/trasera pura y cercana,
          // de lo contrario aplicamos la compensación vertical estándar de centrado de 0.20
          finalCamY += isTurbo ? 0.0 : 0.20; 
        }
      }

      camera.position.x = finalCamX + currentMouseX * (isMobile ? 0.5 : 1.5);
      camera.position.y = finalCamY + currentMouseY * (isMobile ? 0.3 : 0.8);
      camera.position.z = currentCamZ;
      camera.lookAt(finalLookX, currentLookY, currentLookZ);

      // Renderizar solo si no está oculto para ahorrar masivamente recursos de CPU/Batería en móvil
      if (isCanvasVisible) {
        renderer.render(scene, camera);
      }
    }

    animate();
  } catch (error) {
    console.error("Three.js/WebGL initialization failed:", error);
    canvas.style.display = 'none';
  }
}
