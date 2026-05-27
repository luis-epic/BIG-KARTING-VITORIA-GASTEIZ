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
    // Un plano que refleja las luces como asfalto mojado pulido
    const floorGeom = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x06060c,
      metalness: 0.92,
      roughness: 0.28,
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

    // === MODELO DE KART 3D (MIGRACIÓN GLB CON FALLBACK HUD) ===
    const kartGroup = new THREE.Group();
    scene.add(kartGroup);

    const wheels = [];

    // Inicializar cargador HUD Cyber-Loader
    const { updateLoader, removeLoader, loadingMessages } = initLoader();

    let hasLoadedModel = false;

    // Timeout de seguridad de 15 segundos
    const loadTimeout = setTimeout(() => {
      if (!hasLoadedModel) {
        console.warn("La carga del modelo 3D GLB excedió el tiempo límite. Cerrando loader...");
        hasLoadedModel = true;
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
              child.material.roughness = 0.15;
              child.material.metalness = 0.85;

              // Añadir emisividad para partes incandescentes/neon
              const name = child.name.toLowerCase();
              if (name.includes('neon') || name.includes('glow') || name.includes('led') || name.includes('luz')) {
                child.material.emissive = child.material.color || new THREE.Color(0xff5a00);
                child.material.emissiveIntensity = 2.5;
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

    const arches = []; // vacío — solo para compatibilidad

    // === SISTEMAS DE CAPTURA DE MOUSE & SCROLL ===
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let scrollPercent = 0;

    // === INTERACTIVIDAD DRAG-TO-ROTATE (ELEMENTO 3D REACTIVO Y) ===
    const heroSection = document.getElementById('hero');
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragRotationY = 0;

    if (heroSection) {
      // Cambiar cursor estético sobre el Hero para sugerir interactividad
      heroSection.style.cursor = 'grab';

      heroSection.addEventListener('mousedown', (e) => {
        // Evitamos arrastre si hace clic en enlaces/botones
        if (e.target.closest('a') || e.target.closest('button')) return;
        isDragging = true;
        heroSection.style.cursor = 'grabbing';
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
          heroSection.style.cursor = 'grab';
        }
      });

      // Eventos táctiles para móviles
      heroSection.addEventListener('touchstart', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        if (e.touches.length === 1) {
          isDragging = true;
          previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaMove = {
          x: e.touches[0].clientX - previousMousePosition.x,
          y: e.touches[0].clientY - previousMousePosition.y
        };

        // Sumar rotación interactiva horizontal móvil con limitación física elástica a ±45 grados (~0.78 rad)
        dragRotationY = Math.max(-0.78, Math.min(0.78, dragRotationY + deltaMove.x * 0.009));

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDragging = false;
      });
    }

    document.addEventListener('mousemove', e => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const heroEl = document.getElementById('hero');
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
      if (cachedDocHeight > 0) {
        scrollPercent = window.scrollY / cachedDocHeight;
      }
      updateCanvasVisibility();
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

      // A. Girar ruedas del kart constantemente
      wheels.forEach(wheel => {
        wheel.rotateX(-0.18);
      });

      // B. Flujo dinámico del Circuito de Velocidad Infinito (arcos y rejilla)
      const baseFlowSpeed = 0.18;
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
      trackGroup.rotation.y = currentMouseX * 0.02;

      // Halo bajo el kart — pulso sutil y sincronización de posición para alineación perfecta
      haloMesh.position.x = kartGroup.position.x;
      haloMesh.position.z = kartGroup.position.z;
      haloMesh.material.opacity = 0.06 + Math.sin(time * 1.2) * 0.04;
      haloMesh.scale.setScalar(1.0 + Math.sin(time * 0.9) * 0.06);

      // C. Partículas de polvo (drift muy lento, efecto estudio)
      const positions = speedParticles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        // Movimiento sinusoidal muy suave hacia arriba
        positions[i * 3 + 1] += 0.0015;
        positions[i * 3]     += Math.sin(time * 0.3 + i) * 0.0005;
        // Resetear cuando salen del campo visual
        if (positions[i * 3 + 1] > 5) {
          positions[i * 3 + 1] = -3;
          positions[i * 3]     = (Math.random() - 0.5) * 12;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
        }
      }
      speedParticles.geometry.attributes.position.needsUpdate = true;

      // D. Cálculo de Órbita de Cámara y Foco según el SCROLL
      scrollSpeed = scrollPercent - lastScrollPercent;
      lastScrollPercent = scrollPercent;

      let targetCamX = 0;
      let targetCamY = 1.5;
      let targetCamZ = 6.0;

      let targetLookX = 0;
      let targetLookY = 0.2;
      let targetLookZ = 0;

      let targetKartY = -2.09 + Math.sin(time * 2.5) * 0.008; // Suspensión sutil del motor al ralentí (8 milímetros)
      let targetKartRotX = -scrollSpeed * 8.0;       // Inclinación física de inercia longitudinal al acelerar
      let targetKartRotY = Math.PI - 0.4 + currentMouseX * 0.18; // Giro suave reactivo al ratón (volante)
      let targetKartRotZ = scrollSpeed * 4.0 - currentMouseX * 0.08; // Inclinación lateral
      let targetScale = isMobile ? 0.65 : 1.0;

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
      kartGroup.position.x += (targetKartX - kartGroup.position.x) * 0.07;
      kartGroup.position.y += (targetKartY - kartGroup.position.y) * 0.07;
      kartGroup.position.z += (0 - kartGroup.position.z) * 0.07;

      // Sumar rotación interactiva por arrastre (Drag-to-Rotate en eje Y)
      const finalKartRotY = targetKartRotY + dragRotationY;

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
          finalCamY += 0.8;
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
