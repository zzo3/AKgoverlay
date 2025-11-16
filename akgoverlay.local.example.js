// akgoverlay.local.example.js - LOCAL CONFIG TEMPLATE FOR akgoverlay.html
// ASCII-only - DO NOT COMMIT akgoverlay.local.js with real secrets

// USAGE:
// 1. Copy this file to akgoverlay.local.js in the same folder as akgoverlay.html
// 2. Edit values for your local environment
// 3. Ensure /akgoverlay.local.js is listed in .gitignore

window.AKGO_CONFIG = {
  // which profile to use by default
  activeProfile: "production",

  // profiles dictionary - add or modify profiles as needed
  profiles: {
    // production profile - keep secrets empty for client side
    production: {
      roomID: "PROD_ROOM_000",        // example room id - replace with your non-sensitive id
      password: "",                   // leave blank for production or use short-term token via backend
      websocketUrl: "",               // optional ws endpoint for announcements
      featuredMode: false,            // boolean - controls iframe url variant
      joinAnnouncementText: "[Welcome to overlay]", // default announcement text
      debug: false                    // debug off for production
    },

    // test profile - safe for local testing
    test: {
      roomID: "TEST_ROOM_123",
      password: "testpw",
      websocketUrl: "wss://example.test.ws",
      featuredMode: false,
      joinAnnouncementText: "[LOCAL CONFIG loaded - test mode]",
      debug: true
    }
  },

  // safe accessor that returns a shallow copy of the active profile
  getActiveConfig: function() {
    try {
      var p = (this.profiles && this.profiles[this.activeProfile]) ? this.profiles[this.activeProfile] : {};
      var out = {};
      for (var k in p) {
        if (Object.prototype.hasOwnProperty.call(p, k)) out[k] = p[k];
      }
      return out;
    } catch (e) {
      return {};
    }
  }
};
