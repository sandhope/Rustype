import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

// create second window with same config as main window
export async function createSecondWindow() {
  const label = `main-window-${Date.now()}`; // must be unique

  // check if window already exists
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return;
  }

  const secondWindow = new WebviewWindow(label, {
    url: '/',                    // same url as main window
    title: 'Rustype',           // Rustype title
    width: 1200,
    height: 800,
    // other config as main window
    resizable: true,
    minimizable: true,
    maximizable: true,
    // center: true,
    decorations: false,        // no decorations
  });

  // listen for created event
  secondWindow.once('tauri://created', () => {
    console.log('second window created successfully');
  });

  // listen for error event
  secondWindow.once('tauri://error', (e) => {
    console.error('create second window failed', e);
  });
}