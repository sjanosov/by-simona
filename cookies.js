const CONSENT_KEY = "bs-cookie-consent";
const GA_ID = "G-GLW8ZLDCSF";
const PRIVACY_URL = "/ochrana-osobnych-udajov.html";

const readConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
};
const writeConsent = (value) => {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
  }
};

const GA_OFF_FLAG = `ga-disable-${GA_ID}`;

let analyticsStarted = false;
const startAnalytics = () => {
  window[GA_OFF_FLAG] = false;
  if (analyticsStarted) return;
  analyticsStarted = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  gtag("js", new Date());
  gtag("config", GA_ID);
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(tag);
};

const stopAnalytics = () => {
  window[GA_OFF_FLAG] = true;
  const host = window.location.hostname;
  const scopes = ["", `; domain=${host}`, `; domain=.${host}`];
  document.cookie
    .split("; ")
    .map((entry) => entry.split("=")[0])
    .filter((name) => name.startsWith("_ga"))
    .forEach((name) =>
      scopes.forEach((scope) => {
        document.cookie = `${name}=; path=/; max-age=0${scope}`;
      }),
    );
};

let banner = null;
const hideBanner = () => {
  banner?.remove();
  banner = null;
};
const showBanner = () => {
  if (banner) return;
  const onPrivacyPage = window.location.pathname.endsWith(PRIVACY_URL);
  banner = document.createElement("div");
  banner.className = "cookie-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Súhlas s analytickými cookies");
  banner.innerHTML = `
    <p>
      Rada by som vedela, koľko ľudí sem chodí a odkiaľ prišli, preto by som
      použila analytické cookies od Google Analytics. Bez vášho súhlasu sa
      nespustia.${
        onPrivacyPage ? "" : ` <a href="${PRIVACY_URL}">Viac o cookies</a>.`
      }
    </p>
    <div class="cookie-banner-actions">
      <button
        class="cookie-banner-btn cookie-banner-btn-ghost"
        data-cookie="denied"
        type="button"
      >
        Odmietnuť
      </button>
      <button class="cookie-banner-btn" data-cookie="granted" type="button">
        Súhlasím
      </button>
    </div>`;
  document.body.append(banner);
  window.requestAnimationFrame(() => banner?.classList.add("is-visible"));
};

document.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-cookie]");
  if (choice) {
    const value = choice.dataset.cookie;
    writeConsent(value);
    hideBanner();
    if (value === "granted") startAnalytics();
    else stopAnalytics();
    return;
  }
  if (event.target.closest("[data-cookie-reset]")) showBanner();
});

const consent = readConsent();
if (consent === "granted") startAnalytics();
else if (consent !== "denied") showBanner();
