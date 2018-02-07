---
layout: post
title:  "Reverse engineering HoneyGuaridan S25 cat feeder"
date:   2018-02-07 12:00:00 +0200
categories: Security IOT
ref: reverse-engineering-a-cat-feeder
lang: en
published: false
---

As explained in [a previous blog post][anyone-could-feed-my-cat], right after I bought the HoneyGuaridan S25 cat feeder ; I discovered that it was containing major security flaws, allowing anyone to change the meals planning, or even feed my cat at anytime without authentication at all!

I quickly understood that if I wanted to continue to use my cat feeder normally, without having a unsecured device connected to my network, I had to reverse-engineer the way the feeder was communicating with alnpet.net servers ; and replicate that with my own implementation, and security.

### Setting up a different network schema

Since my feeder is using the Wi-Fi created by my box, it wasn't an enough allowing setup. I decided to use my Raspberry Pi as a Wi-Fi hotspot, and then I connected my cat feeder on the resulting Wi-Fi.

Deserved by my Raspberry, this Wi-Fi is fully customizable, and I can intercept, reroute and do anything I want with requests going through. And that's exactly what I intended to do with the feeder!

### Who is making the first call?

Using [Tcpdump][tcpdump] command on my Raspberry Pi ; I quickly noticed that my feeder was constantly calling `47.90.203.137` on port `9999`.
But also, the feeder was getting requests from that IP on his port `1032`.

```
TODO Add tcpdump example
```

As I could not intercept any kind of request, I thought that either the device, or the server was creating a kind of [Socket][socket] to communicate in real time.
The most logical would be that it's the device that initiate the connection to the server. I deciced to try to replicate that!

I used [iptables][iptables] to redirect every request pointing `47.90.203.137:9999` to localhost. That way, the device would have to create the connexion with my own service :

```
TODO Add iptable command
```

Then, I used a very simple node.js script to listen for tcp connexions on that port ; and log what kind of messages were coming in.

{% highlight node.js %}
var net = require("net");

var server = net.createServer(function(socket) {
  socket.on("data", function(data) {
    console.log("Received data: " + data.toString("hex"));
  });
});

// Listen port 1032 ; that will be called by device
server.listen(1032, "192.168.1.1");
{% endhighlight %}

I ran that on my Raspberry Pi, and bingo:

```
TODO / edit IDs
```

I tried it several time ; and I always received the same binary sequence.

[anyone-could-feed-my-cat]: /security/iot/2018/01/31/how-anyone-could-feed-my-cat.html
[tcpdump]: https://www.tcpdump.org/tcpdump_man.html
[socket]: https://en.wikipedia.org/wiki/Socket
[iptables]: https://en.wikipedia.org/wiki/Iptables
