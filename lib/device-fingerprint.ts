'use client';

export interface FingerprintComponents {
  userAgent: string;
  platform: string;
  vendor: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelRatio: number;
  timezone: string;
  timezoneOffset: number;
  language: string;
  languages: string[];
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  canvasHash: string;
  webglHash: string;
  webglVendor: string;
  audioHash: string;
  fingerprint: string;
}

/**
 * Generate device fingerprint from browser characteristics
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components: Partial<FingerprintComponents> = {};
  
  // Basic browser info
  components.userAgent = navigator.userAgent;
  components.platform = navigator.platform;
  components.vendor = navigator.vendor;
  
  // Screen properties
  components.screenWidth = screen.width;
  components.screenHeight = screen.height;
  components.colorDepth = screen.colorDepth;
  components.pixelRatio = window.devicePixelRatio || 1;
  
  // Timezone
  const date = new Date();
  components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  components.timezoneOffset = date.getTimezoneOffset();
  components.language = navigator.language;
  components.languages = navigator.languages ? [...navigator.languages] : [];
  
  // Hardware
  components.hardwareConcurrency = navigator.hardwareConcurrency || 0;
  components.deviceMemory = (navigator as any).deviceMemory;
  components.maxTouchPoints = navigator.maxTouchPoints || 0;
  
  // Canvas fingerprinting
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Моят Глас 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Моят Глас 🔒', 4, 17);
    components.canvasHash = canvas.toDataURL();
  }
  
  // WebGL fingerprinting
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      components.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      components.webglHash = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    
    const glParams = [
      gl.getParameter(gl.VERSION),
      gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      gl.getParameter(gl.VENDOR),
      gl.getParameter(gl.RENDERER),
    ];
    components.webglHash += glParams.join('|');
  }
  
  // Audio fingerprinting
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    
    gainNode.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(0);
    
    let audioHash = '';
    scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      audioHash = Array.from(inputData.slice(0, 100))
        .map(v => Math.abs(v).toString(36))
        .join('')
        .substring(0, 50);
    };
    
    await new Promise(resolve => setTimeout(resolve, 100));
    oscillator.stop();
    audioContext.close();
    
    components.audioHash = audioHash || 'na';
  } catch (e) {
    components.audioHash = 'na';
  }
  
  // Generate final hash
  const fingerprintString = JSON.stringify(components);
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(fingerprintString)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return fingerprint;
}

/**
 * React hook for device fingerprinting
 */
import { useEffect, useState } from 'react';

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    generateDeviceFingerprint()
      .then(setFingerprint)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  return { fingerprint, loading, error };
}
