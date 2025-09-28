/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { toggleTheme, logout } from '../lib/actions';

export default function UserBar() {
    // Always call hooks at the top level - never conditionally
    const theme = useStore.use.theme();
    const user = useStore.use.user();
    const isAuthenticated = useStore.use.isAuthenticated();
    const setIsSettingsOpen = useStore((state) => state.actions.setIsSettingsOpen);

    const handleLogout = async () => {
        if (confirm('Are you sure you want to log out?')) {
            await logout();
        }
    };
    
    const handleSettingsClick = () => {
        setIsSettingsOpen(true);
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
            <div className="user-actions">
                <button 
                    className="icon-btn icon" 
                    onClick={handleSettingsClick}
                    title="Settings"
                >
                    settings
                </button>
                <button 
                    className="icon-btn icon" 
                    onClick={toggleTheme} 
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </button>
                <button 
                    className="icon-btn icon" 
                    onClick={handleLogout}
                    title="Logout"
                >
                    logout
                </button>
            </div>
        </div>
    );
}
