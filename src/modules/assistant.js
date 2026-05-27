/**
 * Submódulo de control de audio de fondo (cyber-track) y asistente virtual ACE IA con síntesis de voz
 */
export function initAssistant() {
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
  // AUDIO CYBER-TRACK
  // ==========================================
  let audioControl = document.getElementById('cyber-audio-control');
  if (!audioControl) {
    audioControl = document.createElement('div');
    audioControl.id = 'cyber-audio-control';
    audioControl.className = 'paused';
    audioControl.innerHTML = `
      <button id="audio-toggle-btn" aria-label="Reproducir música de fondo">
        <span class="play-icon">▶</span>
        <span class="pause-icon">❚❚</span>
      </button>
      <div class="audio-visualizer">
        <span class="bar bar-1"></span>
        <span class="bar bar-2"></span>
        <span class="bar bar-3"></span>
        <span class="bar bar-4"></span>
      </div>
      <span class="audio-tooltip" id="audio-tooltip">RACING: OFF</span>
    `;
    document.body.appendChild(audioControl);
  }

  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioTooltip = document.getElementById('audio-tooltip');

  const bgMusic = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0;

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
    audioControl.addEventListener('click', (e) => {
      if (e.target !== audioToggleBtn && !audioToggleBtn.contains(e.target)) {
        toggleAudio();
      }
    });
  }

  // Auto-iniciar música con la primera interacción física del usuario
  const startAudioOnInteraction = () => {
    if (!isPlaying) {
      isPlaying = true;
      if (audioControl) audioControl.classList.remove('paused');
      if (audioTooltip) audioTooltip.textContent = "RACING: ON";
      bgMusic.play().catch(() => {});
      fadeInVolume(0.20, 2500);
    }
    document.removeEventListener('click', startAudioOnInteraction);
    document.removeEventListener('keydown', startAudioOnInteraction);
    document.removeEventListener('touchstart', startAudioOnInteraction);
  };

  document.addEventListener('click', startAudioOnInteraction);
  document.addEventListener('keydown', startAudioOnInteraction);
  document.addEventListener('touchstart', startAudioOnInteraction);

  // ==========================================
  // AGENTE DE VOZ INTELIGENTE NATIVO (ACE IA)
  // ==========================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechSynthesis = window.speechSynthesis;

  const aiWidget = document.createElement('div');
  aiWidget.id = 'cyber-ai-widget';
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

  const micBtn = document.getElementById('ai-mic-btn');
  const chatBox = document.getElementById('ai-chat-box');
  const chatContent = document.getElementById('ai-chat-content');
  const closeBtn = document.getElementById('ai-close-btn');
  const aiTriggerTooltip = document.getElementById('ai-trigger-tooltip');
  const inputForm = document.getElementById('ai-chat-input-form');
  const chatInput = document.getElementById('ai-chat-input');

  let isBotSpeaking = false;
  let processingTimeout = null;
  let silenceTimer = null;
  let finalTranscript = "";

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chatBox.classList.remove('open');
    });
  }

  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      if (processingTimeout) clearTimeout(processingTimeout);
      if (silenceTimer) clearTimeout(silenceTimer);
      finalTranscript = "";
      micBtn.classList.add('listening');
      aiTriggerTooltip.textContent = "ESCUCHANDO...";
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (processingTimeout) clearTimeout(processingTimeout);
      if (silenceTimer) clearTimeout(silenceTimer);
      micBtn.classList.remove('listening');
      
      let errorMsg = "Piloto, no he podido conectar con tu micrófono. Escribe tu pregunta directamente aquí abajo y te ayudaré de inmediato.";
      if (event.error === 'not-allowed') {
        errorMsg = "Permiso de micrófono denegado. Activa el acceso al micrófono en la barra del navegador o escribe tu consulta aquí en boxes.";
      } else if (event.error === 'network') {
        errorMsg = "Error de red en telemetría de voz. Escribe tu consulta directamente en el chat para que pueda responderte.";
      }
      
      aiTriggerTooltip.textContent = "MICRO DETENIDO";
      appendChatMessage('bot', errorMsg);
      if (chatBox) chatBox.classList.add('open');
      
      if (isPlaying && bgMusic) {
        bgMusic.volume = 0.25;
      }

      setTimeout(() => {
        if (aiTriggerTooltip.textContent === "MICRO DETENIDO") {
          aiTriggerTooltip.textContent = "PULSA PARA HABLAR";
        }
      }, 2500);
    };

    recognition.onend = () => {
      micBtn.classList.remove('listening');
      if (silenceTimer) clearTimeout(silenceTimer);
      
      if (aiTriggerTooltip.textContent === "MICRO DETENIDO") {
        return;
      }
      
      if (!finalTranscript.trim()) {
        aiTriggerTooltip.textContent = "PULSA PARA HABLAR";
        if (isPlaying && bgMusic) {
          bgMusic.volume = 0.25;
        }
        return;
      }
      
      aiTriggerTooltip.textContent = "PROCESANDO...";
      
      if (isPlaying && bgMusic) {
        bgMusic.volume = 0.25;
      }

      const responseText = getAIResponse(finalTranscript);
      appendChatMessage('user', finalTranscript);
      
      aiTriggerTooltip.textContent = "RESPONDIENDO...";
      
      setTimeout(() => {
        appendChatMessage('bot', responseText);
        speakResponse(responseText);
      }, 600);
    };

    recognition.onresult = (event) => {
      if (processingTimeout) clearTimeout(processingTimeout);
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
        aiTriggerTooltip.textContent = "TRANSCRIBIENDO...";
      }
      
      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, 1500);
    };
  }

  if (micBtn) {
    micBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (isBotSpeaking) {
        if (SpeechSynthesis) SpeechSynthesis.cancel();
        stopSpeakingAnimation();
        return;
      }

      if (!recognition) {
        chatBox.classList.toggle('open');
        return;
      }

      if (micBtn.classList.contains('listening')) {
        recognition.stop();
        return;
      }

      try {
        if (isPlaying && bgMusic) {
          bgMusic.volume = 0.03;
        }
        recognition.start();
      } catch (err) {
        console.error("Error arrancando reconocimiento de voz:", err);
        chatBox.classList.add('open');
      }
    });
  }

  if (inputForm && chatInput) {
    inputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      if (processingTimeout) clearTimeout(processingTimeout);
      aiTriggerTooltip.textContent = "PULSA PARA HABLAR";

      appendChatMessage('user', text);
      chatInput.value = '';

      const responseText = getAIResponse(text);

      setTimeout(() => {
        appendChatMessage('bot', responseText);
        speakResponse(responseText);
      }, 500);
    });
  }

  function getAIResponse(userText) {
    const text = userText.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!]/g, "")
      .trim();
    
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
    
    if (
      text.includes('precio') || text.includes('tarifa') || text.includes('cuesta') || 
      text.includes('cuanto') || text.includes('valor') || text.includes('euro') || 
      text.includes('tanda') || text.includes('tando') || text.includes('sesion') || 
      text.includes('ticket') || text.includes('pagar') || text.includes('costo') || 
      text.includes('coste') || text.includes('barato') || text.includes('caro') ||
      text.includes('presupuesto') || text.includes('dinero')
    ) {
      return "Nuestras tandas individuales duran 10 minutos cronometrados. La tanda infantil cuesta 13 euros, la clásica de adultos 20 euros, y la de Drift especial 25 euros. Si vienes en grupo, tenemos campeonatos GP desde 35 euros. ¿Cuál de ellos te apetece probar?";
    }
    
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
    
    if (
      text.includes('drift') || text.includes('deslizar') || text.includes('derrape') || 
      text.includes('derrapar') || text.includes('hielo') || text.includes('norte') || 
      text.includes('deslice') || text.includes('resbalar') || text.includes('derrapes') || 
      text.includes('deslizamiento') || text.includes('drit')
    ) {
      return "¡El Drift es nuestra gran especialidad! Somos el único circuito indoor exclusivo de drift en todo el norte de España. Conducirás karts especiales con neumáticos de baja adherencia. La tanda de 10 minutos cuesta 25 euros. Es una sensación única, ¡como conducir sobre hielo!";
    }

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

    if (
      text.includes('telefono') || text.includes('llamar') || text.includes('whatsapp') || 
      text.includes('reserva') || text.includes('reservar') || text.includes('contacto') || 
      text.includes('escribir') || text.includes('hablar') || text.includes('numero') || 
      text.includes('movil') || text.includes('celular') || text.includes('email') || 
      text.includes('correo') || text.includes('mensajes') || text.includes('mensaje')
    ) {
      return "Puedes reservar tanda o consultarnos llamando directamente a boxes al número 6 8 5, 7 2 2, 1 1 9. También puedes escribirnos por WhatsApp pulsando el botón flotante verde que tienes abajo a la derecha.";
    }
    
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

  function appendChatMessage(sender, messageText) {
    if (chatContent) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-msg ${sender}`;
      msgDiv.textContent = messageText;
      chatContent.appendChild(msgDiv);
      chatContent.scrollTop = chatContent.scrollHeight;
    }
    if (chatBox) {
      chatBox.classList.add('open');
    }
  }

  function speakResponse(text) {
    if (!SpeechSynthesis) return;

    SpeechSynthesis.cancel();
    SpeechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    utterance.onstart = () => {
      isBotSpeaking = true;
      micBtn.classList.add('speaking');
      aiTriggerTooltip.textContent = "ACE HABLANDO...";
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
    aiTriggerTooltip.textContent = "PULSA PARA HABLAR";
    if (isPlaying && bgMusic) {
      bgMusic.volume = 0.25;
    }
  }
}
