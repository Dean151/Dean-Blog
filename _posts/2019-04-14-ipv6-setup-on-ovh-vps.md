---
layout: post
title:  "IPv6 setup on a Debian 9 VPS"
date:   2019-04-14 12:00:00 +0000
categories: server configuration
---

IPv6 isn't new at all, but it's stunning to see how much the web isn't ready for it at all!

But that can change, and making your webserver compatible with it is a great start!

<!--more-->

Today I discovered that my server had a IPv6 address assigned, but was not configured by default.

## Identify your IPv6 address and gateway

At OVH, two IPv6 informations are given along the IPv4:

 Type   | Full Address                              | Shortened Address
--------|-------------------------------------------|---------------------------
IPv6    | `2001:41d0:0305:2100:0000:0000:0000:10f2` | `2001:41d0:305:2100::10f2`
Gateway | `2001:41d0:0305:2100:0000:0000:0000:0001` | `2001:41d0:305:2100::1`

Since only one address is available, the network prefix, alias netmask is `128`.

## Setting up the network

Using root access, you should edit `/etc/network/interfaces`:

{% highlight bash %}
sudo nano /etc/network/interfaces
{% endhighlight %}

By default, this file contains only the IPv4 settings:

{% highlight bash %}
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
allow-hotplug ens3
iface ens3 inet dhcp
{% endhighlight %}

You want to edit this file to add the IPv6 loopback and settings.\\
You can try `auto` settings ; but in my case, I had to use the static network settings:

{% highlight bash %}
iface lo inet6 loopback

iface ens3 inet6 static
    address 2001:41d0:305:2100::10f2
    netmask 128

    post-up /sbin/ip -f inet6 route add 2001:41d0:305:2100::1 dev ens3
    post-up /sbin/ip -f inet6 route add default via 2001:41d0:305:2100::1
    pre-down /sbin/ip -f inet6 route del 2001:41d0:305:2100::1 dev ens3
    pre-down /sbin/ip -f inet6 route del default via 2001:41d0:305:2100::1
{% endhighlight %}

## Testing the Networking configuration

First, you want to test the configuration to make sure your server is correctly setted up, and will not end up unaccessible from the outside world at the first reboot.

{% highlight bash %}
sudo ifup -a --no-act ; echo "status: $?"
{% endhighlight %}

Expected output:
```
/bin/run-parts --exit-on-error /etc/network/if-pre-up.d
/bin/run-parts --exit-on-error /etc/network/if-up.d
status: 0
```

If the status is not at 0, the configuration file have error, and you might wanna correct it before going further.

## Testing IPv6

Now that the configuration is correct, you can restart the networking service:

{% highlight bash %}
sudo service networking restart
{% endhighlight %}

And now you can test IPv6 using `ping6`:

{% highlight bash %}
ping6 -c 4 google.com
{% endhighlight %}

If the ping resolves, your network is correctly setted up. Otherwise, your IPv6 settings are not okay.

## Declare IPv6 support in your DNS entries

At your registar settings, you want to add a `AAAA` entry, corresponding to the IPv6 DNS resolution.

Your entry should look like something like that:

```
IN AAAA 2001:41d0:305:2100:0:0:0:10f2
```
_(here the example for thomasdurand.fr)_

## Configure your HTTP server

Your HTTP server must listen to IPv6 address. You should make sure your HTTP server is correctly setted up.

For example, with Nginx, your `/etc/nginx/nginx.conf` file should contains IPv6 declarations:

```
server {
  listen 80; # IPv4
  listen [::]:80; # IPv6

  # and/or (if you're using SSL/TLS)

  listen 443 ssl; # IPv4
  listen [::]:443 ssl; # IPv6

  ...
}
```

## Testing your full configuration

If you're network is not IPv6 ready, there are online tools to test if your website supports IPv6. They're great for troubleshooting.

I've used [IPv6-test.com][ipv6-test].

[ipv6-test]: http://ipv6-test.com/validate.php
