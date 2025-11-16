// akgoverlay.core.js - core overlay logic
// ASCII-only strings and comments - hyphen used instead of long dash

(function(){
  'use strict';

  var chatContainer = document.getElementById('chat-container');

  // read config from window.AKGO_CONFIG if present
  function getLocalConfig() {
    try {
      if (window.AKGO_CONFIG && typeof window.AKGO_CONFIG.getActiveConfig === 'function') {
        return window.AKGO_CONFIG.getActiveConfig() || {};
      }
      if (window.AKGO_CONFIG && typeof window.AKGO_CONFIG === 'object') {
        return window.AKGO_CONFIG;
      }
    } catch(e){}
    return {};
  }

  var cfg = getLocalConfig();

  // session params fallback
  var urlParams = new URLSearchParams(window.location.search);
  var roomID = urlParams.get('session') || (cfg.roomID || '4DP7Stjuew');
  var password = cfg.password || 'false';
  var featuredMode = (typeof cfg.featuredMode !== 'undefined') ? cfg.featuredMode : false;

  // join announcement text read from localStorage or config
  var joinAnnouncementText = (function(){
    try {
      return localStorage.getItem('joinAnnouncementText') || cfg.joinAnnouncementText || '[Welcome to overlay]';
    } catch(e){ return cfg.joinAnnouncementText || '[Welcome to overlay]'; }
  })();

  // timings from CSS variables or defaults
  function parseCssMs(varName, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(varName);
      var n = parseInt(v);
      if (isNaN(n)) return fallback;
      return n;
    } catch(e){ return fallback; }
  }
  var PER_MESSAGE_MS = parseCssMs('--per-message-ms', 30000);
  var GLOBAL_IDLE_MS = parseCssMs('--global-idle-ms', 60000);
  var LIFE_MS = 60000;

  var globalIdleTimer = null;

  function resetGlobalIdle() {
    if (globalIdleTimer) {
      clearTimeout(globalIdleTimer);
    }
    globalIdleTimer = setTimeout(function(){
      var all = Array.prototype.slice.call(chatContainer.querySelectorAll('.message-container'));
      all.forEach(function(mc){
        if (!mc.classList.contains('global-fade')) {
          mc.classList.add('global-fade');
          setTimeout(function(){ if (mc.parentNode) mc.parentNode.removeChild(mc); }, 650);
        }
      });
    }, GLOBAL_IDLE_MS);
  }

  // public API: addMessageToOverlay
  function addMessageToOverlay(data) {
    if (!data) return;
    if (!data.chatname && data.meta) return;

    var messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');

    var messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (data.mid) messageDiv.id = data.mid;

    var usernameBox = document.createElement('div');
    usernameBox.classList.add('username-box');
    var platformClass = (data.type && typeof data.type === 'string') ? data.type.toLowerCase() : '';
    if (['youtube','twitch','kick','system'].indexOf(platformClass) !== -1) {
      usernameBox.classList.add(platformClass);
    }

    var platformEmoji = {
      youtube: '❤️',
      kick: '💚',
      twitch: '💜'
    };
    var emoji = platformEmoji[platformClass] || '';
    usernameBox.innerText = (emoji ? (emoji + ' ') : '') + (data.chatname || 'Anonymous');

    var textDiv = document.createElement('div');
    textDiv.classList.add('text');
    textDiv.innerHTML = data.chatmessage || '';

    messageDiv.appendChild(usernameBox);
    messageDiv.appendChild(textDiv);

    var isBot = (platformClass === 'system' || platformClass === 'bot');
    var isSpecialEvent = false;
    try {
      var msgLower = (data.chatmessage || '').toLowerCase();
      var keywords = ['follow','subscribe','member','joined','newviewer','join','subscription','gift'];
      for (var i=0;i<keywords.length;i++){
        if (msgLower.indexOf(keywords[i]) !== -1) { isSpecialEvent = true; break; }
      }
    } catch(e){}

    if (isBot) {
      messageDiv.classList.add('bot');
    } else if (isSpecialEvent) {
      messageDiv.classList.add('fireblue');
      messageDiv.classList.add('boldpulse');
    } else {
      messageDiv.classList.add('fireblue');
    }

    var borderColors = [
      '#00ffff','#08f8f8','#0ff0f0','#17e9e9','#1ee1e1','#26dada',
      '#2dd2d2','#35cbcb','#3cc3c3','#44bcbc','#4bb4b4','#53adad'
    ];
    var randomColor = borderColors[Math.floor(Math.random() * borderColors.length)];
    messageDiv.style.border = '1px solid ' + randomColor;

    messageContainer.appendChild(messageDiv);
    chatContainer.appendChild(messageContainer);
    try { chatContainer.scrollTop = chatContainer.scrollHeight; } catch(e){}

    var perMsgTimer = setTimeout(function(){
      if (messageContainer.parentNode) {
        messageContainer.classList.add('fadeout');
      }
    }, PER_MESSAGE_MS);

    var lifeTimer = setTimeout(function(){
      try {
        if (messageContainer.parentNode) messageContainer.parentNode.removeChild(messageContainer);
      } catch(e){}
      clearTimeout(perMsgTimer);
    }, LIFE_MS);

    resetGlobalIdle();
  }

  // expose API on window for external triggers and manual testing
  window.addMessageToOverlay = addMessageToOverlay;
  window.testPushOverlay = function(){
    var samples = [
      {chatname:'Test A', chatmessage:'Overlay debug message 1', type:'system'},
      {chatname:'Test B', chatmessage:'Overlay debug message 2 - a little longer to test wrapping', type:'twitch'},
      {chatname:'Test C', chatmessage:'Overlay debug message 3', type:'youtube'},
      {chatname:'Test D', chatmessage:'Overlay debug message 4', type:'system'},
      {chatname:'Test E', chatmessage:'Overlay debug message 5', type:'kick'}
    ];
    for (var i=0;i<samples.length;i++){
      (function(m,idx){
        setTimeout(function(){ addMessageToOverlay(m); }, idx * 500);
      })(samples[i], i);
    }
  };

  // DOMContentLoaded initialization
  document.addEventListener('DOMContentLoaded', function(){
    addMessageToOverlay({
      chatname: 'System',
      chatmessage: 'Chat loaded',
      type: 'system'
    });

    resetGlobalIdle();

    // create hidden iframe to receive messages from vdo.socialstream.ninja
    try {
      var iframe = document.createElement('iframe');
      iframe.src = featuredMode ?
        ('https://vdo.socialstream.ninja/?ln&password=' + encodeURIComponent(password) + '&salt=vdo.ninja&label=overlay&exclude=' + encodeURIComponent(roomID) + '&scene&novideo&noaudio&cleanoutput&room=' + encodeURIComponent(roomID)) :
        ('https://vdo.socialstream.ninja/?ln&salt=vdo.ninja&password=' + encodeURIComponent(password) + '&push&label=dock&vd=0&ad=0&novideo&noaudio&autostart&cleanoutput&room=' + encodeURIComponent(roomID));
      iframe.style.cssText = 'width: 0px; height: 0px; position: fixed; left: -100px; top: -100px;';
      document.body.appendChild(iframe);

      window.addEventListener('message', function(event){
        if (!iframe.contentWindow) return;
        if (event.source !== iframe.contentWindow) return;
        var data = event.data && event.data.dataReceived && event.data.dataReceived.overlayNinja;
        if (!data) return;
        addMessageToOverlay(data);
        var joinKeywords = ['member','subscribe','follow','newviewer','joined'];
        var messageText = (data.chatmessage || '').toLowerCase();
        var isJoinEvent = false;
        for (var k=0;k<joinKeywords.length;k++){
          if (messageText.indexOf(joinKeywords[k]) !== -1) { isJoinEvent = true; break; }
        }
        if (isJoinEvent && joinAnnouncementText) {
          addMessageToOverlay({
            chatname: 'Announcement',
            chatmessage: joinAnnouncementText,
            type: 'system'
          });
        }
      });
    } catch(e){
      console.debug('iframe integration error', e);
    }

    // BroadcastChannel handler
    try {
      var announcementChannel = new BroadcastChannel('announcements');
      announcementChannel.addEventListener('message', function(event){
        var payload = event.data || {};
        var text = payload.text;
        var type = payload.type;
        if (!text) return;
        if (type === 'join-trigger') {
          joinAnnouncementText = text;
          try { localStorage.setItem('joinAnnouncementText', text); } catch(e){}
          console.log('joinAnnouncementText updated', joinAnnouncementText);
          return;
        }
        var label = 'System';
        if (type === 'announcement') label = 'Announcement';
        else if (type === 'tip') label = 'Tip';
        else if (type === 'test') label = 'Test';
        addMessageToOverlay({
          chatname: label,
          chatmessage: text,
          type: 'system'
        });
      });
    } catch(e){
      console.debug('BroadcastChannel unavailable', e);
    }

    // WebSocket integration - safe try
    try {
      var socket = new WebSocket(cfg.websocketUrl || 'wss://ninjaskin-production.up.railway.app');
      socket.addEventListener('message', function(event){
        var parsed = {};
        try { parsed = JSON.parse(event.data || '{}'); } catch(e){}
        var text = parsed.text;
        var type = parsed.type;
        if (!text) return;
        if (type === 'join-trigger') {
          joinAnnouncementText = text;
          try { localStorage.setItem('joinAnnouncementText', text); } catch(e){}
          return;
        }
        var label = 'System';
        if (type === 'announcement') label = 'Announcement';
        else if (type === 'tip') label = 'Tip';
        else if (type === 'test') label = 'Test';
        addMessageToOverlay({
          chatname: label,
          chatmessage: text,
          type: 'system'
        });
      });
    } catch(e){
      console.warn('WebSocket error or unavailable', e);
    }
  });

})();
