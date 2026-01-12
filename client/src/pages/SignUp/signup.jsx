import React, { useState } from "react";
import './signup.css';
import { FcGoogle } from "react-icons/fc"; 
import { FaFacebookF, FaEye, FaEyeSlash, FaUpload } from "react-icons/fa"; 
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const GOOGLE_CLIENT_ID = "1022839150374-tqm24fj0n6crq711raq4ji8fcinmh8r6.apps.googleusercontent.com";

function SignUpContent() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        rePassword: "",
        phone: "",
        gender: "",
        hometown: "",
        avatar: null
    });

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '', closing: false });
    const ALERT_TRANSITION = 600; 
    const [showPassword, setShowPassword] = useState(false);
    const [showRePassword, setShowRePassword] = useState(false);
    const [errors, setErrors] = useState({});
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ""
            });
        }
    };

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); 
        if (value.length > 0 && value[0] !== '0') {
            value = '0' + value.slice(0, 9); 
        }
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        
        setFormData({
            ...formData,
            phone: value
        });
        if (value.length === 10 && value[0] === '0') {
            setErrors({
                ...errors,
                phone: ""
            });
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                setErrors({
                    ...errors,
                    avatar: "Please upload a valid image file (JPEG, PNG, or GIF)"
                });
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                setErrors({
                    ...errors,
                    avatar: "Image size must be less than 5MB"
                });
                return;
            }

            setFormData({
                ...formData,
                avatar: file
            });
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
            
            if (errors.avatar) {
                setErrors({
                    ...errors,
                    avatar: ""
                });
            }
        }
    };

    const removeAvatar = () => {
        setFormData({
            ...formData,
            avatar: null
        });
        setAvatarPreview(null);
        const fileInput = document.getElementById('avatar');
        if (fileInput) fileInput.value = '';
    };

    const validateForm = () => {
        let newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Please enter your full name.";
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = "Name must be at least 2 characters.";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Please enter your email.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        const pass = formData.password;
        if (!pass) {
            newErrors.password = "Please enter your password.";
        } else if (pass.length < 8) {
            newErrors.password = "Password must be at least 8 characters.";
        } else if (!/[0-9]/.test(pass)) {
            newErrors.password = "Password must contain at least one number.";
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) { 
            newErrors.password = "Password must contain at least one symbol.";
        } else if (!/[A-Z]/.test(pass)) {
            newErrors.password = "Password must contain at least one uppercase letter.";
        } else if (!/[a-z]/.test(pass)) {
            newErrors.password = "Password must contain at least one lowercase letter.";
        }

        if (!formData.rePassword) {
            newErrors.rePassword = "Please confirm your password.";
        } else if (formData.password !== formData.rePassword) {
            newErrors.rePassword = "Passwords do not match.";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Please enter your phone number.";
        } else if (!/^0[0-9]{9}$/.test(formData.phone)) {
            newErrors.phone = "Phone number must start with 0 and have exactly 10 digits.";
        }

        if (!formData.gender) {
            newErrors.gender = "Please select your gender.";
        }

        if (!formData.hometown.trim()) {
            newErrors.hometown = "Please enter your hometown.";
        } else if (formData.hometown.trim().length < 2) {
            newErrors.hometown = "Hometown must be at least 2 characters.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const formDataToSend = new FormData();
                formDataToSend.append('fullName', formData.fullName);
                formDataToSend.append('email', formData.email);
                formDataToSend.append('password', formData.password);
                formDataToSend.append('phone', formData.phone);
                formDataToSend.append('gender', formData.gender);
                formDataToSend.append('hometown', formData.hometown);
                if (formData.avatar) {
                    formDataToSend.append('avatar', formData.avatar);
                }

                const resp = await fetch('http://localhost:4000/api/signup', {
                    method: 'POST',
                    body: formDataToSend
                });
                
                const data = await resp.json();
                if (resp.ok) {
                    setFormData({ 
                        fullName: "", 
                        email: "", 
                        password: "", 
                        rePassword: "",
                        phone: "",
                        gender: "",
                        hometown: "",
                        avatar: null 
                    });
                    setAvatarPreview(null);
                    const display = 1200;
                    setAlert({ show: true, type: 'success', message: 'Register Successfully! Wait for going to login page...', closing: false });
                    setTimeout(() => setAlert(a => ({ ...a, closing: true })), display);
                    setTimeout(() => {
                        setAlert({ show: false, type: 'success', message: '', closing: false });
                        window.location.href = '/login';
                    }, display + ALERT_TRANSITION);
                } else {
                    const display = 3500;
                    setAlert({ show: true, type: 'error', message: data.error || 'Register Failed!', closing: false });
                    setTimeout(() => setAlert(a => ({ ...a, closing: true })), display);
                    setTimeout(() => setAlert({ show: false, type: 'error', message: '', closing: false }), display + ALERT_TRANSITION);
                }
            } catch (err) {
                console.error(err);
                const display = 3500;
                setAlert({ show: true, type: 'error', message: 'Can not connect to the server!', closing: false });
                setTimeout(() => setAlert(a => ({ ...a, closing: true })), display);
                setTimeout(() => setAlert({ show: false, type: 'error', message: '', closing: false }), display + ALERT_TRANSITION);
            }
        } else {
            console.log("There are errors in Form!, Please check again.");
        }
    };

    React.useEffect(() => {
        window.fbAsyncInit = function() {
            window.FB.init({
                appId      : '1855106328705397', 
                cookie     : true,
                xfbml      : true,
                version    : 'v18.0'
            });
        };

        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }, []);

    const handleFacebookLogin = () => {
        console.log('handleFacebookLogin called');
        
        if (!window.FB) {
            console.error('Facebook SDK not loaded');
            setAlert({ 
                show: true, 
                type: 'error', 
                message: 'Facebook SDK not loaded yet!, Please wait...', 
                closing: false 
            });
            return;
        }
        
        window.FB.login((response) => {
            console.log('FB.login response:', response);
            
            if (response.authResponse) {
                const { accessToken, userID } = response.authResponse;
                console.log('Auth successful, token:', accessToken);
                
                window.FB.api('/me', { fields: 'id,name,email,picture.type(large),gender' }, async (userInfo) => {
                    console.log("FB User Info:", userInfo);
                    
                    try {
                        const res = await axios.post(
                            'http://localhost:4000/api/facebook-signup',
                            {
                                token: accessToken,
                                facebookId: userID,
                                email: userInfo.email,
                                name: userInfo.name
                            }
                        );
                        
                        console.log('Backend response:', res.data);
                        
                        localStorage.setItem('authToken', res.data.token);
                        setAlert({ 
                            show: true, 
                            type: 'success', 
                            message: 'Login with Facebook Successfully! Wait for going to login page...', 
                            closing: false 
                        });
                        setTimeout(() => window.location.href = '/login', 1500);
                        
                    } catch (error) {
                        console.error('Backend error:', error);
                        const msg = error.response?.data?.error || 'Facebook login failed!';
                        setAlert({ 
                            show: true, 
                            type: 'error', 
                            message: msg, 
                            closing: false 
                        });
                    }
                });
            } else {
                console.log('User cancelled or not authorized');
                setAlert({ 
                    show: true, 
                    type: 'error', 
                    message: 'You cancelled Facebook sign up', 
                    closing: false 
                });
            }
        }, { scope: 'public_profile,email' });
    };

    return (
        <div className="signup-page">
            <h1>Create An Account</h1>
            <p>Already have an account? <a href="/login">Log in</a></p>
            
            {alert.show && (
                <div className="signup-alert">
                    <div className={`alert alert--${alert.type} ${alert.closing ? 'alert--closing' : ''}`} role="alert">
                        <span>{alert.message}</span>
                        <button className="alert__close" onClick={() => {
                            setAlert(a => ({ ...a, closing: true }));
                            setTimeout(() => setAlert({ show: false, type: a.type, message: '', closing: false }), ALERT_TRANSITION);
                        }} aria-label="Close">×</button>
                    </div>
                </div>
            )}

            <form className="form-signup" onSubmit={handleSubmit}>
                <label htmlFor="fullName">What should we call you? <span className="required">*</span></label>
                <input
                    className={errors.fullName ? "inp input-error" : "inp"}
                    id="fullName"
                    name="fullName" 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={formData.fullName}
                    onChange={handleChange}
                />
                {errors.fullName && <p className="error-message">{errors.fullName}</p>}

                <label htmlFor="email">What's your email? <span className="required">*</span></label>
                <input 
                    className={errors.email ? "inp input-error" : "inp"}
                    id="email"
                    name="email" 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={formData.email}
                    onChange={handleChange}
                />
                {errors.email && <p className="error-message">{errors.email}</p>}

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                        <input 
                            className={errors.phone ? "inp input-error" : "inp"}
                            id="phone"
                            name="phone" 
                            type="tel" 
                            placeholder="0912345678" 
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            maxLength="10"
                            pattern="^0[0-9]{9}$"
                            inputMode="numeric"
                        />
                        {errors.phone && <p className="error-message">{errors.phone}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="gender">Gender <span className="required">*</span></label>
                        <div className="custom-select-wrapper">
                            <select
                                className={errors.gender ? "inp input-error custom-select" : "inp custom-select"}
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        {errors.gender && <p className="error-message">{errors.gender}</p>}
                    </div>
                </div>

                <label htmlFor="hometown">Where are you from? <span className="required">*</span></label>
                <input 
                    className={errors.hometown ? "inp input-error" : "inp"}
                    id="hometown"
                    name="hometown" 
                    type="text" 
                    placeholder="Enter your hometown" 
                    value={formData.hometown}
                    onChange={handleChange}
                />
                {errors.hometown && <p className="error-message">{errors.hometown}</p>}

                <div className="btn-hidepass">
                    <label htmlFor="password">Create a password <span className="required">*</span></label>
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', color: '#666' }}
                    >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
                
                <input 
                    className={errors.password ? "input-error" : ""}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    value={formData.password}
                    onChange={handleChange}
                />
                {errors.password && <p className="error-message">{errors.password}</p>}
                <p className="hint-text">Use 8 or more characters with uppercase, lowercase, numbers & symbols</p>

                <div className="btn-hidepass">
                    <label htmlFor="rePassword">Confirm your password <span className="required">*</span></label>
                    <button 
                        type="button" 
                        onClick={() => setShowRePassword(!showRePassword)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', color: '#666' }}
                    >
                        {showRePassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        {showRePassword ? "Hide" : "Show"}
                    </button>
                </div>
                
                <input 
                    className={errors.rePassword ? "input-error" : ""}
                    id="rePassword"
                    name="rePassword"
                    type={showRePassword ? "text" : "password"} 
                    placeholder="Re-enter your password" 
                    value={formData.rePassword}
                    onChange={handleChange}
                />
                {errors.rePassword && <p className="error-message">{errors.rePassword}</p>}

                <div className="avatar-upload-section">
                    <label>Profile Picture (Optional)</label>
                    <div className="avatar-upload-container">
                        {avatarPreview ? (
                            <div className="avatar-preview">
                                <img src={avatarPreview} alt="Avatar preview" />
                                <button 
                                    type="button" 
                                    className="remove-avatar-btn"
                                    onClick={removeAvatar}
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="avatar" className="avatar-upload-label">
                                <FaUpload size={24} />
                                <span>Upload Photo</span>
                            </label>
                        )}
                        <input
                            type="file"
                            id="avatar"
                            name="avatar"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                    {errors.avatar && <p className="error-message">{errors.avatar}</p>}
                    <p className="hint-text">Accepted formats: JPG, PNG, GIF (Max 5MB)</p>
                </div>
            
                <div className="btn-create">
                    <p>By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
                    <button type="submit">Create An Account</button>
                </div>
            </form>

            <div className="signup-byanother">
                <p>OR Continue with</p>
                <div className="another-btn">
                    <button 
                        type="button" 
                        className="social-btn google-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            const googleBtnContainer = document.querySelector('.google-login-wrapper');
                            const googleBtn = googleBtnContainer?.querySelector('[role="button"]');
                            googleBtn?.click();
                        }}
                    >
                        <div className="icon-wrapper">
                            <FcGoogle size={22} />
                        </div>
                        <span>Google</span>
                    </button>

                    <div className="google-login-wrapper" style={{ display: 'none' }}>
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                try {
                                    const response = await axios.post(
                                        'http://localhost:4000/api/google-signup',
                                        { token: credentialResponse.credential }
                                    );

                                    localStorage.setItem('authToken', response.data.token);
                                    
                                    setAlert({ show: true, type: 'success', message: 'Register with Google Successfully! Wait for going to login page...', closing: false });
                                    setTimeout(() => {
                                        window.location.href = '/login';
                                    }, 1500);
                                } catch (error) {
                                    console.error('Google login failed:', error);
                                    setAlert({ show: true, type: 'error', message: 'Google login failed: ' + (error.response?.data?.error || error.message), closing: false });
                                }
                            }}
                            onError={() => {
                                console.log('Login Failed');
                                setAlert({ show: true, type: 'error', message: 'Google login failed!', closing: false });
                            }}
                        />
                    </div>

                    <button 
                        type="button" 
                        className="social-btn facebook-btn" 
                        onClick={(e) => {
                            e.preventDefault();
                            handleFacebookLogin();
                        }}
                    >
                        <div className="icon-wrapper">
                            <FaFacebookF size={20} color="#1877F2" />
                        </div>
                        <span>Facebook</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Component chính với GoogleOAuthProvider wrapper
export default function SignUp() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <SignUpContent />
        </GoogleOAuthProvider>
    );
}