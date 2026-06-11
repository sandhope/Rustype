import type { AppSettings } from '../utils/settings';

interface AboutDialogProps {
    onClose: () => void;
}

export default function AboutDialog({ onClose }: AboutDialogProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="about-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="about-header">
                    <div className="about-logo">
                        <svg viewBox="0 0 100 100" width="64" height="64">
                            <rect x="10" y="10" width="80" height="80" rx="12" fill="#1976d2" />
                            <path
                                d="M30 30 L70 30 L70 70 L30 70 Z M40 40 L60 40 L60 50 L40 50 Z M40 55 L60 55 L60 60 L40 60 Z"
                                fill="white"
                            />
                        </svg>
                    </div>
                    <h2>Rustype</h2>
                    <p className="about-version">版本 0.1.0</p>
                </div>

                <div className="about-content">
                    <p className="about-description">
                        轻量级高性能 Markdown 编辑器，基于 Tauri + React + muya 构建。
                    </p>

                    <div className="about-section">
                        <h4>功能特性</h4>
                        <ul>
                            <li>所见即所得 (WYSIWYG) 编辑</li>
                            <li>GitHub Flavored Markdown 支持</li>
                            <li>数学公式、代码块、表格</li>
                            <li>多种编辑模式（聚焦、打字机、源码）</li>
                            <li>实时大纲导航</li>
                        </ul>
                    </div>

                    <div className="about-section">
                        <h4>快捷键</h4>
                        <div className="about-shortcuts">
                            <div className="shortcut-row">
                                <span>新建文件</span>
                                <kbd>Ctrl+N</kbd>
                            </div>
                            <div className="shortcut-row">
                                <span>打开文件</span>
                                <kbd>Ctrl+O</kbd>
                            </div>
                            <div className="shortcut-row">
                                <span>保存</span>
                                <kbd>Ctrl+S</kbd>
                            </div>
                            <div className="shortcut-row">
                                <span>另存为</span>
                                <kbd>Ctrl+Shift+S</kbd>
                            </div>
                            <div className="shortcut-row">
                                <span>查找</span>
                                <kbd>Ctrl+F</kbd>
                            </div>
                            <div className="shortcut-row">
                                <span>撤销</span>
                                <kbd>Ctrl+Z</kbd>
                            </div>
                            <div className="shortcut-row">
                                <span>重做</span>
                                <kbd>Ctrl+Y</kbd>
                            </div>
                        </div>
                    </div>

                    <div className="about-section">
                        <h4>技术栈</h4>
                        <p className="tech-stack">
                            <span className="tech-tag">Tauri</span>
                            <span className="tech-tag">React 18</span>
                            <span className="tech-tag">TypeScript</span>
                            <span className="tech-tag">muya</span>
                        </p>
                    </div>
                </div>

                <div className="about-footer">
                    <button className="about-close-btn" onClick={onClose}>
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
}