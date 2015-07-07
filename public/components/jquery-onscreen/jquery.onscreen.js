// http://upshots.org/javascript/jquery-test-if-element-is-in-viewport-visible-on-screen
// plugin to detect is an element on screen?
// return bool

// only concerned with vertical scrolling
$.fn.isOnScreen = function(){
    var viewport = {};
    viewport.top = $(window).scrollTop();
    viewport.bottom = viewport.top + $(window).height();
    var bounds = {};
    bounds.top = this.offset().top;
    bounds.bottom = bounds.top + this.outerHeight();
    return ((bounds.top <= viewport.bottom) && (bounds.bottom >= viewport.top));
};