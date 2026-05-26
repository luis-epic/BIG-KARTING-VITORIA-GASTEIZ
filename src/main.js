import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';

// Habilitar la clase js inmediatamente en el cliente para el cursor y reveals
document.documentElement.classList.add('js');

// ==========================================
// 1. ESCENA 3D WEBGL (THREE.JS GLOBAL)
// ==========================================
const canvas = document.getElementById('hero-canvas');
if (canvas) {
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

    // Inyectar Pantalla de Carga HUD limpia
    let loaderEl = document.getElementById('cyber-loader');
    if (!loaderEl) {
      loaderEl = document.createElement('div');
      loaderEl.id = 'cyber-loader';
      loaderEl.innerHTML = `
        <div class="loader-container">
          <div style="text-align: center;"><img src="/logo-negro.jpg" class="loader-logo-img" alt="Big Karting Vitoria-Gasteiz"></div>
          <div class="loader-status" id="loader-status">INICIALIZANDO MOTOR GRÁFICO...</div>
          <div class="loader-bar-wrap">
            <div class="loader-bar" id="loader-bar"></div>
          </div>
          <div class="loader-percentage" id="loader-percentage">0%</div>
        </div>
      `;
      document.body.appendChild(loaderEl);
    }

    const loaderBar = document.getElementById('loader-bar');
    const loaderPercentage = document.getElementById('loader-percentage');
    const loaderStatus = document.getElementById('loader-status');

    const loadingMessages = [
      "ESTABLECIENDO ENLACE CON EL SERVIDOR...",
      "DESCARGANDO TELEMETRÍA DE VELOCIDAD...",
      "ENSAMBLANDO CHASIS DE COMPETICIÓN...",
      "CALIBRANDO SUSPENSIÓN DE DERRAPE...",
      "COMPLETANDO AJUSTES AERODINÁMICOS..."
    ];

    function updateLoader(progress, text) {
      if (loaderBar) loaderBar.style.width = `${progress}%`;
      if (loaderPercentage) loaderPercentage.textContent = `${Math.round(progress)}%`;
      if (loaderStatus && text) loaderStatus.textContent = text;
    }

    let hasLoadedModel = false;

    // Timeout de seguridad de 15 segundos
    const loadTimeout = setTimeout(() => {
      if (!hasLoadedModel) {
        console.warn("La carga del modelo 3D GLB excedió el tiempo límite. Activando fallback procedural...");
        hasLoadedModel = true;
        buildProceduralFallback();
        removeLoader();
      }
    }, 15000);

    function removeLoader() {
      if (loaderStatus) loaderStatus.textContent = 'CONEXIÓN ESTABLECIDA';
      if (loaderPercentage) loaderPercentage.textContent = '100%';
      if (loaderBar) loaderBar.style.width = '100%';
      
      setTimeout(() => {
        if (loaderEl) {
          loaderEl.classList.add('loaded');
          setTimeout(() => loaderEl.remove(), 800);
        }
      }, 600);
    }

    // Función de Respaldo Failsafe (Procedural Kart)
    function buildProceduralFallback() {
      const neonRedMat = new THREE.MeshBasicMaterial({ 
        color: 0xff5a00, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.95 
      });
      
      const neonYellowMat = new THREE.MeshBasicMaterial({ 
        color: 0xf5c800, 
        wireframe: true,
        transparent: true,
        opacity: 0.95 
      });

      const darkTireMat = new THREE.MeshBasicMaterial({
        color: 0x222222,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });

      // A. Chasis Base
      const baseGeom = new THREE.BoxGeometry(3.2, 0.1, 1.2);
      const baseFrame = new THREE.Mesh(baseGeom, neonRedMat);
      kartGroup.add(baseFrame);

      // B. Side Pods
      const podGeom = new THREE.BoxGeometry(1.6, 0.35, 0.15);
      const leftPod = new THREE.Mesh(podGeom, neonRedMat);
      leftPod.position.set(0.1, 0.15, 0.65);
      const rightPod = leftPod.clone();
      rightPod.position.z = -0.65;
      kartGroup.add(leftPod, rightPod);

      // C. Morro delantero
      const noseGeom = new THREE.BoxGeometry(0.8, 0.2, 0.9);
      const nose = new THREE.Mesh(noseGeom, neonRedMat);
      nose.position.set(1.4, 0.05, 0);
      
      const frontBumperGeom = new THREE.BoxGeometry(0.2, 0.2, 1.5);
      const frontBumper = new THREE.Mesh(frontBumperGeom, neonRedMat);
      frontBumper.position.set(1.8, 0.05, 0);
      kartGroup.add(nose, frontBumper);

      // D. Volante
      const columnGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
      const column = new THREE.Mesh(columnGeom, neonRedMat);
      column.position.set(0.5, 0.35, 0);
      column.rotation.z = -Math.PI / 4;
      
      const wheelGeom = new THREE.TorusGeometry(0.24, 0.04, 6, 16);
      const steeringWheel = new THREE.Mesh(wheelGeom, neonYellowMat);
      steeringWheel.position.set(0.78, 0.62, 0);
      steeringWheel.rotation.y = Math.PI / 2;
      steeringWheel.rotation.x = Math.PI / 4;
      kartGroup.add(column, steeringWheel);

      // E. Asiento
      const seatBaseGeom = new THREE.BoxGeometry(0.7, 0.08, 0.7);
      const seatBase = new THREE.Mesh(seatBaseGeom, neonYellowMat);
      seatBase.position.set(-0.3, 0.08, 0);
      
      const seatBackGeom = new THREE.BoxGeometry(0.08, 0.75, 0.7);
      const seatBack = new THREE.Mesh(seatBackGeom, neonYellowMat);
      seatBack.position.set(-0.62, 0.42, 0);
      seatBack.rotation.z = -0.22;
      kartGroup.add(seatBase, seatBack);

      // F. Motor y Escape
      const engineGeom = new THREE.BoxGeometry(0.65, 0.55, 0.55);
      const engine = new THREE.Mesh(engineGeom, neonYellowMat);
      engine.position.set(-1.1, 0.25, 0.2);
      
      const pipeGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
      const pipe = new THREE.Mesh(pipeGeom, neonRedMat);
      pipe.position.set(-1.5, 0.45, -0.25);
      pipe.rotation.z = Math.PI / 2;
      kartGroup.add(engine, pipe);

      // G. Parachoques trasero
      const rearBumperGeom = new THREE.BoxGeometry(0.15, 0.22, 1.6);
      const rearBumper = new THREE.Mesh(rearBumperGeom, neonRedMat);
      rearBumper.position.set(-1.7, 0.1, 0);
      kartGroup.add(rearBumper);

      // H. Ruedas
      const tireGeom = new THREE.CylinderGeometry(0.52, 0.52, 0.45, 12);
      tireGeom.rotateX(Math.PI / 2);
      
      const rimGeom = new THREE.TorusGeometry(0.32, 0.08, 6, 12);
      rimGeom.rotateY(Math.PI / 2);

      const wheelPositions = [
        { x: 1.0, y: -0.1, z: 0.8 },
        { x: 1.0, y: -0.1, z: -0.8 },
        { x: -0.9, y: -0.1, z: 0.85 },
        { x: -0.9, y: -0.1, z: -0.85 }
      ];

      wheelPositions.forEach(pos => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(pos.x, pos.y, pos.z);
        wheelGroup.isProcedural = true;
        
        const tire = new THREE.Mesh(tireGeom, darkTireMat);
        const rim = new THREE.Mesh(rimGeom, neonYellowMat);
        
        wheelGroup.add(tire, rim);
        kartGroup.add(wheelGroup);
        wheels.push(wheelGroup);
      });
    }

    // Cargar modelo real GLTF/GLB
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
          buildProceduralFallback();
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

        // Sumar rotación interactiva horizontal
        dragRotationY += deltaMove.x * 0.007;

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

        dragRotationY += deltaMove.x * 0.009;

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

    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        scrollPercent = window.scrollY / docHeight;
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

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // === BUCLE DE ANIMACIÓN (INTERPOLACIÓN SCROLL) ===
    const clock = new THREE.Clock();

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

      const elapsedTime = clock.getElapsedTime();
      const time = elapsedTime;

      // Retorno elástico suave a la posición neutra original de scroll
      if (!isDragging) {
        dragRotationY += (0 - dragRotationY) * 0.05;
      }

      // Actualizar uTime del shader de fondo
      bgMat.uniforms.uTime.value = time;

      // A. Girar ruedas del kart constantemente
      wheels.forEach(wheel => {
        if (wheel.isProcedural) {
          wheel.rotation.z -= 0.18;
        } else {
          wheel.rotateX(-0.18);
        }
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

      // D. Cálculo de Órbita de Cámara y Foco según el SCROLL (Idea 1)
      const isMobile = window.innerWidth <= 900;
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
      let targetScale = 1.0;

      // Transición fluida por fases de órbita elíptica
      if (scrollPercent < 0.25) {
        // FASE 1: HERO SPLIT (Órbita frontal-derecha — kart en lado derecho si no es móvil)
        const p = scrollPercent / 0.25;
        const angle = THREE.MathUtils.lerp(0.3, Math.PI / 3, p);
        const radius = 5.5;
        targetCamX = Math.sin(angle) * radius + (isMobile ? 0 : 1.2);  // offset a la derecha si no es móvil
        targetCamY = THREE.MathUtils.lerp(0.6, 1.6, p);
        targetCamZ = Math.cos(angle) * radius;
        
        targetLookX = isMobile ? 0 : 1.8;   // mirar al kart
        targetLookY = THREE.MathUtils.lerp(-0.6, 0.15, p);
        targetLookZ = 0;
        
        targetKartRotY = Math.PI - 0.4 + currentMouseX * 0.25;  // parallax más pronunciado
        targetScale = THREE.MathUtils.lerp(1.0, 0.72, p);
      } else if (scrollPercent >= 0.25 && scrollPercent < 0.55) {
        // FASE 2: MODALIDADES (Acercamiento macro en el motor y pontón derecho)
        const p = (scrollPercent - 0.25) / 0.30;
        const angle = THREE.MathUtils.lerp(Math.PI / 3, Math.PI / 1.7, p);
        const radius = THREE.MathUtils.lerp(5.2, 3.3, p);
        targetCamX = Math.sin(angle) * radius;
        targetCamY = THREE.MathUtils.lerp(1.8, 0.85, p);
        targetCamZ = Math.cos(angle) * radius;
        
        targetLookX = THREE.MathUtils.lerp(0, 0.35, p);
        targetLookY = THREE.MathUtils.lerp(0.25, 0.15, p);
        targetLookZ = THREE.MathUtils.lerp(0, -0.15, p);
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI - 0.4, Math.PI - 0.9 + currentMouseX * 0.1, p);
        targetScale = THREE.MathUtils.lerp(0.72, 0.85, p);
      } else if (scrollPercent >= 0.55 && scrollPercent < 0.85) {
        // FASE 3: DRIFT (Plano rasante bajo desde la parte trasera izquierda)
        const p = (scrollPercent - 0.55) / 0.30;
        const angle = THREE.MathUtils.lerp(Math.PI / 1.7, Math.PI * 1.15, p);
        const radius = THREE.MathUtils.lerp(3.3, 4.9, p);
        targetCamX = Math.sin(angle) * radius;
        targetCamY = THREE.MathUtils.lerp(0.85, 0.45, p);
        targetCamZ = Math.cos(angle) * radius;
        
        targetLookX = THREE.MathUtils.lerp(0.35, -0.5, p);
        targetLookY = THREE.MathUtils.lerp(0.15, 0.25, p);
        targetLookZ = THREE.MathUtils.lerp(-0.15, 0.25, p);
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI - 0.9, Math.PI / 2.5 + currentMouseX * 0.18, p);
        targetScale = THREE.MathUtils.lerp(0.85, 0.65, p);
      } else {
        // FASE 4: CONTACTO Y FOOTER (Vuelo cenital directo top-down)
        const p = Math.min((scrollPercent - 0.85) / 0.15, 1.0);
        const angle = THREE.MathUtils.lerp(Math.PI * 1.15, Math.PI * 1.5, p);
        const radius = THREE.MathUtils.lerp(4.9, 6.2, p);
        targetCamX = Math.sin(angle) * radius * (1 - p);
        targetCamY = THREE.MathUtils.lerp(0.45, 5.8, p);
        targetCamZ = Math.cos(angle) * radius * (1 - p);
        
        if (p > 0.95) {
          targetCamX = 0;
          targetCamZ = 0.01;
        }
        
        targetLookX = THREE.MathUtils.lerp(-0.5, 0, p);
        targetLookY = THREE.MathUtils.lerp(0.25, 0, p);
        targetLookZ = THREE.MathUtils.lerp(0.25, 0, p);
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI / 2.5, Math.PI + currentMouseX * 0.1, p);
        targetScale = THREE.MathUtils.lerp(0.65, 0.45, p);
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
      // En Fase 1 (hero), desplazar el kart a la derecha si no es móvil
      const targetKartX = (scrollPercent < 0.25 && !isMobile) ? 1.8 : 0;
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

      camera.position.x = currentCamX + currentMouseX * 1.5;
      camera.position.y = currentCamY + currentMouseY * 0.8;
      camera.position.z = currentCamZ;
      camera.lookAt(currentLookX, currentLookY, currentLookZ);

      renderer.render(scene, camera);
    }

    animate();
  } catch (error) {
    console.error("Three.js/WebGL initialization failed:", error);
    // Ocultar el canvas fixed si falla WebGL para que no obstruya la pantalla
    canvas.style.display = 'none';
  }
}

