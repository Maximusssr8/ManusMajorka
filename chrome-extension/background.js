(function () {
  "use strict";

  var CACHE_TTL = 60 * 60 * 1000; // 1 hour
  var cache = {};

  function cleanExpiredCache() {
    var now = Date.now();
    var keys = Object.keys(cache);
    for (var i = 0; i < keys.length; i++) {
      if (cache[keys[i]].expires < now) {
        delete cache[keys[i]];
      }
    }
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "GET_API_KEY") {
      chrome.storage.sync.get(["majorkaApiKey"], function (result) {
        sendResponse({ apiKey: result.majorkaApiKey || null });
      });
      return true;
    }

    if (message.type === "CACHED_SEARCH") {
      var cacheKey = "search:" + message.query;
      var now = Date.now();

      cleanExpiredCache();

      if (cache[cacheKey] && cache[cacheKey].expires > now) {
        sendResponse({ data: cache[cacheKey].data, fromCache: true });
        return true;
      }

      chrome.storage.sync.get(["majorkaApiKey"], function (result) {
        var apiKey = result.majorkaApiKey;
        if (!apiKey) {
          sendResponse({ error: "No API key configured" });
          return;
        }

        fetch("https://www.majorka.io/v1/products/search?q=" + encodeURIComponent(message.query), {
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
            cache[cacheKey] = {
              data: data,
              expires: now + CACHE_TTL
            };
            sendResponse({ data: data, fromCache: false });
          })
          .catch(function (err) {
            sendResponse({ error: err.message });
          });
      });

      return true;
    }

    return false;
  });
})();
