"use client";

import React, { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = "http://localhost:5173/dashboard";
    }
  }, []);

  return (
    <main dangerouslySetInnerHTML={{ __html: `
<header class="site-header">
  <div class="container nav">
    <a href="/" class="brand">
      <img src="/assets/logo.svg" alt="" class="logo" />
      <span class="brand-name">Trade<span>X</span></span>
    </a>
    <ul class="nav-links">
      <li><a href="/">Home</a></li>
      <li><a href="/pages/about.html">About</a></li>
      <li><a href="/pages/products.html">Products</a></li>
      <li><a href="/pages/features.html">Features</a></li>
      <li><a href="/pages/contact.html">Contact</a></li>
    </ul>
    <div class="nav-cta">
      <a href="http://localhost:5173/login" class="btn btn-ghost">Login</a>
      <a href="/signup" class="btn btn-primary">Open Account</a>
      <button class="mobile-toggle" aria-label="Toggle menu"><span class="material-symbols-outlined">menu</span></button>
    </div>
  </div>
</header>

<section class="hero">
  <div class="container hero-grid">
    <div>
      <span class="pill">● Live markets • SEBI-registered partners</span>
      <h1>Trade global markets on a <span class="gradient">single smart platform</span></h1>
      <p class="lead">
        Stocks, commodities, indices and CFDs — analyse, execute and manage your portfolio with
        institutional-grade tools, transparent pricing and 24/7 customer support.
      </p>
      <div class="hero-cta">
        <a href="/signup" class="btn btn-primary btn-lg">Get Started Free</a>
        <a href="/pages/features.html" class="btn btn-ghost btn-lg">See Platform <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.25rem;">arrow_forward</span></a>
      </div>

      <div class="hero-stats">
        <div class="stat"><div class="num">₹2,400 Cr+</div><div class="label">Volume Traded</div></div>
        <div class="stat"><div class="num">180k+</div><div class="label">Active Traders</div></div>
        <div class="stat"><div class="num">99.98%</div><div class="label">Uptime</div></div>
      </div>
    </div>

    <div class="hero-visual">
      <div class="hv-head">
        <div class="ticker">
          <span class="dot"></span>
          <b>NIFTY 50</b>
          <span>· NSE</span>
        </div>
        <span class="change-up">+1.24%</span>
      </div>
      <div class="price-row">
        <div class="price">22,418.75</div>
        <div class="change-up"><span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1rem;">trending_up</span> 274.35</div>
      </div>
      <svg id="heroChart" class="chart" viewBox="0 0 520 180" preserveAspectRatio="none" role="img" aria-label="NIFTY 50 market trend chart"></svg>
      <div class="watchlist">
        <div class="wl-row"><b>RELIANCE</b><span>₹2,910.40</span><span class="change-up">+0.82%</span></div>
        <div class="wl-row"><b>TCS</b><span>₹4,076.10</span><span class="change-up">+1.15%</span></div>
        <div class="wl-row"><b>HDFCBANK</b><span>₹1,498.55</span><span class="change-down">-0.43%</span></div>
        <div class="wl-row"><b>GOLD (MCX)</b><span>₹71,320</span><span class="change-up">+0.31%</span></div>
      </div>
    </div>
  </div>
</section>

<div class="markets">
  <div class="ticker-track">
    <div class="ticker-item"><b>SENSEX</b> 73,892.31 <span class="up">+0.88%</span></div>
    <div class="ticker-item"><b>NIFTY</b> 22,418.75 <span class="up">+1.24%</span></div>
    <div class="ticker-item"><b>BANK NIFTY</b> 47,120.10 <span class="down">-0.32%</span></div>
    <div class="ticker-item"><b>USD/INR</b> 83.47 <span class="up">+0.04%</span></div>
    <div class="ticker-item"><b>BRENT</b> $87.42 <span class="down">-0.21%</span></div>
    <div class="ticker-item"><b>GOLD</b> ₹71,320 <span class="up">+0.31%</span></div>
    <div class="ticker-item"><b>BTC</b> $64,880 <span class="up">+2.01%</span></div>
    <div class="ticker-item"><b>S&amp;P 500</b> 5,204.10 <span class="up">+0.55%</span></div>
  </div>
</div>

<section id="features">
  <div class="container">
    <div class="section-head">
      <span class="pill">Why TradeX</span>
      <h2>Everything you need to trade — in one place</h2>
      <p>Powerful charts, transparent pricing, lightning execution, and human support when it matters.</p>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="icon">₹</div>
        <h3>Transparent Pricing</h3>
        <p>Flat, clearly disclosed brokerage. No hidden fees, no surprises on your contract note.</p>
      </div>
      <div class="card">
        <div class="icon"><span class="material-symbols-outlined">bolt</span></div>
        <h3>Lightning Execution</h3>
        <p>Direct market access with co-located order routing — orders filled in milliseconds.</p>
      </div>
      <div class="card">
        <div class="icon"><span class="material-symbols-outlined">bar_chart</span></div>
        <h3>Pro Charts</h3>
        <p>TradingView-powered charts with 100+ indicators, drawing tools and saved templates.</p>
      </div>
      <div class="card">
        <div class="icon"><span class="material-symbols-outlined">lock</span></div>
        <h3>Bank-grade Security</h3>
        <p>2-factor auth, encrypted sessions, and funds held in a SEBI-regulated clearing account.</p>
      </div>
      <div class="card">
        <div class="icon"><span class="material-symbols-outlined">schedule</span></div>
        <h3>24/7 Support</h3>
        <p>Get real humans on chat, email and phone — any time the markets — or your doubts — are open.</p>
      </div>
      <div class="card">
        <div class="icon"><span class="material-symbols-outlined">smartphone</span></div>
        <h3>Works Everywhere</h3>
        <p>Native iOS &amp; Android apps, a web trader, and a desktop terminal — all fully synced.</p>
      </div>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" class="brand">
          <img src="/assets/logo.svg" alt="" class="logo" />
          <span class="brand-name">Trade<span>X</span></span>
        </a>
        <p>India's modern trading platform for stocks, derivatives, commodities and global markets.</p>
      </div>
      <div class="footer-col">
        <h4>Products</h4>
        <ul>
          <li><a href="/pages/products.html">Stocks &amp; ETFs</a></li>
          <li><a href="/pages/products.html">Options &amp; Futures</a></li>
          <li><a href="/pages/products.html">Mutual Funds</a></li>
          <li><a href="/pages/products.html">Commodities</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Features</h4>
        <ul>
          <li><a href="/pages/features.html">Trading Terminal</a></li>
          <li><a href="/pages/features.html">Analytics Deck</a></li>
          <li><a href="/pages/features.html">Instant Payouts</a></li>
          <li><a href="/pages/features.html">APIs &amp; Webhooks</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="/pages/about.html">About TradeX</a></li>
          <li><a href="/pages/about.html">Press &amp; Media</a></li>
          <li><a href="/pages/about.html">Careers &amp; Hiring</a></li>
          <li><a href="/pages/about.html">Safety &amp; Security</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Support &amp; Legal</h4>
        <ul>
          <li><a href="/pages/contact.html">Contact Desk</a></li>
          <li><a href="/pages/contact.html">Help Portal</a></li>
          <li><a href="/pages/contact.html">Terms of Use</a></li>
          <li><a href="/pages/contact.html">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2026 TradeX. All rights reserved.</div>
    </div>
  </div>
</footer>
    ` }} />
  );
}
