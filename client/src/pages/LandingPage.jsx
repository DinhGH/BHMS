import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function Navbar() {
    const navLinks = [
      { name: "Home", href: "#home" },
      { name: "Our Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "About Us", href: "#about" },
    ];

    const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
      <>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-linear-to-r from-white via-slate-50 to-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50">
          <div className="w-full flex items-center justify-between py-3 px-4 sm:px-6 lg:px-10">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <img
                src="/images/icon.png"
                alt="Logo"
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
              <div className="flex flex-col leading-tight">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-blue-600">
                  BHMS
                </h1>
                <p className="text-xs text-slate-600 hidden sm:block">
                  Boarding House Management
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-3 xl:px-4 py-2 text-slate-700 font-medium text-sm xl:text-base transition-all duration-300 relative group hover:text-blue-600"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-blue-600 to-blue-400 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-slate-700 font-semibold text-sm xl:text-base border-2 border-slate-300 rounded-lg transition-all duration-300 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm xl:text-base rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-600 hover:-translate-y-0.5"
              >
                Register
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <span
                className={`w-6 h-0.5 bg-slate-700 transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`w-6 h-0.5 bg-slate-700 transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`w-6 h-0.5 bg-slate-700 transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col py-3 px-4 gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-slate-700 font-medium rounded-lg transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
                  >
                    {link.name}
                  </a>
                ))}
                <div className="flex gap-2 pt-2 border-t border-slate-200 mt-2">
                  <button
                    onClick={() => {
                      navigate("/login");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-2 text-slate-700 font-semibold border-2 border-slate-300 rounded-lg transition-all duration-300 hover:border-blue-600 hover:text-blue-600"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate("/signup");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-600"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </>
    );
  }

  function Hero() {
    return (
      <header className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-16 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 md:px-10 bg-linear-to-br from-blue-50 via-indigo-50 to-white min-h-screen mt-16 sm:mt-20">
        <div className="flex-1 pr-0 lg:pr-8 mb-8 lg:mb-0 text-center lg:text-left w-full">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-3 sm:mb-4 text-slate-900 font-bold">
            Smart & Efficient
          </h1>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-6 sm:mb-8 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
            Boarding House Management
          </h1>
          <p className="text-sm xs:text-base sm:text-lg text-slate-600 mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Streamline your operations with our all-in-one solution. Digitalize
            contracts, automate utility billing with AI, and connect landlords
            with tenants seamlessly.
          </p>
          <div className="flex justify-center lg:justify-start gap-3 sm:gap-4 flex-wrap">
            <button
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-linear-to-r from-blue-600 to-blue-500 text-white border-none rounded-lg text-sm sm:text-base font-bold cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:from-blue-700 hover:to-blue-600 hover:-translate-y-1 active:translate-y-0"
              onClick={() => navigate("/register")}
            >
              Get Started Now!
            </button>
            <button className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-sm sm:text-base font-bold cursor-pointer transition-all duration-300 shadow-md hover:bg-blue-50 hover:shadow-lg hover:-translate-y-1">
              Try Demo
            </button>
          </div>
        </div>
        <div className="flex-1 flex justify-center w-full px-0">
          <img
            src="/images/hr-bnr.webp"
            alt="Dashboard Preview"
            className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xl rounded-2xl shadow-2xl border border-slate-200/50 hover:shadow-3xl transition-shadow duration-300"
          />
        </div>
      </header>
    );
  }

  function Features() {
    const features = [
      {
        title: "Admin Features",
        desc: "Centralized dashboard to oversee the entire system, manage users, and view comprehensive statistics.",
        img: "/images/admin.webp",
        icon: "📊",
      },
      {
        title: "Owner Features",
        desc: "Manage properties efficiently with AI OCR for meter readings, automated billing, and online contracts.",
        img: "/images/boarding-house.jpg",
        icon: "🏠",
      },
      {
        title: "Tenant Features",
        desc: "Convenient portal to view rooms, pay bills online, chat directly with landlords, and report issues.",
        img: "/images/tenant.webp",
        icon: "👥",
      },
    ];

    return (
      <section
        className="py-16 sm:py-20 lg:py-24 text-center min-h-auto bg-linear-to-b from-white to-slate-50 px-4 sm:px-6 md:px-10"
        id="features"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-2 sm:mb-4 font-bold">
            OUR FEATURES
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 mb-12 sm:mb-16 lg:mb-20">
            Discover the powerful features like AI OCR and Online Contracts that
            make our system the perfect choice.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <div
                className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl border-2 border-slate-200 transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl hover:border-blue-400 group"
                key={index}
              >
                <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
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
          "Standard dashboard",
        ],
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
          "Tenant portal access",
        ],
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
          "On-premise deployment options",
        ],
      },
    ];

    return (
      <section
        className="py-16 sm:py-20 lg:py-24 text-center text-slate-900 bg-linear-to-b from-slate-50 to-white px-4 sm:px-6 md:px-10"
        id="pricing"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-4 font-bold">
            PRICING PLANS
          </h2>
          <p className="text-slate-600 mb-12 sm:mb-16 lg:mb-20">
            Choose a pricing plan that fits your needs and budget.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {pricingPlans.map((plan, index) => (
              <div
                className={`bg-white rounded-2xl p-6 sm:p-8 text-left relative border-2 transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl ${
                  plan.buttonStyle === "primary"
                    ? "border-blue-600 shadow-lg lg:scale-105 lg:z-10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                key={index}
              >
                {plan.badge && (
                  <span className="absolute top-4 sm:top-5 right-4 sm:right-5 bg-linear-to-r from-blue-600 to-blue-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs font-bold">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-2xl sm:text-3xl mb-4 font-bold">
                  {plan.name}
                </h3>
                <div className="mb-5">
                  <span className="text-4xl sm:text-5xl font-bold block">
                    ₫{plan.price}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {plan.currency}
                  </span>
                </div>
                <p className="mb-6 text-slate-600 text-sm sm:text-base">
                  {plan.description}
                </p>
                <button
                  className={`w-full py-3 sm:py-4 px-4 rounded-lg text-sm sm:text-base font-bold cursor-pointer mb-6 transition-all duration-300 ${
                    plan.buttonStyle === "primary"
                      ? "bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-600"
                      : "bg-slate-50 text-slate-900 border-2 border-slate-300 hover:bg-slate-100 hover:border-blue-600 hover:text-blue-600"
                  }`}
                >
                  {plan.buttonText}
                </button>
                <ul className="list-none p-0 m-0">
                  {plan.features.map((feature, idx) => (
                    <li
                      className="py-2 sm:py-3 border-b border-slate-200 flex items-start gap-2 sm:gap-2.5 last:border-b-0 text-slate-700 text-xs sm:text-sm"
                      key={idx}
                    >
                      <span className="text-blue-600 font-bold shrink-0 text-lg sm:text-xl">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function About() {
    return (
      <section
        className="py-16 sm:py-20 lg:py-24 text-center min-h-auto bg-linear-to-b from-white to-blue-50 px-4 sm:px-6 md:px-10"
        id="about"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-2 sm:mb-4 font-bold">
            WHY CHOOSE US?
          </h2>
          <p className="text-slate-600 mb-12 sm:mb-16">
            We are dedicated to simplifying the rental experience. Our platform
            offers a seamless, secure, and transparent way to manage properties.
          </p>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-12 lg:gap-16 mt-12 sm:mt-16">
            <img
              src="/images/team.avif"
              alt="Company Images"
              className="w-full max-w-xs sm:max-w-sm md:max-w-md rounded-2xl shadow-2xl border border-slate-200/50 hover:shadow-3xl transition-shadow duration-300"
            />
            <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 w-full">
              <div className="flex gap-4 sm:gap-6 text-left bg-white p-4 sm:p-6 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all duration-300">
                <div className="text-3xl sm:text-4xl shrink-0">🤖</div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">
                    Automated Management
                  </h4>
                  <p className="text-slate-600 text-sm sm:text-base">
                    Auto-generate monthly invoices and send automated email
                    notifications to tenants with payment links.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 sm:gap-6 text-left bg-white p-4 sm:p-6 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all duration-300">
                <div className="text-3xl sm:text-4xl shrink-0">💳</div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">
                    Easy Online Payment
                  </h4>
                  <p className="text-slate-600 text-sm sm:text-base">
                    Tenants pay directly via email links without login required.
                    Instant payment confirmation and invoice tracking.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 sm:gap-6 text-left bg-white p-4 sm:p-6 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all duration-300">
                <div className="text-3xl sm:text-4xl shrink-0">🏢</div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">
                    Centralized Control
                  </h4>
                  <p className="text-slate-600 text-sm sm:text-base">
                    Manage multiple boarding houses, rooms, tenants, and
                    invoices from one unified dashboard.
                  </p>
                </div>
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
        comment:
          "This system has revolutionized the way I manage my boarding house. The AI OCR feature saves me so much time!",
      },
      {
        id: 2,
        img: "/images/avatardh.jpg",
        name: "Tran Dieu Huyen",
        location: "Bo Trach, Quang Binh",
        rating: "4.7/5",
        comment:
          "As a tenant, I love the convenience of signing contracts online and paying bills via the app.",
      },
      {
        id: 3,
        img: "/images/avatartd.jpg",
        name: "Huynh Tan Dinh",
        location: "Thang Binh, Quang Nam",
        rating: "4.6/5",
        comment:
          "The support team is fantastic! The chat feature makes communication with the landlord very smooth.",
      },
      {
        id: 4,
        img: "/images/avatarht.jpg",
        name: "Nguyen Duy Quy",
        location: "Thanh Khe, Da Nang",
        rating: "4.8/5",
        comment:
          "Finding a room has never been easier. The search filters are super accurate and saved me hours of time.",
      },
      {
        id: 5,
        img: "/images/avatardh.jpg",
        name: "Tran Cong Danh",
        location: "Thanh Khe, Da Nang",
        rating: "4.7/5",
        comment:
          "The online payment feature is a lifesaver! Paying rent and utilities is now secure and takes just a few clicks",
      },
      {
        id: 6,
        img: "/images/avatarht.jpg",
        name: "Le Minh Tuan",
        location: "Hai Chau, Da Nang",
        rating: "4.9/5",
        comment:
          "I highly recommend this system to all boarding house owners. The automation features have significantly reduced my workload.",
      },
      {
        id: 7,
        img: "/images/avatardh.jpg",
        name: "Ly Quoc Phong",
        location: "Ninh Kieu, Can Tho",
        rating: "4.8/5",
        comment:
          "The user interface is intuitive and easy to navigate. Both landlords and tenants will find it user-friendly.",
      },
      {
        id: 8,
        img: "/images/avatarht.jpg",
        name: "Tran Minh Hieu",
        location: "Dong Da, Ha Noi",
        rating: "4.7/5",
        comment:
          "The AI-powered utility reading is a game-changer. It eliminates errors and ensures accurate billing every month.",
      },
      {
        id: 9,
        img: "/images/avatartd.jpg",
        name: "Nguyen Luong Tinh",
        location: "Quan 1, Ho Chi Minh",
        rating: "4.9/5",
        comment:
          "I appreciate the transparency this system provides. I can easily track all my transactions and communications in one place.",
      },
    ];

    const [startIndex, setStartIndex] = useState(0);
    const itemsToShow =
      window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;

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
      <section
        className="py-16 sm:py-20 lg:py-24 text-center min-h-auto bg-linear-to-b from-blue-50 to-white px-4 sm:px-6 md:px-10"
        id="reviews"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-2 sm:mb-4 font-bold">
            TRUSTED AND USED BY THOUSANDS CUSTOMERS
          </h2>
          <p className="text-slate-600 mb-12 sm:mb-16 lg:mb-20">
            Join satisfied users who have transformed their management
            experience.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-8 sm:mb-10">
            {currentReviews.map((review) => (
              <div
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/50 hover:shadow-2xl hover:border-blue-300 transition-all duration-300"
                key={review.id}
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-6">
                  <img
                    src={review.img}
                    alt="Avatar User"
                    className="w-12 sm:w-16 h-12 sm:h-16 rounded-full object-cover border-2 border-blue-200"
                  />
                  <div className="text-left">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900">
                      {review.name}
                    </h4>
                    <h5 className="text-xs sm:text-sm text-gray-600">
                      {review.location}
                    </h5>
                    <p className="text-xs sm:text-sm text-yellow-500 font-bold">
                      ⭐ {review.rating}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 italic text-sm sm:text-base leading-relaxed">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-3 sm:gap-4">
            <button
              type="button"
              className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white border-2 border-slate-300 text-slate-700 flex items-center justify-center cursor-pointer shadow-md transition-all duration-300 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600 hover:-translate-y-1 hover:shadow-lg"
              aria-label="Previous slide"
              onClick={handlePrev}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white border-2 border-slate-300 text-slate-700 flex items-center justify-center cursor-pointer shadow-md transition-all duration-300 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600 hover:-translate-y-1 hover:shadow-lg"
              aria-label="Next slide"
              onClick={handleNext}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    );
  }

  function Footer() {
    return (
      <footer className="bg-linear-to-br from-slate-900 to-slate-800 text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 md:px-10 border-t border-slate-700">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 sm:gap-12 mb-8 sm:mb-12">
            {/* Left Section: Logo & Social */}
            <div className="flex flex-col items-start gap-4 sm:gap-6 w-full md:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <img
                  src="/images/icon.png"
                  alt="Logo"
                  className="h-12 sm:h-14 w-12 sm:w-14"
                />
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    Boarding House
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Management System
                  </p>
                </div>
              </div>
              <div className="flex gap-4 sm:gap-6">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="text-gray-400 transition-all duration-300 hover:text-blue-400 hover:scale-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="text-gray-400 transition-all duration-300 hover:text-pink-400 hover:scale-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>

                {/* Gmail */}
                <a
                  href="mailto:contact@example.com"
                  aria-label="Gmail"
                  className="text-gray-400 transition-all duration-300 hover:text-white hover:scale-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Section: Links Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 w-full md:w-auto">
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-sm sm:text-base">About Us</h4>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  Our Story
                </a>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  Careers
                </a>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  Contact Us
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-sm sm:text-base">
                  Community
                </h4>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  Blog
                </a>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  Forums
                </a>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  Affiliates
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-sm sm:text-base">Help</h4>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  Help Center
                </a>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  FAQs
                </a>
                <a
                  href="#"
                  className="text-gray-400 text-xs sm:text-sm hover:text-white transition-colors duration-300"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-slate-700 pt-8 sm:pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm text-gray-400">
              &copy; 2026, Boarding House Management System. All rights
              reserved.
            </p>
            <div className="flex gap-6 sm:gap-8 text-xs sm:text-sm text-gray-400">
              <a
                href="#"
                className="hover:text-white transition-colors duration-300"
              >
                Privacy & Policy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-300"
              >
                Terms & Condition
              </a>
            </div>
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
