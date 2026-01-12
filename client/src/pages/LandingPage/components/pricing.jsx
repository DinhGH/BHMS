import { useState } from 'react';
const pricingPlans = [
    { 
        name: "Basic", 
        price: "59.99",
        currency: "USD / month (excluding VAT)",
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
        currency: "USD / month (excluding VAT)",
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
        currency: "USD / month (excluding VAT)",
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


export default function Pricing() {
    return (
        <section className="pricing" id="pricing">
            <h2>PRICING PLANS</h2>
            <p>Choose a pricing plan that fits your needs and budget.</p>
            <div className="pricing-grid">
                {pricingPlans.map((plan, index) => (
                    <div className={`pricing-card ${plan.buttonStyle === 'primary' ? 'featured' : ''}`} key={index}>
                        {plan.badge && (
                            <span className="pricing-badge">{plan.badge}</span>
                        )}
                        <h3>{plan.name}</h3>
                        <div className="pricing-price">
                            <span className="price-amount">₫{plan.price}</span>
                            <span className="price-currency">{plan.currency}</span>
                        </div>
                        <p className="pricing-description">{plan.description}</p>
                        <button className={`pricing-button ${plan.buttonStyle}`}>
                            {plan.buttonText}
                        </button>
                        <ul className="pricing-features">
                            {plan.features.map((feature, idx) => (
                                <li key={idx}>
                                    <span className="feature-icon">✓</span>
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