// ==========================================
// 2. CURSOR PERSONALIZADO (LERP) Y OCULTACIÓN DINÁMICA
// ==========================================
const cursor = document.getElementById('cursor');
const cursorGlow = document.getElementById('cursor-glow');

let mouseX = 0, mouseY = 0;
let glowX = 0, glowY = 0;

if (window.matchMedia('(hover: hover)').matches) {
  // Ocultar cursor de sistema dinámicamente
  document.body.style.cursor = 'none';
  
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (cursor) {
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    }
  });

  function animateCursor() {
    const lerp = 0.15;
    glowX += (mouseX - glowX) * lerp;
    glowY += (mouseY - glowY) * lerp;

    if (cursorGlow) {
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
    }

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.addEventListener('mousedown', () => {
    if (cursor) cursor.classList.add('click');
    if (cursorGlow) cursorGlow.style.transform = 'translate(-50%, -50%) scale(0.6)';
  });
  document.addEventListener('mouseup', () => {
    if (cursor) cursor.classList.remove('click');
    if (cursorGlow) cursorGlow.style.transform = 'translate(-50%, -50%) scale(1)';
  });
}

// ==========================================
// 3. MENÚ HAMBURGUESA MÓVIL
// ==========================================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburgerBtn && mobileMenu) {
  const mobileLinks = mobileMenu.querySelectorAll('a');
  
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      mobileMenu.classList.remove('active');
    });
  });
}

