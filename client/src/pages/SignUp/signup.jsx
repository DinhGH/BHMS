import React, { useState } from "react";
import './signup.css';
// Import icon từ thư viện
import { FcGoogle } from "react-icons/fc"; 
import { FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa"; 

export default function SignUp() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: ""
    });

    const [alert, setAlert] = useState({ show: false, type: 'success', message: '', closing: false });
    const ALERT_TRANSITION = 600; // must match CSS transition duration (ms)

    const [showPassword, setShowPassword] = useState(false);

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

const validateForm = () => {
        let newErrors = {};
        const pass = formData.password;

        // Kiểm tra password
        if (!pass) {
            newErrors.password = "Please enter your password.";
        } else if (pass.length < 8) {
            newErrors.password = "Password must be at least 8 characters.";
        } else if (!/[0-9]/.test(pass)) {
            newErrors.password = "Password must contain at least one number.";
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) { // Kiểm tra ký tự đặc biệt
            newErrors.password = "Password must contain at least one symbol.";
        }

        // Cập nhật state lỗi
        setErrors(newErrors);

        // Nếu không có lỗi nào (object rỗng) thì trả về true
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const resp = await fetch('http://localhost:4000/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: formData.fullName,
                        email: formData.email,
                        password: formData.password
                    })
                });
                const data = await resp.json();
                if (resp.ok) {
                    setFormData({ fullName: "", email: "", password: "" });
                    // show, then close with animation, then redirect
                    const display = 1200;
                    setAlert({ show: true, type: 'success', message: 'Register Successfully! Wait for going to logging in page...', closing: false });
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
            console.log("There are errors in Form!, Please checking again.");
        }
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
                <label htmlFor="fullName">What should we call you?</label>
                <input
                    className="inp" 
                    id="fullName"
                    name="fullName" 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={formData.fullName}
                    onChange={handleChange}
                />

                <label htmlFor="email">What's your email?</label>
                <input 
                    className="inp"
                    id="email"
                    name="email" 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={formData.email}
                    onChange={handleChange}
                />

                <div className="btn-hidepass">
                    <label htmlFor="password">Create a password</label>
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
                <p className="hint-text">Use 8 or more characters with a mix of letter, numbers & symbols</p>
            
                <div className="btn-create">
                    <p>By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
                    <button type="submit">Create An Account</button>
                </div>
            </form>

            <div className="signup-byanother">
                <p>OR Continue with</p>
                <div className="another-btn">
                    {/* Nút Google */}
                    <button type="button" className="social-btn">
                        <div className="icon-wrapper">
                            <FcGoogle size={22} />
                        </div>
                        <span>Google</span>
                    </button>

                    {/* Nút Facebook */}
                    <button type="button" className="social-btn">
                        <div className="icon-wrapper">
                             {/* Facebook icon gốc màu đen, t chỉnh màu xanh cho giống thật */}
                            <FaFacebookF size={20} color="#1877F2" />
                        </div>
                        <span>Facebook</span>
                    </button>
                </div>
            </div>
        </div>
    );
}