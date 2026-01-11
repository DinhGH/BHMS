import { useState } from 'react';
const pricingPlans = [
    { 
        name: "Basic", 
        price: "$59.99/month",
        image: "/images/temp.jpg", // Ảnh cho popup
        description: "Perfect for individuals and small teams just getting started.",
        popupImageHeight: "388.5px",
        features: [
            "Up to 5 properties",
            "Basic support",
            "Monthly reports",
            "Mobile app access"
        ]
    },
    { 
        name: "Standard", 
        price: "$99.99/month",
        image: "/images/temp.jpg",
        popupImageHeight: "369.1px",
        description: "Ideal for growing businesses with advanced needs.",
        features: [
            "Up to 20 properties",
            "Priority support 24/7",
            "Weekly reports",
            "Mobile app access",
            "Advanced analytics"
        ]
    },
    { 
        name: "Premium", 
        price: "$149.99/month",
        image: "/images/temp.jpg",
        popupImageHeight: "324px",
        description: "Complete solution for large enterprises.",
        features: [
            "Unlimited properties",
            "Dedicated account manager",
            "Daily reports",
            "Mobile app access",
            "Advanced analytics",
            "Custom integrations"
        ]
    }
];


export default function Pricing(){
  const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const handleViewDetail = (plan) => {
        setSelectedPlan(plan);  // Lưu plan được chọn
        setIsPopupOpen(true);   // Mở popup
    };

    // Hàm đóng popup
    const handleClosePopup = () => {
        setIsPopupOpen(false);
        setSelectedPlan(null);
    };

    return(
      <>
        <section className="pricing" id="pricing">
            <h2>PRICING PLANS</h2>
            <p>Choose a pricing plan that fits your needs and budget.</p>
            <div className="pricing-grid">
              {pricingPlans.map((plan, index) => (
                <div className="pricing-card" key={index}>
                  <h3>{plan.name}</h3>
                  <img src="/images/temp.jpg" alt={`${plan.name} Plan`}  />
                  <p>{plan.price}</p>
                  <button onClick={() => handleViewDetail(plan)}>View Detail</button>
                </div>
              ))}
            </div>
        </section>
        {isPopupOpen && selectedPlan && (
    <div className="popup-overlay" onClick={handleClosePopup}>
        <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={handleClosePopup}>×</button>
            {/* Thêm inline style vào img */}
            <img 
                src={selectedPlan.image} 
                alt={selectedPlan.name}
                style={{ height: selectedPlan.popupImageHeight, objectFit: 'cover' }}
            />
            <h3>{selectedPlan.name} Plan</h3>
            <p className="popup-price">{selectedPlan.price}</p>
            <p className="popup-description">{selectedPlan.description}</p>
            <ul className="popup-features">
                {selectedPlan.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                ))}
            </ul>
        </div>
    </div>
)}
    </>
      
    )
}