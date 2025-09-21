'use client';

import { useEffect, useState, useContext } from 'react';
import { AuthContext } from './auth-provider';

export function CookieDebugger() {
  const [cookieData, setCookieData] = useState<any>(null);
  const { user, session, loading } = useContext(AuthContext);

  useEffect(() => {
    // Function to get cookie value
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    // Get all cookies
    const allCookies = document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value };
    });

    // Get specific session cookies
    const equipggSession = getCookie('equipgg_session');
    const equipggClient = getCookie('equipgg_session_client');

    // Try to parse session data
    let sessionData = null;
    let clientData = null;

    if (equipggSession) {
      try {
        sessionData = JSON.parse(decodeURIComponent(equipggSession));
      } catch (e) {
        console.error('Failed to parse equipgg_session:', e);
      }
    }

    if (equipggClient) {
      try {
        clientData = JSON.parse(decodeURIComponent(equipggClient));
      } catch (e) {
        try {
          // Try double decode for double-encoded cookies
          clientData = JSON.parse(decodeURIComponent(decodeURIComponent(equipggClient)));
          console.log('Cookie was double-encoded, used double decode');
        } catch (e2) {
          console.error('Failed to parse equipgg_session_client even with double decode:', e2);
        }
      }
    }

    setCookieData({
      allCookies,
      equipggSession,
      equipggClient,
      sessionData,
      clientData,
      now: Date.now(),
      location: window.location.href
    });
  }, []);

  if (!cookieData) return <div>Loading cookie debug...</div>;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      width: '400px', 
      height: '100vh', 
      background: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '20px', 
      fontSize: '12px', 
      overflow: 'auto', 
      zIndex: 9999 
    }}>
      <h3>Cookie Debug Panel</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Location:</strong> {cookieData.location}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Current Time:</strong> {cookieData.now}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>All Cookies ({cookieData.allCookies.length}):</strong>
        <pre style={{ fontSize: '10px', background: '#333', padding: '5px' }}>
          {JSON.stringify(cookieData.allCookies, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>equipgg_session:</strong>
        <div style={{ fontSize: '10px', wordBreak: 'break-all' }}>
          {cookieData.equipggSession || 'NOT FOUND'}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>equipgg_session_client:</strong>
        <div style={{ fontSize: '10px', wordBreak: 'break-all' }}>
          {cookieData.equipggClient || 'NOT FOUND'}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Parsed Session Data:</strong>
        <pre style={{ fontSize: '10px', background: '#333', padding: '5px' }}>
          {cookieData.sessionData ? JSON.stringify(cookieData.sessionData, null, 2) : 'NONE'}
        </pre>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Parsed Client Data:</strong>
        <pre style={{ fontSize: '10px', background: '#333', padding: '5px' }}>
          {cookieData.clientData ? JSON.stringify(cookieData.clientData, null, 2) : 'NONE'}
        </pre>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Session Valid?</strong>
        {cookieData.sessionData ? (
          <div style={{ color: cookieData.sessionData.expires_at > cookieData.now ? 'green' : 'red' }}>
            {cookieData.sessionData.expires_at > cookieData.now ? 'YES' : 'EXPIRED'}
            <br />
            Expires: {new Date(cookieData.sessionData.expires_at).toLocaleString()}
          </div>
        ) : (
          <div style={{ color: 'red' }}>NO SESSION DATA</div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>AuthProvider Status:</strong>
        <div>
          <div style={{ color: loading ? 'orange' : (user ? 'green' : 'red') }}>
            Loading: {loading ? 'YES' : 'NO'}
          </div>
          <div style={{ color: user ? 'green' : 'red' }}>
            User: {user ? `${user.displayName} (${user.id})` : 'NONE'}
          </div>
          <div style={{ color: session ? 'green' : 'red' }}>
            Session: {session ? 'ACTIVE' : 'NONE'}
          </div>
        </div>
      </div>
    </div>
  );
}