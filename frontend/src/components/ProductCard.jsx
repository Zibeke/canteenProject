import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { addToCart } from "../slices/cartSlice";
import { url } from "../slices/api";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  if (!product) {
    return null;
  }

  const image = product.images?.[0];
  const price = product.isSpecial && product.specialPrice
    ? product.specialPrice
    : product.price;
  const imageUrl = image?.startsWith("http")
    ? image
    : `${url.replace("/api", "")}/${String(image || "").replace(/^\/+/, "")}`;

  return (
    <article className="modern-product-card">
      <Link to={`/product/${product.slug}`} className="product-card-link">
        <div className="product-image-wrap">
          {image ? (
            <img src={imageUrl} alt={product.name} />
          ) : (
            <span className="product-image-placeholder">Fresh today</span>
          )}
        </div>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
      </Link>
      <div className="product-card-footer">
        <strong>
          R{Number(price).toFixed(2)}
          {product.isSpecial && product.specialPrice && (
            <del>R{Number(product.price).toFixed(2)}</del>
          )}
        </strong>
        <button
          type="button"
          disabled={product.stock === 0 || product.isAvailableToday === false}
          onClick={() => dispatch(addToCart(product))}
        >
          Add to cart
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
