---
layout: post
title:  "Build a privacy-safe home network using Pi-hole"
date:   2018-10-15 18:05:00 +0200
categories: Security network
ref: raspberry-pi-hole
lang: en
published: false
---

TODO: intro

### What is Pi-hole?

[Pi-hole][pihole], as they describe themselves, is an open-source [DNS sinkhole][sinkhole].
It is a custom DNS ; that will drop request during the DNS resolution step if it's been blacklisted.

The main advantage of dropping request at DNS resolution step is that the request never leave your own network: 
It is first sent to your Raspberry Pi, and then dropped immediately if it's been blacklisted.

It means that blacklisted remote servers never have to know that you even exist!
The ad are dropped before even loading, and not at rendering time, granting your network better performances.

Of course, some ad-based blacklist are provided, making Pi-hole a powerful and **untraceable** ad-blocker. 
But we're also going to see how to take advantage of Pi-hole to grant yourself a better control of your own privacy.

### Setting up your Raspberry Pi

This step if **optional**, but it's always good to start with a *fresh install*.
You can, of course, skip immediately to [Pi-hole installation][pi-hole-install].

##### Raspbian Stretch installation

Download the [latest release of Raspbian Stretch][raspbian-download] on your disk.
Then, we need to copy it on your SD card, properly. 

On macOS, It can be done with the following commands.

{% highlight bash %}
$ diskutil list # Note the number associated with your SD card. (ie disk2 for instance)
$ diskutil unmountDisk /dev/disk2
$ sudo dd bs=1m if=raspbian-stretch-lite.img of=/dev/rdisk2 conv=sync
{% endhighlight %}

We then need to enable SSH before plugging the SD card in the Raspberry for the first boot:

{% highlight bash %}
$ cd /Volumes/boot/
$ touch ssh
{% endhighlight %}

And we unmount the disk

{% highlight bash %}
$ cd ~
$ diskutil unmountDisk /dev/disk2
{% endhighlight %}

Now, you can plug your SD card in your Raspberry and wait it to boot.

You may now connect to it using SSH:

{% highlight bash %}
$ ssh pi@192.168.1.x
{% endhighlight %}

Default password is `raspberry`

##### Minimal security settings

The bare minimum to do when the Raspberry first start is to **change the password for the pi user**.

{% highlight bash %}
$ passwd
{% endhighlight %}

You may also want to:
- create your own user with sudo auth, and then delete the pi user
- change the SSH port
- Authenticate using a private key
- Requiring a password when using `sudo`
- Update the repositories and packages

### Installing Pi-hole

It is advised that your Raspberry Pi should have a static IP on your network.

From your Raspberry, you can run the installer by executing:

{% highlight bash %}
$ wget -O basic-install.sh https://install.pi-hole.net
$ sudo bash basic-install.sh
{% endhighlight %}

Once all is done, you only need to set up the IP of your Raspberry as your primary DNS server on your router.
If you can't, it's still possible to use the Raspberry as your main DHCP server. (Disable your old one if you choose this option).

[pihole]: https://pi-hole.net/
[sinkhole]: https://en.wikipedia.org/wiki/DNS_sinkhole
[pi-hole-install]: #installing-pi-hole
[raspbian-download]: https://downloads.raspberrypi.org/raspbian_lite_latest

[//]: # (https://discourse.pi-hole.net/t/enabling-https-for-your-pi-hole-web-interface/5771)
[//]: # (https://docs.pi-hole.net/guides/unbound/)
[//]: # (https://discourse.pi-hole.net/t/add-option-to-create-dns-records-in-gui/564)