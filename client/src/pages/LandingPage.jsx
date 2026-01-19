import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
    const navigate = useNavigate();


    function Navbar() {
        return (
        <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/95 shadow-lg">
            <div className="w-full flex items-center justify-between py-4 px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3 text-blue-600">
                <img src="/images/icon.png" alt="Logo" className="h-[50px] sm:h-[60px]"/>
                <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight">Boarding House Management System</h1>
            </div>
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
                <a href="#home" className="no-underline text-slate-800 font-medium transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bottom-[-4px] after:left-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full hover:text-blue-600">Home</a>
                <a href="#features" className="no-underline text-slate-800 font-medium transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bottom-[-4px] after:left-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full hover:text-blue-600">Our Features</a>
                <a href="#pricing" className="no-underline text-slate-800 font-medium transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bottom-[-4px] after:left-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full hover:text-blue-600">Pricing</a>
                <a href="#about" className="no-underline text-slate-800 font-medium transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bottom-[-4px] after:left-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full hover:text-blue-600">About Us</a>
                <span className="hidden lg:block w-px h-8 bg-slate-300" />
                <button className="px-5 py-2 rounded-lg font-semibold cursor-pointer border-none transition-transform duration-200 bg-gray-300 text-slate-800 shadow-md hover:bg-gray-400 hover:-translate-y-0.5" onClick={() => navigate('/signup')}>Register</button>
                <button className="px-5 py-2 rounded-lg font-semibold cursor-pointer border-none transition-transform duration-200 bg-gray-300 text-slate-800 shadow-md hover:bg-gray-400 hover:-translate-y-0.5">Login</button>
            </div>
            </div>
        </nav>
        );
    }

    function Hero() {
        return (
        <header className="w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 py-24 sm:py-28 lg:py-32 px-6 md:px-10 bg-gradient-to-br from-blue-50 to-white min-h-screen mt-[105px]">
            <div className="flex-1 pr-0 lg:pr-12 mb-6 lg:mb-0 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4 text-slate-800">Smart & Efficient</h1>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6 text-slate-800">Boarding House Management System</h1>
            <p className="text-base sm:text-lg text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0">Streamline your operations with our all-in-one solution. Digitalize contracts, automate utility billing with AI, and connect landlords with tenants seamlessly.</p>
            <div className="flex justify-center lg:justify-start gap-3 sm:gap-4 flex-wrap">
                <button className="px-6 sm:px-8 py-3.5 bg-gray-300 text-slate-800 border-none rounded-lg text-base sm:text-lg font-bold cursor-pointer transition-all duration-300 hover:bg-gray-400 hover:-translate-y-2 hover:shadow-xl" onClick={() => navigate('/signup')}>Get Started Now!</button>
                <button className="px-6 sm:px-8 py-3.5 bg-white border-2 border-gray-300 text-slate-800 rounded-lg text-base sm:text-lg font-bold cursor-pointer transition-all duration-300 hover:bg-gray-300 hover:-translate-y-2 hover:shadow-xl">Try Demo</button>
            </div>
            </div>
            <div className="flex-1 flex justify-center">
            <img src="/images/hr-bnr.webp" alt="Dashboard Preview" className="w-full max-w-[720px] lg:max-w-[850px] rounded-xl shadow-2xl border border-black/5"/>
            </div>
        </header>
        );
    }

    function Features() {
        const features = [
        {
            title: "Admin Features",
            desc: "Centralized dashboard to oversee the entire system, manage users, and view comprehensive statistics.",
            img: "/images/admin.webp"
        },
        {
            title: "Owner Features",
            desc: "Manage properties efficiently with AI OCR for meter readings, automated billing, and online contracts.",
            img: "/images/boarding-house.jpg"
        },
        {
            title: "Tenant Features",
            desc: "Convenient portal to view rooms, pay bills online, chat directly with landlords, and report issues.",
            img: "/images/tenant.webp"
        }
        ];

        return (
        <section className="py-24 text-center min-h-screen bg-white px-6 md:px-10" id="features">
            <h2 className="text-4xl text-slate-800 mb-4">OUR FEATURES</h2>
            <p className="text-slate-500 mb-24">Discover the powerful features like AI OCR and Online Contracts that make our system the perfect choice.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {features.map((feature, index) => (
                <div className="bg-white p-10 rounded-xl border border-slate-200 transition-all duration-300 hover:-translate-y-2.5 hover:shadow-xl hover:border-blue-600" key={index}>
                <img src={feature.img} alt={feature.title} className="h-20 mb-6 mx-auto"/>
                <h3 className="mb-4 text-2xl">{feature.title}</h3>
                <p>{feature.desc}</p>
                </div>
            ))}
            </div>
        </section>
        );
    }

    function Pricing() {
        const pricingPlans = [
        {
            name: "Basic",
            price: "59.99",
            currency: "VND / month (excluding VAT)",
            badge: null,
            description: "Perfect for individuals getting started",
            buttonText: "Get Started",
            buttonStyle: "secondary",
            features: [
            "Up to 5 properties",
            "Basic customer support",
            "Monthly analytics reports",
            "Mobile app access",
            "Email notifications",
            "Standard dashboard"
            ]
        },
        {
            name: "Professional",
            price: "149.99",
            currency: "VND / month (excluding VAT)",
            badge: "MOST POPULAR",
            description: "Ideal for growing property management businesses",
            buttonText: "Upgrade to Professional",
            buttonStyle: "primary",
            features: [
            "Up to 25 properties",
            "Priority 24/7 support",
            "Advanced analytics and insights",
            "Mobile and desktop apps",
            "Automated payment reminders",
            "Custom branding options",
            "Maintenance request tracking",
            "Tenant portal access"
            ]
        },
        {
            name: "Enterprise",
            price: "299.99",
            currency: "VND / month (excluding VAT)",
            badge: null,
            description: "Complete solution for large-scale operations",
            buttonText: "Contact Sales",
            buttonStyle: "secondary",
            features: [
            "Unlimited properties",
            "Dedicated account manager",
            "Real-time data synchronization",
            "Full platform customization",
            "API access and integrations",
            "Advanced security features",
            "Multi-user team management",
            "Custom reporting and exports",
            "White-label solutions",
            "On-premise deployment options"
            ]
        }
        ];

        return (
        <section className="py-16 text-center text-slate-800 bg-slate-100 px-6 md:px-10" id="pricing">
            <h2 className="text-4xl mb-2.5">PRICING PLANS</h2>
            <p className="mb-10">Choose a pricing plan that fits your needs and budget.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-[30px] max-w-[1200px] mx-auto">
            {pricingPlans.map((plan, index) => (
                <div className={`bg-white rounded-xl p-[30px] text-left relative border border-slate-200 transition-transform duration-300 hover:-translate-y-5 hover:shadow-lg ${plan.buttonStyle === 'primary' ? 'border-2 border-blue-600 shadow-lg' : ''}`} key={index}>
                {plan.badge && (
                    <span className="absolute top-5 right-5 bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-xs font-bold">{plan.badge}</span>
                )}
                <h3 className="text-3xl mb-4">{plan.name}</h3>
                <div className="mb-5">
                    <span className="text-5xl font-bold block">₫{plan.price}</span>
                    <span className="text-sm text-gray-600">{plan.currency}</span>
                </div>
                <p className="mb-5 text-base">{plan.description}</p>
                <button className={`w-full py-4 px-4 rounded-lg text-base font-bold cursor-pointer mb-6 transition-all duration-300 ${plan.buttonStyle === 'primary' ? 'bg-gray-300 text-slate-800 hover:bg-gray-400' : 'bg-white text-slate-800 border-2 border-gray-300 hover:bg-gray-300'}`}>
                    {plan.buttonText}
                </button>
                <ul className="list-none p-0 m-0">
                    {plan.features.map((feature, idx) => (
                    <li className="py-3 border-b border-slate-200 flex items-start gap-2.5 last:border-b-0" key={idx}>
                        <span className="text-blue-600 font-bold flex-shrink-0">✓</span>
                        {feature}
                    </li>
                    ))}
                </ul>
                </div>
            ))}
            </div>
        </section>
        );
    }

    function About() {
        return (
        <section className="py-24 text-center min-h-screen bg-white px-6 md:px-10" id="about">
            <h2 className="text-4xl text-slate-800 mb-4">WHY CHOOSE US?</h2>
            <p className="text-slate-500 mb-16">We are dedicated to simplifying the rental experience. Our platform offers a seamless, secure, and transparent way to manage properties.</p>
            <div className="flex flex-col lg:flex-row items-center justify-around gap-12 lg:gap-16 mt-16">
            <img src="/images/team.avif" alt="Company Images" className="w-full max-w-[500px] rounded-xl shadow-2xl border border-black/5"/>
            <div className="flex flex-col gap-8 lg:gap-12">
                <div className="flex gap-6 text-left">
                <img src="/images/tick.jpg" alt="Icon" className="h-16 mb-4"/>
                <div>
                    <h4 className="text-xl mb-2">Verified Listings</h4>
                    <p>All listings are verified to ensure accuracy and trustworthiness.</p>
                </div>
                </div>
                <div className="flex gap-6 text-left">
                <img src="/images/ai.jpg" alt="Icon" className="h-16 mb-4"/>
                <div>
                    <h4 className="text-xl mb-2">Smart Management</h4>
                    <p>Intelligent tools to automate operations, including AI-powered utility reading.</p>
                </div>
                </div>
                <div className="flex gap-6 text-left">
                <img src="/images/247.jpg" alt="Icon" className="h-16 mb-4"/>
                <div>
                    <h4 className="text-xl mb-2">24/7 Support</h4>
                    <p>Our support team is available around the clock to assist you.</p>
                </div>
                </div>
            </div>
            </div>
        </section>
        );
    }

    function Reviews() {
        const reviews = [
        {
            id: 1,
            img: "/images/avatarht.jpg",
            name: "Ngo Huu Thuan",
            location: "Pleiku, Gia Lai",
            rating: "4.5/5",
            comment: "This system has revolutionized the way I manage my boarding house. The AI OCR feature saves me so much time!"
        },
        {
            id: 2,
            img: "/images/avatardh.jpg",
            name: "Tran Dieu Huyen",
            location: "Bo Trach, Quang Binh",
            rating: "4.7/5",
            comment: "As a tenant, I love the convenience of signing contracts online and paying bills via the app."
        },
        {
            id: 3,
            img: "/images/avatartd.jpg",
            name: "Huynh Tan Dinh",
            location: "Thang Binh, Quang Nam",
            rating: "4.6/5",
            comment: "The support team is fantastic! The chat feature makes communication with the landlord very smooth."
        },
        {
            id: 4,
            img: "/images/avatarht.jpg",
            name: "Nguyen Duy Quy",
            location: "Thanh Khe, Da Nang",
            rating: "4.8/5",
            comment: "Finding a room has never been easier. The search filters are super accurate and saved me hours of time."
        },
        {
            id: 5,
            img: "/images/avatardh.jpg",
            name: "Tran Cong Danh",
            location: "Thanh Khe, Da Nang",
            rating: "4.7/5",
            comment: "The online payment feature is a lifesaver! Paying rent and utilities is now secure and takes just a few clicks"
        },
        {
            id: 6,
            img: "/images/avatarht.jpg",
            name: "Le Minh Tuan",
            location: "Hai Chau, Da Nang",
            rating: "4.9/5",
            comment: "I highly recommend this system to all boarding house owners. The automation features have significantly reduced my workload."
        },
        {
            id: 7,
            img: "/images/avatardh.jpg",
            name: "Ly Quoc Phong",
            location: "Ninh Kieu, Can Tho",
            rating: "4.8/5",
            comment: "The user interface is intuitive and easy to navigate. Both landlords and tenants will find it user-friendly."
        },
        {
            id: 8,
            img: "/images/avatarht.jpg",
            name: "Tran Minh Hieu",
            location: "Dong Da, Ha Noi",
            rating: "4.7/5",
            comment: "The AI-powered utility reading is a game-changer. It eliminates errors and ensures accurate billing every month."
        },
        {
            id: 9,
            img: "/images/avatartd.jpg",
            name: "Nguyen Luong Tinh",
            location: "Quan 1, Ho Chi Minh",
            rating: "4.9/5",
            comment: "I appreciate the transparency this system provides. I can easily track all my transactions and communications in one place."
        }
        ];

        const [startIndex, setStartIndex] = useState(0);
        const itemsToShow = 3;

        const handleNext = () => {
        setStartIndex((prevIndex) => {
            if (prevIndex + itemsToShow < reviews.length) {
            return prevIndex + itemsToShow;
            } else return 0;
        });
        };

        const handlePrev = () => {
        setStartIndex((prevIndex) => {
            if (prevIndex - itemsToShow >= 0) {
            return prevIndex - itemsToShow;
            } else return reviews.length - itemsToShow;
        });
        };

        const currentReviews = reviews.slice(startIndex, startIndex + itemsToShow);

        return (
        <section className="py-24 text-center min-h-screen bg-slate-100 px-6 md:px-10" id="reviews">
            <h2 className="text-4xl text-slate-800 mb-4">TRUSTED AND USED BY THOUSANDS CUSTOMERS</h2>
            <p className="text-slate-500 mb-24">Join satisfied users who have transformed their management experience.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mb-8">
            {currentReviews.map((review) => (
                <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300" key={review.id}>
                <div className="flex items-center gap-4 mb-6">
                    <img src={review.img} alt="Avatar User" className="w-16 h-16 rounded-full object-cover"/>
                    <div className="text-left">
                    <h4 className="text-lg font-semibold">{review.name}</h4>
                    <h5 className="text-base text-gray-600">{review.location}</h5>
                    <p className="text-sm text-yellow-500 font-medium">{review.rating}</p>
                    </div>
                </div>
                <p className="text-gray-700 italic">"{review.comment}"</p>
                </div>
            ))}
            </div>
            <div className="flex justify-center gap-4">
                <button type="button" className="w-12 h-12 rounded-full bg-gray-300 border border-gray-300 text-slate-800 flex items-center justify-center cursor-pointer shadow-md transition-all duration-300 hover:bg-gray-400 hover:border-gray-400 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-sm" aria-label="Previous slide" onClick={handlePrev}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                </button>
                <button type="button" className="w-12 h-12 rounded-full bg-gray-300 border border-gray-300 text-slate-800 flex items-center justify-center cursor-pointer shadow-md transition-all duration-300 hover:bg-gray-400 hover:border-gray-400 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-sm" aria-label="Next slide" onClick={handleNext}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                </button>
            </div>
        </section>
        );
    }

    function Footer() {
        return (
        <footer className="bg-slate-600 text-white py-12 px-6 md:px-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-8">
            {/* Left Section: Logo & Social */}
            <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-3 mb-4">
                <img src="/images/icon.png" alt="Logo" className="h-[60px]"/>
                <div>
                    <h3 className="font-bold text-lg">Boarding House</h3>
                    <p className="text-sm text-gray-300">Management System</p>
                </div>
                </div>
                <div className="flex gap-6">
                {/* Facebook */}
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="text-gray-400 transition-all duration-300 hover:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                </a>

                {/* Instagram */}
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-gray-400 transition-all duration-300 hover:text-pink-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                </a>

                {/* Gmail */}
                <a href="mailto:contact@example.com" aria-label="Gmail" className="text-gray-400 transition-all duration-300 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </a>
                </div>
            </div>

            {/* Right Section: Links Grid */}
            <div className="grid grid-cols-3 gap-12">
                <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-base">About Us</h4>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">Our Story</a>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">Careers</a>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">Contact Us</a>
                </div>
                <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-base">Community</h4>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">Blog</a>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">Forums</a>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">Affiliates</a>
                </div>
                <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-base">Help</h4>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">Help Center</a>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">FAQs</a>
                <a href="#" className="text-gray-300 text-sm hover:text-white transition">Terms of Service</a>
                </div>
            </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-slate-500 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-300">&copy; 2026, Boarding House Management System</p>
            <div className="flex gap-8 text-sm text-gray-300">
                <a href="#" className="hover:text-white transition">Privacy & Policy</a>
                <a href="#" className="hover:text-white transition">Terms & Condition</a>
            </div>
            </div>
        </footer>
        );
    }

    return (
        <div className="w-full">
        <Navbar />
        <Hero />
        <Features />
        <Pricing />
        <About />
        <Reviews />
        <Footer />
        </div>
    );
}

    export default LandingPage;