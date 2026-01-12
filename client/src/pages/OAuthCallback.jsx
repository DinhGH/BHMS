// client/src/pages/OAuthCallback.jsx
// Component để xử lý OAuth callback từ Google/Facebook

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { handleOAuthCallback } from '../utils/authService';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    // Lấy token từ URL params
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    if (error) {
      // Có lỗi
      console.error('OAuth Error:', error);
      navigate('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      try {
        // Decode JWT token để lấy user info
        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }

        // Decode payload (Base64)
        const payload = JSON.parse(
          atob(parts[1])
        );

        // Lưu token và user info
        const result = handleOAuthCallback(token, {
          id: payload.id,
          email: payload.email
        });

        if (result.success) {
          // Fetch thêm user profile
          fetchUserProfile(token);
        } else {
          navigate('/login?error=OAuth%20callback%20failed');
        }
      } catch (error) {
        console.error('Lỗi khi xử lý OAuth callback:', error);
        navigate('/login?error=Invalid%20token');
      }
    } else {
      navigate('/login?error=No%20token%20provided');
    }
  }, [searchParams, navigate, login]);

  const fetchUserProfile = async (token) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update user info từ profile
        localStorage.setItem('user', JSON.stringify(data.data));
        login(data.data, token);
        
        // Redirect tới dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Lỗi khi fetch profile:', error);
      navigate('/login?error=Failed%20to%20fetch%20profile');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1>Đang xử lý đăng nhập...</h1>
        <p>Vui lòng chờ trong giây lát</p>
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#666'
        }}>
          Nếu không tự động chuyển hướng, <a href="/login">click vào đây</a>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
