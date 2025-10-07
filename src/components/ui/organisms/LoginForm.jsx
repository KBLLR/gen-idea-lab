/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { loginWithGoogle } from '../../lib/actions';

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load Google Sign-In script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: false,
            });

            window.google.accounts.id.renderButton(
                document.getElementById('google-signin-button'),
                {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                }
            );
        };

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleCredentialResponse = async (response) => {
        setIsLoading(true);
        setError(null);

        const result = await loginWithGoogle(response.credential);

        if (!result.success) {
            setError(result.error);
        }

        setIsLoading(false);
    };

    return (
        <div className="login-form">
            <div className="login-content">
                <h2>Welcome to GenBooth Idea Lab</h2>
                <p>Please sign in with your code.berlin Google account to continue.</p>
                
                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}
                
                <div className="google-signin-container">
                    <div id="google-signin-button"></div>
                    {isLoading && (
                        <div className="login-loading">
                            <div className="spinner"></div>
                            <span>Signing you in...</span>
                        </div>
                    )}
                </div>
                
                <div className="login-help">
                    <p>
                        <strong>Note:</strong> Only @code.berlin email addresses are allowed.
                    </p>
                </div>
            </div>
        </div>
    );
}