// ==========================================
// 4. RELOJ & ESTADO DE APERTURA REAL
// ==========================================
function updateOpeningStatus() {
  const now = new Date();
  
  // Reloj digital
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const timeEl = document.querySelector('.clock-time');
  if (timeEl) timeEl.textContent = h + ':' + m;

  const day = now.getDay(); 
  const currentTime = now.getHours() * 60 + now.getMinutes();

  let isOpen = false;
  let statusMsg = "";

  const rows = document.querySelectorAll('.horario-row');
  rows.forEach(r => r.classList.remove('active'));
  const activeIdx = day === 0 ? 6 : day - 1;
  if (rows[activeIdx]) {
    rows[activeIdx].classList.add('active');
  }

  if (day === 1) {
    isOpen = false;
    statusMsg = "Cerrado hoy · Abre mañana a las 16h";
  } else if (day >= 2 && day <= 4) {
    if (currentTime >= 960 && currentTime < 1260) {
      isOpen = true;
      statusMsg = "Abierto ahora · Cierra a las 21:00";
    } else {
      isOpen = false;
      statusMsg = currentTime < 960 ? "Cerrado · Abre hoy a las 16h" : "Cerrado · Abre mañana a las 16h";
    }
  } else if (day === 5) {
    if (currentTime >= 960 && currentTime < 1320) {
      isOpen = true;
      statusMsg = "Abierto ahora · Cierra a las 22:00";
    } else {
      isOpen = false;
      statusMsg = currentTime < 960 ? "Cerrado · Abre hoy a las 16h" : "Cerrado · Abre mañana a las 11h";
    }
  } else if (day === 6) {
    if ((currentTime >= 660 && currentTime < 840) || (currentTime >= 960 && currentTime < 1320)) {
      isOpen = true;
      const closes = currentTime < 840 ? "14:00" : "22:00";
      statusMsg = "Abierto ahora · Cierra a las " + closes;
    } else {
      isOpen = false;
      if (currentTime < 660) {
        statusMsg = "Cerrado · Abre hoy a las 11:00";
      } else if (currentTime >= 840 && currentTime < 960) {
        statusMsg = "Cerrado temporalmente · Abre a las 16:00";
      } else {
        statusMsg = "Cerrado · Abre mañana a las 11:00";
      }
    }
  } else if (day === 0) {
    if ((currentTime >= 660 && currentTime < 840) || (currentTime >= 960 && currentTime < 1260)) {
      isOpen = true;
      const closes = currentTime < 840 ? "14:00" : "21:00";
      statusMsg = "Abierto ahora · Cierra a las " + closes;
    } else {
      isOpen = false;
      if (currentTime < 660) {
        statusMsg = "Cerrado · Abre hoy a las 11:00";
      } else if (currentTime >= 840 && currentTime < 960) {
        statusMsg = "Cerrado temporalmente · Abre a las 16:00";
      } else {
        statusMsg = "Cerrado · Abre el martes a las 16:00";
      }
    }
  }

  const clockLabel = document.querySelector('.clock-label');
  let badge = document.querySelector('.status-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'status-badge';
    const container = document.querySelector('.horario-visual');
    if (container) container.appendChild(badge);
  }

  if (isOpen) {
    if (clockLabel) {
      clockLabel.textContent = "ABIERTO";
      clockLabel.style.color = "#2ecc71";
    }
    badge.textContent = statusMsg;
    badge.className = "status-badge open";
  } else {
    if (clockLabel) {
      clockLabel.textContent = "CERRADO";
      clockLabel.style.color = "var(--red)";
    }
    badge.textContent = statusMsg;
    badge.className = "status-badge closed";
  }
}
updateOpeningStatus();
setInterval(updateOpeningStatus, 15000);

