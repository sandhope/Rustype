import './LoadingSplash.css';

export default function LoadingSplash() {
    return (
        <div className="loading-splash">
            <div className="loading-splash-content">
                <div className="loading-splash-spinner" />
                <span className="loading-splash-text">Loading...</span>
            </div>
        </div>
    );
}
