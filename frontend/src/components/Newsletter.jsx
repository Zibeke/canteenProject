import { useState } from "react";
import { toast } from "react-toastify";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    toast.success("Thanks for subscribing!");
    setEmail("");
  };

  return (
    <section className="newsletter">
      <h2>Subscribe now & get 10% off</h2>
      <p>Be the first to hear about Canteen specials, new meals, and service updates.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email address"
          required
        />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  );
};

export default Newsletter;
