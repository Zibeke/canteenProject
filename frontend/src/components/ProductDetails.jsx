import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { addToCart } from "../slices/cartSlice";
import { url } from "../slices/api";
import NotFound from "./NotFound";

const imageUrl = (image) =>
  image?.startsWith("http")
    ? image
    : `${url.replace("/api", "")}/${String(image || "").replace(/^\/+/, "")}`;

const ProductDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    axios
      .get(`${url}/products/${slug}`)
      .then(({ data }) => {
        if (mounted) {
          setProduct(data);
          setSelectedImage(data.images?.[0] || "");
          setStatus("success");
        }
      })
      .catch((error) => {
        if (mounted) setStatus(error.response?.status === 404 ? "not-found" : "error");
      });
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (status === "loading") {
    return <p className="page-status">Loading product...</p>;
  }
  if (status === "not-found") {
    return <NotFound />;
  }
  if (status === "error") {
    return <p className="page-status">Unable to load this product.</p>;
  }

  const images = product.images?.length ? product.images : [""];
  const unavailable = product.stock === 0 || product.isAvailableToday === false;

  return (
    <main className="product-detail-page">
      <Link to="/shop" className="back-link">← Back to shop</Link>
      <div className="product-detail">
        <section className="product-gallery">
          <div className="product-detail-main-image">
            {selectedImage ? (
              <img src={imageUrl(selectedImage)} alt={product.name} />
            ) : (
              <span>Fresh today</span>
            )}
          </div>
          <div className="product-thumbnails">
            {images.map((image, index) => (
              <button
                type="button"
                className={selectedImage === image ? "selected" : ""}
                key={`${image}-${index}`}
                onClick={() => setSelectedImage(image)}
                aria-label={`View image ${index + 1}`}
              >
                {image ? <img src={imageUrl(image)} alt="" /> : <span>Menu</span>}
              </button>
            ))}
          </div>
        </section>
        <section className="product-detail-copy">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <div className="product-detail-price">
            {product.isSpecial && product.specialPrice ? (
              <>
                <strong>R{Number(product.specialPrice).toFixed(2)}</strong>
                <del>R{Number(product.price).toFixed(2)}</del>
              </>
            ) : (
              <strong>R{Number(product.price).toFixed(2)}</strong>
            )}
          </div>
          <p className="product-detail-description">{product.description}</p>
          <hr className="product-detail-divider" />
          <dl className="product-detail-specs">
            <div>
              <dt>Category</dt>
              <dd>{product.category}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>{unavailable ? "Currently unavailable" : "Available today"}</dd>
            </div>
          </dl>
          <p className="product-stock">
            {unavailable ? "Currently unavailable" : `${product.stock} available today`}
          </p>
          <div className="product-detail-actions">
            <button
              type="button"
              className="detail-add-button"
              disabled={unavailable}
              onClick={() => dispatch(addToCart(product))}
            >
              {unavailable ? "Unavailable" : "Add to cart"}
            </button>
            <button
              type="button"
              className="detail-buy-button"
              disabled={unavailable}
              onClick={() => {
                dispatch(addToCart(product));
                navigate("/cart");
              }}
            >
              {unavailable ? "Unavailable" : "Buy now"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProductDetails;
