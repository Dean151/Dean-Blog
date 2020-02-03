---
layout: post
title:  "Configure Homebridge on a Raspberry Pi"
date:   2020-02-03 12:00:00 +0200
categories: apple homekit
published: false
---

I tend to think that HomeKit is an amazing ecosystem for connected devices, providing a secure way of automating, and communicate with device, even when you're away from home.

Of course, HomeKit have many downsides ; like making it mandatory to have a concentrator to access your devices away from home.
But the most important downside is that many devices does not support HomeKit at all.

<!--more-->

I hope that the amount of devices that are not compatible will decrease over time and newer devices releases, especially now that most of the connected home actors [will develop an open standard][homekit-agreement], and that a [part of HomeKit has already been open-sourced][homekit-opensource].

Hopefully, there is an open-source project that allows us to fill the hole and make basically any non-HomeKit device compatible with the Home app : [Homebridge][homebridge].

## Installation on a Raspberry Pi

#### Node.js

Homebridge have been built over Node.js, and requires **Node v4.3.2 or greater**.

If you don't have already it installed, let's take care of that.

First, let's check if what ARM processor you have:

{% highlight bash %}
sudo uname -m # My Raspberry Pi 4 answers with `armv7l`
{% endhighlight %}

Then, go to [Node.js LTS download page][node-js-download], and copy the link that matches your ARM processor version.

Then use it to perform node installation:

{% highlight bash %}
# We download and untar the archive.
wget https://nodejs.org/dist/v12.14.1/node-v12.14.1-linux-armv7l.tar.xz
tar -xvf node-v12.14.1-linux-armv7l.tar.xz
# Some file are useless to copy
cd node-v12.14.1-linux-armv7l
rm CHANGELOG.md LICENSE README.md
# We copy the files to install
sudo cp -R * /usr/local/
# Cleanup
cd ../
rm -r node-v12.14.1-linux-armv7l*
{% endhighlight %}

We may now test Node.js installation:

{% highlight bash %}
node -v # v12.14.1
npm -v # 6.13.7
{% endhighlight %}

To also make it easier to install npm global package, we fix the ownership of `/usr/local/`

{% highlight bash %}
sudo chown -R pi:pi /usr/local
{% endhighlight %}

#### Homebridge core

```
sudo apt-get install libavahi-compat-libdnssd-dev
```

```
npm install -g homebridge
```

#### Homebridge plugins

TODO!

## Persistency over reboot

TODO!

## Debugging

TODO!

## Going further

TODO!

[homekit-agreement]: https://developer.apple.com/homekit/whats-new/
[homekit-opensource]: https://www.theverge.com/2019/12/20/21031197/apple-homekit-smart-home-open-source-accessory-development-kit-adk-connected-home-over-ip
[homebridge]: https://homebridge.io/
[node-js-download]: https://nodejs.org/en/download/

[homebridge-github]: https://github.com/nfarina/homebridge
