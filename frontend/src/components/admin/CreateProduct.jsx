import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { PrimaryButton } from "./CommonStyled";
import { productsCreate } from "../../slices/productsSlice";

const categories = ["Hot Food", "Cold Drinks", "Snacks", "Breakfast"];

const CreateProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createStatus } = useSelector((state) => state.products);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    isSpecial: false,
    specialPrice: "",
    isAvailableToday: true,
  });

  useEffect(() => {
    if (submitted && createStatus === "success") {
      navigate("/admin/products");
    }
  }, [createStatus, navigate, submitted]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []).slice(0, 5);
    setFiles(selectedFiles);
    Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then(setPreviews);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (key !== "specialPrice" || value !== "") {
        data.append(key, value);
      }
    });
    files.forEach((file) => data.append("images", file));
    setSubmitted(true);
    dispatch(productsCreate(data));
  };

  return (
    <StyledCreateProduct>
      <StyledForm onSubmit={handleSubmit}>
        <h3>Create a Product</h3>
        <label htmlFor="product-images">Product images (up to 5)</label>
        <input
          id="product-images"
          name="images"
          accept="image/jpeg,image/png,image/webp"
          type="file"
          multiple
          onChange={handleFiles}
          required
        />
        <input
          name="name"
          type="text"
          placeholder="Product name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
          maxLength="2000"
        />
        <div className="form-row">
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            required
          />
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            required
          />
        </div>
        <select name="category" value={form.category} onChange={handleChange} required>
          <option value="">Select category</option>
          {categories.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </select>
        <label className="checkbox">
          <input
            name="isSpecial"
            type="checkbox"
            checked={form.isSpecial}
            onChange={handleChange}
          />
          Mark as a special
        </label>
        {form.isSpecial && (
          <input
            name="specialPrice"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Special price"
            value={form.specialPrice}
            onChange={handleChange}
          />
        )}
        <label className="checkbox">
          <input
            name="isAvailableToday"
            type="checkbox"
            checked={form.isAvailableToday}
            onChange={handleChange}
          />
          Available today
        </label>
        <PrimaryButton type="submit" disabled={createStatus === "pending"}>
          {createStatus === "pending" ? "Submitting..." : "Create product"}
        </PrimaryButton>
      </StyledForm>
      <ImagePreview>
        {files.length ? (
          <div className="preview-grid">
            {files.map((file, index) => (
              <img key={`${file.name}-${file.lastModified}`} src={previews[index]} alt={file.name} />
            ))}
          </div>
        ) : (
          <p>Product image previews will appear here.</p>
        )}
      </ImagePreview>
    </StyledCreateProduct>
  );
};

export default CreateProduct;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  width: min(100%, 460px);
  margin-top: 2rem;
  gap: 0.65rem;

  label {
    color: #6b7280;
    font-size: 0.85rem;
  }

  select,
  input,
  textarea {
    width: 100%;
    min-height: 38px;
    padding: 9px;
    border: 1px solid #d1d5db;
    border-radius: 5px;
    outline: none;
  }

  textarea {
    min-height: 92px;
    resize: vertical;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }

  .checkbox {
    display: flex;
    align-items: center;
    gap: 8px;

    input {
      width: auto;
      min-height: 0;
    }
  }
`;

const StyledCreateProduct = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 2rem;
`;

const ImagePreview = styled.div`
  width: min(100%, 390px);
  min-height: 220px;
  margin: 2rem 0;
  padding: 1rem;
  border: 1px dashed #d1d5db;
  color: #6b7280;

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 5px;
  }
`;
