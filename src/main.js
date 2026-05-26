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
    scene.add(stripL);
    const stripR = stripL.clone();
    stripR.position.x = 3.5;
    scene.add(stripR);

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
          <div class="loader-logo">BIG<span>K</span>ARTING</div>
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

        // Centrado y escalado automático inteligente
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center); // Centrar pivote local

        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredLength = 3.5;
        const scaleFactor = desiredLength / maxDim;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const modelContainer = new THREE.Group();
        modelContainer.add(model);
        modelContainer.position.y = 0.15; // Reposar sobre la rejilla
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

      studioGrid.position.z += flow;
      if (studioGrid.position.z > 2) {
        studioGrid.position.z = 0;
      }
      trackGroup.rotation.y = currentMouseX * 0.02;

      // Halo bajo el kart — pulso sutil (estudio)
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

      let targetKartY = Math.sin(time * 1.8) * 0.05; // Levitación de suspensión senoidal constante
      let targetKartRotX = -scrollSpeed * 8.0;       // Inclinación física de inercia longitudinal al acelerar
      let targetKartRotY = (time * 0.15) + currentMouseX * 0.18; // Giro suave reactivo al ratón (volante)
      let targetKartRotZ = scrollSpeed * 4.0 - currentMouseX * 0.08; // Inclinación lateral
      let targetScale = 1.0;

      // Transición fluida por fases de órbita elíptica
      if (scrollPercent < 0.25) {
        // FASE 1: HERO SPLIT (Órbita frontal-derecha — kart en lado derecho si no es móvil)
        const p = scrollPercent / 0.25;
        const angle = THREE.MathUtils.lerp(0.3, Math.PI / 3, p);
        const radius = 5.5;
        targetCamX = Math.sin(angle) * radius + (isMobile ? 0 : 1.2);  // offset a la derecha si no es móvil
        targetCamY = THREE.MathUtils.lerp(1.0, 1.6, p);
        targetCamZ = Math.cos(angle) * radius;
        
        targetLookX = isMobile ? 0 : 1.8;   // mirar al kart
        targetLookY = 0.15;
        targetLookZ = 0;
        
        targetKartRotY = (time * 0.12) + currentMouseX * 0.25;  // parallax más pronunciado
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
        
        targetKartRotY = THREE.MathUtils.lerp((time * 0.15) + currentMouseX * 0.18, -Math.PI / 6 + currentMouseX * 0.1, p);
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
        
        targetKartRotY = THREE.MathUtils.lerp(-Math.PI / 6, Math.PI / 3.2 + currentMouseX * 0.18, p);
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
        
        targetKartRotY = THREE.MathUtils.lerp(Math.PI / 3.2, time * 0.2 + currentMouseX * 0.1, p);
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

      kartGroup.rotation.x += (targetKartRotX - kartGroup.rotation.x) * 0.07;
      kartGroup.rotation.y += (targetKartRotY - kartGroup.rotation.y) * 0.07;
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
