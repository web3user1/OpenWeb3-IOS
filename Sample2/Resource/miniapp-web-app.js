// WebView
(function () {

  console.log("==============[OpenWeb3.WebApp] init Begin!")
  console.log("==============[OpenWeb3.WebApp] location is", location.href)

  var eventHandlers = {};

  // 1、获取h5 url中的锚点值
  var locationHash = '';
  try {
    locationHash = location.hash.toString();
  } catch (e) {}

  // 2、解析锚点值 ，返回key-value数组
  var initParams = urlParseHashParams(locationHash);

  // 3、读取key为__OpenWeb3__initParams的json session值
  var storedParams = sessionStorageGet('initParams');

  // 4、合并storedParams到initParams中
  if (storedParams) {
    for (var key in storedParams) {
      if (typeof initParams[key] === 'undefined') {
        initParams[key] = storedParams[key];
      }
    }
  }

  // 5、用initParams覆盖本地seesion值
  sessionStorageSet('initParams', initParams);

  // 6、判断是否是iFrame，获取iFrame样式
  var isIframe = false, iFrameStyle;
  try {
    isIframe = (window.parent != null && window !== window.parent);
    console.log("==============[OpenWeb3.WebApp] isIframe is ", isIframe)
    if (isIframe) {
      console.log("==============[OpenWeb3.WebApp] window.addEventListener")
      // 7、监听window消息
      window.addEventListener('message', function (event) {
        // 8、判断事件的来源是否为当前窗口的父窗口，如果不是，则直接返回，不执行后续操作。
        console.log("==============[OpenWeb3.WebApp] get new message: " + JSON.stringify(event.data))
        if (event.source !== window.parent) return;
        try {
          // 9、获取事件中json数据
          var dataParsed = JSON.parse(event.data);
        } catch (e) {
          return;
        }
        // 10、过滤非法事件，即不包含事件类型的数据
        if (!dataParsed || !dataParsed.eventType) {
          return;
        }
        if (dataParsed.eventType === 'set_custom_style') {
          // 11、设置自定义样式消息
          if (event.origin === 'http://web.openweb3.io') {
            iFrameStyle.innerHTML = dataParsed.eventData;
          }
        } else if (dataParsed.eventType === 'reload_iframe') {
          try {
            // 12、重新加载iframe
            window.parent.postMessage(JSON.stringify({eventType: 'iframe_will_reload'}), '*');
          } catch (e) {}
          location.reload();
        } else {
          // 13、处理其他消息
          receiveEvent(dataParsed.eventType, dataParsed.eventData);
        }
      });
      // 14、创建样式元素，并附加到html的head中
      iFrameStyle = document.createElement('style');
      document.head.appendChild(iFrameStyle);
      try {
        // 15、发送iframe初始化完成事件
        window.parent.postMessage(JSON.stringify({eventType: 'iframe_ready', eventData: {reload_supported: true}}), '*');
      } catch (e) {}
    }
  } catch (e) {}

  function urlSafeDecode(urlencoded) {
    try {
      urlencoded = urlencoded.replace(/\+/g, '%20');
      return decodeURIComponent(urlencoded);
    } catch (e) {
      return urlencoded;
    }
  }

  function urlParseHashParams(locationHash) {
    locationHash = locationHash.replace(/^#/, '');
    var params = {};
    if (!locationHash.length) {
      return params;
    }
    if (locationHash.indexOf('=') < 0 && locationHash.indexOf('?') < 0) {
      params._path = urlSafeDecode(locationHash);
      return params;
    }
    var qIndex = locationHash.indexOf('?');
    if (qIndex >= 0) {
      var pathParam = locationHash.substr(0, qIndex);
      params._path = urlSafeDecode(pathParam);
      locationHash = locationHash.substr(qIndex + 1);
    }
    var query_params = urlParseQueryString(locationHash);
    for (var k in query_params) {
      params[k] = query_params[k];
    }
    return params;
  }

  function urlParseQueryString(queryString) {
    var params = {};
    if (!queryString.length) {
      return params;
    }
    var queryStringParams = queryString.split('&');
    var i, param, paramName, paramValue;
    for (i = 0; i < queryStringParams.length; i++) {
      param = queryStringParams[i].split('=');
      paramName = urlSafeDecode(param[0]);
      paramValue = param[1] == null ? null : urlSafeDecode(param[1]);
      params[paramName] = paramValue;
    }
    return params;
  }

  // OpenWeb3 apps will implement this logic to add service params (e.g. tgShareScoreUrl) to game URL
  function urlAppendHashParams(url, addHash) {
    // url looks like 'https://game.com/path?query=1#hash'
    // addHash looks like 'tgShareScoreUrl=' + encodeURIComponent('tgb://share_game_score?hash=very_long_hash123')

    var ind = url.indexOf('#');
    if (ind < 0) {
      // https://game.com/path -> https://game.com/path#tgShareScoreUrl=etc
      return url + '#' + addHash;
    }
    var curHash = url.substr(ind + 1);
    if (curHash.indexOf('=') >= 0 || curHash.indexOf('?') >= 0) {
      // https://game.com/#hash=1 -> https://game.com/#hash=1&tgShareScoreUrl=etc
      // https://game.com/#path?query -> https://game.com/#path?query&tgShareScoreUrl=etc
      return url + '&' + addHash;
    }
    // https://game.com/#hash -> https://game.com/#hash?tgShareScoreUrl=etc
    if (curHash.length > 0) {
      return url + '?' + addHash;
    }
    // https://game.com/# -> https://game.com/#tgShareScoreUrl=etc
    return url + addHash;
  }

  // 发送消息到WebView，一共三种方式发送
  function postEvent(eventType, callback, eventData) {
    if (!callback) {
      callback = function () {};
    }
    if (eventData === undefined) {
      eventData = '';
    }
    console.log('==============[OpenWeb3.WebApp] > postEvent', eventType, JSON.stringify(eventData));

    if (window.OpenWeb3WebviewProxy !== undefined) {
      OpenWeb3WebviewProxy.postEvent(eventType, JSON.stringify(eventData));
      callback();
    }
    else if (window.external && 'notify' in window.external) {
      window.external.notify(JSON.stringify({eventType: eventType, eventData: eventData}));
      callback();
    }
    else if (isIframe) {
      try {
        var trustedTarget = 'https://web.openweb3.io';
        // For now we don't restrict target, for testing purposes
        trustedTarget = '*';
        window.parent.postMessage(JSON.stringify({eventType: eventType, eventData: eventData}), trustedTarget);
        callback();
      } catch (e) {
        callback(e);
      }
    }
    else {
      callback({notAvailable: true});
    }
  };

  // 接收事件
  function receiveEvent(eventType, eventData) {
    console.log('==============[OpenWeb3.WebApp] < receiveEvent', eventType, JSON.stringify(eventData));
    callEventCallbacks(eventType, function(callback) {
      callback(eventType, eventData);
    });
  }

  // 分发事件
  function callEventCallbacks(eventType, func) {
    var curEventHandlers = eventHandlers[eventType];
    if (curEventHandlers === undefined ||
        !curEventHandlers.length) {
      return;
    }

    for (var i = 0; i < curEventHandlers.length; i++) {
      try {
        func(curEventHandlers[i]);
      } catch (e) {}
    }
  }

  // 订阅事件
  function onEvent(eventType, callback) {

    console.log('==============[OpenWeb3.WebApp] < onEvent ', eventType);

    if (eventHandlers[eventType] === undefined) {
      eventHandlers[eventType] = [];
    }
    var index = eventHandlers[eventType].indexOf(callback);
    if (index === -1) {
      eventHandlers[eventType].push(callback);
    }
  };

  // 去掉订阅事件
  function offEvent(eventType, callback) {
    if (eventHandlers[eventType] === undefined) {
      return;
    }
    var index = eventHandlers[eventType].indexOf(callback);
    if (index === -1) {
      return;
    }
    eventHandlers[eventType].splice(index, 1);
  };

  // 打开一张图片
  function openProtoUrl(url) {
    if (!url.match(/^(web\+)?tgb?:\/\/./)) {
      return false;
    }
    var useIframe = navigator.userAgent.match(/iOS|iPhone OS|iPhone|iPod|iPad/i) ? true : false;
    if (useIframe) {
      var iframeContEl = document.getElementById('tgme_frame_cont') || document.body;
      var iframeEl = document.createElement('iframe');
      iframeContEl.appendChild(iframeEl);
      var pageHidden = false;
      var enableHidden = function () {
        pageHidden = true;
      };
      window.addEventListener('pagehide', enableHidden, false);
      window.addEventListener('blur', enableHidden, false);
      if (iframeEl !== null) {
        iframeEl.src = url;
      }
      setTimeout(function() {
        if (!pageHidden) {
          window.location = url;
        }
        window.removeEventListener('pagehide', enableHidden, false);
        window.removeEventListener('blur', enableHidden, false);
      }, 2000);
    }
    else {
      window.location = url;
    }
    return true;
  }

  // 保存会话
  function sessionStorageSet(key, value) {
    try {
      window.sessionStorage.setItem('__OpenWeb3__' + key, JSON.stringify(value));
      return true;
    } catch(e) {}
    return false;
  }

  // 获取会话
  function sessionStorageGet(key) {
    try {
      return JSON.parse(window.sessionStorage.getItem('__OpenWeb3__' + key));
    } catch(e) {}
    return null;
  }

  // sayHello
  function sayHello() {
    if (window.OpenWeb3WebviewProxy !== undefined) {
      OpenWeb3WebviewProxy.sayHello();
    }
  }

  // 16、注册OpenWeb3.WebView事件方法
  if (!window.OpenWeb3) {
    window.OpenWeb3 = {};
  }
  window.OpenWeb3.WebView = {
    initParams: initParams,
    isIframe: isIframe,
    onEvent: onEvent,
    offEvent: offEvent,
    postEvent: postEvent,
    receiveEvent: receiveEvent,
    callEventCallbacks: callEventCallbacks,
    sayHello: sayHello
  };

  // 17、注册OpenWeb3 Utils方法
  window.OpenWeb3.Utils = {
    urlSafeDecode: urlSafeDecode,
    urlParseQueryString: urlParseQueryString,
    urlParseHashParams: urlParseHashParams,
    urlAppendHashParams: urlAppendHashParams,
    sessionStorageSet: sessionStorageSet,
    sessionStorageGet: sessionStorageGet
  };

  // For Windows Phone app
  window.OpenWeb3GameProxy_receiveEvent = receiveEvent;

  // App backward compatibility
  window.OpenWeb3GameProxy = {
    receiveEvent: receiveEvent
  };
})();

// WebApp
(function () {
  var Utils = window.OpenWeb3.Utils;
  var WebView = window.OpenWeb3.WebView;
  var initParams = WebView.initParams;
  var isIframe = WebView.isIframe;

  var WebApp = {};
  var webAppInitData = '', webAppInitDataUnsafe = {};
  var themeParams = {}, colorScheme = 'light';
  var webAppVersion = '1.0';
  var webAppPlatform = 'unknown';

  // 18、进一步解析session和锚点中的tgWebAppData数据，包括版本、平台等
  if (initParams.tgWebAppData && initParams.tgWebAppData.length) {
    webAppInitData = initParams.tgWebAppData;
    webAppInitDataUnsafe = Utils.urlParseQueryString(webAppInitData);
    for (var key in webAppInitDataUnsafe) {
      var val = webAppInitDataUnsafe[key];
      try {
        if (val.substr(0, 1) == '{' && val.substr(-1) == '}' ||
            val.substr(0, 1) == '[' && val.substr(-1) == ']') {
          webAppInitDataUnsafe[key] = JSON.parse(val);
        }
      } catch (e) {}
    }
  }

  // 19、解析tgWebAppThemeParams样式数据，更新样式
  if (initParams.tgWebAppThemeParams && initParams.tgWebAppThemeParams.length) {
    var themeParamsRaw = initParams.tgWebAppThemeParams;
    try {
      var theme_params = JSON.parse(themeParamsRaw);
      if (theme_params) {
        setThemeParams(theme_params);
      }
    } catch (e) {}
  }

  // 20、查找session中的themeParams数据，更新样式
  var theme_params = Utils.sessionStorageGet('themeParams');
  if (theme_params) {
    setThemeParams(theme_params);
  }
  if (initParams.tgWebAppVersion) {
    webAppVersion = initParams.tgWebAppVersion;
  }
  if (initParams.tgWebAppPlatform) {
    webAppPlatform = initParams.tgWebAppPlatform;
  }

  // 样式变化
  function onThemeChanged(eventType, eventData) {
    if (eventData.theme_params) {
      setThemeParams(eventData.theme_params);
      window.OpenWeb3.WebApp.MainButton.setParams({});
      updateBackgroundColor();
      receiveWebViewEvent('themeChanged');
    }
  }

  // 高度变化事件
  var lastWindowHeight = window.innerHeight;
  function onViewportChanged(eventType, eventData) {
    if (eventData.height) {
      window.removeEventListener('resize', onWindowResize);
      setViewportHeight(eventData);
    }
  }

  //
  function onWindowResize(e) {
    if (lastWindowHeight != window.innerHeight) {
      lastWindowHeight = window.innerHeight;
      receiveWebViewEvent('viewportChanged', {
        isStateStable: true
      });
    }
  }

  // 打开链接
  function linkHandler(e) {
    if (e.metaKey || e.ctrlKey) return;
    var el = e.target;
    while (el.tagName != 'A' && el.parentNode) {
      el = el.parentNode;
    }
    if (el.tagName == 'A' &&
        el.target != '_blank' &&
        (el.protocol == 'http:' || el.protocol == 'https:') &&
        el.hostname == 'openweb3.io') {
      WebApp.openTgLink(el.href);
      e.preventDefault();
    }
  }

  function strTrim(str) {
    return str.toString().replace(/^\s+|\s+$/g, '');
  }

  function receiveWebViewEvent(eventType) {
    var args = Array.prototype.slice.call(arguments);
    eventType = args.shift();
    WebView.callEventCallbacks('webview:' + eventType, function(callback) {
      callback.apply(WebApp, args);
    });
  }

  function onWebViewEvent(eventType, callback) {
    WebView.onEvent('webview:' + eventType, callback);
  };

  function offWebViewEvent(eventType, callback) {
    WebView.offEvent('webview:' + eventType, callback);
  };

  function setCssProperty(name, value) {
    var root = document.documentElement;
    if (root && root.style && root.style.setProperty) {
      root.style.setProperty('--tg-' + name, value);
    }
  }

  function setThemeParams(theme_params) {
    // temp iOS fix
    if (theme_params.bg_color == '#1c1c1d' &&
        theme_params.bg_color == theme_params.secondary_bg_color) {
      theme_params.secondary_bg_color = '#2c2c2e';
    }
    var color;
    for (var key in theme_params) {
      if (color = parseColorToHex(theme_params[key])) {
        themeParams[key] = color;
        if (key == 'bg_color') {
          colorScheme = isColorDark(color) ? 'dark' : 'light'
          setCssProperty('color-scheme', colorScheme);
        }
        key = 'theme-' + key.split('_').join('-');
        setCssProperty(key, color);
      }
    }
    Utils.sessionStorageSet('themeParams', themeParams);
  }

  var webAppCallbacks = {};
  function generateCallbackId(len) {
    var tries = 100;
    while (--tries) {
      var id = '', chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', chars_len = chars.length;
      for (var i = 0; i < len; i++) {
        id += chars[Math.floor(Math.random() * chars_len)];
      }
      if (!webAppCallbacks[id]) {
        webAppCallbacks[id] = {};
        return id;
      }
    }
    throw Error('WebAppCallbackIdGenerateFailed');
  }

  var viewportHeight = false, viewportStableHeight = false, isExpanded = true;
  function setViewportHeight(data) {
    if (typeof data !== 'undefined') {
      isExpanded = !!data.is_expanded;
      viewportHeight = data.height;
      if (data.is_state_stable) {
        viewportStableHeight = data.height;
      }
      receiveWebViewEvent('viewportChanged', {
        isStateStable: !!data.is_state_stable
      });
    }
    var height, stable_height;
    if (viewportHeight !== false) {
      height = (viewportHeight - mainButtonHeight) + 'px';
    } else {
      height = mainButtonHeight ? 'calc(100vh - ' + mainButtonHeight + 'px)' : '100vh';
    }
    if (viewportStableHeight !== false) {
      stable_height = (viewportStableHeight - mainButtonHeight) + 'px';
    } else {
      stable_height = mainButtonHeight ? 'calc(100vh - ' + mainButtonHeight + 'px)' : '100vh';
    }
    setCssProperty('viewport-height', height);
    setCssProperty('viewport-stable-height', stable_height);
  }

  var isClosingConfirmationEnabled = false;
  function setClosingConfirmation(need_confirmation) {
    if (!versionAtLeast('1.0')) {
      console.warn('[OpenWeb3.WebApp] Closing confirmation is not supported in version ' + webAppVersion);
      return;
    }
    isClosingConfirmationEnabled = !!need_confirmation;
    WebView.postEvent('web_app_setup_closing_behavior', false, {need_confirmation: isClosingConfirmationEnabled});
  }

  var isVerticalSwipesEnabled = true;
  function toggleVerticalSwipes(enable_swipes) {
    isVerticalSwipesEnabled = !!enable_swipes;
    WebView.postEvent('web_app_setup_swipe_behavior', false, {allow_vertical_swipe: isVerticalSwipesEnabled});
  }

  var isActionBarVisible = true;
  function toggleHeadContainer(visible) {
    isActionBarVisible = !!visible;
    WebView.postEvent('web_app_setup_show_head', false, {show_head: isActionBarVisible});
  }

  var isFullScreenEnabled = false;
  function toggleFullScreen(visible) {
    isFullScreenEnabled = !!visible;
    WebView.postEvent('web_app_setup_full_screen', false, {show_fullscreen: isFullScreenEnabled});
  }

  var headerColorKey = 'bg_color', headerColor = null;
  function getHeaderColor() {
    if (headerColorKey == 'secondary_bg_color') {
      return themeParams.secondary_bg_color;
    } else if (headerColorKey == 'bg_color') {
      return themeParams.bg_color;
    }
    return headerColor;
  }
  function setHeaderColor(color) {
    if (!versionAtLeast('1.0')) {
      console.warn('[OpenWeb3.WebApp] Header color is not supported in version ' + webAppVersion);
      return;
    }
    if (!versionAtLeast('1.0')) {
      if (themeParams.bg_color &&
          themeParams.bg_color == color) {
        color = 'bg_color';
      } else if (themeParams.secondary_bg_color &&
          themeParams.secondary_bg_color == color) {
        color = 'secondary_bg_color';
      }
    }
    var head_color = null, color_key = null;
    if (color == 'bg_color' || color == 'secondary_bg_color') {
      color_key = color;
    } else if (versionAtLeast('1.0')) {
      head_color = parseColorToHex(color);
      if (!head_color) {
        console.error('[OpenWeb3.WebApp] Header color format is invalid', color);
        throw Error('WebAppHeaderColorInvalid');
      }
    }
    if (!versionAtLeast('1.0') &&
        color_key != 'bg_color' &&
        color_key != 'secondary_bg_color') {
      console.error('[OpenWeb3.WebApp] Header color key should be one of OpenWeb3.WebApp.themeParams.bg_color, OpenWeb3.WebApp.themeParams.secondary_bg_color, \'bg_color\', \'secondary_bg_color\'', color);
      throw Error('WebAppHeaderColorKeyInvalid');
    }
    headerColorKey = color_key;
    headerColor = head_color;
    updateHeaderColor();
  }
  var appHeaderColorKey = null, appHeaderColor = null;
  function updateHeaderColor() {
    if (appHeaderColorKey != headerColorKey ||
        appHeaderColor != headerColor) {
      appHeaderColorKey = headerColorKey;
      appHeaderColor = headerColor;
      if (appHeaderColor) {
        WebView.postEvent('web_app_set_header_color', false, {color: headerColor});
      } else {
        WebView.postEvent('web_app_set_header_color', false, {color_key: headerColorKey});
      }
    }
  }

  var backgroundColor = 'bg_color';
  function getBackgroundColor() {
    if (backgroundColor == 'secondary_bg_color') {
      return themeParams.secondary_bg_color;
    } else if (backgroundColor == 'bg_color') {
      return themeParams.bg_color;
    }
    return backgroundColor;
  }
  function setBackgroundColor(color) {
    if (!versionAtLeast('1.0')) {
      console.warn('[OpenWeb3.WebApp] Background color is not supported in version ' + webAppVersion);
      return;
    }
    var bg_color;
    if (color == 'bg_color' || color == 'secondary_bg_color') {
      bg_color = color;
    } else {
      bg_color = parseColorToHex(color);
      if (!bg_color) {
        console.error('[OpenWeb3.WebApp] Background color format is invalid', color);
        throw Error('WebAppBackgroundColorInvalid');
      }
    }
    backgroundColor = bg_color;
    updateBackgroundColor();
  }
  var appBackgroundColor = null;
  function updateBackgroundColor() {
    var color = getBackgroundColor();
    if (appBackgroundColor != color) {
      appBackgroundColor = color;
      WebView.postEvent('web_app_set_background_color', false, {color: color});
    }
  }


  function parseColorToHex(color) {
    color += '';
    var match;
    if (match = /^\s*#([0-9a-f]{6})\s*$/i.exec(color)) {
      return '#' + match[1].toLowerCase();
    }
    else if (match = /^\s*#([0-9a-f])([0-9a-f])([0-9a-f])\s*$/i.exec(color)) {
      return ('#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3]).toLowerCase();
    }
    else if (match = /^\s*rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)\s*$/.exec(color)) {
      var r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
      r = (r < 16 ? '0' : '') + r.toString(16);
      g = (g < 16 ? '0' : '') + g.toString(16);
      b = (b < 16 ? '0' : '') + b.toString(16);
      return '#' + r + g + b;
    }
    return false;
  }

  function isColorDark(rgb) {
    rgb = rgb.replace(/[\s#]/g, '');
    if (rgb.length == 3) {
      rgb = rgb[0] + rgb[0] + rgb[1] + rgb[1] + rgb[2] + rgb[2];
    }
    var r = parseInt(rgb.substr(0, 2), 16);
    var g = parseInt(rgb.substr(2, 2), 16);
    var b = parseInt(rgb.substr(4, 2), 16);
    var hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp < 120;
  }

  function versionCompare(v1, v2) {
    if (typeof v1 !== 'string') v1 = '';
    if (typeof v2 !== 'string') v2 = '';
    v1 = v1.replace(/^\s+|\s+$/g, '').split('.');
    v2 = v2.replace(/^\s+|\s+$/g, '').split('.');
    var a = Math.max(v1.length, v2.length), i, p1, p2;
    for (i = 0; i < a; i++) {
      p1 = parseInt(v1[i]) || 0;
      p2 = parseInt(v2[i]) || 0;
      if (p1 == p2) continue;
      if (p1 > p2) return 1;
      return -1;
    }
    return 0;
  }

  function versionAtLeast(ver) {
    return versionCompare(webAppVersion, ver) >= 0;
  }

  function byteLength(str) {
    if (window.Blob) {
      try { return new Blob([str]).size; } catch (e) {}
    }
    var s = str.length;
    for (var i=str.length-1; i>=0; i--) {
      var code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) s++;
      else if (code > 0x7ff && code <= 0xffff) s+=2;
      if (code >= 0xdc00 && code <= 0xdfff) i--;
    }
    return s;
  }

  var BackButton = (function() {
    var isVisible = false;

    var backButton = {};
    Object.defineProperty(backButton, 'isVisible', {
      set: function(val){ setParams({is_visible: val}); },
      get: function(){ return isVisible; },
      enumerable: true
    });

    var curButtonState = null;

    WebView.onEvent('back_button_pressed', onBackButtonPressed);

    function onBackButtonPressed() {
      receiveWebViewEvent('backButtonClicked');
    }

    function buttonParams() {
      return {is_visible: isVisible};
    }

    function buttonState(btn_params) {
      if (typeof btn_params === 'undefined') {
        btn_params = buttonParams();
      }
      return JSON.stringify(btn_params);
    }

    function buttonCheckVersion() {
      if (!versionAtLeast('1.0')) {
        console.warn('[OpenWeb3.WebApp] BackButton is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    function updateButton() {
      var btn_params = buttonParams();
      var btn_state = buttonState(btn_params);
      if (curButtonState === btn_state) {
        return;
      }
      curButtonState = btn_state;
      WebView.postEvent('web_app_setup_back_button', false, btn_params);
    }

    function setParams(params) {
      if (!buttonCheckVersion()) {
        return backButton;
      }
      if (typeof params.is_visible !== 'undefined') {
        isVisible = !!params.is_visible;
      }
      updateButton();
      return backButton;
    }

    backButton.onClick = function(callback) {
      if (buttonCheckVersion()) {
        onWebViewEvent('backButtonClicked', callback);
      }
      return backButton;
    };
    backButton.offClick = function(callback) {
      if (buttonCheckVersion()) {
        offWebViewEvent('backButtonClicked', callback);
      }
      return backButton;
    };
    backButton.show = function() {
      return setParams({is_visible: true});
    };
    backButton.hide = function() {
      return setParams({is_visible: false});
    };
    return backButton;
  })();

  var mainButtonHeight = 0;
  var MainButton = (function() {
    var isVisible = false;
    var isActive = true;
    var isProgressVisible = false;
    var buttonText = 'CONTINUE';
    var buttonColor = false;
    var buttonTextColor = false;

    var mainButton = {};
    Object.defineProperty(mainButton, 'text', {
      set: function(val){ mainButton.setParams({text: val}); },
      get: function(){ return buttonText; },
      enumerable: true
    });
    Object.defineProperty(mainButton, 'color', {
      set: function(val){ mainButton.setParams({color: val}); },
      get: function(){ return buttonColor || themeParams.button_color || '#2481cc'; },
      enumerable: true
    });
    Object.defineProperty(mainButton, 'textColor', {
      set: function(val){ mainButton.setParams({text_color: val}); },
      get: function(){ return buttonTextColor || themeParams.button_text_color || '#ffffff'; },
      enumerable: true
    });
    Object.defineProperty(mainButton, 'isVisible', {
      set: function(val){ mainButton.setParams({is_visible: val}); },
      get: function(){ return isVisible; },
      enumerable: true
    });
    Object.defineProperty(mainButton, 'isProgressVisible', {
      get: function(){ return isProgressVisible; },
      enumerable: true
    });
    Object.defineProperty(mainButton, 'isActive', {
      set: function(val){ mainButton.setParams({is_active: val}); },
      get: function(){ return isActive; },
      enumerable: true
    });

    var curButtonState = null;

    WebView.onEvent('main_button_pressed', onMainButtonPressed);

    var debugBtn = null, debugBtnStyle = {};
    if (initParams.tgWebAppDebug) {
      debugBtn = document.createElement('tg-main-button');
      debugBtnStyle = {
        font: '600 14px/18px sans-serif',
        display: 'none',
        width: '100%',
        height: '48px',
        borderRadius: '0',
        background: 'no-repeat right center',
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: '0',
        margin: '0',
        padding: '15px 20px',
        textAlign: 'center',
        boxSizing: 'border-box',
        zIndex: '10000'
      };
      for (var k in debugBtnStyle) {
        debugBtn.style[k] = debugBtnStyle[k];
      }
      document.addEventListener('DOMContentLoaded', function onDomLoaded(event) {
        document.removeEventListener('DOMContentLoaded', onDomLoaded);
        document.body.appendChild(debugBtn);
        debugBtn.addEventListener('click', onMainButtonPressed, false);
      });
    }

    function onMainButtonPressed() {
      if (isActive) {
        receiveWebViewEvent('mainButtonClicked');
      }
    }

    function buttonParams() {
      var color = mainButton.color;
      var text_color = mainButton.textColor;
      return isVisible ? {
        is_visible: true,
        is_active: isActive,
        is_progress_visible: isProgressVisible,
        text: buttonText,
        color: color,
        text_color: text_color
      } : {is_visible: false};
    }

    function buttonState(btn_params) {
      if (typeof btn_params === 'undefined') {
        btn_params = buttonParams();
      }
      return JSON.stringify(btn_params);
    }

    function updateButton() {
      var btn_params = buttonParams();
      var btn_state = buttonState(btn_params);
      if (curButtonState === btn_state) {
        return;
      }
      curButtonState = btn_state;
      WebView.postEvent('web_app_setup_main_button', false, btn_params);
      if (initParams.tgWebAppDebug) {
        updateDebugButton(btn_params);
      }
    }

    function updateDebugButton(btn_params) {
      if (btn_params.is_visible) {
        debugBtn.style.display = 'block';
        mainButtonHeight = 48;

        debugBtn.style.opacity = btn_params.is_active ? '1' : '0.8';
        debugBtn.style.cursor = btn_params.is_active ? 'pointer' : 'auto';
        debugBtn.disabled = !btn_params.is_active;
        debugBtn.innerText = btn_params.text;
        debugBtn.style.backgroundImage = btn_params.is_progress_visible ? "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20viewport%3D%220%200%2048%2048%22%20width%3D%2248px%22%20height%3D%2248px%22%3E%3Ccircle%20cx%3D%2250%25%22%20cy%3D%2250%25%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222.25%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%20stroke-dashoffset%3D%22106%22%20r%3D%229%22%20stroke-dasharray%3D%2256.52%22%20rotate%3D%22-90%22%3E%3Canimate%20attributeName%3D%22stroke-dashoffset%22%20attributeType%3D%22XML%22%20dur%3D%22360s%22%20from%3D%220%22%20to%3D%2212500%22%20repeatCount%3D%22indefinite%22%3E%3C%2Fanimate%3E%3CanimateTransform%20attributeName%3D%22transform%22%20attributeType%3D%22XML%22%20type%3D%22rotate%22%20dur%3D%221s%22%20from%3D%22-90%2024%2024%22%20to%3D%22630%2024%2024%22%20repeatCount%3D%22indefinite%22%3E%3C%2FanimateTransform%3E%3C%2Fcircle%3E%3C%2Fsvg%3E')" : 'none';
        debugBtn.style.backgroundColor = btn_params.color;
        debugBtn.style.color = btn_params.text_color;
      } else {
        debugBtn.style.display = 'none';
        mainButtonHeight = 0;
      }
      if (document.documentElement) {
        document.documentElement.style.boxSizing = 'border-box';
        document.documentElement.style.paddingBottom = mainButtonHeight + 'px';
      }
      setViewportHeight();
    }

    function setParams(params) {
      if (typeof params.text !== 'undefined') {
        var text = strTrim(params.text);
        if (!text.length) {
          console.error('[OpenWeb3.WebApp] Main button text is required', params.text);
          throw Error('WebAppMainButtonParamInvalid');
        }
        if (text.length > 64) {
          console.error('[OpenWeb3.WebApp] Main button text is too long', text);
          throw Error('WebAppMainButtonParamInvalid');
        }
        buttonText = text;
      }
      if (typeof params.color !== 'undefined') {
        if (params.color === false ||
            params.color === null) {
          buttonColor = false;
        } else {
          var color = parseColorToHex(params.color);
          if (!color) {
            console.error('[OpenWeb3.WebApp] Main button color format is invalid', params.color);
            throw Error('WebAppMainButtonParamInvalid');
          }
          buttonColor = color;
        }
      }
      if (typeof params.text_color !== 'undefined') {
        if (params.text_color === false ||
            params.text_color === null) {
          buttonTextColor = false;
        } else {
          var text_color = parseColorToHex(params.text_color);
          if (!text_color) {
            console.error('[OpenWeb3.WebApp] Main button text color format is invalid', params.text_color);
            throw Error('WebAppMainButtonParamInvalid');
          }
          buttonTextColor = text_color;
        }
      }
      if (typeof params.is_visible !== 'undefined') {
        if (params.is_visible &&
            !mainButton.text.length) {
          console.error('[OpenWeb3.WebApp] Main button text is required');
          throw Error('WebAppMainButtonParamInvalid');
        }
        isVisible = !!params.is_visible;
      }
      if (typeof params.is_active !== 'undefined') {
        isActive = !!params.is_active;
      }
      updateButton();
      return mainButton;
    }

    mainButton.setText = function(text) {
      return mainButton.setParams({text: text});
    };
    mainButton.onClick = function(callback) {
      onWebViewEvent('mainButtonClicked', callback);
      return mainButton;
    };
    mainButton.offClick = function(callback) {
      offWebViewEvent('mainButtonClicked', callback);
      return mainButton;
    };
    mainButton.show = function() {
      return mainButton.setParams({is_visible: true});
    };
    mainButton.hide = function() {
      return mainButton.setParams({is_visible: false});
    };
    mainButton.enable = function() {
      return mainButton.setParams({is_active: true});
    };
    mainButton.disable = function() {
      return mainButton.setParams({is_active: false});
    };
    mainButton.showProgress = function(leaveActive) {
      isActive = !!leaveActive;
      isProgressVisible = true;
      updateButton();
      return mainButton;
    };
    mainButton.hideProgress = function() {
      if (!mainButton.isActive) {
        isActive = true;
      }
      isProgressVisible = false;
      updateButton();
      return mainButton;
    }
    mainButton.setParams = setParams;
    return mainButton;
  })();

  var SettingsButton = (function() {
    var isVisible = false;

    var settingsButton = {};
    Object.defineProperty(settingsButton, 'isVisible', {
      set: function(val){ setParams({is_visible: val}); },
      get: function(){ return isVisible; },
      enumerable: true
    });

    var curButtonState = null;

    WebView.onEvent('settings_button_pressed', onSettingsButtonPressed);

    function onSettingsButtonPressed() {
      receiveWebViewEvent('settingsButtonClicked');
    }

    function buttonParams() {
      return {is_visible: isVisible};
    }

    function buttonState(btn_params) {
      if (typeof btn_params === 'undefined') {
        btn_params = buttonParams();
      }
      return JSON.stringify(btn_params);
    }

    function buttonCheckVersion() {
      if (!versionAtLeast('1.0')) {
        console.warn('[OpenWeb3.WebApp] SettingsButton is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    function updateButton() {
      var btn_params = buttonParams();
      var btn_state = buttonState(btn_params);
      if (curButtonState === btn_state) {
        return;
      }
      curButtonState = btn_state;
      WebView.postEvent('web_app_setup_settings_button', false, btn_params);
    }

    function setParams(params) {
      if (!buttonCheckVersion()) {
        return settingsButton;
      }
      if (typeof params.is_visible !== 'undefined') {
        isVisible = !!params.is_visible;
      }
      updateButton();
      return settingsButton;
    }

    settingsButton.onClick = function(callback) {
      if (buttonCheckVersion()) {
        onWebViewEvent('settingsButtonClicked', callback);
      }
      return settingsButton;
    };
    settingsButton.offClick = function(callback) {
      if (buttonCheckVersion()) {
        offWebViewEvent('settingsButtonClicked', callback);
      }
      return settingsButton;
    };
    settingsButton.show = function() {
      return setParams({is_visible: true});
    };
    settingsButton.hide = function() {
      return setParams({is_visible: false});
    };
    return settingsButton;
  })();

  var HapticFeedback = (function() {
    var hapticFeedback = {};

    function triggerFeedback(params) {
      if (!versionAtLeast('1.0')) {
        console.warn('[OpenWeb3.WebApp] HapticFeedback is not supported in version ' + webAppVersion);
        return hapticFeedback;
      }
      if (params.type == 'impact') {
        if (params.impact_style != 'light' &&
            params.impact_style != 'medium' &&
            params.impact_style != 'heavy' &&
            params.impact_style != 'rigid' &&
            params.impact_style != 'soft') {
          console.error('[OpenWeb3.WebApp] Haptic impact style is invalid', params.impact_style);
          throw Error('WebAppHapticImpactStyleInvalid');
        }
      } else if (params.type == 'notification') {
        if (params.notification_type != 'error' &&
            params.notification_type != 'success' &&
            params.notification_type != 'warning') {
          console.error('[OpenWeb3.WebApp] Haptic notification type is invalid', params.notification_type);
          throw Error('WebAppHapticNotificationTypeInvalid');
        }
      } else if (params.type == 'selection_change') {
        // no params needed
      } else {
        console.error('[OpenWeb3.WebApp] Haptic feedback type is invalid', params.type);
        throw Error('WebAppHapticFeedbackTypeInvalid');
      }
      WebView.postEvent('web_app_trigger_haptic_feedback', false, params);
      return hapticFeedback;
    }

    hapticFeedback.impactOccurred = function(style) {
      return triggerFeedback({type: 'impact', impact_style: style});
    };
    hapticFeedback.notificationOccurred = function(type) {
      return triggerFeedback({type: 'notification', notification_type: type});
    };
    hapticFeedback.selectionChanged = function() {
      return triggerFeedback({type: 'selection_change'});
    };
    return hapticFeedback;
  })();

  var CloudStorage = (function() {
    var cloudStorage = {};

    function invokeStorageMethod(method, params, callback) {
      if (!versionAtLeast('1.0')) {
        console.error('[OpenWeb3.WebApp] CloudStorage is not supported in version ' + webAppVersion);
        throw Error('WebAppMethodUnsupported');
      }
      invokeCustomMethod(method, params, callback);
      return cloudStorage;
    }

    cloudStorage.setItem = function(key, value, callback) {
      return invokeStorageMethod('saveStorageValue', {key: key, value: value}, callback);
    };
    cloudStorage.getItem = function(key, callback) {
      return cloudStorage.getItems([key], callback ? function(err, res) {
        if (err) callback(err);
        else callback(null, res[key]);
      } : null);
    };
    cloudStorage.getItems = function(keys, callback) {
      return invokeStorageMethod('getStorageValues', {keys: keys}, callback);
    };
    cloudStorage.removeItem = function(key, callback) {
      return cloudStorage.removeItems([key], callback);
    };
    cloudStorage.removeItems = function(keys, callback) {
      return invokeStorageMethod('deleteStorageValues', {keys: keys}, callback);
    };
    cloudStorage.getKeys = function(callback) {
      return invokeStorageMethod('getStorageKeys', {}, callback);
    };
    return cloudStorage;
  })();

  var BiometricManager = (function() {
    var isInited = false;
    var isBiometricAvailable = false;
    var biometricType = 'unknown';
    var isAccessRequested = false;
    var isAccessGranted = false;
    var isBiometricTokenSaved = false;
    var deviceId = '';

    var biometricManager = {};
    Object.defineProperty(biometricManager, 'isInited', {
      get: function(){ return isInited; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'isBiometricAvailable', {
      get: function(){ return isInited && isBiometricAvailable; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'biometricType', {
      get: function(){ return biometricType || 'unknown'; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'isAccessRequested', {
      get: function(){ return isAccessRequested; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'isAccessGranted', {
      get: function(){ return isAccessRequested && isAccessGranted; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'isBiometricTokenSaved', {
      get: function(){ return isBiometricTokenSaved; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'deviceId', {
      get: function(){ return deviceId || ''; },
      enumerable: true
    });

    var initRequestState = {callbacks: []};
    var accessRequestState = false;
    var authRequestState = false;
    var tokenRequestState = false;

    WebView.onEvent('biometry_info_received',  onBiometryInfoReceived);
    WebView.onEvent('biometry_auth_requested', onBiometryAuthRequested);
    WebView.onEvent('biometry_token_updated',  onBiometryTokenUpdated);

    function onBiometryInfoReceived(eventType, eventData) {
      isInited = true;
      if (eventData.available) {
        isBiometricAvailable = true;
        biometricType = eventData.type || 'unknown';
        if (eventData.access_requested) {
          isAccessRequested = true;
          isAccessGranted = !!eventData.access_granted;
          isBiometricTokenSaved = !!eventData.token_saved;
        } else {
          isAccessRequested = false;
          isAccessGranted = false;
          isBiometricTokenSaved = false;
        }
      } else {
        isBiometricAvailable = false;
        biometricType = 'unknown';
        isAccessRequested = false;
        isAccessGranted = false;
        isBiometricTokenSaved = false;
      }
      deviceId = eventData.device_id || '';

      if (initRequestState.callbacks.length > 0) {
        for (var i = 0; i < initRequestState.callbacks.length; i++) {
          var callback = initRequestState.callbacks[i];
          callback();
        }
      }
      if (accessRequestState) {
        var state = accessRequestState;
        accessRequestState = false;
        if (state.callback) {
          state.callback(isAccessGranted);
        }
      }
      receiveWebViewEvent('biometricManagerUpdated');
    }
    function onBiometryAuthRequested(eventType, eventData) {
      var isAuthenticated = (eventData.status == 'authorized'),
          biometricToken = eventData.token || '';
      if (authRequestState) {
        var state = authRequestState;
        authRequestState = false;
        if (state.callback) {
          state.callback(isAuthenticated, isAuthenticated ? biometricToken : null);
        }
      }
      receiveWebViewEvent('biometricAuthRequested', isAuthenticated ? {
        isAuthenticated: true,
        biometricToken: biometricToken
      } : {
        isAuthenticated: false
      });
    }
    function onBiometryTokenUpdated(eventType, eventData) {
      var applied = false;
      if (isBiometricAvailable &&
          isAccessRequested) {
        if (eventData.status == 'updated') {
          isBiometricTokenSaved = true;
          applied = true;
        }
        else if (eventData.status == 'removed') {
          isBiometricTokenSaved = false;
          applied = true;
        }
      }
      if (tokenRequestState) {
        var state = tokenRequestState;
        tokenRequestState = false;
        if (state.callback) {
          state.callback(applied);
        }
      }
      receiveWebViewEvent('biometricTokenUpdated', {
        isUpdated: applied
      });
    }

    function checkVersion() {
      if (!versionAtLeast('1.0')) {
        console.warn('[OpenWeb3.WebApp] BiometricManager is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    function checkInit() {
      if (!isInited) {
        console.error('[OpenWeb3.WebApp] BiometricManager should be inited before using.');
        throw Error('WebAppBiometricManagerNotInited');
      }
      return true;
    }

    biometricManager.init = function(callback) {
      if (!checkVersion()) {
        return biometricManager;
      }
      if (isInited) {
        return biometricManager;
      }
      if (callback) {
        initRequestState.callbacks.push(callback);
      }
      WebView.postEvent('web_app_biometry_get_info', false);
      return biometricManager;
    };
    biometricManager.requestAccess = function(params, callback) {
      if (!checkVersion()) {
        return biometricManager;
      }
      checkInit();
      if (!isBiometricAvailable) {
        console.error('[OpenWeb3.WebApp] Biometrics is not available on this device.');
        throw Error('WebAppBiometricManagerBiometricsNotAvailable');
      }
      if (accessRequestState) {
        console.error('[OpenWeb3.WebApp] Access is already requested');
        throw Error('WebAppBiometricManagerAccessRequested');
      }
      var popup_params = {};
      if (typeof params.reason !== 'undefined') {
        var reason = strTrim(params.reason);
        if (reason.length > 128) {
          console.error('[OpenWeb3.WebApp] Biometric reason is too long', reason);
          throw Error('WebAppBiometricRequestAccessParamInvalid');
        }
        if (reason.length > 0) {
          popup_params.reason = reason;
        }
      }

      accessRequestState = {
        callback: callback
      };
      WebView.postEvent('web_app_biometry_request_access', false, popup_params);
      return biometricManager;
    };
    biometricManager.authenticate = function(params, callback) {
      if (!checkVersion()) {
        return biometricManager;
      }
      checkInit();
      if (!isBiometricAvailable) {
        console.error('[OpenWeb3.WebApp] Biometrics is not available on this device.');
        throw Error('WebAppBiometricManagerBiometricsNotAvailable');
      }
      if (!isAccessGranted) {
        console.error('[OpenWeb3.WebApp] Biometric access was not granted by the user.');
        throw Error('WebAppBiometricManagerBiometricAccessNotGranted');
      }
      if (authRequestState) {
        console.error('[OpenWeb3.WebApp] Authentication request is already in progress.');
        throw Error('WebAppBiometricManagerAuthenticationRequested');
      }
      var popup_params = {};
      if (typeof params.reason !== 'undefined') {
        var reason = strTrim(params.reason);
        if (reason.length > 128) {
          console.error('[OpenWeb3.WebApp] Biometric reason is too long', reason);
          throw Error('WebAppBiometricRequestAccessParamInvalid');
        }
        if (reason.length > 0) {
          popup_params.reason = reason;
        }
      }

      authRequestState = {
        callback: callback
      };
      WebView.postEvent('web_app_biometry_request_auth', false, popup_params);
      return biometricManager;
    };
    biometricManager.updateBiometricToken = function(token, callback) {
      if (!checkVersion()) {
        return biometricManager;
      }
      token = token || '';
      if (token.length > 1024) {
        console.error('[OpenWeb3.WebApp] Token is too long', token);
        throw Error('WebAppBiometricManagerTokenInvalid');
      }
      checkInit();
      if (!isBiometricAvailable) {
        console.error('[OpenWeb3.WebApp] Biometrics is not available on this device.');
        throw Error('WebAppBiometricManagerBiometricsNotAvailable');
      }
      if (!isAccessGranted) {
        console.error('[OpenWeb3.WebApp] Biometric access was not granted by the user.');
        throw Error('WebAppBiometricManagerBiometricAccessNotGranted');
      }
      if (tokenRequestState) {
        console.error('[OpenWeb3.WebApp] Token request is already in progress.');
        throw Error('WebAppBiometricManagerTokenUpdateRequested');
      }
      tokenRequestState = {
        callback: callback
      };
      WebView.postEvent('web_app_biometry_update_token', false, {token: token});
      return biometricManager;
    };
    biometricManager.openSettings = function() {
      if (!checkVersion()) {
        return biometricManager;
      }
      checkInit();
      if (!isBiometricAvailable) {
        console.error('[OpenWeb3.WebApp] Biometrics is not available on this device.');
        throw Error('WebAppBiometricManagerBiometricsNotAvailable');
      }
      if (!isAccessRequested) {
        console.error('[OpenWeb3.WebApp] Biometric access was not requested yet.');
        throw Error('WebAppBiometricManagerBiometricsAccessNotRequested');
      }
      if (isAccessGranted) {
        console.warn('[OpenWeb3.WebApp] Biometric access was granted by the user, no need to go to settings.');
        return biometricManager;
      }
      WebView.postEvent('web_app_biometry_open_settings', false);
      return biometricManager;
    };
    return biometricManager;
  })();

  var webAppInvoices = {};
  function onInvoiceClosed(eventType, eventData) {
    if (eventData.slug && webAppInvoices[eventData.slug]) {
      var invoiceData = webAppInvoices[eventData.slug];
      delete webAppInvoices[eventData.slug];
      if (invoiceData.callback) {
        invoiceData.callback(eventData.status);
      }
      receiveWebViewEvent('invoiceClosed', {
        url: invoiceData.url,
        status: eventData.status
      });
    }
  }

  var webAppPopupOpened = false;
  function onPopupClosed(eventType, eventData) {
    if (webAppPopupOpened) {
      var popupData = webAppPopupOpened;
      webAppPopupOpened = false;
      var button_id = null;
      if (typeof eventData.button_id !== 'undefined') {
        button_id = eventData.button_id;
      }
      if (popupData.callback) {
        popupData.callback(button_id);
      }
      receiveWebViewEvent('popupClosed', {
        button_id: button_id
      });
    }
  }

  var webAppScanQrPopupOpened = false;
  function onQrTextReceived(eventType, eventData) {
    if (webAppScanQrPopupOpened) {
      var popupData = webAppScanQrPopupOpened;
      var data = null;
      if (typeof eventData.data !== 'undefined') {
        data = eventData.data;
      }
      if (popupData.callback) {
        if (popupData.callback(data)) {
          webAppScanQrPopupOpened = false;
          WebView.postEvent('web_app_close_scan_qr_popup', false);
        }
      }
      receiveWebViewEvent('qrTextReceived', {
        data: data
      });
    }
  }
  function onScanQrPopupClosed(eventType, eventData) {
    webAppScanQrPopupOpened = false;
  }

  function onClipboardTextReceived(eventType, eventData) {
    if (eventData.req_id && webAppCallbacks[eventData.req_id]) {
      var requestData = webAppCallbacks[eventData.req_id];
      delete webAppCallbacks[eventData.req_id];
      var data = null;
      if (typeof eventData.data !== 'undefined') {
        data = eventData.data;
      }
      if (requestData.callback) {
        requestData.callback(data);
      }
      receiveWebViewEvent('clipboardTextReceived', {
        data: data
      });
    }
  }

  var WebAppWriteAccessRequested = false;
  function onWriteAccessRequested(eventType, eventData) {
    if (WebAppWriteAccessRequested) {
      var requestData = WebAppWriteAccessRequested;
      WebAppWriteAccessRequested = false;
      if (requestData.callback) {
        requestData.callback(eventData.status == 'allowed');
      }
      receiveWebViewEvent('writeAccessRequested', {
        status: eventData.status
      });
    }
  }

  function getRequestedContact(callback, timeout) {
    var reqTo, fallbackTo, reqDelay = 0;
    var reqInvoke = function() {
      invokeCustomMethod('getRequestedContact', {}, function(err, res) {
        if (res && res.length) {
          clearTimeout(fallbackTo);
          callback(res);
        } else {
          reqDelay += 50;
          reqTo = setTimeout(reqInvoke, reqDelay);
        }
      });
    };
    var fallbackInvoke = function() {
      clearTimeout(reqTo);
      callback('');
    };
    fallbackTo = setTimeout(fallbackInvoke, timeout);
    reqInvoke();
  }

  var WebAppContactRequested = false;
  function onPhoneRequested(eventType, eventData) {
    if (WebAppContactRequested) {
      var requestData = WebAppContactRequested;
      WebAppContactRequested = false;
      var requestSent = eventData.status == 'sent';
      var webViewEvent = {
        status: eventData.status
      };
      if (requestSent) {
        getRequestedContact(function(res) {
          if (res && res.length) {
            webViewEvent.response = res;
            webViewEvent.responseUnsafe = Utils.urlParseQueryString(res);
            for (var key in webViewEvent.responseUnsafe) {
              var val = webViewEvent.responseUnsafe[key];
              try {
                if (val.substr(0, 1) == '{' && val.substr(-1) == '}' ||
                    val.substr(0, 1) == '[' && val.substr(-1) == ']') {
                  webViewEvent.responseUnsafe[key] = JSON.parse(val);
                }
              } catch (e) {}
            }
          }
          if (requestData.callback) {
            requestData.callback(requestSent, webViewEvent);
          }
          receiveWebViewEvent('contactRequested', webViewEvent);
        }, 3000);
      } else {
        if (requestData.callback) {
          requestData.callback(requestSent, webViewEvent);
        }
        receiveWebViewEvent('contactRequested', webViewEvent);
      }
    }
  }

  function onCustomMethodInvoked(eventType, eventData) {
    console.log("==============[OpenWeb3.WebApp] => onCustomMethodInvoked", eventType, eventData )
    if (eventData.req_id && webAppCallbacks[eventData.req_id]) {
      var requestData = webAppCallbacks[eventData.req_id];
      delete webAppCallbacks[eventData.req_id];
      var res = null, err = null;
      if (typeof eventData.result !== 'undefined') {
        res = eventData.result;
      }
      if (typeof eventData.error !== 'undefined') {
        err = eventData.error;
      }
      if (requestData.callback) {
        requestData.callback(err, res);
      }
    }
  }

  function invokeCustomMethod(method, params, callback) {
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method invokeCustomMethod is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    var req_id = generateCallbackId(16);
    var req_params = {req_id: req_id, method: method, params: params || {}};
    webAppCallbacks[req_id] = {
      callback: callback
    };
    WebView.postEvent('web_app_invoke_custom_method', false, req_params);
  };

  // 21、注册OpenWeb3对象
  if (!window.OpenWeb3) {
    window.OpenWeb3 = {};
  }

  // 22、WebApp定义属性和方法，通过调用WebView发送消息通讯
  Object.defineProperty(WebApp, 'initData', {
    get: function(){ return webAppInitData; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'initDataUnsafe', {
    get: function(){ return webAppInitDataUnsafe; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'version', {
    get: function(){ return webAppVersion; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'platform', {
    get: function(){ return webAppPlatform; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'colorScheme', {
    get: function(){ return colorScheme; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'themeParams', {
    get: function(){ return themeParams; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isExpanded', {
    get: function(){ return isExpanded; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'viewportHeight', {
    get: function(){ return (viewportHeight === false ? window.innerHeight : viewportHeight) - mainButtonHeight; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'viewportStableHeight', {
    get: function(){ return (viewportStableHeight === false ? window.innerHeight : viewportStableHeight) - mainButtonHeight; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isClosingConfirmationEnabled', {
    set: function(val){ setClosingConfirmation(val); },
    get: function(){ return isClosingConfirmationEnabled; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'headerColor', {
    set: function(val){ setHeaderColor(val); },
    get: function(){ return getHeaderColor(); },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'backgroundColor', {
    set: function(val){ setBackgroundColor(val); },
    get: function(){ return getBackgroundColor(); },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'BackButton', {
    value: BackButton,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'MainButton', {
    value: MainButton,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'SettingsButton', {
    value: SettingsButton,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'HapticFeedback', {
    value: HapticFeedback,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'CloudStorage', {
    value: CloudStorage,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'BiometricManager', {
    value: BiometricManager,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isVerticalSwipesEnabled', {
    set: function(val){ toggleVerticalSwipes(val); },
    get: function(){ return isVerticalSwipesEnabled; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isActionBarVisible', {
    set: function(val){ toggleHeadContainer(val); },
    get: function(){ return isActionBarVisible; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isFullScreenEnabled', {
    set: function(val){ toggleFullScreen(val); },
    get: function(){ return isFullScreenEnabled; },
    enumerable: true
  });
  WebApp.sayHello = function () {
    WebView.sayHello()
  };
  WebApp.setHeaderColor = function(color_key) {
    WebApp.headerColor = color_key;
  };
  WebApp.setBackgroundColor = function(color) {
    WebApp.backgroundColor = color;
  };
  WebApp.enableClosingConfirmation = function() {
    WebApp.isClosingConfirmationEnabled = true;
  };
  WebApp.disableClosingConfirmation = function() {
    WebApp.isClosingConfirmationEnabled = false;
  };
  WebApp.enableVerticalSwipes = function() {
    WebApp.isVerticalSwipesEnabled = true;
  };
  WebApp.disableVerticalSwipes = function() {
    WebApp.isVerticalSwipesEnabled = false;
  };
  WebApp.enableActionBar = function() {
    WebApp.isActionBarVisible = true;
  };
  WebApp.disableActionBar = function() {
    WebApp.isActionBarVisible = false;
  };
  WebApp.enableFullScreen = function() {
    WebApp.isFullScreenEnabled = true;
  };
  WebApp.disableFullScreen = function() {
    WebApp.isFullScreenEnabled = false;
  };
  WebApp.isVersionAtLeast = function(ver) {
    return versionAtLeast(ver);
  };
  WebApp.onEvent = function(eventType, callback) {
    onWebViewEvent(eventType, callback);
  };
  WebApp.offEvent = function(eventType, callback) {offWebViewEvent(eventType, callback);
  };
  WebApp.sendData = function (data) {
    if (!data || !data.length) {
      console.error('[OpenWeb3.WebApp] Data is required', data);
      throw Error('WebAppDataInvalid');
    }
    if (byteLength(data) > 4096) {
      console.error('[OpenWeb3.WebApp] Data is too long', data);
      throw Error('WebAppDataInvalid');
    }
    WebView.postEvent('web_app_data_send', false, {data: data});
  };
  WebApp.switchInlineQuery = function (query, choose_chat_types) {
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method switchInlineQuery is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (!initParams.tgWebAppBotInline) {
      console.error('[OpenWeb3.WebApp] Inline mode is disabled for this bot. Read more about inline mode: https://core.OpenWeb3.org/bots/inline');
      throw Error('WebAppInlineModeDisabled');
    }
    query = query || '';
    if (query.length > 256) {
      console.error('[OpenWeb3.WebApp] Inline query is too long', query);
      throw Error('WebAppInlineQueryInvalid');
    }
    var chat_types = [];
    if (choose_chat_types) {
      if (!Array.isArray(choose_chat_types)) {
        console.error('[OpenWeb3.WebApp] Choose chat types should be an array', choose_chat_types);
        throw Error('WebAppInlineChooseChatTypesInvalid');
      }
      var good_types = {users: 1, bots: 1, groups: 1, channels: 1};
      for (var i = 0; i < choose_chat_types.length; i++) {
        var chat_type = choose_chat_types[i];
        if (!good_types[chat_type]) {
          console.error('[OpenWeb3.WebApp] Choose chat type is invalid', chat_type);
          throw Error('WebAppInlineChooseChatTypeInvalid');
        }
        if (good_types[chat_type] != 2) {
          good_types[chat_type] = 2;
          chat_types.push(chat_type);
        }
      }
    }
    WebView.postEvent('web_app_switch_inline_query', false, {query: query, chat_types: chat_types});
  };
  WebApp.openLink = function (url, options) {
    var a = document.createElement('A');
    a.href = url;
    if (a.protocol != 'http:' &&
        a.protocol != 'https:') {
      console.error('[OpenWeb3.WebApp] Url protocol is not supported', url);
      throw Error('WebAppTgUrlInvalid');
    }
    var url = a.href;
    options = options || {};
    if (versionAtLeast('1.0')) {
      WebView.postEvent('web_app_open_link', false, {url: url, try_instant_view: versionAtLeast('1.0') && !!options.try_instant_view});
    } else {
      window.open(url, '_blank');
    }
  };
  WebApp.openWebAppLink = function (url) {
    var a = document.createElement('A');
    a.href = url;
    if (a.protocol != 'http:' &&
        a.protocol != 'https:') {
      console.error('[OpenWeb3.WebApp] Url protocol is not supported', url);
      throw Error('WebAppUrlInvalid');
    }
    if (a.hostname != 'openweb3.io') {
      console.error('[OpenWeb3.WebApp] Url host is not supported', url);
      throw Error('WebAppTgUrlInvalid');
    }
    var path_full = a.pathname + a.search;
    if (isIframe || versionAtLeast('1.0')) {
      WebView.postEvent('web_app_open_webapp_link', false, {path_full: path_full});
    } else {
      location.href = 'https://openweb3.io' + path_full;
    }
  };
  WebApp.openInvoice = function (url, callback) {
    var a = document.createElement('A'), match, slug;
    a.href = url;
    if (a.protocol != 'http:' &&
        a.protocol != 'https:' ||
        a.hostname != 'openweb3.io' ||
        !(match = a.pathname.match(/^\/(\$|invoice\/)([A-Za-z0-9\-_=]+)$/)) ||
        !(slug = match[2])) {
      console.error('[OpenWeb3.WebApp] Invoice url is invalid', url);
      throw Error('WebAppInvoiceUrlInvalid');
    }
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method openInvoice is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (webAppInvoices[slug]) {
      console.error('[OpenWeb3.WebApp] Invoice is already opened');
      throw Error('WebAppInvoiceOpened');
    }
    webAppInvoices[slug] = {
      url: url,
      callback: callback
    };
    WebView.postEvent('web_app_open_invoice', false, {slug: slug});
  };
  WebApp.showPopup = function (params, callback) {
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method showPopup is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (webAppPopupOpened) {
      console.error('[OpenWeb3.WebApp] Popup is already opened');
      throw Error('WebAppPopupOpened');
    }
    var title = '';
    var message = '';
    var buttons = [];
    var popup_buttons = {};
    var popup_params = {};
    if (typeof params.title !== 'undefined') {
      title = strTrim(params.title);
      if (title.length > 64) {
        console.error('[OpenWeb3.WebApp] Popup title is too long', title);
        throw Error('WebAppPopupParamInvalid');
      }
      if (title.length > 0) {
        popup_params.title = title;
      }
    }
    if (typeof params.message !== 'undefined') {
      message = strTrim(params.message);
    }
    if (!message.length) {
      console.error('[OpenWeb3.WebApp] Popup message is required', params.message);
      throw Error('WebAppPopupParamInvalid');
    }
    if (message.length > 256) {
      console.error('[OpenWeb3.WebApp] Popup message is too long', message);
      throw Error('WebAppPopupParamInvalid');
    }
    popup_params.message = message;
    if (typeof params.buttons !== 'undefined') {
      if (!Array.isArray(params.buttons)) {
        console.error('[OpenWeb3.WebApp] Popup buttons should be an array', params.buttons);
        throw Error('WebAppPopupParamInvalid');
      }
      for (var i = 0; i < params.buttons.length; i++) {
        var button = params.buttons[i];
        var btn = {};
        var id = '';
        if (typeof button.id !== 'undefined') {
          id = button.id.toString();
          if (id.length > 64) {
            console.error('[OpenWeb3.WebApp] Popup button id is too long', id);
            throw Error('WebAppPopupParamInvalid');
          }
        }
        btn.id = id;
        var button_type = button.type;
        if (typeof button_type === 'undefined') {
          button_type = 'default';
        }
        btn.type = button_type;
        if (button_type == 'ok' ||
            button_type == 'close' ||
            button_type == 'cancel') {
          // no params needed
        } else if (button_type == 'default' ||
            button_type == 'destructive') {
          var text = '';
          if (typeof button.text !== 'undefined') {
            text = strTrim(button.text);
          }
          if (!text.length) {
            console.error('[OpenWeb3.WebApp] Popup button text is required for type ' + button_type, button.text);
            throw Error('WebAppPopupParamInvalid');
          }
          if (text.length > 64) {
            console.error('[OpenWeb3.WebApp] Popup button text is too long', text);
            throw Error('WebAppPopupParamInvalid');
          }
          btn.text = text;
        } else {
          console.error('[OpenWeb3.WebApp] Popup button type is invalid', button_type);
          throw Error('WebAppPopupParamInvalid');
        }
        buttons.push(btn);
      }
    } else {
      buttons.push({id: '', type: 'close'});
    }
    if (buttons.length < 1) {
      console.error('[OpenWeb3.WebApp] Popup should have at least one button');
      throw Error('WebAppPopupParamInvalid');
    }
    if (buttons.length > 3) {
      console.error('[OpenWeb3.WebApp] Popup should not have more than 3 buttons');
      throw Error('WebAppPopupParamInvalid');
    }
    popup_params.buttons = buttons;

    webAppPopupOpened = {
      callback: callback
    };
    WebView.postEvent('web_app_open_popup', false, popup_params);
  };
  WebApp.showAlert = function (message, callback) {
    WebApp.showPopup({
      message: message
    }, callback ? function(){ callback(); } : null);
  };
  WebApp.showConfirm = function (message, callback) {
    WebApp.showPopup({
      message: message,
      buttons: [
        {type: 'ok', id: 'ok'},
        {type: 'cancel'}
      ]
    }, callback ? function (button_id) {
      callback(button_id == 'ok');
    } : null);
  };
  WebApp.showScanQrPopup = function (params, callback) {
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method showScanQrPopup is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (webAppScanQrPopupOpened) {
      console.error('[OpenWeb3.WebApp] Popup is already opened');
      throw Error('WebAppScanQrPopupOpened');
    }
    var text = '';
    var popup_params = {};
    if (typeof params.text !== 'undefined') {
      text = strTrim(params.text);
      if (text.length > 64) {
        console.error('[OpenWeb3.WebApp] Scan QR popup text is too long', text);
        throw Error('WebAppScanQrPopupParamInvalid');
      }
      if (text.length > 0) {
        popup_params.text = text;
      }
    }

    webAppScanQrPopupOpened = {
      callback: callback
    };
    WebView.postEvent('web_app_open_scan_qr_popup', false, popup_params);
  };
  WebApp.closeScanQrPopup = function () {
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method closeScanQrPopup is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }

    webAppScanQrPopupOpened = false;
    WebView.postEvent('web_app_close_scan_qr_popup', false);
  };
  WebApp.readTextFromClipboard = function (callback) {
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method readTextFromClipboard is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    var req_id = generateCallbackId(16);
    var req_params = {req_id: req_id};
    webAppCallbacks[req_id] = {
      callback: callback
    };
    WebView.postEvent('web_app_read_text_from_clipboard', false, req_params);
  };
  WebApp.requestWriteAccess = function (callback) {
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method requestWriteAccess is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (WebAppWriteAccessRequested) {
      console.error('[OpenWeb3.WebApp] Write access is already requested');
      throw Error('WebAppWriteAccessRequested');
    }
    WebAppWriteAccessRequested = {
      callback: callback
    };
    WebView.postEvent('web_app_request_write_access');
  };
  WebApp.requestContact = function (callback) {
    if (!versionAtLeast('1.0')) {
      console.error('[OpenWeb3.WebApp] Method requestContact is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (WebAppContactRequested) {
      console.error('[OpenWeb3.WebApp] Contact is already requested');
      throw Error('WebAppContactRequested');
    }
    WebAppContactRequested = {
      callback: callback
    };
    WebView.postEvent('web_app_request_phone');
  };
  WebApp.invokeCustomMethod = function (method, params, callback) {
    invokeCustomMethod(method, params, callback);
  };
  WebApp.ready = function () {
    WebView.postEvent('web_app_ready');
  };
  WebApp.expand = function () {
    WebView.postEvent('web_app_expand');
  };
  WebApp.close = function () {
    WebView.postEvent('web_app_close');
  };

  // 23、注册OpenWeb3.WebApp对象，即WebApp对象，提供给H5使用的对象，完成JS到Navive的通讯
  window.OpenWeb3.WebApp = WebApp;

  updateHeaderColor();
  updateBackgroundColor();
  setViewportHeight();
  if (initParams.tgWebAppShowSettings) {
    SettingsButton.show();
  }

  window.addEventListener('resize', onWindowResize);
  if (isIframe) {
    document.addEventListener('click', linkHandler);
  }

  // 24、监听WebView的消息事件，完成Native消息到JS的监听
  WebView.onEvent('theme_changed', onThemeChanged);
  WebView.onEvent('viewport_changed', onViewportChanged);
  WebView.onEvent('invoice_closed', onInvoiceClosed);
  WebView.onEvent('popup_closed', onPopupClosed);
  WebView.onEvent('qr_text_received', onQrTextReceived);
  WebView.onEvent('scan_qr_popup_closed', onScanQrPopupClosed);
  WebView.onEvent('clipboard_text_received', onClipboardTextReceived);
  WebView.onEvent('write_access_requested', onWriteAccessRequested);
  WebView.onEvent('phone_requested', onPhoneRequested);
  WebView.onEvent('custom_method_invoked', onCustomMethodInvoked);
  WebView.postEvent('web_app_request_theme');
  WebView.postEvent('web_app_request_viewport');

  console.log("==============[OpenWeb3.WebApp] init Finish!")

})();
