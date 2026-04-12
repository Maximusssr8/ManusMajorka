(function () {
  "use strict";

  var API_BASE = "https://www.majorka.io/v1";
  var OVERLAY_ID = "majorka-overlay";
  var BADGE_ID = "majorka-badge";

  function extractProductId() {
    var match = window.location.href.match(/\/item\/(\d+)\.html/);
    if (match) return match[1];

    var params = new URLSearchParams(window.location.search);
    var id = params.get("productId") || params.get("product_id");
    if (id) return id;

    var pathMatch = window.location.pathname.match(/\/(\d{10,})(?:\.html)?/);
    if (pathMatch) return pathMatch[1];

    return null;
  }

  function extractProductTitle() {
    var h1 = document.querySelector("h1");
    if (h1 && h1.textContent) {
      return h1.textContent.trim().substring(0, 120);
    }
    return null;
  }

  function isProductPage() {
    var url = window.location.href;
    return (
      url.indexOf("/item/") !== -1 ||
      url.indexOf("productId") !== -1 ||
      url.indexOf("product_id") !== -1 ||
      /\/\d{10,}\.html/.test(url)
    );
  }

  function getScoreColor(score) {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#d4af37";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  }

  function getTrendBadge(trend) {
    if (!trend) return "";
    var colors = {
      rising: { bg: "#0a2e1a", text: "#22c55e", icon: "\u2191" },
      stable: { bg: "#1a1a00", text: "#d4af37", icon: "\u2192" },
      declining: { bg: "#2e0a0a", text: "#ef4444", icon: "\u2193" }
    };
    var c = colors[trend] || colors.stable;
    return (
      '<span class="majorka-trend" style="background:' + c.bg + ";color:" + c.text + '">' +
      c.icon + " " + trend.charAt(0).toUpperCase() + trend.slice(1) +
      "</span>"
    );
  }

  function removeExisting() {
    var existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    var badge = document.getElementById(BADGE_ID);
    if (badge) badge.remove();
  }

  function injectOverlay(product) {
    removeExisting();

    var score = product.winning_score || product.winningScore || 0;
    var orders = product.daily_orders || product.dailyOrders || 0;
    var trend = product.trend || "stable";
    var majorkaUrl = "https://www.majorka.io/app/products/" + (product.id || "");

    var card = document.createElement("div");
    card.id = OVERLAY_ID;
    card.className = "majorka-overlay majorka-overlay-expanded";
    card.innerHTML =
      '<div class="majorka-overlay-header">' +
        '<span class="majorka-overlay-logo">majorka</span>' +
        '<button class="majorka-overlay-toggle" id="majorkaToggle" title="Collapse">\u2212</button>' +
      "</div>" +
      '<div class="majorka-overlay-body" id="majorkaBody">' +
        '<div class="majorka-overlay-row">' +
          '<span class="majorka-overlay-label">Winning Score</span>' +
          '<span class="majorka-overlay-value" style="color:' + getScoreColor(score) + '">' + score + "/100</span>" +
        "</div>" +
        '<div class="majorka-overlay-row">' +
          '<span class="majorka-overlay-label">Daily Orders Est.</span>' +
          '<span class="majorka-overlay-value">' + formatNumber(orders) + "</span>" +
        "</div>" +
        '<div class="majorka-overlay-row">' +
          '<span class="majorka-overlay-label">Trend</span>' +
          getTrendBadge(trend) +
        "</div>" +
        '<a href="' + majorkaUrl + '" target="_blank" rel="noopener" class="majorka-overlay-cta">' +
          "View in Majorka \u2192" +
        "</a>" +
      "</div>";

    document.body.appendChild(card);

    requestAnimationFrame(function () {
      card.classList.add("majorka-overlay-visible");
    });

    document.getElementById("majorkaToggle").addEventListener("click", function () {
      var body = document.getElementById("majorkaBody");
      var isExpanded = card.classList.contains("majorka-overlay-expanded");
      if (isExpanded) {
        card.classList.remove("majorka-overlay-expanded");
        card.classList.add("majorka-overlay-collapsed");
        body.style.display = "none";
        this.textContent = "M";
        this.title = "Expand";
      } else {
        card.classList.remove("majorka-overlay-collapsed");
        card.classList.add("majorka-overlay-expanded");
        body.style.display = "block";
        this.textContent = "\u2212";
        this.title = "Collapse";
      }
    });
  }

  function injectNotTrackedBadge(productTitle) {
    removeExisting();

    var importUrl = "https://www.majorka.io/app/products/import?q=" + encodeURIComponent(productTitle || "");

    var badge = document.createElement("div");
    badge.id = BADGE_ID;
    badge.className = "majorka-badge";
    badge.innerHTML =
      '<span class="majorka-badge-logo">M</span>' +
      '<span class="majorka-badge-text">Not yet tracked by Majorka</span>' +
      ' <a href="' + importUrl + '" target="_blank" rel="noopener" class="majorka-badge-link">Add it \u2192</a>';

    document.body.appendChild(badge);

    requestAnimationFrame(function () {
      badge.classList.add("majorka-badge-visible");
    });
  }

  function injectSetupPrompt() {
    removeExisting();

    var card = document.createElement("div");
    card.id = OVERLAY_ID;
    card.className = "majorka-overlay majorka-overlay-expanded";
    card.innerHTML =
      '<div class="majorka-overlay-header">' +
        '<span class="majorka-overlay-logo">majorka</span>' +
        '<button class="majorka-overlay-toggle" id="majorkaToggle" title="Collapse">\u2212</button>' +
      "</div>" +
      '<div class="majorka-overlay-body" id="majorkaBody">' +
        '<p class="majorka-overlay-setup-text">Set up your API key to see product intelligence.</p>' +
        '<a href="https://www.majorka.io/app/api-keys" target="_blank" rel="noopener" class="majorka-overlay-cta">' +
          "Get your API key \u2192" +
        "</a>" +
      "</div>";

    document.body.appendChild(card);

    requestAnimationFrame(function () {
      card.classList.add("majorka-overlay-visible");
    });

    document.getElementById("majorkaToggle").addEventListener("click", function () {
      var body = document.getElementById("majorkaBody");
      var isExpanded = card.classList.contains("majorka-overlay-expanded");
      if (isExpanded) {
        card.classList.remove("majorka-overlay-expanded");
        card.classList.add("majorka-overlay-collapsed");
        body.style.display = "none";
        this.textContent = "M";
        this.title = "Expand";
      } else {
        card.classList.remove("majorka-overlay-collapsed");
        card.classList.add("majorka-overlay-expanded");
        body.style.display = "block";
        this.textContent = "\u2212";
        this.title = "Collapse";
      }
    });
  }

  function formatNumber(n) {
    if (n >= 1000) {
      return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return String(n);
  }

  function searchProduct(apiKey, title) {
    return fetch(API_BASE + "/products/search?q=" + encodeURIComponent(title), {
      method: "GET",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("API error " + res.status);
        return res.json();
      })
      .then(function (data) {
        var products = data.products || data.data || data.results || [];
        return products.length > 0 ? products[0] : null;
      });
  }

  function run() {
    if (!isProductPage()) return;

    var productTitle = extractProductTitle();
    if (!productTitle) {
      setTimeout(run, 2000);
      return;
    }

    chrome.storage.sync.get(["majorkaApiKey"], function (result) {
      var apiKey = result.majorkaApiKey;
      if (!apiKey) {
        injectSetupPrompt();
        return;
      }

      searchProduct(apiKey, productTitle)
        .then(function (product) {
          if (product) {
            injectOverlay(product);
          } else {
            injectNotTrackedBadge(productTitle);
          }
        })
        .catch(function () {
          injectNotTrackedBadge(productTitle);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(run, 1000);
    });
  } else {
    setTimeout(run, 1000);
  }

  var lastUrl = window.location.href;
  var observer = new MutationObserver(function () {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(run, 1500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
