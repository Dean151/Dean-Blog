---
layout: post
title:  "Reverse engineering HoneyGuaridan S25 cat feeder"
date:   2018-02-08 12:00:00 +0100
categories: Security IOT
ref: reverse-engineering-a-cat-feeder
published: false
---

As explained in [a previous blog post][anyone-could-feed-my-cat], right after I bought the HoneyGuaridan S25 cat feeder ; I discovered that it was containing major security flaws, allowing anyone to change the meals planning, or even feed my cat at anytime without authentication at all!

I quickly understood that if I wanted to continue to use my cat feeder normally, without having a unsecured device connected to my network, I had to reverse-engineer the way the feeder was communicating with alnpet.net servers ; and replicate that with my own implementation, and security.

### Setting up a different network schema

Since my feeder is using the Wi-Fi created by my box, it wasn't an enough allowing setup. I decided to use my Raspberry Pi as a Wi-Fi hotspot, and then I connected my cat feeder on the resulting Wi-Fi.

Deserved by my Raspberry, this Wi-Fi is fully customizable, and I can intercept, reroute and do anything I want with requests going through. And that's exactly what I intended to do with the feeder!

### Who is making the first call?

Using [Tcpdump][tcpdump] command on my Raspberry Pi ; I quickly noticed that my feeder was constantly calling `47.90.203.137` on port `1032`.
But also, the feeder was getting requests from that IP on his port `9999`.

As I could not intercept any kind of request, I thought that either the device, or the server was creating a kind of [Socket][socket] to communicate in real time.
The most logical would be that it's the device that initiate the connection to the server. I deciced to try to replicate that!

I used [iptables][iptables] to redirect every request pointing `47.90.203.137:1032` to localhost. That way, the device would have to create the connexion with my own service :

```
iptables -t nat -A PREROUTING -d 47.90.203.137 -p tcp -j DNAT --to-destination 192.168.1.1:1032
```

Then, I used a very simple node.js script to listen for tcp connexions on that port ; and log what kind of messages were coming in.

{% highlight javascript %}
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
Received data: 9da11441424330313233343536373801d0010000
```

I tried it several time ; and I always received the same binary sequence.

When I try to decode it as text, I get `9da1 - ABC012345678 - d001 0000`. I can recognize the unique ID of my feeder, as noted in the manual, and the setup QRCode (Of course it's not my real unique ID! Don't bother to decode the hex either!)

Moreover, I'm getting that data every 10 seconds, precisely. It means that my feeder send his identity every ten seconds to the servers.

### Playing with their own servers

Well, it's time to go further, and connect with the original server!
This time, I will use my MacBook directly.

{% highlight javascript %}
var net = require('net');
var socket = new net.Socket();
socket.connect(9999, '47.90.203.137', function() {
  console.log('Connected');

  socket.on("data", function(data) {
    console.log('Received: ' + data.toString('hex'));
  });

  socket.on('close', function() {
    console.log('Connection closed');
  });

  // Sending the data every 10 seconds
  setInterval(function(){
    socket.write("9da11441424330313233343536373801d0010000", "hex", function() {
      console.log("Data sent");
    });
  }, 10000);
});
{% endhighlight %}

The output here is *almost* straightforward:

```
Connected
Data sent
Received: 9da1060100fe
Data sent
Received: 9da1060100fe
Data sent
Received: 9da1060100fe
Data sent
Received: 9da1060100ff
Data sent
Received: 9da1060100ff
...
```

Okay, somehow the response does increment. I stayed a little bit longer, and it kept incrementing. We'll figure it out later!

Now that I'm ... somehow ... connected to their server with a *fraud* feeder ; I can use the application ; and see what the server is sending me.

Setting a feeding amount:

```
# 10 grams setted in the app
Received: 9da106c3000a
# 5 grams - the minimum
Received: 9da106c30005
# 150 grams - the maximum
Received: 9da106c30096
```

So we can see a pattern here:
  - `9da1`: a kind of prefix, that we can see everywhere (before the ID; and in every responses from the server.)
  - `06c300`: not yet known
  - `05 to 96`: the amount setted, in grams, from 5 (5 grams) to 96 (150 grams, in hexadecimal)

When I set a planning:

```
# With no meal at all:
Received: 9da105c400
# With one meal (5g at 12h CET):
Received: 9da109c40104740005
# With two meals (5g at 00h and 12h CET):
Received: 9da109c40201a4000504740005
```

Here we can identify:
  - `9da1`: The prefix
  - `09c4`: A kind of code saying "We're setting the planning"
  - `01 or 02`: The number of meals, in hexadecimal. In the manual, it's been said that the feeder can support up to 16 meals in the planning
  - Then, the data corresponding to the meals.

Here some more data I gathered for the meals:

```
// 5 grams each, hours in CET
01c2 0005 // 00h30
0258 0005 // 03h00
02ee 0005 // 05h30
03a2 0005 // 08h30
041a 0005 // 10h30
04ce 0005 // 13h30
0564 0005 // 16h00
003c 0005 // 18h00
00b4 0005 // 20h00
012c 0005 // 22h00
```

We can identify two bytes for the time ; and two bytes for the amount.

Altough the time was increasing, somehow between 4PM and 6PM, it reseted. Let try a meal at 5PM?

```
// 10 grams à 17h CET
0000 000a
```

Okay, somehow it's resetting at 5PM CET. But something great is the value of 6PM:
in hexadecimal, 3c equals 60. b4 equals 120... And it works for each meal!

So the time is encoded as a number of minutes on two bytes ; offseted at 5PM CET.

The amount of food is a number of grams, from 5 to 150, encoded on two bytes too (where only one would have worked).

### How does the feeder responds to a request?

What I needed to do next was to find out how the feeder was responding to those commands. A solution would be not to emulate the feeder like I did a few lines before, but their servers. I needed to make my feeder think I'm the rightfull server to communicate with, and therefore send it a few requests and see what happen.

This is how I implemented it:

```

```

Then, I had to test a few of the requests I could send to the feeder:

#### Feeding now

Let's send a request to give 5g right now (My cat was so thrilled when he got unexpected food!)

```
Data sent: 9da106a20005
Data received: 9da114414243303132333435363738a2d0a10000
```

Here we have:
  - `9da114`: The prefix
  - `414243303132333435363738`: The code `ABC012345678` -> the identifier of the feeder (in hexadecimal)
  - `a2`: The operation code
  - `d0a10000`: The suffix

Somehow, I think it means "Feeder ABC012345678 have performed the feed order."

#### Set this default amount

If I do the same with the default feeding amount, used by the physical button:

```
Data sent: 9da106c30005
Data received: 9da114414243303132333435363738c3d0a10000
```

That decompose into:
  - `9da114`: The prefix
  - `414243303132333435363738`: The code `ABC012345678` -> the identifier of the feeder (in hexadecimal)
  - `c3`: The operation code
  - `d0a10000`: The suffix

### Set a planning

 Finally for a feeding plan:

```
Data sent: 9da105c400
Data received: 9da114414243303132333435363738c3d0a10000
```

That decompose into:
  - `9da114`: The prefix
  - `414243303132333435363738`: The code `ABC012345678` -> the identifier of the feeder (in hexadecimal)
  - `c3`: The operation code
  - `d0a10000`: The suffix


### To sum it up



[anyone-could-feed-my-cat]: /security/iot/2018/01/31/how-anyone-could-feed-my-cat.html
[tcpdump]: https://www.tcpdump.org/tcpdump_man.html
[socket]: https://en.wikipedia.org/wiki/Socket
[iptables]: https://en.wikipedia.org/wiki/Iptables