// ==========================================
// 5. NAVBAR SCROLL
// ==========================================
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(10,10,10,0.98)';
    nav.style.padding = '12px 40px';
  } else {
    nav.style.background = 'linear-gradient(to bottom, rgba(10,10,10,0.95), transparent)';
    nav.style.padding = '18px 40px';
  }
});

// ==========================================
// 6. SCROLL REVEAL OBSERVER + ANIMATED COUNTERS
// ==========================================
const reveals = document.querySelectorAll('.reveal');
if (reveals.length > 0) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(r => obs.observe(r));
}

// Animated stat counters
function animateCounter(el, targetStr) {
  const isSymbol = isNaN(parseFloat(targetStr));
  if (isSymbol) return; // Skip ∞ and 1º etc with suffix
  const hasOrdinal = /\D/.test(targetStr);
  const target = parseFloat(targetStr);
  const suffix = hasOrdinal ? targetStr.replace(/[\d\.]/g, '') : '';
  let start = 0;
  const duration = 1400;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.round(target * ease);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = targetStr;
  }
  requestAnimationFrame(tick);
}

const statNums = document.querySelectorAll('.stat-num');
if (statNums.length > 0) {
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const original = e.target.dataset.target || e.target.textContent.trim();
        e.target.dataset.target = original;
        animateCounter(e.target, original);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  statNums.forEach(n => counterObs.observe(n));
}

