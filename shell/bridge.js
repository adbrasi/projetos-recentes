// Lets the master deck (index.html) drive this reveal.js deck when it runs inside the master's iframe.
// The master owns the keyboard and the progress UI; this deck only moves when told and reports where it is.
(function () {
  if (window.parent === window || typeof Reveal === "undefined") return;

  var NAV = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " ", "PageUp", "PageDown", "Home", "End", "Escape", "Enter", "f", "F", "g", "G", "o", "O"];
  var post = function (msg) { msg.ns = "deck"; window.parent.postMessage(msg, "*"); };
  var state = function () {
    return { type: "state", index: Reveal.getSlidePastCount() + 1, total: Reveal.getTotalSlides() };
  };
  var atEnd = function () { return Reveal.isLastSlide() && !Reveal.availableFragments().next; };
  var atStart = function () { return Reveal.isFirstSlide() && !Reveal.availableFragments().prev; };
  var toLast = function () {
    Reveal.slide(Reveal.getHorizontalSlides().length - 1, Number.MAX_SAFE_INTEGER);
    while (Reveal.nextFragment()) {}
  };

  function start() {
    Reveal.configure({ controls: false, progress: false, slideNumber: false, keyboard: false,
      hash: false, history: false, overview: false, help: false });
    if (/[?&]at=last/.test(location.search)) toLast();
    Reveal.on("slidechanged", function () { post(state()); });
    Reveal.on("fragmentshown", function () { post(state()); });
    Reveal.on("fragmenthidden", function () { post(state()); });
    var s = state(); s.type = "ready"; post(s);
  }
  Reveal.isReady() ? start() : Reveal.on("ready", start);

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.ns !== "shell" || !Reveal.isReady()) return;
    if (d.cmd === "next") atEnd() ? post({ type: "end" }) : Reveal.next();
    else if (d.cmd === "prev") atStart() ? post({ type: "start" }) : Reveal.prev();
    else if (d.cmd === "first") Reveal.slide(0, 0, -1);
    else if (d.cmd === "last") toLast();
    post(state());
  });

  // Keys pressed while this frame has focus (after a click inside it) go to the master.
  window.addEventListener("keydown", function (e) {
    if (NAV.indexOf(e.key) < 0 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    post({ type: "key", key: e.key, shift: e.shiftKey });
  }, true);
})();
