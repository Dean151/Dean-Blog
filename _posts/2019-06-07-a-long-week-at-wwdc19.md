---
layout: post
title:  "A (long) week at  WWDC19"
date:   2019-06-07 17:30:00 -0700
categories: conference apple
---

What a long week it's been!

My first [ WWDC][wwdc] is now over, and there's a lot to say. I've learnt a lot, met incredible people, and corrected a lot of bugs with the help of fellows Apple engineers.

<!--more-->

{% include slideshow.html images="/assets/ios/wwdc/wwdc19-robot.jpg, /assets/ios/wwdc/wwdc19-alien.jpg, /assets/ios/wwdc/wwdc19-monkey.jpg, /assets/ios/wwdc/wwdc19-skull.jpg" %}

## The experience

First thing I want to dig into is the amazing experience it is to attend  WWDC.

#### People
You meet people, a lot and a lot of people. App developers, designers, product owners, Apple engineers, … etc.

All of those people shares different experiences, way of living, apps concepts. Discussing with all of them is thrilling and allow you to take a step back on a lot of point of view you may had on development.

#### Labs
Labs are an opportunity of a lifetime: being able to speak with the guys who make the API alive allows you to congratulate them on their hard work (Thanks guys from the PDFKit I met earlier today, it was a nice time with you!) 

Also this is the opportunity to dig into bugs and weird behaviors will the engineers that designed the frameworks. They're the most willing to know what's going on on a specific bug, or when an API is wrongly used (this can happen a lot with some advanced UIKit API like [UIViewControllerTransitioningDelegate][uiviewcontrollertransitioningdelegate]).

#### Keynote
If you're an Apple-enthusiast like I am, you've already seen at least one Keynote streamed live over the Internet. Those are a quite a fine tuned show, and living one by being in the audience is amazing. Plus, this year was very rich in announcements! Catalyst, SwiftUI, iPadOS with multi-window for apps, USB drive support, download manager over Safari. Dark-mode for iOS, iPadOS & tvOS … etc. And for all of those, you get the audience reactions, that you don't really have over the live streaming. Finally, the videos shown during the presentation are really stunning when projected on a screen that is about 50m large.

#### Sessions
There are a lot of sessions, which are all streamable live ; and can be watched for later reference since they are made available later over on-demand stream. Those are always interesting, and it was really a nice feeling to follow the SwiftUI sessions live this year.

But since there are a lot of sessions at the same time, and also the labs, you cannot attend them all. That also why I now have a big list of sessions to watch later. But still way less sessions to stream in comparison of years I didn't attend!

## Announcements

I'm not going to attempt listing all the announcements made by Apple for the developers. Some other [blogs already made that][announcement-list] better than I would ever do!
I'm just going to go back on a few improvements made, that I'm thrilled about.

#### SwiftUI
SwiftUI came out of nowhere, and it's stunning already! Sure, it's not going to replace UIKit or AppKit anytime soon (or maybe never?) since it heavily rely on them to work properly. 

Plus for now it's missing a lot of core components. There are no ActivityIndicator for example. But to fulfill those miss, the compatibility with old UI framework is complete! You may use a SwiftUI view in a UIView or a NSView. And you may use a UIView in a SwiftUI view. That's allow to use the old UIKit views that may not have their own SwiftUI implementations before years (like MKMapView or WKWebView).

SwiftUI suppress the MVC design pattern and replace it with real MVVM. And all the solutions proposed by Apple to make that easy for developer is breathtaking. I'm thrilled to see what the future of SwiftUI will be made of. And a lot of components will appears in the future betas. (Form for instance is not yet available in Beta 1)

#### Catalyst
Catalyst is the marketing name for the Marzipan project. It allow you to build and run UIKit application, basically iPad application natively on the Mac.

It didn't take me that long time to make that work for [DiliTrust Exec][dilitrust-exec] app. And most of the bug I was encountering were wrong usage of the UIKit API. And the Labs were awesome to get the guidance for correcting all those bugs. The Mac AppStore may became a brand new place to find great apps in the very near future.

#### iPadOS's multiple windows for a same app
This add a whole new dimension to the iPad capabilities. You may now have as much document editor opened from the same app at a time, making a lot of new workflows available on iPadOS. And what makes this feature really powerful is that it's an open API for third-parties applications.

To provide a great user experience though, it's not that easy to opt-in for application. Two windows showing the same data should stay in sync, and idle windows may be dismissed by the system at any moment, making mandatory to have a powerful state restoration mechanism within the app. Plus, you have to make the whole application available as a stand-alone, since the opt-in allow the user creating as windows as he wan't.

We definitely want to include those features in our DiliTrust Exec application, but those will require a bit more work to make it right.

#### PencilKit
Always felt weird about Apple providing a great user experience since they introduced the Apple Pencil, witch is an amazing tool. But all the underneath APIs, driven by Metal, were private. Not anymore!

Making this API available open a range of all new apps ; that will provide the best user experience for drawing out of the box!

It will, of course, be part of the APIs will dig into at DiliTrust Exec.

#### Others
New Foundation formatters, NFC opened to Read/Write NDEF tags, and more, Taptic engine now opened with CoreHaptics framework. And finally, CryptoSwift is now a thing! A great new way of dealing with cryptography when using Swift. It's hard to use it wrong, and it makes most of my [cryptography blog post][crypto-ios] out of date.

## To sum it up

Attending the WWDC is a unique opportunity, and I strongly recommend this experience to any Apple related developer.
Sure it's not cheap. For students, the Scholarship program gives you a chance to get you ticket. And if you're working for a company, ask them to attend. Most of countries provide credits for formations. And your company will also win by sending you!

It was an exhausting week, but still, I hope that WWDC19 will not be the last WWDC I attend to.

[wwdc]: https://developer.apple.com/wwdc19/
[uiviewcontrollertransitioningdelegate]: https://developer.apple.com/documentation/uikit/uiviewcontrollertransitioningdelegate
[announcement-list]: https://patrickbalestra.com/blog/2019/06/07/wwdc-2019-the-things-you-may-have-missed.html
[dilitrust-exec]: https://www.dilitrust.com/solution/exec/
[crypto-ios]: {{ site.baseurl }}{% post_url 2017-07-12-aes-encryption-good-practice-with-swift %}