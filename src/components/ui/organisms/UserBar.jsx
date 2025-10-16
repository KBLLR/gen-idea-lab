/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useNavigate } from 'react-router-dom';
import useStore from '@store';
import { toggleTheme, logout, openSettings } from '@shared/lib/actions';

export default function UserBar() {
    // Always call hooks at the top level - never conditionally
    const navigate = useNavigate();
    const theme = useStore.use.theme();
    const user = useStore.use.user();
    const isAuthenticated = useStore.use.isAuthenticated();
    const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen); // legacy
    const handleOpenSettings = () => {
        try { openSettings(); } catch {
            // fallback to legacy store action if direct action import fails
            setIsSettingsOpen(true);
        }
    };

    const handleLogout = async () => {
        if (confirm('Are you sure you want to log out?')) {
            await logout();
        }
    };

    const handleSettingsClick = () => {
        setIsSettingsOpen(true);
    };

    const handleDashboardClick = () => {
        navigate('/');
    };

    if (!isAuthenticated || !user) {
        return null; // Don't show user bar if not authenticated
    }

    return (
        <div className="user-bar">
            <div className="user-info">
                {user.picture ? (
                    <img
                        src={user.picture}
                        alt={user.name}
                        className="user-avatar"
                    />
                ) : (
                    <span className="icon">account_circle</span>
                )}
                <div className="user-details">
                    <p className="user-name">{user.name}</p>
                    <p className="user-email">{user.email}</p>
                </div>
            </div>
            <div className="user-controls-wrapper">
                <div className="user-actions">
                    <button
                        className="action-btn"
                        onClick={handleDashboardClick}
                        title="Go to Dashboard"
                    >
                        <span className="icon">home</span>
                    </button>
                    <div className="action-divider"></div>
                    <button
                        className="action-btn"
                        onClick={handleOpenSettings}
                        title="Settings"
                    >
                        <span className="icon">settings</span>
                    </button>
                    <div className="action-divider"></div>
                    <button
                        className="action-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        <span className="icon">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <div className="action-divider"></div>
                    <button
                        className="action-btn logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <span className="icon">logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
