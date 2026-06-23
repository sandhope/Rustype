use std::fs;
use std::path::Path;
use tauri::Manager;
use tauri_plugin_window_state::StateFlags;

#[tauri::command]
fn create_file(path: String) -> Result<(), String> {
    fs::File::create(&path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn rename_file_or_dir(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn copy_file_or_dir(source: String, destination: String) -> Result<(), String> {
    let src = Path::new(&source);
    let dst = Path::new(&destination);
    if src.is_dir() {
        copy_dir_recursive(src, dst).map_err(|e| e.to_string())?;
    } else {
        fs::copy(src, dst).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

#[tauri::command]
fn remove_file_or_dir(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn reveal_in_folder(path: String) -> Result<(), String> {
    let p = Path::new(&path);

    #[cfg(target_os = "windows")]
    {
        // explorer /select,<path> opens parent directory and selects target file/folder
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", p.to_string_lossy()))
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        // open -R <path> reveals and selects in Finder
        std::process::Command::new("open")
            .arg("-R")
            .arg(p)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        // xdg-open opens the parent directory
        let parent = p.parent().unwrap_or(p);
        std::process::Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Dynamically grant filesystem permissions for a specific directory
#[tauri::command]
fn grant_directory_access(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_fs::FsExt;

    let fs_scope = app_handle.fs_scope();

    // Grant access to the directory and all its subdirectories recursively
    fs_scope
        .allow_directory(&path, true)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn grant_file_access(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_fs::FsExt;

    let fs_scope = app_handle.fs_scope();

    // Grant access to the file
    fs_scope.allow_file(&path).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn open_devtools(app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;

    if let Some(window) = app_handle.get_webview_window("main") {
        window.open_devtools();
    } else {
        return Err("Main window not found".to_string());
    }

    Ok(())
}

#[tauri::command]
fn toggle_fullscreen(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let is_fullscreen = window.is_fullscreen().unwrap_or(false);
        if is_fullscreen {
            window.set_fullscreen(false).map_err(|e| e.to_string())?;
        } else {
            window.set_fullscreen(true).map_err(|e| e.to_string())?;
        }
    } else {
        return Err("Main window not found".to_string());
    }

    Ok(())
}

#[tauri::command]
async fn html_to_pdf(html_content: String, target_path: String) -> Result<(), String> {
    use headless_chrome::{Browser, LaunchOptions};
    use headless_chrome::types::PrintToPdfOptions;

    // Create a temporary HTML file to avoid Data URI length limits
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let temp_html_path = std::env::temp_dir().join(format!("rustype_tauri_pdf_{}.html", timestamp));
    fs::write(&temp_html_path, html_content).map_err(|e| format!("Failed to create temp file: {}", e))?;

    // Convert to a browser-compatible file:// URL
    let file_url = format!("file://{}", temp_html_path.to_string_lossy());

    // Launch headless browser (sandbox disabled for better compatibility)
    let browser = Browser::new(
        LaunchOptions::default_builder()
            .headless(true)
            .args(vec![
                "--no-sandbox".as_ref(),
                "--disable-setuid-sandbox".as_ref(),
                "--disable-gpu".as_ref(), // Disable GPU in headless mode to reduce errors
            ])
            .build()
            .map_err(|e| e.to_string())?
    ).map_err(|e| e.to_string())?;

    // Open a new tab and navigate to the temp HTML file
    let tab = browser.new_tab().map_err(|e| e.to_string())?;
    tab.navigate_to(&file_url).map_err(|e| e.to_string())?;

    // wait_until_navigated only guarantees DOM is loaded
    tab.wait_until_navigated().map_err(|e| e.to_string())?;

    // Wait for images and styles to finish rendering.
    // For complex JS-rendered content, increase the delay or have the frontend
    // signal readiness via a window variable.
    std::thread::sleep(std::time::Duration::from_millis(500));

    // Configure PDF print options.
    // Passing None would use defaults (A4, with header/footer, default margins).
    // Custom options are needed to remove the default header/footer (URL and date).
    let pdf_options = PrintToPdfOptions {
        display_header_footer: Some(false), // Hide header/footer (title and URL)
        print_background: Some(true),       // Required for CSS background colors/images
        paper_width: Some(8.27),            // A4 width (inches)
        paper_height: Some(11.69),          // A4 height (inches)
        margin_top: Some(0.4),              // Top margin (inches)
        margin_bottom: Some(0.4),
        margin_left: Some(0.4),
        margin_right: Some(0.4),
        ..Default::default()
    };

    let pdf_data = tab.print_to_pdf(Some(pdf_options)).map_err(|e| e.to_string())?;

    // Save PDF and clean up temp file
    fs::write(&target_path, pdf_data).map_err(|e| format!("Failed to save PDF: {}", e))?;
    let _ = fs::remove_file(temp_html_path); // Remove temp HTML to free disk space

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::all().difference(StateFlags::DECORATIONS))
                .build(),
        )
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            create_file,
            create_directory,
            rename_file_or_dir,
            copy_file_or_dir,
            remove_file_or_dir,
            reveal_in_folder,
            grant_directory_access,
            grant_file_access,
            open_devtools,
            toggle_fullscreen,
            html_to_pdf,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_decorations(false)?;
            window.set_title("Rustype").ok();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
