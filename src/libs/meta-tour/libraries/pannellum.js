/* eslint-disable */
import utils from "@/utils";
import libpannellum from "./libpannellum";
export default (function (window, document, undefined) {
  /**
   * @param {*} container
   * @param {*} initialConfig
   */
  function Viewer(container, initialConfig) {
    var _this = this;
    var config,
      renderer,
      preview,
      draggingHotSpot,
      isUserInteracting = false,
      latestInteraction = Date.now(),
      onPointerDownPointerX = 0,
      onPointerDownPointerY = 0,
      onPointerDownPointerDist = -1,
      onPointerDownYaw = 0,
      onPointerDownPitch = 0,
      keysDown = new Array(10),
      fullscreenActive = false,
      loaded,
      error = false,
      listenersAdded = false,
      panoImage,
      prevTime,
      speed = { yaw: 0, pitch: 0, hfov: 0 },
      animating = false,
      orientation = false,
      orientationYawOffset = 0,
      autoRotateStart,
      autoRotateSpeed = 0,
      origHfov,
      origPitch,
      animatedMove = {},
      externalEventListeners = {},
      specifiedPhotoSphereExcludes = [],
      update = false,
      eps = 1e-6,
      hotspotsCreated = false,
      destroyed = false;

    var defaultConfig = {
      hfov: 100,
      minHfov: 50,
      multiResMinHfov: false,
      maxHfov: 120,
      pitch: 0,
      minPitch: -90,
      maxPitch: 90,
      yaw: 0,
      minYaw: -180,
      maxYaw: 180,
      roll: 0,
      haov: 360,
      vaov: 180,
      vOffset: 0,
      loading: true,
      autoRotate: false,
      autoRotateInactivityDelay: -1,
      autoRotateStopDelay: 0,
      type: "equirectangular",
      northOffset: 0,
      showFullscreenCtrl: true,
      dynamic: false,
      dynamicUpdate: false,
      doubleClickZoom: true,
      keyboardZoom: true,
      mouseZoom: true,
      showZoomCtrl: true,
      autoLoad: true,
      showControls: true,
      customControls: false,
      orientationOnByDefault: false,
      hotSpotDebug: false,
      backgroundColor: [0, 0, 0],
      avoidShowingBackground: false,
      animationTimingFunction: timingFunction,
      draggable: true,
      draggableHotSpot: false,
      disableKeyboardCtrl: false,
      crossOrigin: "anonymous",
      touchPanSpeedCoeffFactor: 1,
      capturedKeyNumbers: [
        16, 17, 27, 37, 38, 39, 40, 61, 65, 68, 83, 87, 107, 109, 173, 187, 189,
      ],
      friction: 0.15,
    };

    defaultConfig.uiText = {
      loadButtonLabel: "Bấm để tải <br/> toàn cảnh",
      loadingLabel: "Đang tải...",
      bylineLabel: "bởi %s",
      noPanoramaError: "Không có hình ảnh nào được chỉ định.",
      fileAccessError: "Không thể truy cập %s.",
      malformedURLError: "Đã xảy ra sự cố với đường dẫn ảnh.",
      iOS8WebGLError:
        "Do triển khai WebGL của iOS 8 bị hỏng, chỉ " +
        "JPEG được mã hóa liên tục hoạt động cho thiết bị của bạn " +
        "(toàn cảnh này sử dụng mã hóa tiêu chuẩn).",
      genericWebGLError:
        "Trình duyệt của bạn không có hỗ trợ WebGL cần thiết để hiển thị ảnh toàn cảnh này.",
      textureSizeError:
        "Ảnh toàn cảnh này quá lớn đối với thiết bị của bạn!" +
        "Nó rộng %spx, nhưng thiết bị của bạn chỉ hỗ trợ hình ảnh có chiều rộng tối đa %spx. " +
        ". Hãy thử một thiết bị khác." +
        " (Nếu bạn là tác giả, hãy thử thu nhỏ hình ảnh)",
      unknownError:
        "Lỗi không rõ. Kiểm tra bảng điều khiển dành cho nhà phát triển.",
    };

    // Khởi tạo vùng chứa
    container =
      typeof container === "string"
        ? document.getElementById(container)
        : container;
    container.classList.add("pnlm-container");
    container.tabIndex = 0;

    // Tạo vùng chứa cho ui
    var uiContainer = document.createElement("div");
    uiContainer.className = "pnlm-ui";
    container.appendChild(uiContainer);

    // Tạo vùng chứa cho trình kết xuất
    var renderContainer = document.createElement("div");
    renderContainer.className = "pnlm-render-container";
    container.appendChild(renderContainer);
    var dragFix = document.createElement("div");
    dragFix.className = "pnlm-dragfix";
    uiContainer.appendChild(dragFix);

    // Tắt sự kiện right click (contextmenu)
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    var infoDisplay = {};

    // Hot spot debug indicator
    var hotSpotDebugIndicator = document.createElement("div");
    hotSpotDebugIndicator.className =
      "pnlm-sprite pnlm-hot-spot-debug-indicator";
    uiContainer.appendChild(hotSpotDebugIndicator);

    // Panorama info
    infoDisplay.container = document.createElement("div");
    infoDisplay.container.className = "pnlm-panorama-info";
    infoDisplay.title = document.createElement("div");
    infoDisplay.title.className = "pnlm-title-box";
    infoDisplay.container.appendChild(infoDisplay.title);
    infoDisplay.description = document.createElement("div");
    infoDisplay.description.className = "pnlm-description-box";
    infoDisplay.container.appendChild(infoDisplay.description);
    infoDisplay.author = document.createElement("div");
    infoDisplay.author.className = "pnlm-author-box";
    infoDisplay.container.appendChild(infoDisplay.author);
    uiContainer.appendChild(infoDisplay.container);

    // Loading ui
    infoDisplay.load = {};
    infoDisplay.loadingPano = document.getElementById("loading_pano");
    infoDisplay.load.box = document.createElement("div");
    infoDisplay.load.box.className = "pnlm-load-box";
    infoDisplay.load.boxp = document.createElement("p");
    infoDisplay.load.box.appendChild(infoDisplay.load.boxp);
    infoDisplay.load.lbox = document.createElement("div");
    infoDisplay.load.lbox.className = "pnlm-lbox";
    infoDisplay.load.lbox.innerHTML = '<div class="pnlm-loading"></div>';
    infoDisplay.load.box.appendChild(infoDisplay.load.lbox);
    infoDisplay.load.lbar = document.createElement("div");
    infoDisplay.load.lbar.className = "pnlm-lbar";
    infoDisplay.load.lbarFill = document.createElement("div");
    infoDisplay.load.lbarFill.className = "pnlm-lbar-fill";
    infoDisplay.load.lbar.appendChild(infoDisplay.load.lbarFill);
    infoDisplay.load.box.appendChild(infoDisplay.load.lbar);
    infoDisplay.load.msg = document.createElement("p");
    infoDisplay.load.msg.className = "pnlm-lmsg";
    infoDisplay.load.box.appendChild(infoDisplay.load.msg);
    uiContainer.appendChild(infoDisplay.load.box);

    // Error message ui
    infoDisplay.errorMsg = document.createElement("div");
    infoDisplay.errorMsg.className = "pnlm-error-msg pnlm-info-box";
    uiContainer.appendChild(infoDisplay.errorMsg);

    // Create controls
    var controls = {};
    controls.container = document.createElement("div");
    controls.container.className = "pnlm-controls-container";
    uiContainer.appendChild(controls.container);

    // Load Button
    controls.load = document.createElement("div");
    controls.load.className = "pnlm-load-button";
    controls.load.addEventListener("click", function () {
      processOptions();
      load();
    });
    uiContainer.appendChild(controls.load);

    // Zoom controls
    controls.zoom = document.createElement("div");
    controls.zoom.className = "pnlm-zoom-controls pnlm-controls";
    controls.zoomIn = document.createElement("div");
    controls.zoomIn.className = "pnlm-zoom-in pnlm-sprite pnlm-control";
    controls.zoomIn.addEventListener("click", zoomIn);
    controls.zoom.appendChild(controls.zoomIn);
    controls.zoomOut = document.createElement("div");
    controls.zoomOut.className = "pnlm-zoom-out pnlm-sprite pnlm-control";
    controls.zoomOut.addEventListener("click", zoomOut);
    controls.zoom.appendChild(controls.zoomOut);
    controls.container.appendChild(controls.zoom);

    // Fullscreen controls
    controls.fullscreen = document.createElement("div");
    controls.fullscreen.addEventListener("click", toggleFullscreen);

    if (initialConfig.default.customControls) {
      controls.fullscreen.className =
        "button-control button-control-fullscreen";
      controls.fullscreen.icon = document.createElement("i");
      controls.fullscreen.icon.className = "fa fa-expand";
      controls.fullscreen.appendChild(controls.fullscreen.icon);
    } else {
      controls.fullscreen.className =
        "pnlm-fullscreen-toggle-button pnlm-sprite pnlm-fullscreen-toggle-button-inactive pnlm-controls pnlm-control";
    }

    if (
      document.fullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.msFullscreenEnabled
    ) {
      if (initialConfig.default.customControls) {
        container.appendChild(controls.fullscreen);
      } else {
        controls.container.appendChild(controls.fullscreen);
      }
    }

    controls.orientation = document.createElement("div");
    controls.orientation.addEventListener("click", function () {
      if (orientation) stopOrientation();
      else startOrientation();
    });
    controls.orientation.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
    controls.orientation.addEventListener("touchstart", function (e) {
      e.stopPropagation();
    });
    controls.orientation.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
    });
    controls.orientation.className =
      "pnlm-orientation-button pnlm-orientation-button-inactive pnlm-sprite pnlm-controls pnlm-control";
    var orientationSupport = false;

    if (utils.isMobileOrIOS) {
      controls.container.appendChild(controls.orientation);
      orientationSupport = true;
    }

    if (initialConfig.firstScene) {
      mergeConfig(initialConfig.firstScene);
    } else if (initialConfig.default && initialConfig.default.firstScene) {
      mergeConfig(initialConfig.default.firstScene);
    } else {
      mergeConfig(null);
    }
    processOptions(true);

    /**
     * Khởi tạo
     * @returns
     */
    function init() {
      var div = document.createElement("div");
      div.innerHTML = "<!--[if lte IE 9]><i></i><![endif]-->";
      if (div.getElementsByTagName("i").length === 1) {
        anError();
        return;
      }
      origHfov = config.hfov;
      origPitch = config.pitch;
      var i, p;
      if (config.type === "cubemap") {
        panoImage = [];
        for (i = 0; i < 6; i++) {
          panoImage.push(new Image());
          panoImage[i].crossOrigin = config.crossOrigin;
        }
        infoDisplay.load.lbox.style.display = "block";
        infoDisplay.load.lbar.style.display = "none";
      } else if (config.type === "multires") {
        var c = JSON.parse(JSON.stringify(config.multiRes));
        if (
          config.basePath &&
          config.multiRes.basePath &&
          !/^(?:[a-z]+:)?\/\//i.test(config.multiRes.basePath)
        ) {
          c.basePath = config.basePath + config.multiRes.basePath;
        } else if (config.multiRes.basePath) {
          c.basePath = config.multiRes.basePath;
        } else if (config.basePath) {
          c.basePath = config.basePath;
        }
        panoImage = c;
      } else {
        if (config.dynamic === true) {
          panoImage = config.image;
        } else {
          if (config.image === undefined) {
            anError(config.uiText.noPanoramaError);
            return;
          }
          panoImage = new Image();
        }
      }
      // Cấu hnhf tải hình ảnh
      if (config.type === "cubemap") {
        var itemsToLoad = 6;
        var onLoad = function () {
          itemsToLoad--;
          if (itemsToLoad === 0) {
            onImageLoad();
          }
        };
        var onError = function (e) {
          var a = document.createElement("a");
          a.href = e.target.src;
          a.innerHTML = a.href;
          anError(config.uiText.fileAccessError.replace("%s", a.outerHTML));
        };
        for (i = 0; i < panoImage.length; i++) {
          panoImage[i].onload = onLoad;
          panoImage[i].onerror = onError;
          p = config.cubeMap[i];
          if (p === "null") {
            onLoad();
          } else {
            if (config.basePath && !absoluteURL(p)) {
              p = config.basePath + p;
            }
            panoImage[i].onload = onLoad;
            panoImage[i].onerror = onError;
            panoImage[i].src = sanitizeURL(p);
            //panoImage[i].src = encodeURI(p);
          }
        }
      } else if (config.type === "multires") {
        onImageLoad();
      } else {
        p = "";
        if (config.basePath) {
          p = config.basePath;
        }
        if (config.dynamic !== true) {
          // Ảnh tĩnh
          p = absoluteURL(config.image) ? config.image : p + config.image;
          panoImage.onload = function () {
            window.URL.revokeObjectURL(this.src);
            onImageLoad();
          };
          var xhr = new XMLHttpRequest();
          xhr.onloadend = function () {
            if (xhr.status != 200) {
              // Lỗi hiển thị khi không tải được hình ảnh
              var a = document.createElement("a");
              a.href = p;
              a.textContent = a.href;
              anError(config.uiText.fileAccessError.replace("%s", a.outerHTML));
            }
            var img = this.response;
            if (img) {
              parseGPanoXMP(img);
            }
            infoDisplay.load.msg.innerHTML = "";
          };
          xhr.onprogress = function (e) {
            if (e.lengthComputable) {
              // Hiển thị tiến trình tải (theo phần trăm)
              var percent = (e.loaded / e.total) * 100;
              infoDisplay.load.lbarFill.style.width = percent + "%";
              var unit, numerator, denominator;
              if (e.total > 1e6) {
                unit = "MB";
                numerator = (e.loaded / 1e6).toFixed(2);
                denominator = (e.total / 1e6).toFixed(2);
              } else if (e.total > 1e3) {
                unit = "kB";
                numerator = (e.loaded / 1e3).toFixed(1);
                denominator = (e.total / 1e3).toFixed(1);
              } else {
                unit = "B";
                numerator = e.loaded;
                denominator = e.total;
              }
              infoDisplay.load.msg.innerHTML =
                numerator + " / " + denominator + " " + unit;
            } else {
              // Hiển thị tiến trình tải theo dạo vòng quay
              infoDisplay.load.lbox.style.display = "block";
              infoDisplay.load.lbar.style.display = "none";
            }
          };
          try {
            xhr.open("GET", p, true);
          } catch (e) {
            anError(config.uiText.malformedURLError);
          }
          xhr.responseType = "blob";
          xhr.setRequestHeader("Accept", "image/*,*/*;q=0.9");
          xhr.withCredentials = config.crossOrigin === "use-credentials";
          xhr.send();
        }
      }
      if (config.draggable) uiContainer.classList.add("pnlm-grab");
      uiContainer.classList.remove("pnlm-grabbing");
      update = config.dynamicUpdate === true;
      if (config.dynamic && update) {
        panoImage = config.panorama;
        onImageLoad();
      }
    }

    function absoluteURL(url) {
      return (
        new RegExp("^(?:[a-z]+:)?//", "i").test(url) ||
        url[0] === "/" ||
        url.slice(0, 5) === "blob:"
      );
    }

    function onImageLoad() {
      if (!renderer) renderer = new libpannellum.renderer(renderContainer);

      // Only add event listeners once
      if (!listenersAdded) {
        listenersAdded = true;
        dragFix.addEventListener("mousedown", onDocumentMouseDown, false);
        document.addEventListener("mousemove", onDocumentMouseMove, false);
        document.addEventListener("mouseup", onDocumentMouseUp, false);

        if (config.mouseZoom) {
          uiContainer.addEventListener(
            "mousewheel",
            onDocumentMouseWheel,
            false
          );
          uiContainer.addEventListener(
            "DOMMouseScroll",
            onDocumentMouseWheel,
            false
          );
        }
        if (config.doubleClickZoom) {
          dragFix.addEventListener("dblclick", onDocumentDoubleClick, false);
        }
        container.addEventListener(
          "mozfullscreenchange",
          onFullScreenChange,
          false
        );
        container.addEventListener(
          "webkitfullscreenchange",
          onFullScreenChange,
          false
        );
        container.addEventListener(
          "msfullscreenchange",
          onFullScreenChange,
          false
        );
        container.addEventListener(
          "fullscreenchange",
          onFullScreenChange,
          false
        );
        window.addEventListener("resize", onDocumentResize, false);
        window.addEventListener("orientationchange", onDocumentResize, false);
        if (!config.disableKeyboardCtrl) {
          container.addEventListener("keydown", onDocumentKeyPress, false);
          container.addEventListener("keyup", onDocumentKeyUp, false);
          container.addEventListener("blur", clearKeys, false);
        }
        document.addEventListener("mouseleave", onDocumentMouseUp, false);
        if (
          document.documentElement.style.pointerAction === "" &&
          document.documentElement.style.touchAction === ""
        ) {
          dragFix.addEventListener("pointerdown", onDocumentPointerDown, false);
          dragFix.addEventListener("pointermove", onDocumentPointerMove, false);
          dragFix.addEventListener("pointerup", onDocumentPointerUp, false);
          dragFix.addEventListener("pointerleave", onDocumentPointerUp, false);
        } else {
          dragFix.addEventListener("touchstart", onDocumentTouchStart, false);
          dragFix.addEventListener("touchmove", onDocumentTouchMove, false);
          dragFix.addEventListener("touchend", onDocumentTouchEnd, false);
        }

        // Deal with MS pointer events
        if (window.navigator.pointerEnabled)
          container.style.touchAction = "none";
      }

      renderInit();
      setHfov(config.hfov); // possibly adapt hfov after configuration and canvas is complete; prevents empty space on top or bottom by zomming out too much
    }

    function parseGPanoXMP(image) {
      var reader = new FileReader();
      reader.addEventListener("loadend", function () {
        var img = reader.result;

        // This awful browser specific test exists because iOS 8 does not work
        // with non-progressive encoded JPEGs.
        if (
          navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 8_/)
        ) {
          var flagIndex = img.indexOf("\xff\xc2");
          if (flagIndex < 0 || flagIndex > 65536)
            anError(config.uiText.iOS8WebGLError);
        }

        var start = img.indexOf("<x:xmpmeta");
        if (start > -1 && config.ignoreGPanoXMP !== true) {
          var xmpData = img.substring(start, img.indexOf("</x:xmpmeta>") + 12);

          // Extract the requested tag from the XMP data
          var getTag = function (tag) {
            var result;
            if (xmpData.indexOf(tag + '="') >= 0) {
              result = xmpData.substring(
                xmpData.indexOf(tag + '="') + tag.length + 2
              );
              result = result.substring(0, result.indexOf('"'));
            } else if (xmpData.indexOf(tag + ">") >= 0) {
              result = xmpData.substring(
                xmpData.indexOf(tag + ">") + tag.length + 1
              );
              result = result.substring(0, result.indexOf("<"));
            }
            if (result !== undefined) {
              return Number(result);
            }
            return null;
          };

          // Relevant XMP data
          var xmp = {
            fullWidth: getTag("GPano:FullPanoWidthPixels"),
            croppedWidth: getTag("GPano:CroppedAreaImageWidthPixels"),
            fullHeight: getTag("GPano:FullPanoHeightPixels"),
            croppedHeight: getTag("GPano:CroppedAreaImageHeightPixels"),
            topPixels: getTag("GPano:CroppedAreaTopPixels"),
            heading: getTag("GPano:PoseHeadingDegrees"),
            horizonPitch: getTag("GPano:PosePitchDegrees"),
            horizonRoll: getTag("GPano:PoseRollDegrees"),
          };

          if (
            xmp.fullWidth !== null &&
            xmp.croppedWidth !== null &&
            xmp.fullHeight !== null &&
            xmp.croppedHeight !== null &&
            xmp.topPixels !== null
          ) {
            // Set up viewer using GPano XMP data
            if (specifiedPhotoSphereExcludes.indexOf("haov") < 0)
              config.haov = (xmp.croppedWidth / xmp.fullWidth) * 360;
            if (specifiedPhotoSphereExcludes.indexOf("vaov") < 0)
              config.vaov = (xmp.croppedHeight / xmp.fullHeight) * 180;
            if (specifiedPhotoSphereExcludes.indexOf("vOffset") < 0)
              config.vOffset =
                ((xmp.topPixels + xmp.croppedHeight / 2) / xmp.fullHeight -
                  0.5) *
                -180;
            if (
              xmp.heading !== null &&
              specifiedPhotoSphereExcludes.indexOf("northOffset") < 0
            ) {
              // TODO: make sure this works correctly for partial panoramas
              config.northOffset = xmp.heading;
              if (config.compass !== false) {
                config.compass = true;
              }
            }
            if (xmp.horizonPitch !== null && xmp.horizonRoll !== null) {
              if (specifiedPhotoSphereExcludes.indexOf("horizonPitch") < 0)
                config.horizonPitch = xmp.horizonPitch;
              if (specifiedPhotoSphereExcludes.indexOf("horizonRoll") < 0)
                config.horizonRoll = xmp.horizonRoll;
            }

            // TODO: add support for initial view settings
          }
        }

        // Load panorama
        panoImage.src = window.URL.createObjectURL(image);
      });
      if (reader.readAsBinaryString !== undefined) {
        reader.readAsBinaryString(image);
      } else {
        reader.readAsText(image);
      }
    }

    /**
     * @param {*} errorMsg
     */
    function anError(errorMsg) {
      if (errorMsg === undefined) errorMsg = config.uiText.genericWebGLError;
      infoDisplay.errorMsg.innerHTML = "<p>" + errorMsg + "</p>";
      controls.load.style.display = "none";
      infoDisplay.load.box.style.display = "none";
      infoDisplay.errorMsg.style.display = "none";
      error = true;
      loaded = undefined;
      renderContainer.style.display = "none";
      fireEvent("error", errorMsg);
    }

    function clearError() {
      if (error) {
        infoDisplay.load.box.style.display = "none";
        infoDisplay.errorMsg.style.display = "none";
        error = false;
        renderContainer.style.display = "block";
        fireEvent("errorcleared");
      }
    }

    /**
     * Vị trí chuột
     * @param {*} event
     * @returns
     */
    function mousePosition(event) {
      var bounds = container.getBoundingClientRect();
      var pos = {};
      // pageX / pageY needed for iOS
      pos.x = (event.clientX || event.pageX) - bounds.left;
      pos.y = (event.clientY || event.pageY) - bounds.top;
      return pos;
    }

    /**
     * Sự kiện nhấp và giữ chuột
     * @param {*} event
     * @returns
     */
    function onDocumentMouseDown(event) {
      event.preventDefault();
      container.focus();
      // Không thực hiện khi ảnh chưa được tải xong
      if (!loaded || !config.draggable || config.draggingHotSpot) {
        return;
      }
      // Tính toán vị trí chuột so với trên cùng bên trái của vùng chứa trình xem
      var pos = mousePosition(event);
      // Ghi lại cao độ / thao tác nhấp chuột khi gỡ lỗi / đặt các hotspots
      if (config.hotSpotDebug) {
        var coords = mouseEventToCoords(event);
        console.log(
          "Pitch: " +
            coords[0] +
            ", Yaw: " +
            coords[1] +
            ", Center Pitch: " +
            config.pitch +
            ", Center Yaw: " +
            config.yaw +
            ", HFOV: " +
            config.hfov
        );
      }
      stopAnimation();
      stopOrientation();
      config.roll = 0;
      speed.hfov = 0;
      isUserInteracting = true;
      latestInteraction = Date.now();
      onPointerDownPointerX = pos.x;
      onPointerDownPointerY = pos.y;
      onPointerDownYaw = config.yaw;
      onPointerDownPitch = config.pitch;
      uiContainer.classList.add("pnlm-grabbing");
      uiContainer.classList.remove("pnlm-grab");
      fireEvent("mousedown", event);
      animateInit();
    }

    /**
     * Sự kiện nhả chuột
     * @param {*} event
     * @returns
     */
    function onDocumentMouseUp(event) {
      draggingHotSpot = null;
      if (!isUserInteracting) {
        return;
      }
      isUserInteracting = false;
      if (Date.now() - latestInteraction > 15) {
        // Ngăn hiện tượng nhảy khi người dùng di chuyển nhanh chuột, dừng, sau đó thả nút chuột
        speed.pitch = speed.yaw = 0;
      }
      uiContainer.classList.add("pnlm-grab");
      uiContainer.classList.remove("pnlm-grabbing");
      latestInteraction = Date.now();
      fireEvent("mouseup", event);
    }

    /**
     * Sự kiện di chuyển chuột
     * @param {*} event
     */
    function onDocumentMouseMove(event) {
      if (draggingHotSpot) {
        moveHotSpot(draggingHotSpot, event);
      } else if (isUserInteracting && loaded) {
        latestInteraction = Date.now();
        var canvas = renderer.getCanvas();
        var canvasWidth = canvas.clientWidth,
          canvasHeight = canvas.clientHeight;
        var pos = mousePosition(event);
        var yaw =
          ((((Math.atan((onPointerDownPointerX / canvasWidth) * 2 - 1) -
            Math.atan((pos.x / canvasWidth) * 2 - 1)) *
            180) /
            Math.PI) *
            config.hfov) /
            90 +
          onPointerDownYaw;
        speed.yaw = ((yaw - config.yaw) % 360) * 0.2;
        config.yaw = yaw;
        var vfov =
          (2 *
            Math.atan(
              (Math.tan((config.hfov / 360) * Math.PI) * canvasHeight) /
                canvasWidth
            ) *
            180) /
          Math.PI;
        var pitch =
          ((((Math.atan((pos.y / canvasHeight) * 2 - 1) -
            Math.atan((onPointerDownPointerY / canvasHeight) * 2 - 1)) *
            180) /
            Math.PI) *
            vfov) /
            90 +
          onPointerDownPitch;
        speed.pitch = (pitch - config.pitch) * 0.2;
        config.pitch = pitch;
        fireEvent("mousemove", event);
      }
    }

    /**
     * Sự kiện kích đúp
     * @param {*} event
     */
    function onDocumentDoubleClick(event) {
      if (config.minHfov === config.hfov) {
        _this.setHfov(origHfov, 1000);
      } else {
        var coords = mouseEventToCoords(event);
        _this.lookAt(coords[0], coords[1], config.minHfov, 1000);
      }
    }

    /**
     * bắt đầu sự kiện chạm
     * @param {*} event
     * @returns
     */
    function onDocumentTouchStart(event) {
      // Only do something if the panorama is loaded
      if (!loaded || !config.draggable) {
        return;
      }

      // Turn off auto-rotation if enabled
      stopAnimation();

      stopOrientation();
      config.roll = 0;

      speed.hfov = 0;

      // Calculate touch position relative to top left of viewer container
      var pos0 = mousePosition(event.targetTouches[0]);

      onPointerDownPointerX = pos0.x;
      onPointerDownPointerY = pos0.y;

      if (event.targetTouches.length === 2) {
        // Down pointer is the center of the two fingers
        var pos1 = mousePosition(event.targetTouches[1]);
        onPointerDownPointerX += (pos1.x - pos0.x) * 0.5;
        onPointerDownPointerY += (pos1.y - pos0.y) * 0.5;
        onPointerDownPointerDist = Math.sqrt(
          (pos0.x - pos1.x) * (pos0.x - pos1.x) +
            (pos0.y - pos1.y) * (pos0.y - pos1.y)
        );
      }
      isUserInteracting = true;
      latestInteraction = Date.now();

      onPointerDownYaw = config.yaw;
      onPointerDownPitch = config.pitch;

      fireEvent("touchstart", event);
      animateInit();
    }

    /**
     * chạm và di chuyển
     * @param {*} event
     * @returns
     */
    function onDocumentTouchMove(event) {
      if (!config.draggable) {
        return;
      }
      event.preventDefault();
      if (loaded) {
        latestInteraction = Date.now();
      }
      if (isUserInteracting && loaded) {
        var pos0 = mousePosition(event.targetTouches[0]);
        var clientX = pos0.x;
        var clientY = pos0.y;

        if (
          event.targetTouches.length === 2 &&
          onPointerDownPointerDist != -1
        ) {
          var pos1 = mousePosition(event.targetTouches[1]);
          clientX += (pos1.x - pos0.x) * 0.5;
          clientY += (pos1.y - pos0.y) * 0.5;
          var clientDist = Math.sqrt(
            (pos0.x - pos1.x) * (pos0.x - pos1.x) +
              (pos0.y - pos1.y) * (pos0.y - pos1.y)
          );
          setHfov(config.hfov + (onPointerDownPointerDist - clientDist) * 0.1);
          onPointerDownPointerDist = clientDist;
        }
        var touchmovePanSpeedCoeff =
          (config.hfov / 360) * config.touchPanSpeedCoeffFactor;

        var yaw =
          (onPointerDownPointerX - clientX) * touchmovePanSpeedCoeff +
          onPointerDownYaw;
        speed.yaw = ((yaw - config.yaw) % 360) * 0.2;
        config.yaw = yaw;

        var pitch =
          (clientY - onPointerDownPointerY) * touchmovePanSpeedCoeff +
          onPointerDownPitch;
        speed.pitch = (pitch - config.pitch) * 0.2;
        config.pitch = pitch;

        fireEvent("touchmove", event);
      }
    }

    /**
     * ngừng chạm
     */
    function onDocumentTouchEnd() {
      isUserInteracting = false;
      if (Date.now() - latestInteraction > 150) {
        speed.pitch = speed.yaw = 0;
      }
      onPointerDownPointerDist = -1;
      latestInteraction = Date.now();

      fireEvent("touchend", event);
    }

    /**
     * sự kiện chuột đến tọa độ
     * @param {*} event
     * @returns
     */
    function mouseEventToCoords(event) {
      var pos = mousePosition(event);
      var canvas = renderer.getCanvas();
      var canvasWidth = canvas.clientWidth,
        canvasHeight = canvas.clientHeight;
      var x = (pos.x / canvasWidth) * 2 - 1;
      var y = ((1 - (pos.y / canvasHeight) * 2) * canvasHeight) / canvasWidth;
      var focal = 1 / Math.tan((config.hfov * Math.PI) / 360);
      var s = Math.sin((config.pitch * Math.PI) / 180);
      var c = Math.cos((config.pitch * Math.PI) / 180);
      var a = focal * c - y * s;
      var root = Math.sqrt(x * x + a * a);
      var pitch = (Math.atan((y * c + focal * s) / root) * 180) / Math.PI;
      var yaw = (Math.atan2(x / root, a / root) * 180) / Math.PI + config.yaw;
      if (yaw < -180) yaw += 360;
      if (yaw > 180) yaw -= 360;
      return [pitch, yaw];
    }

    var pointerIDs = [];
    var pointerCoordinates = [];

    /**
     * Con trỏ xuống
     * @param {*} event
     * @returns
     */
    function onDocumentPointerDown(event) {
      if (event.pointerType === "touch") {
        // Only do something if the panorama is loaded
        if (!loaded || !config.draggable) return;
        pointerIDs.push(event.pointerId);
        pointerCoordinates.push({
          clientX: event.clientX,
          clientY: event.clientY,
        });
        event.targetTouches = pointerCoordinates;
        onDocumentTouchStart(event);
        event.preventDefault();
      }
    }

    /**
     * Con trỏ di chuyển
     * @param {*} event
     * @returns
     */
    function onDocumentPointerMove(event) {
      if (event.pointerType === "touch") {
        if (!config.draggable) return;
        for (var i = 0; i < pointerIDs.length; i++) {
          if (event.pointerId === pointerIDs[i]) {
            pointerCoordinates[i].clientX = event.clientX;
            pointerCoordinates[i].clientY = event.clientY;
            event.targetTouches = pointerCoordinates;
            onDocumentTouchMove(event);
            event.preventDefault();
            return;
          }
        }
      }
    }

    /**
     * Nhả con trỏ
     * @param {*} event
     */
    function onDocumentPointerUp(event) {
      if (event.pointerType === "touch") {
        var defined = false;
        for (var i = 0; i < pointerIDs.length; i++) {
          if (event.pointerId === pointerIDs[i]) pointerIDs[i] = undefined;
          if (pointerIDs[i]) defined = true;
        }
        if (!defined) {
          pointerIDs = [];
          pointerCoordinates = [];
          onDocumentTouchEnd();
        }
        event.preventDefault();
      }
    }

    /**
     * sự kiện lăn chuột
     * @param {*} event
     * @returns
     */
    function onDocumentMouseWheel(event) {
      if (
        !loaded ||
        (config.mouseZoom === "fullscreenonly" && !fullscreenActive)
      ) {
        return;
      }
      event.preventDefault();
      stopAnimation();
      latestInteraction = Date.now();

      if (event.wheelDeltaY) {
        // WebKit
        setHfov(config.hfov - event.wheelDeltaY * 0.05);
        speed.hfov = event.wheelDelta < 0 ? 1 : -1;
      } else if (event.wheelDelta) {
        // Opera / Explorer 9
        setHfov(config.hfov - event.wheelDelta * 0.05);
        speed.hfov = event.wheelDelta < 0 ? 1 : -1;
      } else if (event.detail) {
        // Firefox
        setHfov(config.hfov + event.detail * 1.5);
        speed.hfov = event.detail > 0 ? 1 : -1;
      }
      fireEvent("mousewheel", event);
      animateInit();
    }

    /**
     * Phím bấm
     * @param {*} event
     * @returns
     */
    function onDocumentKeyPress(event) {
      // Turn off auto-rotation if enabled
      stopAnimation();
      latestInteraction = Date.now();

      stopOrientation();
      config.roll = 0;

      // Record key pressed
      var keynumber = event.which || event.keycode;

      // Override default action for keys that are used
      if (config.capturedKeyNumbers.indexOf(keynumber) < 0) return;
      event.preventDefault();

      // If escape key is pressed
      if (keynumber === 27) {
        // If in fullscreen mode
        if (fullscreenActive) {
          toggleFullscreen();
        }
      } else {
        // Change key
        changeKey(keynumber, true);
      }
    }

    function clearKeys() {
      for (var i = 0; i < 10; i++) {
        keysDown[i] = false;
      }
    }

    function onDocumentKeyUp(event) {
      // Record key pressed
      var keynumber = event.which || event.keycode;

      // Override default action for keys that are used
      if (config.capturedKeyNumbers.indexOf(keynumber) < 0) return;
      event.preventDefault();

      // Change key
      changeKey(keynumber, false);
    }

    function changeKey(keynumber, value) {
      var keyChanged = false;
      switch (keynumber) {
        // If minus key is released
        case 109:
        case 189:
        case 17:
        case 173:
          if (keysDown[0] != value) {
            keyChanged = true;
          }
          keysDown[0] = value;
          break;

        // If plus key is released
        case 107:
        case 187:
        case 16:
        case 61:
          if (keysDown[1] != value) {
            keyChanged = true;
          }
          keysDown[1] = value;
          break;

        // If up arrow is released
        case 38:
          if (keysDown[2] != value) {
            keyChanged = true;
          }
          keysDown[2] = value;
          break;

        // If "w" is released
        case 87:
          if (keysDown[6] != value) {
            keyChanged = true;
          }
          keysDown[6] = value;
          break;

        // If down arrow is released
        case 40:
          if (keysDown[3] != value) {
            keyChanged = true;
          }
          keysDown[3] = value;
          break;

        // If "s" is released
        case 83:
          if (keysDown[7] != value) {
            keyChanged = true;
          }
          keysDown[7] = value;
          break;

        // If left arrow is released
        case 37:
          if (keysDown[4] != value) {
            keyChanged = true;
          }
          keysDown[4] = value;
          break;

        // If "a" is released
        case 65:
          if (keysDown[8] != value) {
            keyChanged = true;
          }
          keysDown[8] = value;
          break;

        // If right arrow is released
        case 39:
          if (keysDown[5] != value) {
            keyChanged = true;
          }
          keysDown[5] = value;
          break;

        // If "d" is released
        case 68:
          if (keysDown[9] != value) {
            keyChanged = true;
          }
          keysDown[9] = value;
      }

      if (keyChanged && value) {
        if (typeof performance !== "undefined" && performance.now()) {
          prevTime = performance.now();
        } else {
          prevTime = Date.now();
        }
        animateInit();
      }
    }

    function keyRepeat() {
      // Only do something if the panorama is loaded
      if (!loaded) {
        return;
      }

      var isKeyDown = false;

      var prevPitch = config.pitch;
      var prevYaw = config.yaw;
      var prevZoom = config.hfov;

      var newTime;
      if (typeof performance !== "undefined" && performance.now()) {
        newTime = performance.now();
      } else {
        newTime = Date.now();
      }
      if (prevTime === undefined) {
        prevTime = newTime;
      }
      var diff = ((newTime - prevTime) * config.hfov) / 1700;
      diff = Math.min(diff, 1.0);

      // If minus key is down
      if (keysDown[0] && config.keyboardZoom === true) {
        setHfov(config.hfov + (speed.hfov * 0.8 + 0.5) * diff);
        isKeyDown = true;
      }

      // If plus key is down
      if (keysDown[1] && config.keyboardZoom === true) {
        setHfov(config.hfov + (speed.hfov * 0.8 - 0.2) * diff);
        isKeyDown = true;
      }

      // If up arrow or "w" is down
      if (keysDown[2] || keysDown[6]) {
        // Pan up
        config.pitch += (speed.pitch * 0.8 + 0.2) * diff;
        isKeyDown = true;
      }

      // If down arrow or "s" is down
      if (keysDown[3] || keysDown[7]) {
        // Pan down
        config.pitch += (speed.pitch * 0.8 - 0.2) * diff;
        isKeyDown = true;
      }

      // If left arrow or "a" is down
      if (keysDown[4] || keysDown[8]) {
        // Pan left
        config.yaw += (speed.yaw * 0.8 - 0.2) * diff;
        isKeyDown = true;
      }

      // If right arrow or "d" is down
      if (keysDown[5] || keysDown[9]) {
        // Pan right
        config.yaw += (speed.yaw * 0.8 + 0.2) * diff;
        isKeyDown = true;
      }

      if (isKeyDown) latestInteraction = Date.now();

      // If auto-rotate
      if (config.autoRotate) {
        // Pan
        if (newTime - prevTime > 0.001) {
          var timeDiff = (newTime - prevTime) / 1000;
          var yawDiff =
            ((speed.yaw / timeDiff) * diff - config.autoRotate * 0.2) *
            timeDiff;
          yawDiff =
            (-config.autoRotate > 0 ? 1 : -1) *
            Math.min(Math.abs(config.autoRotate * timeDiff), Math.abs(yawDiff));
          config.yaw += yawDiff;
        }

        // Deal with stopping auto rotation after a set delay
        if (config.autoRotateStopDelay) {
          config.autoRotateStopDelay -= newTime - prevTime;
          if (config.autoRotateStopDelay <= 0) {
            config.autoRotateStopDelay = false;
            autoRotateSpeed = config.autoRotate;
            config.autoRotate = 0;
          }
        }
      }

      // Animated moves
      if (animatedMove.pitch) {
        animateMove("pitch");
        prevPitch = config.pitch;
      }
      if (animatedMove.yaw) {
        animateMove("yaw");
        prevYaw = config.yaw;
      }
      if (animatedMove.hfov) {
        animateMove("hfov");
        prevZoom = config.hfov;
      }

      // "Inertia"
      if (diff > 0 && !config.autoRotate) {
        // "Friction"
        var slowDownFactor = 1 - config.friction;

        // Yaw
        if (
          !keysDown[4] &&
          !keysDown[5] &&
          !keysDown[8] &&
          !keysDown[9] &&
          !animatedMove.yaw
        ) {
          config.yaw += speed.yaw * diff * slowDownFactor;
        }
        // Pitch
        if (
          !keysDown[2] &&
          !keysDown[3] &&
          !keysDown[6] &&
          !keysDown[7] &&
          !animatedMove.pitch
        ) {
          config.pitch += speed.pitch * diff * slowDownFactor;
        }
        // Zoom
        if (!keysDown[0] && !keysDown[1] && !animatedMove.hfov) {
          setHfov(config.hfov + speed.hfov * diff * slowDownFactor);
        }
      }

      prevTime = newTime;
      if (diff > 0) {
        speed.yaw = speed.yaw * 0.8 + ((config.yaw - prevYaw) / diff) * 0.2;
        speed.pitch =
          speed.pitch * 0.8 + ((config.pitch - prevPitch) / diff) * 0.2;
        speed.hfov = speed.hfov * 0.8 + ((config.hfov - prevZoom) / diff) * 0.2;

        // Limit speed
        var maxSpeed = config.autoRotate ? Math.abs(config.autoRotate) : 5;
        speed.yaw = Math.min(maxSpeed, Math.max(speed.yaw, -maxSpeed));
        speed.pitch = Math.min(maxSpeed, Math.max(speed.pitch, -maxSpeed));
        speed.hfov = Math.min(maxSpeed, Math.max(speed.hfov, -maxSpeed));
      }

      // Stop movement if opposite controls are pressed
      if (keysDown[0] && keysDown[1]) {
        speed.hfov = 0;
      }
      if ((keysDown[2] || keysDown[6]) && (keysDown[3] || keysDown[7])) {
        speed.pitch = 0;
      }
      if ((keysDown[4] || keysDown[8]) && (keysDown[5] || keysDown[9])) {
        speed.yaw = 0;
      }
    }

    function animateMove(axis) {
      var t = animatedMove[axis];
      var normTime = Math.min(
        1,
        Math.max((Date.now() - t.startTime) / 1000 / (t.duration / 1000), 0)
      );
      var result =
        t.startPosition +
        config.animationTimingFunction(normTime) *
          (t.endPosition - t.startPosition);
      if (
        (t.endPosition > t.startPosition && result >= t.endPosition) ||
        (t.endPosition < t.startPosition && result <= t.endPosition) ||
        t.endPosition === t.startPosition
      ) {
        result = t.endPosition;
        speed[axis] = 0;
        delete animatedMove[axis];
      }
      config[axis] = result;
    }

    function timingFunction(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function onDocumentResize() {
      onFullScreenChange("resize");
    }

    function animateInit() {
      if (animating) {
        return;
      }
      animating = true;
      animate();
    }

    function animate() {
      if (destroyed) {
        return;
      }
      render();
      if (autoRotateStart) clearTimeout(autoRotateStart);
      if (isUserInteracting || orientation === true) {
        requestAnimationFrame(animate);
      } else if (
        keysDown[0] ||
        keysDown[1] ||
        keysDown[2] ||
        keysDown[3] ||
        keysDown[4] ||
        keysDown[5] ||
        keysDown[6] ||
        keysDown[7] ||
        keysDown[8] ||
        keysDown[9] ||
        config.autoRotate ||
        animatedMove.pitch ||
        animatedMove.yaw ||
        animatedMove.hfov ||
        Math.abs(speed.yaw) > 0.01 ||
        Math.abs(speed.pitch) > 0.01 ||
        Math.abs(speed.hfov) > 0.01
      ) {
        keyRepeat();
        if (
          config.autoRotateInactivityDelay >= 0 &&
          autoRotateSpeed &&
          Date.now() - latestInteraction > config.autoRotateInactivityDelay &&
          !config.autoRotate
        ) {
          config.autoRotate = autoRotateSpeed;
          _this.lookAt(origPitch, undefined, origHfov, 3000);
        }
        requestAnimationFrame(animate);
      } else if (
        renderer &&
        (renderer.isLoading() || (config.dynamic === true && update))
      ) {
        requestAnimationFrame(animate);
      } else {
        fireEvent("animatefinished", {
          pitch: _this.getPitch(),
          yaw: _this.getYaw(),
          hfov: _this.getHfov(),
        });
        animating = false;
        prevTime = undefined;
        var autoRotateStartTime =
          config.autoRotateInactivityDelay - (Date.now() - latestInteraction);
        if (autoRotateStartTime > 0) {
          autoRotateStart = setTimeout(function () {
            config.autoRotate = autoRotateSpeed;
            _this.lookAt(origPitch, undefined, origHfov, 3000);
            animateInit();
          }, autoRotateStartTime);
        } else if (config.autoRotateInactivityDelay >= 0 && autoRotateSpeed) {
          config.autoRotate = autoRotateSpeed;
          _this.lookAt(origPitch, undefined, origHfov, 3000);
          animateInit();
        }
      }
    }

    function render() {
      var tmpyaw;

      if (loaded) {
        var canvas = renderer.getCanvas();

        if (config.autoRotate !== false) {
          // When auto-rotating this check needs to happen first (see issue #764)
          if (config.yaw > 180) {
            config.yaw -= 360;
          } else if (config.yaw < -180) {
            config.yaw += 360;
          }
        }

        // Keep a tmp value of yaw for autoRotate comparison later
        tmpyaw = config.yaw;

        // Optionally avoid showing background (empty space) on left or right by adapting min/max yaw
        var hoffcut = 0;
        if (config.avoidShowingBackground) {
          var hfov2 = config.hfov / 2,
            vfov2 =
              (Math.atan2(
                Math.tan((hfov2 / 180) * Math.PI),
                canvas.width / canvas.height
              ) *
                180) /
              Math.PI,
            transposed = config.vaov > config.haov;
          if (!transposed) {
            hoffcut =
              hfov2 *
              (1 -
                Math.min(
                  Math.cos(((config.pitch - vfov2) / 180) * Math.PI),
                  Math.cos(((config.pitch + vfov2) / 180) * Math.PI)
                ));
          }
        }

        // Ensure the yaw is within min and max allowed
        var yawRange = config.maxYaw - config.minYaw,
          minYaw = -180,
          maxYaw = 180;
        if (yawRange < 360) {
          minYaw = config.minYaw + config.hfov / 2 + hoffcut;
          maxYaw = config.maxYaw - config.hfov / 2 - hoffcut;
          if (yawRange < config.hfov) {
            // Lock yaw to average of min and max yaw when both can be seen at once
            minYaw = maxYaw = (minYaw + maxYaw) / 2;
          }
          config.yaw = Math.max(minYaw, Math.min(maxYaw, config.yaw));
        }

        if (!(config.autoRotate !== false)) {
          // When not auto-rotating, this check needs to happen after the
          // previous check (see issue #698)
          if (config.yaw > 180) {
            config.yaw -= 360;
          } else if (config.yaw < -180) {
            config.yaw += 360;
          }
        }

        // Check if we autoRotate in a limited by min and max yaw
        // If so reverse direction
        if (
          config.autoRotate !== false &&
          tmpyaw != config.yaw &&
          prevTime !== undefined
        ) {
          // this condition prevents changing the direction initially
          config.autoRotate *= -1;
        }

        // Ensure the calculated pitch is within min and max allowed
        var vfov =
          ((2 *
            Math.atan(
              Math.tan((config.hfov / 180) * Math.PI * 0.5) /
                (canvas.width / canvas.height)
            )) /
            Math.PI) *
          180;
        var minPitch = config.minPitch + vfov / 2,
          maxPitch = config.maxPitch - vfov / 2;
        var pitchRange = config.maxPitch - config.minPitch;
        if (pitchRange < vfov) {
          // Lock pitch to average of min and max pitch when both can be seen at once
          minPitch = maxPitch = (minPitch + maxPitch) / 2;
        }
        if (isNaN(minPitch)) minPitch = -90;
        if (isNaN(maxPitch)) maxPitch = 90;
        config.pitch = Math.max(minPitch, Math.min(maxPitch, config.pitch));

        renderer.render(
          (config.pitch * Math.PI) / 180,
          (config.yaw * Math.PI) / 180,
          (config.hfov * Math.PI) / 180,
          { roll: (config.roll * Math.PI) / 180 }
        );

        renderHotSpots();

        if (config.compass) {
          try {
            var compass_icon = document.getElementById("compass_icon");
            compass_icon.style.transform =
              "rotate(" + (-config.yaw - config.northOffset) + "deg)";
            compass_icon.style.webkitTransform =
              "rotate(" + (-config.yaw - config.northOffset) + "deg)";
          } catch (e) {}
        }
      }
    }

    function Quaternion(w, x, y, z) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;
    }

    Quaternion.prototype.multiply = function (q) {
      return new Quaternion(
        this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
        this.x * q.w + this.w * q.x + this.y * q.z - this.z * q.y,
        this.y * q.w + this.w * q.y + this.z * q.x - this.x * q.z,
        this.z * q.w + this.w * q.z + this.x * q.y - this.y * q.x
      );
    };

    Quaternion.prototype.toEulerAngles = function () {
      var phi = Math.atan2(
          2 * (this.w * this.x + this.y * this.z),
          1 - 2 * (this.x * this.x + this.y * this.y)
        ),
        theta = Math.asin(2 * (this.w * this.y - this.z * this.x)),
        psi = Math.atan2(
          2 * (this.w * this.z + this.x * this.y),
          1 - 2 * (this.y * this.y + this.z * this.z)
        );
      return [phi, theta, psi];
    };

    function taitBryanToQuaternion(alpha, beta, gamma) {
      var r = [
        beta ? (beta * Math.PI) / 180 / 2 : 0,
        gamma ? (gamma * Math.PI) / 180 / 2 : 0,
        alpha ? (alpha * Math.PI) / 180 / 2 : 0,
      ];
      var c = [Math.cos(r[0]), Math.cos(r[1]), Math.cos(r[2])],
        s = [Math.sin(r[0]), Math.sin(r[1]), Math.sin(r[2])];

      return new Quaternion(
        c[0] * c[1] * c[2] - s[0] * s[1] * s[2],
        s[0] * c[1] * c[2] - c[0] * s[1] * s[2],
        c[0] * s[1] * c[2] + s[0] * c[1] * s[2],
        c[0] * c[1] * s[2] + s[0] * s[1] * c[2]
      );
    }

    function computeQuaternion(alpha, beta, gamma) {
      // Convert Tait-Bryan angles to quaternion
      var quaternion = taitBryanToQuaternion(alpha, beta, gamma);
      // Apply world transform
      quaternion = quaternion.multiply(
        new Quaternion(Math.sqrt(0.5), -Math.sqrt(0.5), 0, 0)
      );
      // Apply screen transform
      var angle = window.orientation
        ? (-window.orientation * Math.PI) / 180 / 2
        : 0;
      return quaternion.multiply(
        new Quaternion(Math.cos(angle), 0, -Math.sin(angle), 0)
      );
    }

    function orientationListener(e) {
      if (e.hasOwnProperty("requestPermission")) e.requestPermission();
      var q = computeQuaternion(e.alpha, e.beta, e.gamma).toEulerAngles();
      if (typeof orientation === "number" && orientation < 10) {
        orientation += 1;
      } else if (orientation === 10) {
        orientationYawOffset = (q[2] / Math.PI) * 180 + config.yaw;
        orientation = true;
        requestAnimationFrame(animate);
      } else {
        config.pitch = (q[0] / Math.PI) * 180;
        config.roll = (-q[1] / Math.PI) * 180;
        config.yaw = (-q[2] / Math.PI) * 180 + orientationYawOffset;
      }

      fireEvent("vrmove", e);
    }

    function renderInit() {
      try {
        var params = {};
        if (config.horizonPitch !== undefined)
          params.horizonPitch = (config.horizonPitch * Math.PI) / 180;
        if (config.horizonRoll !== undefined)
          params.horizonRoll = (config.horizonRoll * Math.PI) / 180;
        if (config.backgroundColor !== undefined)
          params.backgroundColor = config.backgroundColor;
        renderer.init(
          panoImage,
          config.type,
          config.dynamic,
          (config.haov * Math.PI) / 180,
          (config.vaov * Math.PI) / 180,
          (config.vOffset * Math.PI) / 180,
          renderInitCallback,
          params
        );
        if (config.dynamic !== true) {
          // Allow image to be garbage collected
          panoImage = undefined;
        }
      } catch (event) {
        // Panorama not loaded

        // Display error if there is a bad texture
        if (event.type === "webgl error" || event.type === "no webgl") {
          anError();
        } else if (event.type === "webgl size error") {
          anError(
            config.uiText.textureSizeError
              .replace("%s", event.width)
              .replace("%s", event.maxWidth)
          );
        } else {
          anError(config.uiText.unknownError);
          throw event;
        }
      }
    }

    function renderInitCallback() {
      // Fade if specified
      if (config.sceneFadeDuration && renderer.fadeImg !== undefined) {
        renderer.fadeImg.style.opacity = 0;
        // Remove image
        var fadeImg = renderer.fadeImg;
        delete renderer.fadeImg;
        setTimeout(function () {
          renderContainer.removeChild(fadeImg);
          fireEvent("scenechangefadedone");
        }, config.sceneFadeDuration);
      }

      // Show hotspots
      createHotSpots();

      // Hide loading display
      infoDisplay.load.box.style.display = "none";
      if (preview !== undefined) {
        renderContainer.removeChild(preview);
        preview = undefined;
      }

      loaded = true;

      animateInit();

      fireEvent("load");
    }

    function createHotSpot(hs) {
      // Make sure hot spot pitch and yaw are numbers
      hs.transform.rotate = Number(hs.transform.rotate) || 0;
      hs.transform.rotateX = Number(hs.transform.rotateX) || 0;
      hs.transform.rotateY = Number(hs.transform.rotateY) || 0;
      hs.transform.rotateZ = Number(hs.transform.rotateZ) || 0;
      hs.transform.scale = Number(hs.transform.scale) || 1;
      hs.pitch = Number(hs.pitch) || 0;
      hs.yaw = Number(hs.yaw) || 0;

      var div = document.createElement("div");
      div.className = "pnlm-hotspot-base";
      div.id = "hotspot-maker-" + hs._id;

      var hotspotMaker = document.createElement("div");
      hotspotMaker.className += "hotspot-maker";
      div.appendChild(hotspotMaker);

      if (hs.animation) {
        hotspotMaker.className += ` ${hs.animation}`;
      }
      if (hs.icon && hs.icon != "") {
        var hotspotMakerIcon = document.createElement("div");
        hotspotMakerIcon.className = "hotspot-maker-icon";
        var hotspotMakerIconFa = document.createElement("i");
        hotspotMakerIconFa.className = "fa fa-" + hs.icon;
        hotspotMakerIcon.appendChild(hotspotMakerIconFa);
        hotspotMaker.appendChild(hotspotMakerIcon);
      }
      if (hs.buttonText && hs.buttonText != "") {
        var hotspotMakerText = document.createElement("div");
        hotspotMakerText.className = "hotspot-maker-text";
        hotspotMakerText.innerHTML = hs.buttonText;
        hotspotMaker.appendChild(hotspotMakerText);
        hotspotMaker.classList.add("hotspot-maker-button-text");
      } else {
        hotspotMaker.classList.remove("hotspot-maker-button-text");
      }

      var transformMaker = "translateZ(9999px) perspective(500px)";
      if (hs.transform.rotate) {
        transformMaker += ` rotate(${hs.transform.rotate + "deg"})`;
      }
      if (hs.transform.rotateX) {
        transformMaker += ` rotateX(${hs.transform.rotateX + "deg"})`;
      }
      if (hs.transform.rotateY) {
        transformMaker += ` rotateY(${hs.transform.rotateY + "deg"})`;
      }
      if (hs.transform.rotateZ) {
        var c_yaw = config.yaw;
        c_yaw -= Math.floor(c_yaw / 360 + 0.2) * 360;
        var angle_pitch = (hs.pitch / 90) * 7;
        if (angle_pitch < 0) angle_pitch = angle_pitch * -1;
        var diff_yaw = -hs.yaw + c_yaw;
        diff_yaw -= Math.floor(diff_yaw / 360 + 0.2) * 360;
        var angle_yaw = -(diff_yaw * angle_pitch);
        transformMaker += ` rotateZ(${
          parseInt(hs.transform.rotateZ) + angle_yaw + "deg"
        })`;
      }
      hotspotMaker.style = "--transform: " + transformMaker;

      if (hs.cssClass) div.className += " " + hs.cssClass;
      else if (config.cssMaker) div.className += " " + config.cssMaker;
      else
        div.className +=
          " pnlm-hotspot pnlm-sprite pnlm-" + escapeHTML(hs.type);

      var span = document.createElement("div");
      span.className = "hotspot-maker-tooltip";
      if (hs.text) span.innerHTML = escapeHTML(hs.text);

      var a;
      if (hs.video) {
        var video = document.createElement("video"),
          vidp = hs.video;
        if (config.basePath && !absoluteURL(vidp))
          vidp = config.basePath + vidp;
        video.src = sanitizeURL(vidp);
        video.controls = true;
        video.style.width = hs.width + "px";
        renderContainer.appendChild(div);
        span.appendChild(video);
      } else if (hs.image) {
        var imgp = hs.image;
        if (config.basePath && !absoluteURL(imgp))
          imgp = config.basePath + imgp;
        a = document.createElement("a");
        a.href = sanitizeURL(hs.URL ? hs.URL : imgp);
        a.target = "_blank";
        span.appendChild(a);
        var image = document.createElement("img");
        image.src = sanitizeURL(imgp);
        image.style.width = hs.width + "px";
        image.style.paddingTop = "5px";
        renderContainer.appendChild(div);
        a.appendChild(image);
        span.style.maxWidth = "initial";
      } else if (hs.URL) {
        a = document.createElement("a");
        a.href = sanitizeURL(hs.URL);
        if (hs.attributes) {
          for (var key in hs.attributes) {
            a.setAttribute(key, hs.attributes[key]);
          }
        } else {
          a.target = "_blank";
        }
        renderContainer.appendChild(a);
        div.className += " pnlm-pointer";
        span.className += " pnlm-pointer";
        a.appendChild(div);
      } else {
        if (!config.draggableHotSpot && hs.sceneId) {
          div.onclick = div.ontouchend = function () {
            var timeAnimated = 500;
            if (!div.clicked) {
              div.clicked = true;
              _this.lookAt(
                hs.pitch,
                hs.yaw,
                config.hfov - 20,
                timeAnimated,
                () => {
                  console.log(hs, config);
                  loadScene(
                    hs.sceneId,
                    hs.targetPitch,
                    hs.targetYaw,
                    hs.targetHfov
                  );
                }
              );
            }
            return false;
          };
          div.className += " pnlm-pointer";
          span.className += " pnlm-pointer";
        }
        renderContainer.appendChild(div);
      }
      if (hs.createTooltipFunc) {
        hs.createTooltipFunc(div, hs.createTooltipArgs);
      } else if (hs.text || hs.video || hs.image) {
        div.classList.add("pnlm-tooltip");
        if (!config.draggableHotSpot) {
          div.appendChild(span);
        }
        span.style.width = span.scrollWidth + "px";
        if (config.cssMaker) {
          span.style.marginLeft =
            -(span.scrollWidth - hotspotMaker.offsetWidth) / 2 + "px";
        } else {
          span.style.marginLeft =
            -(span.scrollWidth - div.offsetWidth) / 2 + "px";
        }
        if (hs.buttonText) {
          span.style.marginTop = -span.scrollHeight - 45 + "px";
        } else {
          span.style.marginTop = -span.scrollHeight - 50 + "px";
        }
      }
      if (hs.clickHandlerFunc) {
        div.addEventListener(
          "click",
          function (e) {
            hs.clickHandlerFunc(hs, hs.clickHandlerArgs);
          },
          "false"
        );
        div.className += " pnlm-pointer";
        span.className += " pnlm-pointer";
      }
      if (config.draggableHotSpot) {
        hotspotMaker.classList.add("pnlm-grab");
        hotspotMaker.classList.remove("pnlm-pointer");
        div.addEventListener("mousedown", function (e) {
          hotspotMaker.classList.add("pnlm-grabbing");
          if (hs.dragHandlerFunc) hs.dragHandlerFunc(hs, hs.dragHandlerArgs);
          draggingHotSpot = hs;
        });

        div.addEventListener("mouseup", function (e) {
          hotspotMaker.classList.remove("pnlm-grabbing");
          const [pitch, yaw] = mouseEventToCoords(e);
          _this.setPitch(pitch);
          _this.setYaw(yaw);
        });

        div.addEventListener("contextmenu", function (e) {
          e.preventDefault();
        });

        if (
          document.documentElement.style.pointerAction === "" &&
          document.documentElement.style.touchAction === ""
        ) {
          div.addEventListener("pointerdown", function (e) {
            hotspotMaker.classList.add("pnlm-grabbing");
            if (hs.dragHandlerFunc) hs.dragHandlerFunc(hs, hs.dragHandlerArgs);
            draggingHotSpot = hs;
          });
        }

        div.addEventListener("touchmove", function (e) {
          hotspotMaker.classList.add("pnlm-grabbing");
          moveHotSpot(hs, e.targetTouches[0]);
        });
        div.addEventListener("touchend", function (e) {
          hotspotMaker.classList.remove("pnlm-grabbing");
          if (hs.dragHandlerFunc) hs.dragHandlerFunc(hs, hs.dragHandlerArgs);
          draggingHotSpot = null;
        });
      } else {
        hotspotMaker.classList.remove("pnlm-grab");
        hotspotMaker.classList.add("pnlm-pointer");
      }

      hs.div = div;
      hs.hotspotMaker = hotspotMaker;
    }

    function createHotSpots() {
      if (hotspotsCreated) return;

      if (!config.hotSpots) {
        config.hotSpots = [];
      } else {
        // Sort by pitch so tooltip is never obscured by another hot spot
        config.hotSpots = config.hotSpots.sort(function (a, b) {
          return a.pitch < b.pitch;
        });
        config.hotSpots.forEach(createHotSpot);
      }
      hotspotsCreated = true;
      renderHotSpots();
    }

    /**
     * Xuất các hotspots
     * @param {*} hs
     */
    function renderHotSpot(hs) {
      var hsPitchSin = Math.sin((hs.pitch * Math.PI) / 180),
        hsPitchCos = Math.cos((hs.pitch * Math.PI) / 180),
        configPitchSin = Math.sin((config.pitch * Math.PI) / 180),
        configPitchCos = Math.cos((config.pitch * Math.PI) / 180),
        yawCos = Math.cos(((-hs.yaw + config.yaw) * Math.PI) / 180);
      var z =
        hsPitchSin * configPitchSin + hsPitchCos * yawCos * configPitchCos;
      if (
        (hs.yaw <= 90 && hs.yaw > -90 && z <= 0) ||
        ((hs.yaw > 90 || hs.yaw <= -90) && z <= 0)
      ) {
        hs.div.style.visibility = "hidden";
      } else {
        var yawSin = Math.sin(((-hs.yaw + config.yaw) * Math.PI) / 180),
          hfovTan = Math.tan((config.hfov * Math.PI) / 360);
        hs.div.style.visibility = "visible";
        var canvas = renderer.getCanvas(),
          canvasWidth = canvas.clientWidth,
          canvasHeight = canvas.clientHeight;
        var coord = [
          ((-canvasWidth / hfovTan) * yawSin * hsPitchCos) / z / 2,
          ((-canvasWidth / hfovTan) *
            (hsPitchSin * configPitchCos -
              hsPitchCos * yawCos * configPitchSin)) /
            z /
            2,
        ];
        var rollSin = Math.sin((config.roll * Math.PI) / 180),
          rollCos = Math.cos((config.roll * Math.PI) / 180);
        coord = [
          coord[0] * rollCos - coord[1] * rollSin,
          coord[0] * rollSin + coord[1] * rollCos,
        ];
        coord[0] += (canvasWidth - hs.div.offsetWidth) / 2;
        coord[1] += (canvasHeight - hs.div.offsetHeight) / 2;
        var transform =
          "translate(" +
          coord[0] +
          "px, " +
          coord[1] +
          "px) rotate(" +
          config.roll +
          "deg)";
        if (hs.transform.scale) {
          var width =
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;
          if (width < 768) {
            var hs_scale = hs.transform.scale * 0.65;
          } else {
            var hs_scale = hs.transform.scale;
          }
          transform += ` scale(${hs_scale * (origHfov / config.hfov / z)})`;
        }
        hs.div.style.webkitTransform = transform;
        hs.div.style.MozTransform = transform;
        hs.div.style.transform = transform;
      }
    }

    function renderHotSpots() {
      config.hotSpots.forEach(renderHotSpot);
    }

    function destroyHotSpots() {
      var hs = config.hotSpots;
      hotspotsCreated = false;
      delete config.hotSpots;
      if (hs) {
        for (var i = 0; i < hs.length; i++) {
          var current = hs[i].div;
          if (current) {
            while (
              current.parentNode &&
              current.parentNode != renderContainer
            ) {
              current = current.parentNode;
            }
            renderContainer.removeChild(current);
          }
          delete hs[i].div;
        }
      }
    }

    function moveHotSpot(hs, event) {
      var coords = mouseEventToCoords(event);
      hs.pitch = coords[0];
      hs.yaw = coords[1];
      renderHotSpot(hs);
    }

    function mergeConfig(sceneId) {
      config = {};
      var k, s;
      var photoSphereExcludes = [
        "haov",
        "vaov",
        "vOffset",
        "northOffset",
        "horizonPitch",
        "horizonRoll",
      ];
      specifiedPhotoSphereExcludes = [];

      // Merge default config
      for (k in defaultConfig) {
        if (defaultConfig.hasOwnProperty(k)) {
          config[k] = defaultConfig[k];
        }
      }

      // Merge default scene config
      for (k in initialConfig.default) {
        if (initialConfig.default.hasOwnProperty(k)) {
          if (k === "uiText") {
            for (s in initialConfig.default.uiText) {
              if (initialConfig.default.uiText.hasOwnProperty(s)) {
                config.uiText[s] = escapeHTML(initialConfig.default.uiText[s]);
              }
            }
          } else {
            config[k] = initialConfig.default[k];
            if (photoSphereExcludes.indexOf(k) >= 0) {
              specifiedPhotoSphereExcludes.push(k);
            }
          }
        }
      }

      // Merge current scene config
      if (
        sceneId !== null &&
        sceneId !== "" &&
        initialConfig.scenes &&
        initialConfig.scenes[sceneId]
      ) {
        var scene = initialConfig.scenes[sceneId];
        for (k in scene) {
          if (scene.hasOwnProperty(k)) {
            if (k === "uiText") {
              for (s in scene.uiText) {
                if (scene.uiText.hasOwnProperty(s)) {
                  config.uiText[s] = escapeHTML(scene.uiText[s]);
                }
              }
            } else {
              config[k] = scene[k];
              if (photoSphereExcludes.indexOf(k) >= 0) {
                specifiedPhotoSphereExcludes.push(k);
              }
            }
          }
        }
        config.scene = sceneId;
      }

      // Merge initial config
      for (k in initialConfig) {
        if (initialConfig.hasOwnProperty(k)) {
          if (k === "uiText") {
            for (s in initialConfig.uiText) {
              if (initialConfig.uiText.hasOwnProperty(s)) {
                config.uiText[s] = escapeHTML(initialConfig.uiText[s]);
              }
            }
          } else {
            config[k] = initialConfig[k];
            if (photoSphereExcludes.indexOf(k) >= 0) {
              specifiedPhotoSphereExcludes.push(k);
            }
          }
        }
      }
    }

    function processOptions(isPreview) {
      isPreview = isPreview ? isPreview : false;

      // Process preview first so it always loads before the browser hits its
      // maximum number of connections to a server as can happen with cubic
      // panoramas
      if (isPreview && "preview" in config) {
        var p = config.preview;
        if (config.basePath && !absoluteURL(p)) p = config.basePath + p;
        preview = document.createElement("div");
        preview.className = "pnlm-preview-img";
        preview.style.backgroundImage = "url('" + sanitizeURLForCss(p) + "')";
        renderContainer.appendChild(preview);
      }

      // Handle different preview values
      var title = config.title,
        author = config.author,
        description = config.description;

      if (isPreview) {
        if ("previewTitle" in config) config.title = config.previewTitle;
        if ("previewDescription" in config)
          config.description = config.previewDescription;
        if ("previewAuthor" in config) config.author = config.previewAuthor;
      }

      // Reset title / author display
      if (!config.hasOwnProperty("title")) infoDisplay.title.innerHTML = "";
      if (!config.hasOwnProperty("description"))
        infoDisplay.description.innerHTML = "";
      if (!config.hasOwnProperty("author")) infoDisplay.author.innerHTML = "";
      if (
        !config.hasOwnProperty("title") &&
        !config.hasOwnProperty("description") &&
        !config.hasOwnProperty("author")
      )
        infoDisplay.container.style.display = "none";

      // Fill in load button label and loading box text
      controls.load.innerHTML = "<p>" + config.uiText.loadButtonLabel + "</p>";
      infoDisplay.load.boxp.innerHTML = config.uiText.loadingLabel;

      // Process other options
      for (var key in config) {
        if (config.hasOwnProperty(key)) {
          switch (key) {
            case "title":
              infoDisplay.title.innerHTML = escapeHTML(config[key]);
              infoDisplay.container.style.display = "inline";
              break;
            case "description":
              infoDisplay.description.innerHTML = escapeHTML(config[key]);
              infoDisplay.container.style.display = "inline";
              break;
            case "author":
              var authorText = escapeHTML(config[key]);
              if (config.authorURL) {
                var authorLink = document.createElement("a");
                authorLink.href = sanitizeURL(config["authorURL"]);
                authorLink.target = "_blank";
                authorLink.innerHTML = escapeHTML(config[key]);
                authorText = authorLink.outerHTML;
              }
              infoDisplay.author.innerHTML = config.uiText.bylineLabel.replace(
                "%s",
                authorText
              );
              infoDisplay.container.style.display = "inline";
              break;

            case "fallback":
              var link = document.createElement("a");
              link.href = sanitizeURL(config[key]);
              link.target = "_blank";
              link.textContent =
                "Click here to view this panorama in an alternative viewer.";
              var message = document.createElement("p");
              message.textContent = "Your browser does not support WebGL.";
              message.appendChild(document.createElement("br"));
              message.appendChild(link);
              infoDisplay.errorMsg.innerHTML = ""; // Removes all children nodes
              infoDisplay.errorMsg.appendChild(message);
              break;

            case "hfov":
              setHfov(Number(config[key]));
              break;

            case "autoLoad":
              if (config[key] === true && renderer === undefined) {
                // Show loading box
                infoDisplay.load.box.style.display = "none";
                // Hide load button
                controls.load.style.display = "none";
                // Initialize
                init();
              }
              break;

            case "showZoomCtrl":
              if (config[key] && config.showControls != false) {
                // Show zoom controls
                controls.zoom.style.display = "block";
              } else {
                // Hide zoom controls
                controls.zoom.style.display = "none";
              }
              break;

            case "showFullscreenCtrl":
              if (
                config[key] &&
                config.showControls != false &&
                ("fullscreen" in document ||
                  "mozFullScreen" in document ||
                  "webkitIsFullScreen" in document ||
                  "msFullscreenElement" in document)
              ) {
                // Show fullscreen control
                controls.fullscreen.style.display = "block";
              } else {
                // Hide fullscreen control
                controls.fullscreen.style.display = "none";
              }
              break;

            case "hotSpotDebug":
              if (config[key]) hotSpotDebugIndicator.style.display = "block";
              else hotSpotDebugIndicator.style.display = "none";
              break;

            case "showControls":
              if (!config[key]) {
                controls.orientation.style.display = "none";
                controls.zoom.style.display = "none";
                controls.fullscreen.style.display = "none";
              }
              break;
            case "customControls":
              if (config.customControls) {
                controls.zoom.style.display = "none";
              }
              break;

            case "orientationOnByDefault":
              if (config[key]) {
                startOrientation();
                break;
              }
          }
        }
      }

      if (isPreview) {
        // Restore original values if changed for preview
        if (title) config.title = title;
        else delete config.title;
        if (description) config.description = description;
        else delete config.description;
        if (author) config.author = author;
        else delete config.author;
      }
    }

    function toggleFullscreen() {
      if (loaded && !error) {
        if (!fullscreenActive) {
          if (config.customControls) {
            controls.fullscreen.icon.classList.add("fa-compress");
            controls.fullscreen.icon.classList.remove("fa-expand");
          }
          try {
            if (container.parentNode.parentNode.requestFullscreen) {
              container.parentNode.parentNode.requestFullscreen();
            } else if (container.parentNode.parentNode.mozRequestFullScreen) {
              container.parentNode.parentNode.mozRequestFullScreen();
            } else if (container.parentNode.parentNode.msRequestFullscreen) {
              container.parentNode.parentNode.msRequestFullscreen();
            } else {
              container.parentNode.parentNode.webkitRequestFullScreen();
            }
          } catch (event) {
            // Fullscreen doesn't work
          }
        } else {
          controls.fullscreen.icon.classList.add("fa-expand");
          controls.fullscreen.icon.classList.remove("fa-compress");
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
      }
    }

    function onFullScreenChange(resize) {
      if (
        document.fullscreenElement ||
        document.fullscreen ||
        document.mozFullScreen ||
        document.webkitIsFullScreen ||
        document.msFullscreenElement
      ) {
        if (!config.customControls) {
          controls.fullscreen.classList.add(
            "pnlm-fullscreen-toggle-button-active"
          );
        }
        fullscreenActive = true;
      } else {
        controls.fullscreen.classList.remove(
          "pnlm-fullscreen-toggle-button-active"
        );
        fullscreenActive = false;
      }
      if (resize !== "resize") fireEvent("fullscreenchange", fullscreenActive);
      // Resize renderer (deal with browser quirks and fixes #155)
      renderer.resize();
      setHfov(config.hfov);
      animateInit();
    }

    function zoomIn() {
      if (loaded) {
        setHfov(config.hfov - 5);
        animateInit();
      }
    }

    function zoomOut() {
      if (loaded) {
        setHfov(config.hfov + 5);
        animateInit();
      }
    }

    function constrainHfov(hfov) {
      // Keep field of view within bounds
      var minHfov = config.minHfov;
      if (config.type === "multires" && renderer && !config.multiResMinHfov) {
        minHfov = Math.min(
          minHfov,
          renderer.getCanvas().width /
            ((config.multiRes.cubeResolution / 90) * 0.9)
        );
      }
      if (minHfov > config.maxHfov) {
        // Don't change view if bounds don't make sense
        console.log("HFOV bounds do not make sense (minHfov > maxHfov).");
        return config.hfov;
      }
      var newHfov = config.hfov;
      if (hfov < minHfov) {
        newHfov = minHfov;
      } else if (hfov > config.maxHfov) {
        newHfov = config.maxHfov;
      } else {
        newHfov = hfov;
      }
      // Optionally avoid showing background (empty space) on top or bottom by adapting newHfov
      if (config.avoidShowingBackground && renderer) {
        var canvas = renderer.getCanvas();
        newHfov = Math.min(
          newHfov,
          (Math.atan(
            (Math.tan(((config.maxPitch - config.minPitch) / 360) * Math.PI) /
              canvas.height) *
              canvas.width
          ) *
            360) /
            Math.PI
        );
      }
      return newHfov;
    }

    function setHfov(hfov) {
      config.hfov = constrainHfov(hfov);
      fireEvent("zoomchange", config.hfov);
    }

    function stopAnimation() {
      animatedMove = {};
      autoRotateSpeed = config.autoRotate ? config.autoRotate : autoRotateSpeed;
      config.autoRotate = false;
    }

    function load() {
      clearError();
      loaded = false;

      controls.load.style.display = "none";
      infoDisplay.load.box.style.display = "none";
      init();
    }

    function loadScene(sceneId, targetPitch, targetYaw, targetHfov, fadeDone) {
      if (!loaded) fadeDone = true; // Don't try to fade when there isn't a scene loaded
      loaded = false;
      animatedMove = {};

      // Set up fade if specified
      var fadeImg, workingPitch, workingYaw, workingHfov;
      if (config.sceneFadeDuration && !fadeDone) {
        var data = renderer.render(
          (config.pitch * Math.PI) / 180,
          (config.yaw * Math.PI) / 180,
          (config.hfov * Math.PI) / 180,
          { returnImage: true }
        );
        if (data !== undefined) {
          fadeImg = new Image();
          fadeImg.className = "pnlm-fade-img";
          fadeImg.style.transition =
            "opacity " + config.sceneFadeDuration / 1000 + "s";
          fadeImg.style.width = "100%";
          fadeImg.style.height = "100%";
          fadeImg.onload = function () {
            loadScene(sceneId, targetPitch, targetYaw, targetHfov, true);
          };
          fadeImg.src = data;
          renderContainer.appendChild(fadeImg);
          renderer.fadeImg = fadeImg;
          return;
        }
      }

      // Set new pointing
      if (targetPitch === "same") {
        workingPitch = config.pitch;
      } else {
        workingPitch = targetPitch;
      }
      if (targetYaw === "same") {
        workingYaw = config.yaw;
      } else if (targetYaw === "sameAzimuth") {
        workingYaw =
          config.yaw +
          (config.northOffset || 0) -
          (initialConfig.scenes[sceneId].northOffset || 0);
      } else {
        workingYaw = targetYaw;
      }
      if (targetHfov === "same") {
        workingHfov = config.hfov;
      } else {
        workingHfov = targetHfov;
      }

      // Destroy hot spots from previous scene
      destroyHotSpots();

      // Create the new config for the scene
      mergeConfig(sceneId);

      // Stop motion
      speed.yaw = speed.pitch = speed.hfov = 0;

      // Reload scene
      processOptions();
      if (workingPitch !== undefined) {
        config.pitch = workingPitch;
      }
      if (workingYaw !== undefined) {
        config.yaw = workingYaw;
      }
      if (workingHfov !== undefined) {
        config.hfov = workingHfov;
      }
      fireEvent("scenechange", sceneId);
      load();
    }

    function escapeHTML(s) {
      if (!initialConfig.escapeHTML) return String(s).split("\n").join("<br>");
      return String(s)
        .split(/&/g)
        .join("&amp;")
        .split('"')
        .join("&quot;")
        .split("'")
        .join("&#39;")
        .split("<")
        .join("&lt;")
        .split(">")
        .join("&gt;")
        .split("/")
        .join("&#x2f;")
        .split("\n")
        .join("<br>"); // Allow line breaks
    }

    function sanitizeURL(url) {
      if (url.trim().toLowerCase().indexOf("javascript:") === 0) {
        return "about:blank";
      }
      return url;
    }

    function sanitizeURLForCss(url) {
      return sanitizeURL(url).replace(/"/g, "%22").replace(/'/g, "%27");
    }

    // trên mobile
    function startOrientation() {
      if (!orientationSupport) return;
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission().then(function (response) {
          if (response == "granted") {
            orientation = 1;
            window.addEventListener("deviceorientation", orientationListener);
            controls.orientation.classList.add(
              "pnlm-orientation-button-active"
            );
          }
        });
      } else {
        orientation = 1;
        window.addEventListener("deviceorientation", orientationListener);
        controls.orientation.classList.add("pnlm-orientation-button-active");
      }
    }

    function stopOrientation() {
      window.removeEventListener("deviceorientation", orientationListener);
      controls.orientation.classList.remove("pnlm-orientation-button-active");
      orientation = false;
    }

    // Public
    // Lấy dữ liệu
    this.isLoaded = function () {
      return Boolean(loaded);
    };
    this.getPitch = function () {
      return config.pitch;
    };
    this.getHfov = function () {
      return config.hfov;
    };
    this.getYaw = function () {
      return config.yaw;
    };
    this.getPitchBounds = function () {
      return [config.minPitch, config.maxPitch];
    };
    this.getYawBounds = function () {
      return [config.minYaw, config.maxYaw];
    };
    this.getHfovBounds = function () {
      return [config.minHfov, config.maxHfov];
    };
    this.getNorthOffset = function () {
      return config.northOffset;
    };
    this.getHorizonRoll = function () {
      return config.horizonRoll;
    };
    this.getHorizonPitch = function () {
      return config.horizonPitch;
    };
    this.getRenderer = function () {
      return renderer;
    };
    this.mouseEventToCoords = function (event) {
      return mouseEventToCoords(event);
    };
    this.getScene = function () {
      return config.scene;
    };
    this.getAllScenes = function () {
      const allScenes = [];
      Object.keys(initialConfig.scenes).forEach((scene) => {
        allScenes.push({ [scene]: initialConfig.scenes[scene] });
      });
      return allScenes;
    };
    this.getConfig = function () {
      return config;
    };
    this.getSceneObj = function (key) {
      return config.scenes[key];
    };
    this.getContainer = function () {
      return container;
    };
    this.isOrientationSupported = function () {
      return orientationSupport || false;
    };
    this.isOrientationActive = function () {
      return Boolean(orientation);
    };

    // Sửa dữ liệu
    this.setPitch = function (pitch, animated, callback, callbackArgs) {
      latestInteraction = Date.now();
      if (Math.abs(pitch - config.pitch) <= eps) {
        if (typeof callback === "function") callback(callbackArgs);
        return this;
      }
      animated = animated === undefined ? 1000 : Number(animated);
      if (animated) {
        animatedMove.pitch = {
          startTime: Date.now(),
          startPosition: config.pitch,
          endPosition: pitch,
          duration: animated,
        };
        if (typeof callback === "function")
          setTimeout(function () {
            callback(callbackArgs);
          }, animated);
      } else {
        config.pitch = pitch;
      }
      animateInit();
      return this;
    };
    this.setPitchBounds = function (bounds) {
      config.minPitch = Math.max(-90, Math.min(bounds[0], 90));
      config.maxPitch = Math.max(-90, Math.min(bounds[1], 90));
      return this;
    };
    this.setYaw = function (yaw, animated, callback, callbackArgs) {
      latestInteraction = Date.now();
      if (Math.abs(yaw - config.yaw) <= eps) {
        if (typeof callback === "function") callback(callbackArgs);
        return this;
      }
      animated = animated === undefined ? 1000 : Number(animated);
      yaw = ((yaw + 180) % 360) - 180; // Keep in bounds
      if (animated) {
        // Animate in shortest direction
        if (config.yaw - yaw > 180) yaw += 360;
        else if (yaw - config.yaw > 180) yaw -= 360;

        animatedMove.yaw = {
          startTime: Date.now(),
          startPosition: config.yaw,
          endPosition: yaw,
          duration: animated,
        };
        if (typeof callback === "function")
          setTimeout(function () {
            callback(callbackArgs);
          }, animated);
      } else {
        config.yaw = yaw;
      }
      animateInit();
      return this;
    };
    this.setYawBounds = function (bounds) {
      config.minYaw = Math.max(-180, Math.min(bounds[0], 180));
      config.maxYaw = Math.max(-180, Math.min(bounds[1], 180));
      return this;
    };
    this.setHfov = function (hfov, animated, callback, callbackArgs) {
      latestInteraction = Date.now();
      if (Math.abs(hfov - config.hfov) <= eps) {
        if (typeof callback === "function") callback(callbackArgs);
        return this;
      }
      animated = animated === undefined ? 1000 : Number(animated);
      if (animated) {
        animatedMove.hfov = {
          startTime: Date.now(),
          startPosition: config.hfov,
          endPosition: constrainHfov(hfov),
          duration: animated,
        };
        if (typeof callback === "function")
          setTimeout(function () {
            callback(callbackArgs);
          }, animated);
      } else {
        setHfov(hfov);
      }
      animateInit();
      return this;
    };
    this.setHfovBounds = function (bounds) {
      config.minHfov = Math.max(0, bounds[0]);
      config.maxHfov = Math.max(0, bounds[1]);
      return this;
    };
    this.setNorthOffset = function (heading) {
      config.northOffset = Math.min(360, Math.max(0, heading));
      animateInit();
      return this;
    };
    this.setHorizonRoll = function (roll) {
      config.horizonRoll = Math.min(90, Math.max(-90, roll));
      renderer.setPose(
        (config.horizonPitch * Math.PI) / 180,
        (config.horizonRoll * Math.PI) / 180
      );
      animateInit();
      return this;
    };
    this.setHorizonPitch = function (pitch) {
      config.horizonPitch = Math.min(90, Math.max(-90, pitch));
      renderer.setPose(
        (config.horizonPitch * Math.PI) / 180,
        (config.horizonRoll * Math.PI) / 180
      );
      animateInit();
      return this;
    };
    this.setUpdate = function (bool) {
      update = bool === true;
      if (renderer === undefined) onImageLoad();
      else animateInit();
      return this;
    };

    // hành động
    this.lookAt = function (
      pitch,
      yaw,
      hfov,
      animated,
      callback,
      callbackArgs
    ) {
      animated = animated === undefined ? 1000 : Number(animated);
      if (pitch !== undefined && Math.abs(pitch - config.pitch) > eps) {
        this.setPitch(pitch, animated, callback, callbackArgs);
        callback = undefined;
      }
      if (yaw !== undefined && Math.abs(yaw - config.yaw) > eps) {
        this.setYaw(yaw, animated, callback, callbackArgs);
        callback = undefined;
      }
      if (hfov !== undefined && Math.abs(hfov - config.hfov) > eps) {
        this.setHfov(hfov, animated, callback, callbackArgs);
        callback = undefined;
      }
      if (typeof callback === "function") callback(callbackArgs);
      return this;
    };
    this.startAutoRotate = function (speed, pitch) {
      speed = speed || autoRotateSpeed || 1;
      pitch = pitch === undefined ? origPitch : pitch;
      config.autoRotate = speed;
      _this.lookAt(pitch, undefined, origHfov, 3000);
      animateInit();
      return this;
    };
    this.stopAutoRotate = function () {
      autoRotateSpeed = config.autoRotate ? config.autoRotate : autoRotateSpeed;
      config.autoRotate = false;
      config.autoRotateInactivityDelay = -1;
      return this;
    };
    this.stopMovement = function () {
      stopAnimation();
      speed = { yaw: 0, pitch: 0, hfov: 0 };
    };
    this.loadScene = function (sceneId, pitch, yaw, hfov) {
      if (loaded !== false) loadScene(sceneId, pitch, yaw, hfov);
      return this;
    };
    this.toggleFullscreen = function () {
      toggleFullscreen();
      return this;
    };
    this.addScene = function (sceneId, config) {
      initialConfig.scenes[sceneId] = config;
      return this;
    };
    this.removeScene = function (sceneId) {
      if (
        config.scene === sceneId ||
        !initialConfig.scenes.hasOwnProperty(sceneId)
      )
        return false;
      delete initialConfig.scenes[sceneId];
      return true;
    };
    this.addHotSpot = function (hs, sceneId) {
      if (sceneId === undefined && config.scene === undefined) {
        // Not a tour
        config.hotSpots.push(hs);
      } else {
        // Tour
        var id = sceneId !== undefined ? sceneId : config.scene;
        if (initialConfig.scenes.hasOwnProperty(id)) {
          if (!initialConfig.scenes[id].hasOwnProperty("hotSpots")) {
            initialConfig.scenes[id].hotSpots = []; // Create hot spots array if needed
            if (id === config.scene)
              config.hotSpots = initialConfig.scenes[id].hotSpots; // Link to current config
          }
          initialConfig.scenes[id].hotSpots.push(hs); // Add hot spot to config
        } else {
          throw "Invalid scene ID!";
        }
      }
      if (sceneId === undefined || config.scene === sceneId) {
        // Add to current scene
        createHotSpot(hs);
        if (loaded) renderHotSpot(hs);
      }
      return this;
    };
    this.removeHotSpot = function (hotSpotId, sceneId) {
      if (sceneId === undefined || config.scene === sceneId) {
        if (!config.hotSpots) return false;
        for (var i = 0; i < config.hotSpots.length; i++) {
          if (
            config.hotSpots[i].hasOwnProperty("id") &&
            config.hotSpots[i].id === hotSpotId
          ) {
            // Delete hot spot DOM elements
            var current = config.hotSpots[i].div;
            while (current.parentNode != renderContainer)
              current = current.parentNode;
            renderContainer.removeChild(current);
            delete config.hotSpots[i].div;
            // Remove hot spot from configuration
            config.hotSpots.splice(i, 1);
            return true;
          }
        }
      } else {
        if (initialConfig.scenes.hasOwnProperty(sceneId)) {
          if (!initialConfig.scenes[sceneId].hasOwnProperty("hotSpots"))
            return false;
          for (
            var j = 0;
            j < initialConfig.scenes[sceneId].hotSpots.length;
            j++
          ) {
            if (
              initialConfig.scenes[sceneId].hotSpots[j].hasOwnProperty("id") &&
              initialConfig.scenes[sceneId].hotSpots[j].id === hotSpotId
            ) {
              // Remove hot spot from configuration
              initialConfig.scenes[sceneId].hotSpots.splice(j, 1);
              return true;
            }
          }
        } else {
          return false;
        }
      }
    };
    this.resize = function () {
      if (renderer) onDocumentResize();
    };
    this.startOrientation = function () {
      if (orientationSupport) startOrientation();
    };
    this.stopOrientation = function () {
      stopOrientation();
    };

    // event listenner
    this.on = function (type, listener) {
      externalEventListeners[type] = externalEventListeners[type] || [];
      externalEventListeners[type].push(listener);
      return this;
    };
    this.off = function (type, listener) {
      if (!type) {
        // Remove all listeners if type isn't specified
        externalEventListeners = {};
        return this;
      }
      if (listener) {
        var i = externalEventListeners[type].indexOf(listener);
        if (i >= 0) {
          // Remove listener if found
          externalEventListeners[type].splice(i, 1);
        }
        if (externalEventListeners[type].length === 0) {
          // Remove category if empty
          delete externalEventListeners[type];
        }
      } else {
        // Remove category of listeners if listener isn't specified
        delete externalEventListeners[type];
      }
      return this;
    };

    function fireEvent(type) {
      if (type in externalEventListeners) {
        // Reverse iteration is useful, if event listener is removed inside its definition
        for (var i = externalEventListeners[type].length; i > 0; i--) {
          externalEventListeners[type][
            externalEventListeners[type].length - i
          ].apply(null, [].slice.call(arguments, 1));
        }
      }
    }

    this.destroy = function () {
      destroyed = true;
      clearTimeout(autoRotateStart);
      if (renderer) renderer.destroy();
      if (listenersAdded) {
        document.removeEventListener("mousemove", onDocumentMouseMove, false);
        document.removeEventListener("mouseup", onDocumentMouseUp, false);
        container.removeEventListener(
          "mozfullscreenchange",
          onFullScreenChange,
          false
        );
        container.removeEventListener(
          "webkitfullscreenchange",
          onFullScreenChange,
          false
        );
        container.removeEventListener(
          "msfullscreenchange",
          onFullScreenChange,
          false
        );
        container.removeEventListener(
          "fullscreenchange",
          onFullScreenChange,
          false
        );
        window.removeEventListener("resize", onDocumentResize, false);
        window.removeEventListener(
          "orientationchange",
          onDocumentResize,
          false
        );
        container.removeEventListener("keydown", onDocumentKeyPress, false);
        container.removeEventListener("keyup", onDocumentKeyUp, false);
        container.removeEventListener("blur", clearKeys, false);
        document.removeEventListener("mouseleave", onDocumentMouseUp, false);
      }
      container.innerHTML = "";
      container.classList.remove("pnlm-container");
    };
  }

  return {
    /**
     * @param {*} container
     * @param {*} config
     * @returns
     */
    viewer: function (container, config) {
      return new Viewer(container, config);
    },
  };
})(
  typeof window === "undefined" ? null : window,
  typeof document === "undefined" ? null : document
);
