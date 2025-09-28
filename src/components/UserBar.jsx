/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { toggleTheme } from '../lib/actions';

export default function UserBar() {
    const theme = useStore.use.theme();

    return (
        <div className="user-bar">
            <div className="user-info">
                <span className="icon">account_circle</span>
                <p>User</p>
            </div>
            <div className="user-actions">
                <button className="icon-btn icon" title="Settings">
                    settings
                </button>
                <button 
                    className="icon-btn icon" 
                    onClick={toggleTheme} 
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </button>
            </div>
        </div>
    );
}
