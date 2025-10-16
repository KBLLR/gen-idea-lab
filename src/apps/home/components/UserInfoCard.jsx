import React from 'react';
import useStore from '@store';

/**
 * UserInfoCard - Displays logged-in user information with logout button
 * Matches the width of the sidebar for visual consistency
 */
export default function UserInfoCard() {
  const user = useStore(s => s.user);
  const logout = useStore(s => s.actions?.logout);

  if (!user) return null;

  return (
    <div className="dashboard-user-info">
      <div className="user-avatar">
        {user.picture ? (
          <img src={user.picture} alt={user.name} />
        ) : (
          <span className="material-icons-round">person</span>
        )}
      </div>
      <div className="user-details">
        <div className="user-name">{user.name}</div>
        <div className="user-email">{user.email}</div>
      </div>
      <button
        className="logout-btn"
        onClick={() => logout()}
        title="Logout"
        aria-label="Logout"
      >
        <span className="material-icons-round">logout</span>
      </button>
    </div>
  );
}
