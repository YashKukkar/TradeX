import { serverBranding as branding } from "./branding.server";

export default function Home() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `if (typeof window !== 'undefined' && localStorage.getItem('token')) { window.location.href = '${branding.urls.portalUrl}/dashboard'; }`,
        }}
      />
      <main suppressHydrationWarning dangerouslySetInnerHTML={{
      __html: `
<header class="site-header">
  <div class="container nav">
    <a href="/" class="brand">
      <img src="${branding.logoUrl}" alt="${branding.appName}" class="logo" />
      <span class="brand-name">${branding.brandPrefix}<span>${branding.accentText}</span></span>
    </a>
    <ul class="nav-links">
      <li><a href="/">Home</a></li>
      <li><a href="/pages/about.html">About</a></li>
      <li><a href="/pages/products.html">Products</a></li>
      <li><a href="/pages/features.html">Features</a></li>
      <li><a href="/pages/contact.html">Contact</a></li>
    </ul>
    <div class="nav-cta">
      <a href="${branding.urls.portalUrl}/login" class="btn btn-ghost">Log in</a>
      <a href="/signup" class="btn btn-primary">Open account</a>
      <button class="mobile-toggle" aria-label="Toggle menu"><span class="material-symbols-outlined">menu</span></button>
    </div>
  </div>
</header>

<div class="container">
  <section class="hero">
    <div class="eyebrow mono">NSE FUTURES · MCX · COMEX</div>
    <h1>Trade with clarity. <span>Move with confidence.</span></h1>
    <p class="lead">Purpose-built for NSE futures, MCX and COMEX commodities traders. Your wallet, bank accounts, referrals and rewards, managed from one secure account.</p>
    <div class="hero-cta">
      <a href="/signup" class="btn btn-primary btn-lg">Open account</a>
      <a href="${branding.urls.portalUrl}/login" class="btn btn-ghost btn-lg">Log in</a>
    </div>
    <p class="hint">Have a referral code? Add it during sign-up.</p>
  </section>

  <section class="hours">
    <div class="hhead"><b>Three markets, across the day</b><span>Exchange session hours · IST</span></div>
    <div class="hrow"><div class="lbl"><b>NSE</b><span class="mono">09:15–15:30</span></div>
      <div class="track"><div class="seg seg-nse mono" style="left:38.54%;width:26.04%">Futures</div></div></div>
    <div class="hrow"><div class="lbl"><b>MCX</b><span class="mono">09:00–23:30</span></div>
      <div class="track"><div class="seg seg-mcx mono" style="left:37.5%;width:60.42%">Commodities</div></div></div>
    <div class="hrow"><div class="lbl"><b>COMEX</b><span class="mono">23 hours</span></div>
      <div class="track"><div class="seg seg-comex mono" style="left:0;width:10.42%" title="Trades 00:00–02:30"></div><div class="seg seg-comex mono" style="left:14.58%;width:85.42%" title="Trades 03:30–24:00 (Break 02:30–03:30)">Commodities</div></div></div>
    <div class="axis mono"><span>00:00</span><span>03:00</span><span>06:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span><span>21:00</span><span>24:00</span></div>
    <p class="hfoot">All times IST. NSE and MCX trade Mon–Fri. COMEX trades nearly 24 hours Sun–Fri, pausing for a 1-hour daily maintenance break (02:30–03:30 IST) and closing for the weekend (Sat morning to Mon morning). Exact hours follow the exchanges.</p>
  </section>

  <section class="features">
    <div class="feat"><h4>Market focus</h4><p>Purpose-built for NSE futures, MCX and COMEX commodities traders.</p></div>
    <div class="feat"><h4>Transparent wallet</h4><p>Separate cash, bonus and reward balances, with full transaction history.</p></div>
    <div class="feat"><h4>Multi-account banking</h4><p>Link multiple bank accounts and choose your primary one.</p></div>
    <div class="feat"><h4>Referrals &amp; rewards</h4><p>Multi-tier referrals, bonus cash and reward points.</p></div>
    <div class="feat"><h4>Integrated support</h4><p>Raise in-app tickets, attach files and follow every reply.</p></div>
    <div class="feat"><h4>Account security</h4><p>Verified email onboarding with secure sessions.</p></div>
  </section>

  <section class="invite">
    <div>
      <h2>Invite friends.<br>Grow together.</h2>
      <p class="lead">Share your personal link. Referrals are tracked across multiple levels, and rewards arrive as bonus cash and reward points.</p>
      <div class="ol">
        <div><span class="n mono">01</span><span><b>Share your link</b> Find your personal invite link in your account.</span></div>
        <div><span class="n mono">02</span><span><b>Friends join</b> They sign up with your link or code.</span></div>
        <div><span class="n mono">03</span><span><b>Earn across tiers</b> Referrals are tracked beyond your direct invites.</span></div>
      </div>
    </div>
    <div class="linkcard">
      <div class="t mono">YOUR INVITE LINK</div>
      <div class="lbox"><code>…/signup?ref=YOURCODE</code></div>
      <div class="rw">
        <div class="t mono">REWARDS</div>
        <dl>
          <dt>Welcome points</dt><dd>Reward points when a new account is created.</dd>
          <dt>First-deposit reward</dt><dd>A cash reward on the first approved deposit.</dd>
          <dt>Points to bonus cash</dt><dd>Convert reward points into bonus cash at the current rate.</dd>
        </dl>
      </div>
    </div>
  </section>

  <section class="wallet">
    <div>
      <h2>One wallet,<br>three balances</h2>
      <p class="lead">Cash, bonus and reward points are kept separate, so you always know what is withdrawable and what is a reward.</p>
      <div class="list">
        <div><h5>Deposits</h5><p>Submit a request. Once approved, it is credited to your withdrawable balance.</p></div>
        <div><h5>Withdrawals</h5><p>The amount is held from your balance when you request it, paid out on approval, and returned if the request is declined.</p></div>
        <div><h5>Bank accounts</h5><p>Link several accounts and mark one as primary.</p></div>
      </div>
    </div>
    <div>
      <div class="win">
        <div class="bar"><i></i><i></i><i></i><span>Wallet</span></div>
        <div class="wbody">
          <div class="bals">
            <div class="bal hi"><small>Withdrawable balance</small><b>₹24,500.00</b><small>Approved deposits</small></div>
            <div class="bal"><small>Bonus balance</small><b>₹750.00</b><small>Rewards and conversions</small></div>
            <div class="bal"><small>Reward points</small><b>1,200 <em>pts</em></b><small>Convert to bonus cash</small></div>
          </div>
          <div class="act">
            <div>Recent activity</div>
            <div>Deposit request<span class="status">Approved</span></div>
            <div>Welcome points<span class="status">Credited</span></div>
            <div>Points converted to bonus cash<span class="status">Completed</span></div>
            <div>Withdrawal request<span class="status pending">Pending approval</span></div>
          </div>
        </div>
      </div>
      <p class="note">Illustration with example values.</p>
    </div>
  </section>

  <section class="cta">
    <div class="cta-top">
      <div><h2>Open your ${branding.appName} account</h2><p>Verify your email to get started.</p></div>
      <a href="/signup" class="btn btn-primary">Open account</a>
    </div>
    <div class="steps">
      <div><div class="n mono">01</div><h5>Sign up and verify</h5><p>Create your account and verify your email.</p></div>
      <div><div class="n mono">02</div><h5>Link your bank</h5><p>Add one or more bank accounts and set a primary.</p></div>
      <div><div class="n mono">03</div><h5>Add funds</h5><p>Submit a deposit request. Approved deposits land in your withdrawable balance.</p></div>
      <div><div class="n mono">04</div><h5>Invite and earn</h5><p>Share your link and collect rewards as your network grows.</p></div>
    </div>
  </section>
</div>

<footer class="site-footer">
  <div class="container">
    <p class="disclaimer">Trading in futures and commodity derivatives involves substantial risk and may not be suitable for every investor. Please read all related documents carefully before trading.</p>
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" class="brand">
          <img src="${branding.logoUrl}" alt="${branding.appName}" class="logo" />
          <span class="brand-name">${branding.brandPrefix}<span>${branding.accentText}</span></span>
        </a>
        <p>Trade with clarity. Move with confidence.</p>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <ul>
          <li><a href="/pages/products.html">Markets</a></li>
          <li><a href="/pages/features.html">Features</a></li>
          <li><a href="/pages/about.html">About</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Account</h4>
        <ul>
          <li><a href="/signup">Open account</a></li>
          <li><a href="${branding.urls.portalUrl}/login">Log in</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Help</h4>
        <ul>
          <li><a href="/pages/contact.html">Support</a></li>
          <li><a href="/pages/contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><a href="/pages/contact.html">Terms</a></li>
          <li><a href="/pages/contact.html">Privacy</a></li>
          <li><a href="/pages/contact.html">Disclosures</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© ${branding.year} ${branding.appName}. All rights reserved.</div>
    </div>
  </div>
</footer>
    ` }} />
    </>
  );
}