// 3D tilt effect for cards
document.querySelectorAll('.card-3d').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(8px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// === WhatsApp Floating Button ===
const waBtn = document.createElement('a');
waBtn.id = 'wa-float-btn';
waBtn.href = 'https://wa.me/34685722119';
waBtn.target = '_blank';
waBtn.rel = 'noopener noreferrer';
waBtn.setAttribute('aria-label', 'Contactar por WhatsApp');
waBtn.innerHTML = `
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
  <span class="wa-label">¿Reservar?</span>
`;
document.body.appendChild(waBtn);

// ==========================================
// 7. CONTROLADOR DE AUDIO CYBER-TRACK (SENIOR BEST PRACTICE)
// ==========================================
let audioControl = document.getElementById('cyber-audio-control');
if (!audioControl) {
  audioControl = document.createElement('div');
  audioControl.id = 'cyber-audio-control';
  audioControl.className = 'paused';
  audioControl.innerHTML = `
    <div class="audio-visualizer">
      <span class="bar bar-1"></span>
      <span class="bar bar-2"></span>
      <span class="bar bar-3"></span>
      <span class="bar bar-4"></span>
    </div>
    <button id="audio-toggle-btn" aria-label="Reproducir música de fondo">
      <span class="play-icon">▶</span>
      <span class="pause-icon">❚❚</span>
    </button>
    <span class="audio-tooltip" id="audio-tooltip">RACING: OFF</span>
  `;
  document.body.appendChild(audioControl);
}

const audioToggleBtn = document.getElementById('audio-toggle-btn');
const audioTooltip = document.getElementById('audio-tooltip');

// Música de fondo: rock enérgico/electrónico temática racing
const bgMusic = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
bgMusic.loop = true;
bgMusic.volume = 0; // Iniciar en 0 para fade-in

let isPlaying = false;
let fadeInterval = null;

function fadeInVolume(targetVol = 0.25, duration = 1500) {
  clearInterval(fadeInterval);
  const steps = 30;
  const stepTime = duration / steps;
  const stepAmount = targetVol / steps;
  
  fadeInterval = setInterval(() => {
    if (bgMusic.volume < targetVol) {
      bgMusic.volume = Math.min(bgMusic.volume + stepAmount, targetVol);
    } else {
      clearInterval(fadeInterval);
    }
  }, stepTime);
}

function fadeOutVolume(duration = 1000) {
  clearInterval(fadeInterval);
  const steps = 20;
  const stepTime = duration / steps;
  const stepAmount = bgMusic.volume / steps;
  
  fadeInterval = setInterval(() => {
    if (bgMusic.volume > 0.01) {
      bgMusic.volume = Math.max(bgMusic.volume - stepAmount, 0);
    } else {
      bgMusic.volume = 0;
      bgMusic.pause();
      clearInterval(fadeInterval);
    }
  }, stepTime);
}

function toggleAudio() {
  if (isPlaying) {
    isPlaying = false;
    audioControl.classList.add('paused');
    audioTooltip.textContent = "RACING: OFF";
    fadeOutVolume();
  } else {
    isPlaying = true;
    audioControl.classList.remove('paused');
    audioTooltip.textContent = "RACING: ON";
    bgMusic.play().catch(err => {
      console.warn("Autoplay bloqueado por el navegador, requiere interacción previa del usuario:", err);
      isPlaying = false;
      audioControl.classList.add('paused');
      audioTooltip.textContent = "RACING: OFF";
    });
    if (isPlaying) {
      fadeInVolume(0.25);
    }
  }
}

if (audioToggleBtn) {
  audioToggleBtn.addEventListener('click', toggleAudio);
  // Permitir clic en todo el widget para facilidad de uso
  audioControl.addEventListener('click', (e) => {
    if (e.target !== audioToggleBtn && !audioToggleBtn.contains(e.target)) {
      toggleAudio();
    }
  });
}

// Auto-iniciar música con la primera interacción física del usuario en el sitio
const startAudioOnInteraction = () => {
  if (!isPlaying) {
    isPlaying = true;
    if (audioControl) audioControl.classList.remove('paused');
    if (audioTooltip) audioTooltip.textContent = "RACING: ON";
    bgMusic.play().catch(() => {});
    fadeInVolume(0.20, 2500);
  }
  // Limpiar listeners para que no se disparen constantemente
  document.removeEventListener('click', startAudioOnInteraction);
  document.removeEventListener('keydown', startAudioOnInteraction);
  document.removeEventListener('touchstart', startAudioOnInteraction);
};

document.addEventListener('click', startAudioOnInteraction);
document.addEventListener('keydown', startAudioOnInteraction);
document.addEventListener('touchstart', startAudioOnInteraction);

// ==========================================
// 8. AGENTE DE VOZ INTELIGENTE NATIVO (CYBER-ASSISTANT)
// ==========================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;

// Inyectar de forma 100% incondicional en el DOM para que el botón siempre sea visible pase lo que pase con el navegador
const aiWidget = document.createElement('div');
aiWidget.id = 'cyber-ai-widget';
aiWidget.className = '';
aiWidget.innerHTML = `
  <div class="ai-chat-box" id="ai-chat-box">
    <div class="ai-chat-header">
      <span class="ai-status-dot"></span>
      <span class="ai-chat-title">TELEMETRÍA IA: BOXES</span>
      <button class="ai-close-btn" id="ai-close-btn">×</button>
    </div>
    <div class="ai-chat-content" id="ai-chat-content">
      <div class="ai-msg bot">¡Hola, piloto! Soy ACE, la inteligencia artificial de Boxes de Big Karting. Pregúntame hablando por el micrófono o escribiendo tu consulta aquí abajo. ¡Aceleremos!</div>
    </div>
    <form class="ai-chat-input-form" id="ai-chat-input-form" style="padding: 10px 16px; border-top: 1px solid rgba(255,90,0,0.15); display: flex; gap: 8px; background: rgba(255,90,0,0.02); margin: 0;">
      <input type="text" id="ai-chat-input" placeholder="Pregunta a Boxes (ej. precios, horarios)..." style="flex-grow: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,90,0,0.2); border-radius: 8px; color: #fff; padding: 6px 12px; font-family: inherit; font-size: 12px; outline: none; transition: border-color 0.2s;" />
      <button type="submit" style="background: rgba(255,90,0,0.15); border: 1px solid rgba(255,90,0,0.3); color: #ff5a00; border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 11px; font-weight: 700; letter-spacing: 1px; transition: all 0.2s;">ENVIAR</button>
    </form>
  </div>
  <div class="ai-trigger-wrap">
    <span class="ai-tooltip" id="ai-trigger-tooltip">HABLAR CON ACE IA</span>
    <button class="ai-mic-btn" id="ai-mic-btn" aria-label="Hablar con el asistente virtual">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mic-svg">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
      <div class="ai-waves">
        <span class="wave w-1"></span>
        <span class="wave w-2"></span>
        <span class="wave w-3"></span>
      </div>
    </button>
  </div>
`;
document.body.appendChild(aiWidget);

// Iniciar listeners
const micBtn = document.getElementById('ai-mic-btn');
const chatBox = document.getElementById('ai-chat-box');
const chatContent = document.getElementById('ai-chat-content');
const closeBtn = document.getElementById('ai-close-btn');
const aiTooltip = document.getElementById('ai-trigger-tooltip');
const inputForm = document.getElementById('ai-chat-input-form');
const chatInput = document.getElementById('ai-chat-input');

let isBotSpeaking = false;
let processingTimeout = null;
let silenceTimer = null;
let finalTranscript = "";

// Cerrar la ventana del chat
if (closeBtn) {
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chatBox.classList.remove('open');
  });
}

