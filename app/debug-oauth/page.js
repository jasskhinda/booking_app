'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DebugOAuth() {
  const supabase = createClientComponentClient();
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(message);
  };

  const checkCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        addLog(`Error getting user: ${error.message}`);
      } else if (user) {
        addLog(`Current user: ${user.email} (${user.app_metadata.provider || 'email'})`);
        setUser(user);
      } else {
        addLog('No current user');
        setUser(null);
      }
    } catch (err) {
      addLog(`Exception getting user: ${err.message}`);
    }
  };

  const testGoogleOAuth = async () => {
    try {
      addLog('Starting Google OAuth test...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        addLog(`OAuth initiation error: ${error.message}`);
      } else {
        addLog('OAuth initiated successfully');
      }
    } catch (err) {
      addLog(`OAuth exception: ${err.message}`);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        addLog(`Sign out error: ${error.message}`);
      } else {
        addLog('Signed out successfully');
        setUser(null);
      }
    } catch (err) {
      addLog(`Sign out exception: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">OAuth Debug Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              <button
                onClick={checkCurrentUser}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Check Current User
              </button>
              
              <button
                onClick={testGoogleOAuth}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Test Google OAuth
              </button>
              
              {user && (
                <button
                  onClick={signOut}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Sign Out
                </button>
              )}
            </div>

            {user && (
              <div className="mt-6 p-4 bg-green-50 rounded">
                <h3 className="font-semibold text-green-800">Current User:</h3>
                <p className="text-sm text-green-700">Email: {user.email}</p>
                <p className="text-sm text-green-700">Provider: {user.app_metadata.provider || 'email'}</p>
                <p className="text-sm text-green-700">ID: {user.id}</p>
                <p className="text-sm text-green-700">Created: {new Date(user.created_at).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p>No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
            <button
              onClick={() => setLogs([])}
              className="mt-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>First click "Check Current User" to see if you're already logged in</li>
            <li>If logged in, try "Sign Out" first</li>
            <li>Click "Test Google OAuth" to initiate the OAuth flow</li>
            <li>Check browser console and network tab for additional errors</li>
            <li>After OAuth redirect, check this page again to see if authentication succeeded</li>
          </ol>
        </div>
      </div>
    </div>
  );
}