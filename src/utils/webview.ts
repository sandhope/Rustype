import { getCurrentWebview } from "@tauri-apps/api/webview";

// Load zoom level from storage, default 1.0
let zoomLevel = parseFloat(localStorage.getItem('app_zoom_level') || '1.0');

const MAX_ZOOM_LEVEL = 3.0; 
const MIN_ZOOM_LEVEL = 0.3;
const ZOOM_STEP = 0.1; 

async function setZoom(level: number) {
  // Fix float precision
  const cleanedLevel = Math.round(level * 10) / 10;
  
  // Clamp to boundaries
  zoomLevel = Math.min(Math.max(cleanedLevel, MIN_ZOOM_LEVEL), MAX_ZOOM_LEVEL);
  
  // Save and apply
  localStorage.setItem('app_zoom_level', zoomLevel.toString());
  await getCurrentWebview().setZoom(zoomLevel);
}

// Initialize zoom on app start
export async function initZoom() {
  if (zoomLevel !== 1.0) {
    await setZoom(zoomLevel);
  }
}

export function zoomIn() {
  setZoom(zoomLevel + ZOOM_STEP);
}

export function zoomOut() {
  setZoom(zoomLevel - ZOOM_STEP);
}

export function zoomReset() {
  setZoom(1.0);
}