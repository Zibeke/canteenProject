import { Link } from "react-router-dom";

const HomeBanner = () => (
  <section className="home-banner">
    <div className="banner-illustration banner-plate" aria-hidden="true">🍽️</div>
    <div className="banner-copy">
      <h2>Make your lunch break count</h2>
      <p>Order your Canteen favourites ahead of time and spend less time waiting.</p>
      <Link to="/cart">Order now <span>→</span></Link>
    </div>
    <div className="banner-illustration banner-drink" aria-hidden="true">🥤</div>
  </section>
);

export default HomeBanner;
