import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProductCard from "./ProductCard";
import { productsFetch } from "../slices/productsSlice";

const categories = ["All", "Hot Food", "Cold Drinks", "Snacks", "Breakfast"];

const Shop = () => {
  const dispatch = useDispatch();
  const { items: products, status } = useSelector((state) => state.products);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    dispatch(productsFetch({ search: submittedSearch, category }));
  }, [dispatch, submittedSearch, category]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  };

  return (
    <main className="shop-page">
      <header className="shop-header">
        <div>
          <p className="eyebrow">Fresh from the canteen</p>
          <h1>Shop the menu</h1>
          <p>Find your next favourite meal, snack or drink.</p>
        </div>
        <form className="shop-search" onSubmit={handleSubmit}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
          />
          <button type="submit">Search</button>
        </form>
      </header>
      <div className="shop-filters" aria-label="Product categories">
        {categories.map((item) => (
          <button
            type="button"
            key={item}
            className={category === item ? "active" : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {status === "pending" && <p className="shop-status">Loading the menu...</p>}
      {status === "rejected" && (
        <p className="shop-status">We could not load the menu. Please try again.</p>
      )}
      {status === "success" && products.length === 0 && (
        <div className="shop-empty">
          <h2>No products found</h2>
          <p>Try another search or browse a different category.</p>
        </div>
      )}
      {status === "success" && products.length > 0 && (
        <div className="modern-products-grid shop-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Shop;
