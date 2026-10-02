import React, { useState } from 'react';

export default function PortalPage() {
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMagicSent(true);
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: 'screen', padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '40px auto', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', color: '#ffffff', marginBottom: '10px' }}>Secure Client Portal</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>Enter your authorized institutional email to receive a password-free Magic Link access tracking key.</p>
        
        {!magicSent ? (
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '80%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#ffffff', marginBottom: '20px' }}
              required 
            />
            <button type="submit" style={{ width: '85%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              Send Magic Login Link
            </button>
          </form>
        ) : (
          <div style={{ color: '#4ade80', fontSize: '14px', padding: '20px', backgroundColor: '#064e3b', borderRadius: '8px' }}>
            <strong>✓ Magic Link Sent!</strong> Check your business inbox at <strong>{email}</strong> to securely jump straight into your Airtable data pipeline logs.
          </div>
        )}
      </div>
    </div>
  );
}
