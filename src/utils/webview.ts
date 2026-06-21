import { getCurrentWebview } from "@tauri-apps/api/webview";

const MAX_ZOOM_LEVEL = 2.0;
const MIN_ZOOM_LEVEL = 0.5;
const ZOOM_STEP = 0.1;

function clamp(level: number): number {
  return Math.min(Math.max(Math.round(level * 10) / 10, MIN_ZOOM_LEVEL), MAX_ZOOM_LEVEL);
}

export async function setZoomLevel(level: number): Promise<number> {
  const zoom = clamp(level);
  await getCurrentWebview().setZoom(zoom);
  return zoom;
}

export async function zoomIn(level: number): Promise<number> {
  return setZoomLevel(level + ZOOM_STEP);
}

export async function zoomOut(level: number): Promise<number> {
  return setZoomLevel(level - ZOOM_STEP);
}

export async function zoomReset(): Promise<number> {
  return setZoomLevel(1.0);
}
