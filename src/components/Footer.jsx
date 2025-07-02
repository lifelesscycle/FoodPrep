import React from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          
          <div className="footer-section">
            <h3 className="footer-logo">FoodPrep</h3>
            <p className="footer-description">
              Delicious food delivered fresh to your doorstep. Order from your favorite restaurants and enjoy quality meals at home.
            </p>
            <div className="social-icons">
              <Facebook className="social-icon" />
              <Instagram className="social-icon" />
              <Twitter className="social-icon" />
              <Youtube className="social-icon" />
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Menu</a></li>
              <li><a href="#" className="footer-link">Track Order</a></li>
              <li><a href="#" className="footer-link">Become a Partner</a></li>
              <li><a href="#" className="footer-link">Gift Cards</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Help Center</a></li>
              <li><a href="#" className="footer-link">Contact Us</a></li>
              <li><a href="#" className="footer-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-link">Terms of Service</a></li>
              <li><a href="#" className="footer-link">Refund Policy</a></li>
              <li><a href="#" className="footer-link">Food Safety</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Contact Info</h4>
            <div className="contact-info">
              <div className="contact-item">
                <Phone className="contact-icon" />
                <span className="contact-text">+91 99999-99999</span>
              </div>
              <div className="contact-item">
                <Mail className="contact-icon" />
                <span className="contact-text">support@foodprep.com</span>
              </div>
              <div className="contact-item">
                <MapPin className="contact-icon" />
                <span className="contact-text">
                  123 Food Street<br />
                  Bhopal
                </span>
              </div>
              <div className="contact-item">
                <Clock className="contact-icon" />
                <span className="contact-text">24/7 Delivery</span>
              </div>
            </div>
          </div>
        </div>

        <div className="app-section">
          <div className="app-content">
            <div className="app-text">
              <h4>Download Our App</h4>
              <p>Get exclusive deals and faster ordering</p>
            </div>
            <div className="app-buttons">
              <a href="#" className="app-button">
                <div className="app-icon">
                  📱
                </div>
                <div className="app-store-text">
                  <p className="app-store-small">Download on the</p>
                  <p className="app-store-large">App Store</p>
                </div>
              </a>
              <a href="#" className="app-button">
                <div className="app-icon">
                  ▶
                </div>
                <div className="app-store-text">
                  <p className="app-store-small">Get it on</p>
                  <p className="app-store-large">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="bottom-footer">
          <p className="copyright">
            © 2025 FoodieExpress. All rights reserved.
          </p>
          <div className="bottom-links">
            <a href="#" className="bottom-link">Privacy</a>
            <a href="#" className="bottom-link">Terms</a>
            <a href="#" className="bottom-link">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;