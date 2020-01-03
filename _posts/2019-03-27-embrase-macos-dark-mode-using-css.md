---
layout: post
title:  "Embrace macOS's dark mode with Safari"
date:   2019-03-27 12:00:00 +0000
categories: web design
---

This last monday (March 25, 2019), Apple released the last version of macOS 10.14.4, along with Safari 12.1.
This last version of Safari expose a CSS api using the `@media` tag allowing you to support a **Dark theme** for your site, working along with macOS's dark mode.

<!--more-->

If you're using Safari 12.1 right now, enable the Dark Mode on your Mac, and you'll find that this very blog post is now in "Dark Mode", using the very same css method I'm going to provide you.

You may also want to play with this interactive comparative screenshot of the blog:

{% include compare_images.html before="/assets/screenshots/blog-light.png" after="/assets/screenshots/blog-dark.png" %}

## Just a bit of CSS

Let's say we're starting with a very simple CSS website:

{% highlight css %}
body {
    color: #333;
    background: #f8f8f8;
}
{% endhighlight %}

You'll just have to provide extra declaration for the dark-mode alternative:

{% highlight css %}
body {
    color: #333;
    background: #f8f8f8;
}

@media (prefers-color-scheme: dark) {
    body {
        color: #eee;
        background: #111;
    }
}
{% endhighlight %}

## What about dark websites?

For website that are dark by default, you may provide a "light" alternative to your site, allowing user that prefers light content to use it!

{% highlight css %}
body {
    color: #eee;
    background: #111;
}

@media (prefers-color-scheme: light) {
    body {
        color: #333;
        background: #f8f8f8;
    }
}
{% endhighlight %}

## Legibility & Contrast

When designing your dark theme alternative, make sure to test every webpage for illegible content. Colored links, syntaxic coloring, tables... There are many places where you may find unadapted color schemes and illegible text.

All of them should have their own dark-mode alternative to keep your website legible whatever the user's color-scheme preference is.

To help you with colors and legibility, you may want to read this cool article: [Color Contrast for Better Readability][color-contrast]

## Cross-compatibility

For now, this feature is only implemented for Safari 12.1\\
No other browser supports-it yet, but Firefox will introduce it starting with [version 67][firefox-nightly].

As of today, this CSS media query is currently [a W3C draft][w3c-draft], and we can hope it'll be more supported by browsers in the future.
Until then, you'll have a working dark-mode for true Apple addicts that still use Safari as their main browser.

[color-contrast]: https://www.viget.com/articles/color-contrast/
[firefox-nightly]: https://www.mozilla.org/en-US/firefox/67.0a1/releasenotes/
[w3c-draft]: https://drafts.csswg.org/mediaqueries-5/#descdef-media-prefers-color-scheme
