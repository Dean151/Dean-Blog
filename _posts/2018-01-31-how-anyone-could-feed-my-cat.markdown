---
layout: post
title:  "How anyone could feed my cat"
date:   2018-01-31 12:00:00 +0100
categories: Security IOT
ref: how-anyone-could-feed-my-cat
---

As a software engineer for [DiliTrust][dilitrust], I think software security as a primary feature for any kind of product or software.
Every time we heard a story about any kind of security flaw, we take it seriously: how is that possible? Am we directly or indirectly impacted?

Well, I guess I wasn't yet prepared for my last discovery.

### What I like about home automation solution

Since I got my first home automation device: a Philips Hue set, I really like the idea of handling devices remotely, or locally from my phone or even my voice. That's why I also bought some sensor devices from Elgato, to track temperature, humidity and air quality all around my flat.

Every device I ever choose was HomeKit compatible, and I never intended to use any of my devices remotely. I do not have any concentrator to make HomeKit available from anywhere, and I feel confident that my devices are pretty much secure. I suppose, maybe wrongly, that Apple do impose some rules to make the device secure, and also make sure that their own implementation of HomeKit is quite secure.

I know that HomeKit already had some security flaw [in the past][homekit-flaw], and may have some in the future, but I'm pretty sure Apple will always correct them.

### Where my cat comes in

![My cat, Newton][newton]

I adopted Newton in June 2016, and he's adorable… well… most of the time. But since we've got him neutralized, he became trapped in gluttony. Incapable of getting himself regulated with food, we had a pretty bad time trying him not to eat more food that he needs.

In that context, I got seduced by an automatic feeder like we can find on Amazon.
The trademark *HoneyGuaridan* was getting very good reception and comments from many users, and their last model, the **HoneyGuaridan S25** was very seducing!

Indeed, it was one of the only models that allowed me to program 10 meals or more a day! Perfect to make my cat more regulated about food. Last tinkle in my ear: The device was getting setted and triggered with a smartphone, it was a complete IoT device!

### When it got complicated

I received the device about three weeks ago, and my cat adopted it very quickly!

![My cat, and his feeding machine][honey-guaridan]

Despite a buggy application, the machine works very well, and my cat gets less obsessed about food.

Plus, the setup workflow made me fairly confident: I had to create an account, and then it seemed like we're authenticated all the time within the app.

But still, with some very nasty bugs, the app gave a very bad user experience, and I decided to reverse-engineer their API to make my own application, with less features, but also less UI bugs!

I used [Burp Community Edition][burp-suite] as an HTTP proxy to catch every requests sent by the application ; and find out how they're built.

### What I found

The application communicate with many differents servers: `us1.dev.alnpet.com`, `fr.dev.alnpet.com`, but also `183.232.29.249` to send some report data over a security layer.

Both `fr.dev.alnpet.com` and `us1.dev.alnpet.com` does not have any security layer, and make data transmit without TLS or SSL. It means that it's vulnerable to [man-in-the-middle attacks][man-in-the-middle], and that the password used for signin and login is sent with no encryption at all, making any attacker able to intercept it, and read it!

But another intercepted request I got tinkled my mind: I was not able to see any authentication cookie, representing my current session, and declaring the permission to perform a feed request, or any modification on my device schedule.

I immediately tried it with `curl`: Just using my machine unique ID and the url, BIM, my cat got a new meal, right from my command line interface, and without any session created.

This is crazy. At this moment, I realize that barely *anyone* could empty my feeder from anywhere in the world and/or make my cat obese!

### How I reacted

My first reaction to that discovery was to remove the Wi-Fi settings from the machine, making sure it's not anymore Internet connected. Of course I tried the magic request to prove that my machine was offline, and therefore more secure.

But that solution made the machine unusable: impossible to change the schedule or trigger a meal from my phone anymore. So I decided to continue the reverse engineering of my machine in order to implement my own secure API to use it! (crazy right?)

I looked for my [Raspberry Pi][raspberry-pi], that was getting some dust in a drawer, and setted up a [Wi-Fi hotspot][hotspot-pi] with it.

That allowed me to look the way my cat feeder was communicating with the outside world.
I found out that the only address it was communicating with was `47.90.203.137`.

`47.90.203.137` corresponds to [alnpet.net][alnpet]. I do recognize the feeder on this website, but It's a more advanced one, with a camera, and more advanced feature. Hum, weird. And the preorder link bring to KickStarter homepage. Oh boy, what am I getting myself into? I do not know what link there is between *HoneyGuaridan* and *Alnpet*. Are they even the same?

Well, let say that this IP has been banned from my Raspberry Pi

```
iptables -A INPUT -s 47.90.203.137 -j DROP
iptables -A FORWARD -s 47.90.203.137 -j DROP
iptables -A OUTPUT -s 47.90.203.137 -j DROP
```

That make sure my machine is still offline, while connected to my Raspberry. The next step would be to imitate this server to make my machine thinks it's communicating with Alnpet API, despite it would be mine.

For now, I'm still at the reverse engineering phase in order to understand how I can communicate with my device. It's not the easiest part; let hope I succeed.

And lesson learned: I will always challenge any new device that connect to my network from now on.

Am I getting a little bit paranoid? Yes I am!

[dilitrust]: https://www.dilitrust.com/en/
[homekit-flaw]: https://9to5mac.com/2017/12/07/homekit-vulnerability/
[newton]: /assets/pictures/newton.jpg
[honey-guaridan]: /assets/pictures/honeyguaridan.jpg
[burp-suite]: https://portswigger.net/burp
[man-in-the-middle]: https://en.wikipedia.org/wiki/Man-in-the-middle_attack
[raspberry-pi]: https://www.raspberrypi.org/
[hotspot-pi]: https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md
[alnpet]: http://alnpet.com
