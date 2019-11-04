(function() {
  var comparable, comparableBehavior, comparables, i, j, len, len1, slideshow, slideshowBehavior, slideshows;

  comparableBehavior = function(comparable) {
    var clipImage, shouldClip;
    clipImage = function(amount) {
      var image;
      image = comparable.children[1];
      return image.style.clip = 'rect(0px ' + image.clientWidth + 'px ' + image.clientHeight + 'px ' + amount + 'px)';
    };
    comparable.addEventListener('dragstart', function(event) {
      event.preventDefault();
      event.returnValue = false;
      return false;
    });
    shouldClip = false;
    comparable.addEventListener('mousedown', function() {
      shouldClip = true;
      comparable.children[1].style.removeProperty('transition');
      clipImage(event.layerX);
    });
    comparable.addEventListener('mousemove', function() {
      if (!shouldClip) {
        return;
      }
      comparable.children[1].style.transition = 'none';
      clipImage(event.layerX);
    });
    comparable.addEventListener('mouseup', function() {
      comparable.children[1].style.removeProperty('transition');
      shouldClip = false;
    });
    return window.addEventListener('load', function() {
      var width;
      width = comparable.clientWidth;
      clipImage(width);
      return setTimeout(function() {
        comparable.children[1].style.transition = 'clip 1s';
        clipImage(width / 2);
        return setTimeout(function() {
          return comparable.children[1].style.removeProperty('transition');
        }, 1000);
      }, 500);
    });
  };

  comparables = document.getElementsByClassName('comparable-images');

  for (i = 0, len = comparables.length; i < len; i++) {
    comparable = comparables[i];
    comparableBehavior(comparable);
  }

  slideshowBehavior = function(slideshow) {
    var images, interval, nextImage, resetInterval, shouldTransition;
    images = slideshow.dataset.images.split(', ');
    shouldTransition = true;
    interval = void 0;
    nextImage = function() {
      var current, next;
      if (!shouldTransition) {
        return;
      }
      shouldTransition = false;
      current = parseInt(slideshow.dataset.current);
      next = (current + 1) % images.length;
      slideshow.children[0].setAttribute('src', images[next]);
      slideshow.children[1].setAttribute('src', images[current]);
      slideshow.dataset.current = next;
      slideshow.children[1].style.opacity = 0;
      setTimeout(function() {
        slideshow.children[1].setAttribute('src', images[next]);
        setTimeout(function() {
          slideshow.children[1].style.opacity = 1;
          setTimeout(function() {
            shouldTransition = true;
          }, 300);
        }, 10);
      }, 300);
    };
    resetInterval = function() {
      clearInterval(interval);
      return interval = setInterval(nextImage, 5000);
    };
    resetInterval();
    slideshow.addEventListener('click', function() {
      resetInterval();
      nextImage();
    });
  };

  slideshows = document.getElementsByClassName('slideshow');

  for (j = 0, len1 = slideshows.length; j < len1; j++) {
    slideshow = slideshows[j];
    slideshowBehavior(slideshow);
  }

}).call(this);
