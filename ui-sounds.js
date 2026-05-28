/**
 * Raíces Sonoras - Sistema de Sonidos UI Global
 * Usa la Web Audio API para generar efectos de sonido de interfaz sin requerir archivos mp3.
 */

const UIAudioContext = window.AudioContext || window.webkitAudioContext;
let uiAudioCtx;

// Inicializa el contexto de audio solo cuando es necesario
function initUIAudio() {
    if (!uiAudioCtx) {
        uiAudioCtx = new UIAudioContext();
    }
    if (uiAudioCtx.state === 'suspended') {
        uiAudioCtx.resume();
    }
}

/**
 * Sonido de "Ingreso" o "Comenzar"
 * Acorde ascendente rápido y alegre.
 */
function playUIEntry() {
    initUIAudio();
    const t = uiAudioCtx.currentTime;
    
    // Tocar un pequeño acorde mágico
    [440, 554.37, 659.25, 880].forEach((freq, i) => { // A4, C#5, E5, A5
        const osc = uiAudioCtx.createOscillator();
        const gain = uiAudioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.05);
        
        gain.gain.setValueAtTime(0, t + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.1, t + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.5);
        
        osc.connect(gain);
        gain.connect(uiAudioCtx.destination);
        
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.6);
    });
}

/**
 * Sonido de "Siguiente" o "Pop"
 * Para cambios de sección o botones.
 */
function playUINext() {
    initUIAudio();
    const t = uiAudioCtx.currentTime;
    
    const osc = uiAudioCtx.createOscillator();
    const gain = uiAudioCtx.createGain();
    
    osc.type = 'sine';
    // Caída rápida de frecuencia para efecto 'pop'
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.connect(gain);
    gain.connect(uiAudioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.1);
}

/**
 * Sonido de "Acierto" (Success)
 * Campanilla brillante y positiva.
 */
function playUISuccess() {
    initUIAudio();
    const t = uiAudioCtx.currentTime;
    
    [659.25, 880].forEach((freq, i) => { // E5, A5
        const osc = uiAudioCtx.createOscillator();
        const gain = uiAudioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, t + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4);
        
        osc.connect(gain);
        gain.connect(uiAudioCtx.destination);
        
        osc.start(t + i * 0.1);
        osc.stop(t + i * 0.1 + 0.5);
    });
}

/**
 * Sonido de "Error" (Incorrect)
 * Buzzer suave y corto.
 */
function playUIError() {
    initUIAudio();
    const t = uiAudioCtx.currentTime;
    
    const osc = uiAudioCtx.createOscillator();
    const gain = uiAudioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t); // Frecuencia grave
    osc.frequency.linearRampToValueAtTime(120, t + 0.15); // Baja ligeramente
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.2);
    
    osc.connect(gain);
    gain.connect(uiAudioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.25);
}

// Hacer las funciones disponibles globalmente
window.playUIEntry = playUIEntry;
window.playUINext = playUINext;
window.playUISuccess = playUISuccess;
window.playUIError = playUIError;
