import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-about">
        <Link to="/" className="brand">CANTEEN<span>.</span></Link>
        <p>CCI Canteen is your daily hub for fresh meals, daily specials, and canteen updates. Browse today's menu, view meal updates with full screen images, and place your order in seconds - all designed for a fast, simple experience for CCI staff.</p> 
        <p>Enjoy a convenient way to order your favourite meals without the hassle. Check what's available, choose your meals, and place your order with ease. Stay updated with the latest canteen specials and enjoy a quicker, smoother experience every day.</p>
        </div>
      <div>
        <h3>Company</h3>
        <Link to="/">Home</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/">About us</Link>
        <Link to="/">Contact us</Link>
        <Link to="/">Privacy policy</Link>
      </div>
      <div>
        <h3>Get in touch</h3>
        <p>Zibeke Onwabe</p>
        <p>+27 784 300 901</p>
        <p>onwabe.zibeke@outlook.com</p>
        <p>Port St Johns, Eastern Cape Mthalala A/A</p>
      </div>
    </div>
  </footer>
);

export default Footer;