// Configuración opcional del reconocimiento de voz si el navegador lo soporta
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true; // Flujo continuo para evitar cortes por silencios cortos
  recognition.interimResults = true; // Habilitar transcripción parcial para rastrear voz activa

  recognition.onstart = () => {
    if (processingTimeout) clearTimeout(processingTimeout);
    if (silenceTimer) clearTimeout(silenceTimer);
    finalTranscript = ""; // Resetear la transcripción acumulada
    micBtn.classList.add('listening');
    aiTooltip.textContent = "ESCUCHANDO...";
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (processingTimeout) clearTimeout(processingTimeout);
    if (silenceTimer) clearTimeout(silenceTimer);
    micBtn.classList.remove('listening');
    
    // Fallback de mensaje dinámico en chat según tipo de error del micrófono
    let errorMsg = "Piloto, no he podido conectar con tu micrófono. Escribe tu pregunta directamente aquí abajo y te ayudaré de inmediato.";
    if (event.error === 'not-allowed') {
      errorMsg = "Permiso de micrófono denegado. Activa el acceso al micrófono en la barra del navegador o escribe tu consulta aquí en boxes.";
    } else if (event.error === 'network') {
      errorMsg = "Error de red en telemetría de voz. Escribe tu consulta directamente en el chat para que pueda responderte.";
    }
    
    aiTooltip.textContent = "MICRO DETENIDO";
    appendChatMessage('bot', errorMsg);
    if (chatBox) chatBox.classList.add('open');
    
    // Devolver la música a su volumen normal
    if (isPlaying && bgMusic) {
      bgMusic.volume = 0.25;
    }

    // Volver a "PULSA PARA HABLAR" tras un momento
    setTimeout(() => {
      if (aiTooltip.textContent === "MICRO DETENIDO") {
        aiTooltip.textContent = "PULSA PARA HABLAR";
      }
    }, 2500);
  };

  recognition.onend = () => {
    micBtn.classList.remove('listening');
    if (silenceTimer) clearTimeout(silenceTimer);
    
    // Si se detuvo por error de micro (MICRO DETENIDO), no sobreescribir el estado
    if (aiTooltip.textContent === "MICRO DETENIDO") {
      return;
    }
    
    // Si la grabación terminó por silencio o stop pero no se dijo nada de valor, cancelamos pacíficamente
    if (!finalTranscript.trim()) {
      aiTooltip.textContent = "PULSA PARA HABLAR";
      // Restaurar música de fondo
      if (isPlaying && bgMusic) {
        bgMusic.volume = 0.25;
      }
      return;
    }
    
    aiTooltip.textContent = "PROCESANDO...";
    
    // Devolver la música a su volumen normal
    if (isPlaying && bgMusic) {
      bgMusic.volume = 0.25;
    }

    // Procesar la transcripción acumulada final
    const responseText = getAIResponse(finalTranscript);
    appendChatMessage('user', finalTranscript);
    
    aiTooltip.textContent = "RESPONDIENDO...";
    
    // Inyectar respuesta del bot con síntesis
    setTimeout(() => {
      appendChatMessage('bot', responseText);
      speakResponse(responseText);
    }, 600);
  };

  recognition.onresult = (event) => {
    if (processingTimeout) clearTimeout(processingTimeout);
    
    // Reiniciar temporizador de silencio cada vez que el usuario pronuncie palabras nuevas (parciales o finales)
    if (silenceTimer) clearTimeout(silenceTimer);
    
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    const currentText = finalTranscript || interimTranscript;
    if (currentText.trim()) {
      aiTooltip.textContent = "TRANSCRIBIENDO...";
    }
    
    // Silence Gate: si el usuario no dice nada nuevo en 1.5s, detenemos la API para procesar la oración completa
    silenceTimer = setTimeout(() => {
      recognition.stop();
    }, 1500);
  };
}

