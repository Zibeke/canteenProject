import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AdminHeaders, PrimaryButton } from "./CommonStyled";
import { url } from "../../slices/api";
import { useDispatch } from "react-redux";
import { productsFetch } from "../../slices/productsSlice";

const Products = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: products } = useSelector((state) => state.products);

  useEffect(() => {
    if (products.length === 0) {
      dispatch(productsFetch());
    }
  }, [dispatch, products.length]);

  return (
    <>
      <AdminHeaders>
        <h2>Products</h2>
        <PrimaryButton
          onClick={() => navigate("/admin/products/create-product")}
        >
          Create
        </PrimaryButton>
      </AdminHeaders>
      <div className="admin-product-list">
        {products.length === 0 ? (
          <p>No products have been created yet.</p>
        ) : (
          products.map((product) => (
            <Link
              className="admin-product-row"
              key={product._id}
              to={`/product/${product.slug}`}
            >
              {product.images?.[0] ? (
                <img
                  src={product.images[0].startsWith("http")
                    ? product.images[0]
                    : `${url.replace("/api", "")}${product.images[0]}`}
                  alt=""
                />
              ) : (
                <div className="admin-product-placeholder" />
              )}
              <div>
                <strong>{product.name}</strong>
                <span>{product.category}</span>
              </div>
              <strong>R{Number(product.price).toFixed(2)}</strong>
            </Link>
          ))
        )}
      </div>
      <Outlet />
    </>
  );
};

export default Products;
