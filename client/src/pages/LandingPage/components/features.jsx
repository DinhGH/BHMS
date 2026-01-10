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

export default function Features() {
    return (
        <section className="features" id="features">
        <h2>OUR FEATURES</h2>
        <p>Discover the powerful features like AI OCR and Online Contracts that make our system the perfect choice.</p>
        <div className="feature-grid">
        {features.map((features, index) => (
            <div className="feature-card" key={index}>
            <img src={features.img} alt={features.title} />
            <h3>{features.title}</h3>
            <p>{features.desc}</p>
            </div>
        ))}
        </div>
    </section>
    )
}