---
---

# Compare images
comparableBehavior = (comparable) ->

    # Changes the amout of both images
    clipImage = (amount) ->
        image = comparable.children[1]
        image.style.clip = 'rect(0px ' + image.clientWidth + 'px ' + image.clientHeight + 'px ' + amount + 'px)';

    # Prevent drag feature
    comparable.addEventListener 'dragstart', (event) -> 
        event.preventDefault()
        event.returnValue = false
        false

    # Add mouse behavior
    shouldClip = false
    comparable.addEventListener 'mousedown', () -> 
        shouldClip = true
        comparable.children[1].style.removeProperty 'transition'
        clipImage event.layerX
        return
    comparable.addEventListener 'mousemove', () ->
        if !shouldClip
            return
        comparable.children[1].style.transition = 'none'
        clipImage event.layerX
        return
    comparable.addEventListener 'mouseup', () -> 
        comparable.children[1].style.removeProperty 'transition'
        shouldClip = false
        return

    # Fade in the image
    window.addEventListener 'load', () ->
        width = comparable.clientWidth;
        clipImage(width)
        setTimeout () ->
            comparable.children[1].style.transition = 'clip 1s'
            clipImage width/2
            setTimeout () ->
                comparable.children[1].style.removeProperty 'transition'
            , 1000
        , 500

comparables = document.getElementsByClassName 'comparable-images'
comparableBehavior comparable for comparable in comparables


# Slideshows
slideshowBehavior = (slideshow) ->
    images = slideshow.dataset.images.split ', '
    shouldTransition = true
    interval = undefined

    nextImage = () ->
        if !shouldTransition
            return
        shouldTransition = false
        current = parseInt slideshow.dataset.current
        next = (current + 1) % images.length
        
        slideshow.children[0].setAttribute 'src', images[next]
        slideshow.children[1].setAttribute 'src', images[current]
        slideshow.dataset.current = next

        # We animate to the next image
        slideshow.children[1].style.opacity = 0;
        setTimeout () -> 
            slideshow.children[1].setAttribute 'src', images[next]
            setTimeout () -> 
                slideshow.children[1].style.opacity = 1
                setTimeout () -> 
                    shouldTransition = true
                    return
                , 300
                return
            , 10
            return
        , 300
        return

    resetInterval = () -> 
        clearInterval(interval);
        interval = setInterval nextImage, 5000

    resetInterval()
    slideshow.addEventListener 'click', () -> 
        resetInterval()
        nextImage()
        return
    return

slideshows = document.getElementsByClassName 'slideshow'
slideshowBehavior slideshow for slideshow in slideshows
