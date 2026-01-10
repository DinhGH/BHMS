const pricingPlans = [
    { name: "Basic", price: "$59.99/month" },
    { name: "Standard", price: "$99.99/month" },
    { name: "Premium", price: "$149.99/month" }
];

export default function Pricing(){
    return(
        <section className="pricing" id="pricing">
        <h2>PRICING PLANS</h2>
        <p>Choose a pricing plan that fits your needs and budget.</p>
        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <div className="pricing-card" key={index}>
              <h3>{plan.name}</h3>
              <img src="/images/temp.jpg" alt={`${plan.name} Plan`} />
              <p>{plan.price}</p>
              <button>View Detail</button>
            </div>
          ))}
        </div>
      </section>
    )
}