// Alternar micrófono / Escuchar / Soporte teclado fallback
if (micBtn) {
  micBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Si la IA está hablando, detenerla
    if (isBotSpeaking) {
      if (SpeechSynthesis) SpeechSynthesis.cancel();
      stopSpeakingAnimation();
      return;
    }

    // Si el navegador no soporta micrófono nativo, abrimos el chat para usar el teclado
    if (!recognition) {
      chatBox.classList.toggle('open');
      return;
    }

    // Si ya está escuchando, detener
    if (micBtn.classList.contains('listening')) {
      recognition.stop();
      return;
    }

    try {
      // Detener la música de fondo temporalmente o atenuarla para escuchar bien
      if (isPlaying && bgMusic) {
        bgMusic.volume = 0.03; // Atenuar al 3%
      }

      recognition.start();
    } catch (err) {
      console.error("Error arrancando reconocimiento de voz:", err);
      chatBox.classList.add('open');
    }
  });
}

// Lógica del formulario de entrada de teclado
if (inputForm && chatInput) {
  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Detener cualquier procesamiento de voz
    if (processingTimeout) clearTimeout(processingTimeout);
    aiTooltip.textContent = "PULSA PARA HABLAR";

    appendChatMessage('user', text);
    chatInput.value = '';

    const responseText = getAIResponse(text);

    setTimeout(() => {
      appendChatMessage('bot', responseText);
      speakResponse(responseText);
    }, 500);
  });
}

