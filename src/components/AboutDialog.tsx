import appIcon from '../../src-tauri/icons/128x128.png';
import { useI18n } from '../utils/i18n';

interface AboutDialogProps {
    onClose: () => void;
}

export default function AboutDialog({ onClose }: AboutDialogProps) {
    const { t } = useI18n();
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="about-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="about-header">
                    <div className="about-logo">
                        <img src={appIcon} alt="Rustype Logo" width="64" height="64" />
                    </div>
                    <h2>Rustype</h2>
                    <p className="about-version">{t('dialogs.about.version', { version: '0.1.0' })}</p>
                </div>

                <div className="about-content">
                    <p className="about-description">
                        {t('dialogs.about.description')}
                    </p>

                    <div className="about-section">
                        <h4>{t('dialogs.about.features')}</h4>
                        <ul>
                            <li>{t('dialogs.about.feature1')}</li>
                            <li>{t('dialogs.about.feature2')}</li>
                            <li>{t('dialogs.about.feature3')}</li>
                            <li>{t('dialogs.about.feature4')}</li>
                            <li>{t('dialogs.about.feature5')}</li>
                        </ul>
                    </div>

                    <div className="about-section">
                        <h4>{t('dialogs.about.techStack')}</h4>
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
                        {t('dialogs.about.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}