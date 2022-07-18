export default (function () {
  function Map(container, initialConfig) {
    var _this = this;
    var config,
      draggingPointer,
      pointersCreated,
      listenersAdded,
      externalEventListeners = {};
    var defaultConfig = {};

    container =
      typeof container === "string"
        ? document.getElementById(container)
        : container;
    container.classList.add("mt-map-container");
    container.tabIndex = 1;
    container.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
    container.addEventListener("touchstart", function (e) {
      e.stopPropagation();
    });
    container.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
    });

    var renderContainer = document.createElement("div");
    renderContainer.className = "mt-map-render-container";
    container.appendChild(renderContainer);
    init();

    function init() {
      var k;
      config = {};
      for (k in defaultConfig) {
        if (defaultConfig.hasOwnProperty(k)) {
          config[k] = defaultConfig[k];
        }
      }
      for (k in initialConfig) {
        if (initialConfig.hasOwnProperty(k)) {
          config[k] = initialConfig[k];
        }
      }

      var img = document.createElement("img");
      img.className = "mt-map-image";
      img.style.height = "100%";
      img.style.width = "100%";
      img.src = config.image;
      img.draggable = false;
      img.onload = function () {
        createPointers();
      };
      container.appendChild(img);
      document.addEventListener("mousemove", onDocumentMouseMove, false);
      document.addEventListener("mouseup", onDocumentMouseUp, false);
      listenersAdded = true;
    }

    function createPointer(pt) {
      pt.top = Number(pt.top) || 0;
      pt.left = Number(pt.left) || 0;

      var div = document.createElement("div");
      div.className = "mt-pointer-base";
      div.style.left = pt.left + "px";
      div.style.top = pt.top + "px";
      renderContainer.appendChild(div);

      var divMaker = document.createElement("div");
      divMaker.className = "pointer-maker-content";
      divMaker.id = "pointer-" + pt.id_room;
      div.appendChild(divMaker);

      if (config.draggablePointer) {
        div.classList.add("pnlm-grab");
        div.classList.remove("pnlm-pointer");
        div.addEventListener("mousedown", function (e) {
          div.classList.add("pnlm-grabbing");
          if (pt.dragHandlerFunc) pt.dragHandlerFunc(pt, pt.dragHandlerArgs);
          draggingPointer = pt;
        });

        div.addEventListener("mouseup", function (e) {
          div.classList.remove("pnlm-grabbing");
        });

        div.addEventListener("contextmenu", function (e) {
          e.preventDefault();
        });

        if (
          document.documentElement.style.pointerAction === "" &&
          document.documentElement.style.touchAction === ""
        ) {
          div.addEventListener("pointerdown", function (e) {
            div.classList.add("pnlm-grabbing");
            if (pt.dragHandlerFunc) pt.dragHandlerFunc(pt, pt.dragHandlerArgs);
            draggingPointer = pt;
          });
        }

        div.addEventListener("touchmove", function (e) {
          div.classList.add("pnlm-grabbing");
          movePointer(pt, e.targetTouches[0]);
        });
        div.addEventListener("touchend", function (e) {
          div.classList.remove("pnlm-grabbing");
          if (pt.dragHandlerFunc) pt.dragHandlerFunc(pt, pt.dragHandlerArgs);
          draggingPointer = null;
        });
      } else {
        div.classList.remove("pnlm-grab");
        div.classList.add("pnlm-pointer");
        var direction_arrow = document.createElement("div");
        direction_arrow.className = "view_direction__arrow";
        divMaker.appendChild(direction_arrow);

        var span = document.createElement("div");
        span.className = "pointer-tooltip";
        span.innerHTML = escapeHTML(pt.text);
        div.appendChild(span);
        if (pt.text) {
          span.style.width = span.scrollWidth + "px";
          span.style.marginLeft =
            -(span.scrollWidth - div.offsetWidth) / 2 + "px";
          span.style.marginTop = div.offsetWidth + 5 + "px";
        }

        if (pt.clickHandlerFunc) {
          function handleClicked() {
            pt.clickHandlerFunc(pt, pt.clickHandlerArgs);
          }
          div.addEventListener("click", handleClicked, "false");
          div.className += " pnlm-pointer";
          span.className += " pnlm-pointer";
        }
      }
      pt.div = div;
    }

    function createPointers() {
      if (pointersCreated) return;
      if (!config.pointers) {
        config.pointers = [];
      } else {
        config.pointers = config.pointers.sort(function (a, b) {
          return a.top < b.top;
        });
        config.pointers.forEach(createPointer);
      }
      pointersCreated = true;
    }

    function escapeHTML(s) {
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
        .join("<br>");
    }

    function movePointer(pt, event) {
      var posY = event.clientY - container.offsetTop - 10;
      var posX = event.clientX - container.offsetLeft - 10;
      pt.top = posY >= 0 ? posY : 0;
      pt.left = posX >= 0 ? posX : 0;
      onDestroy();
    }

    function onDocumentMouseMove(event) {
      if (draggingPointer) {
        movePointer(draggingPointer, event);
      }
    }

    function onDocumentMouseUp() {
      if (draggingPointer) {
        fireEvent("draggable", draggingPointer);
      }
      draggingPointer = null;
    }

    function onDestroy() {
      renderContainer.innerHTML = "";
      config.pointers.forEach(createPointer);
    }

    function fireEvent(type) {
      if (type in externalEventListeners) {
        for (var i = externalEventListeners[type].length; i > 0; i--) {
          externalEventListeners[type][
            externalEventListeners[type].length - i
          ].apply(null, [].slice.call(arguments, 1));
        }
      }
    }

    this.on = function (type, listener) {
      externalEventListeners[type] = externalEventListeners[type] || [];
      externalEventListeners[type].push(listener);
      return this;
    };

    this.off = function (type, listener) {
      if (!type) {
        externalEventListeners = {};
        return this;
      }
      if (listener) {
        var i = externalEventListeners[type].indexOf(listener);
        if (i >= 0) {
          externalEventListeners[type].splice(i, 1);
        }
        if (externalEventListeners[type].length === 0) {
          delete externalEventListeners[type];
        }
      } else {
        delete externalEventListeners[type];
      }
      return this;
    };

    this.addPointer = function (pt) {
      config.pointers.push(pt);
      createPointer(pt);
      return this;
    };

    this.destroy = function () {
      if (listenersAdded) {
        document.removeEventListener("mousemove", onDocumentMouseMove, false);
        document.removeEventListener("mouseup", onDocumentMouseUp, false);
        document.removeEventListener("mouseleave", onDocumentMouseUp, false);
      }
      container.innerHTML = "";
      container.classList.remove("mt-map-container");
    };
  }

  return {
    init: function (container, config) {
      return new Map(container, config);
    },
  };
})(
  typeof window === "undefined" ? null : window,
  typeof document === "undefined" ? null : document
);
