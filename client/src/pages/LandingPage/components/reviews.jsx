import { useState } from 'react';

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
      id:2,
      img: "/images/avatardh.jpg",
      name: "Tran Dieu Huyen",
      location: "Bo Trach, Quang Binh",
      rating: "4.7/5",
      comment: "As a tenant, I love the convenience of signing contracts online and paying bills via the app."
    },
    {
      id:3,
      img: "/images/avatartd.jpg",
      name: "Huynh Tan Dinh",
      location: "Thang Binh, Quang Nam",
      rating: "4.6/5",
      comment: "The support team is fantastic! The chat feature makes communication with the landlord very smooth."
    },
    {
      id:4,
      img: "/images/avatartd.jpg",
      name: "Nguyen Duy Quy",
      location: "Thanh Khe, Da Nang",
      rating: "4.8/5",
      comment: "Finding a room has never been easier. The search filters are super accurate and saved me hours of time."
    },
    {
      id:5,
      img: "/images/avatartd.jpg",
      name: "Tran Cong Danh",
      location: "Thanh Khe, Da Nang",
      rating: "4.7/5",
      comment: "The online payment feature is a lifesaver! Paying rent and utilities is now secure and takes just a few clicks"
    },
    {
      id:6,
      img: "/images/avatartd.jpg",
      name: "Le Minh Tuan",
      location: "Hai Chau, Da Nang",
      rating: "4.9/5",
      comment: "I highly recommend this system to all boarding house owners. The automation features have significantly reduced my workload."
    },{
      id:7,
      img: "/images/avatartd.jpg",
      name: "Ly Quoc Phong",
      location: "Ninh Kieu, Can Tho",
      rating: "4.8/5",
      comment: "The user interface is intuitive and easy to navigate. Both landlords and tenants will find it user-friendly."
    },
    {
      id:8,
      img: "/images/avatartd.jpg",
      name: "Tran Minh Hieu",
      location: "Dong Da, Ha Noi",
      rating: "4.7/5",
      comment: "The AI-powered utility reading is a game-changer. It eliminates errors and ensures accurate billing every month."
    },
    {
      id:9,
      img: "/images/avatartd.jpg",
      name: "Nguyen Luong Tinh",
      location: "Quan 1, Ho Chi Minh",
      rating: "4.9/5",
      comment: "I appreciate the transparency this system provides. I can easily track all my transactions and communications in one place."
    }
  ];

  export default function Reviews(){
    const [startIndex, setStartIndex] = useState(0)
  const itemsToShow = 3;
  const handleNext = () => {
    setStartIndex((prevIndex) => {
      if(prevIndex + itemsToShow < reviews.length) {
        return prevIndex + itemsToShow;
      }
      else return 0;
    });
  };
  const handlePrev = () => {
    setStartIndex((prevIndex) => {
      if(prevIndex - itemsToShow >= 0) {
        return prevIndex - itemsToShow;
      }
      else return reviews.length - itemsToShow;
    });
  };

  const currentReviews = reviews.slice(startIndex, startIndex + itemsToShow);
    return(
      <section className="reviews">
        <h2>TRUSTED AND USED BY THOUSANDS CUSTOMERS</h2>
        <p>Join satisfied users who have transformed their management experience.</p>
        <div className="review-grid">
          {currentReviews.map((reviews) => (
            <div className="review-card fade-in" key={reviews.id}>
              <div className="review-info">
              <img src={reviews.img} alt="Avatar User"/>
              <div className="review-profile">
              <h4>{reviews.name}</h4>
              <h5>{reviews.location}</h5>
              <p>{reviews.rating}</p>
              </div>
              </div>
              <p>"{reviews.comment}"</p>
            </div>
          ))}
          <div className="carousel-navigation">
            <button type="button" className="nav-btn prev-slide" aria-label="Previous slide" onClick={handlePrev}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <button type="button" className="nav-btn next-slide" aria-label="Next slide" onClick={handleNext}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>)
  }