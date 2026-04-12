(function () {
  "use strict";

  var API_BASE = "https://www.majorka.io/v1";

  var apiKeyInput = document.getElementById("apiKeyInput");
  var saveBtn = document.getElementById("saveBtn");
  var statusDot = document.getElementById("statusDot");
  var statusText = document.getElementById("statusText");
  var statsSection = document.getElementById("statsSection");
  var totalProducts = document.getElementById("totalProducts");
  var hotToday = document.getElementById("hotToday");
  var errorMessage = document.getElementById("errorMessage");

  function setConnected(text) {
    statusDot.className = "status-dot connected";
    statusText.className = "status-text connected";
    statusText.textContent = text || "Connected";
  }

  function setDisconnected(text) {
    statusDot.className = "status-dot";
    statusText.className = "status-text";
    statusText.textContent = text || "Enter your API key";
  }

  function setError(text) {
    statusDot.className = "status-dot error";
    statusText.className = "status-text";
    statusText.textContent = "Error";
    errorMessage.textContent = text;
    errorMessage.style.display = "block";
  }

  function hideError() {
    errorMessage.style.display = "none";
  }

  function fetchStats(apiKey) {
    hideError();

    fetch(API_BASE + "/stats/overview", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      }
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("API returned " + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        setConnected("Connected");
        statsSection.style.display = "block";
        totalProducts.textContent = formatNumber(data.totalProducts || data.total_products || 0);
        hotToday.textContent = formatNumber(data.hotToday || data.hot_today || 0);
      })
      .catch(function (err) {
        setError(err.message || "Failed to fetch stats");
        statsSection.style.display = "none";
      });
  }

  function formatNumber(n) {
    if (n >= 1000) {
      return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return String(n);
  }

  function init() {
    chrome.storage.sync.get(["majorkaApiKey"], function (result) {
      var key = result.majorkaApiKey;
      if (key) {
        apiKeyInput.value = key;
        fetchStats(key);
      } else {
        setDisconnected();
      }
    });
  }

  saveBtn.addEventListener("click", function () {
    var key = apiKeyInput.value.trim();
    if (!key) {
      setError("Please enter a valid API key");
      return;
    }

    chrome.storage.sync.set({ majorkaApiKey: key }, function () {
      fetchStats(key);
    });
  });

  apiKeyInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      saveBtn.click();
    }
  });

  init();
})();