// Respuestas inteligentes basadas en heurística de palabras clave del negocio
function getAIResponse(userText) {
  // Normalizar: pasar a minúsculas, quitar acentos, tildes, diéresis y puntuaciones
  const text = userText.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!]/g, "")
    .trim();
  
  // 1. HORARIOS Y DÍAS DE APERTURA
  if (
    text.includes('horario') || text.includes('hora') || text.includes('abierto') || 
    text.includes('abrir') || text.includes('abre') || text.includes('cierran') || 
    text.includes('cierra') || text.includes('lunes') || text.includes('martes') || 
    text.includes('miercoles') || text.includes('jueves') || text.includes('viernes') || 
    text.includes('sabado') || text.includes('domingo') || text.includes('dias') || 
    text.includes('cuando abris') || text.includes('cuando abren') || text.includes('calendario') ||
    text.includes('abris') || text.includes('abren') || text.includes('semana') || text.includes('finde')
  ) {
    return "Abrimos de martes a domingo. De martes a jueves de 16 a 21 horas. Los viernes de 16 a 22. Los sábados abrimos en dos turnos: de 11 a 14 y de 16 a 22 horas. Los domingos abrimos de 11 a 14 y de 16 a 21 horas. ¡Los lunes cerramos en boxes para mantenimiento de karts!";
  }
  
  // 2. PRECIOS Y TARIFAS
  if (
    text.includes('precio') || text.includes('tarifa') || text.includes('cuesta') || 
    text.includes('cuanto') || text.includes('valor') || text.includes('euro') || 
    text.includes('tanda') || text.includes('tando') || text.includes('sesion') || 
    text.includes('ticket') || text.includes('pagar') || text.includes('costo') || 
    text.includes('coste') || text.includes('barato') || text.includes('caro') ||
    text.includes('presupuesto') || text.includes('dinero')
  ) {
    return "Nuestras tandas individuales duran 8 minutos cronometrados. La tanda de adultos cuesta 17 euros, la de Drift especial 22 euros y la infantil 15 euros. Si vienes en grupo, tenemos el Pack Mini GP a 38 euros, el GP Especial a 43 euros, y el Súper GP de drift a 48 euros. ¿Cuál de ellos te apetece probar?";
  }
  
  // 3. UBICACIÓN, DIRECCIÓN Y CÓMO LLEGAR
  if (
    text.includes('donde') || text.includes('ubicacion') || text.includes('direccion') || 
    text.includes('como llegar') || text.includes('como se llega') || text.includes('miñano') || 
    text.includes('alava') || text.includes('vitoria') || text.includes('llegar') || 
    text.includes('mapa') || text.includes('sitio') || text.includes('lugar') || 
    text.includes('gps') || text.includes('direcion') || text.includes('provincias') ||
    text.includes('donde estan') || text.includes('donde estais') || text.includes('como voy') ||
    text.includes('como ir')
  ) {
    return "Estamos en la Carretera sin número, en Miñano Mayor, Álava. Código postal 01196. Nos encontramos en el Parque Tecnológico, a tan solo 10 minutos de Vitoria-Gasteiz. Tienes un mapa interactivo de Google en la sección de contacto al final de la página.";
  }
  
  // 4. CIRCUITO DE DRIFT
  if (
    text.includes('drift') || text.includes('deslizar') || text.includes('derrape') || 
    text.includes('derrapar') || text.includes('hielo') || text.includes('norte') || 
    text.includes('deslice') || text.includes('resbalar') || text.includes('derrapes') || 
    text.includes('deslizamiento') || text.includes('drit')
  ) {
    return "¡El Drift es nuestra gran especialidad! Somos el único circuito indoor exclusivo de drift en todo el norte de España. Conducirás karts especiales con neumáticos de baja adherencia. La tanda de 8 minutos cuesta 22 euros. Es una sensación única, ¡como conducir sobre hielo!";
  }

  // 5. EVENTOS DE GRUPO, CUMPLEAÑOS, DESPEDIDAS Y TEAMBUILDING
  if (
    text.includes('grupo') || text.includes('evento') || text.includes('empresa') || 
    text.includes('teambuilding') || text.includes('despedida') || text.includes('soltero') || 
    text.includes('soltera') || text.includes('cumple') || text.includes('cumpleaños') || 
    text.includes('fiesta') || text.includes('celebracion') || text.includes('carrera') || 
    text.includes('campeonato') || text.includes('pack') || text.includes('amigo') || 
    text.includes('juntarnos') || text.includes('reunion') || text.includes('competicion') ||
    text.includes('niño') || text.includes('niña') || text.includes('cumpleano')
  ) {
    return "¡Somos especialistas en eventos de grupo! Diseñamos packs a medida para despedidas de soltero, teambuilding de empresas y cumpleaños de niños. Todos nuestros eventos de grupo incluyen bienvenida de pilotos, tanda de clasificación, carrera final con parrilla semáforo, podium de ganadores, medallas oficiales y refrescos. ¡Diversión garantizada!";
  }

  // 6. CONTACTO, TELÉFONO Y RESERVAS
  if (
    text.includes('telefono') || text.includes('llamar') || text.includes('whatsapp') || 
    text.includes('reserva') || text.includes('reservar') || text.includes('contacto') || 
    text.includes('escribir') || text.includes('hablar') || text.includes('numero') || 
    text.includes('movil') || text.includes('celular') || text.includes('email') || 
    text.includes('correo') || text.includes('mensajes') || text.includes('mensaje')
  ) {
    return "Puedes reservar tanda o consultarnos llamando directamente a boxes al número 6 8 5, 7 2 2, 1 1 9. También puedes escribirnos por WhatsApp pulsando el botón flotante verde que tienes abajo a la derecha.";
  }
  
  // 7. SALUDOS E IDENTIDAD
  if (
    text.includes('hola') || text.includes('buenos dias') || text.includes('buenas tardes') || 
    text.includes('buenas noches') || text.includes('quien eres') || text.includes('ace') || 
    text.includes('asistente') || text.includes('ayuda') || text.includes('que tal') || 
    text.includes('saludos') || text.includes('presentate') || text.includes('como te llamas')
  ) {
    return "¡Hola! Soy ACE, la inteligencia artificial de boxes de Big Karting. Estoy listo para ayudarte a trazar la mejor línea. Pregúntame sobre nuestros horarios, precios de tandas, cómo llegar, el circuito de drift o nuestras actividades para despedidas y cumpleaños.";
  }

  return "Comprendido, piloto. He analizado tu telemetría pero no he capturado bien tu pregunta. Puedes preguntarme sobre nuestras tarifas de karts, los horarios de apertura, cómo llegar a Miñano o qué incluye el circuito exclusivo de Drift.";
}

// Añadir mensaje a la caja de chat visual
function appendChatMessage(sender, messageText) {
  if (chatContent) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender}`;
    msgDiv.textContent = messageText;
    chatContent.appendChild(msgDiv);
    
    // Auto-scroll al final del chat
    chatContent.scrollTop = chatContent.scrollHeight;
  }
  
  // Asegurar que la ventana esté abierta
  if (chatBox) {
    chatBox.classList.add('open');
  }
}

// Configuración de eventos de Síntesis de voz (Hablar)
function speakResponse(text) {
  if (!SpeechSynthesis) return;

  // Cancelar y reanudar síntesis previa para evitar el bug de colgado crónico de Chrome
  SpeechSynthesis.cancel();
  SpeechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 1.05; // Un pelín acelerada para look cyberpunk/deportivo ágil
  utterance.pitch = 0.95; // Un tono levemente grave y profesional

  utterance.onstart = () => {
    isBotSpeaking = true;
    micBtn.classList.add('speaking');
    aiTooltip.textContent = "ACE HABLANDO...";
    
    // Atenuar la música de fondo de nuevo mientras habla
    if (isPlaying && bgMusic) {
      bgMusic.volume = 0.05;
    }
  };

  utterance.onend = () => {
    stopSpeakingAnimation();
  };

  utterance.onerror = () => {
    stopSpeakingAnimation();
  };

  try {
    SpeechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speech synthesis failed:", err);
    stopSpeakingAnimation();
  }
}

function stopSpeakingAnimation() {
  isBotSpeaking = false;
  micBtn.classList.remove('speaking');
  aiTooltip.textContent = "PULSA PARA HABLAR";
  
  // Restaurar música de fondo
  if (isPlaying && bgMusic) {
    bgMusic.volume = 0.25;
  }
}
