import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import HeaderSlider from "./HeaderSlider";
import ProductCard from "./ProductCard";
import FeaturedProducts from "./FeaturedProducts";
import HomeBanner from "./HomeBanner";
import Newsletter from "./Newsletter";
import Footer from "./Footer";

const Home = () => {
  const { items: products, status } = useSelector((state) => state.products);

  return (
    <main className="modern-home">
      <div className="home-content">
        <HeaderSlider />
        <section className="home-products-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">From our kitchen</p>
              <h2>Popular products</h2>
            </div>
            <Link to="/shop" className="see-all-link">
              See all <span>→</span>
            </Link>
          </div>
          {status === "pending" && <p className="home-status">Loading today's menu...</p>}
          {status === "rejected" && <p className="home-status">Unable to load today's menu.</p>}
          {status === "success" && (
            <div className="modern-products-grid">
              {products.filter((product) => product && product._id).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
        <FeaturedProducts />
        <HomeBanner />
        <Newsletter />
      </div>
      <Footer />
    </main>
  );
};

export default Home;
