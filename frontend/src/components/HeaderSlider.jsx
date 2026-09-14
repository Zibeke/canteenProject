import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const carouselSlides = [
  {
    offer: "Fresh from the kitchen",
    title: "Good food, ready when you are.",
    description: "Order your favourite canteen meals before they sell out.",
    image: "/carousel1.png",
    action: "Order now",
  },
  {
    offer: "Daily specials",
    title: "A better lunch starts here.",
    description: "Discover today's hot meals, snacks and refreshing drinks.",
    image: "/carousel2.png",
    action: "View specials",
  },
  {
    offer: "Quick and convenient",
    title: "Skip the queue. Enjoy your break.",
    description: "Place your order online and collect it at the canteen counter.",
    image: "/carousel3.png",
    action: "Browse menu",
  },
];

const HeaderSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % carouselSlides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-slider" aria-label="Canteen promotions">
      <div
        className="hero-track"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {carouselSlides.map((slide) => (
          <article className="hero-slide" key={slide.title}>
            <div className="hero-copy">
              <p className="hero-offer">{slide.offer}</p>
              <h1>{slide.title}</h1>
              <p className="hero-description">{slide.description}</p>
              <Link to="/cart" className="hero-primary-action">
                {slide.action}
              </Link>
              <Link to="/" className="hero-secondary-action">
                Explore menu <span>→</span>
              </Link>
            </div>
            <div className="hero-image-wrap">
              <img src={slide.image} alt="" />
            </div>
          </article>
        ))}
      </div>
      <div className="hero-dots">
        {carouselSlides.map((slide, index) => (
          <button
            type="button"
            key={slide.title}
            aria-label={`Show slide ${index + 1}`}
            className={index === currentSlide ? "active" : ""}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default HeaderSlider;
