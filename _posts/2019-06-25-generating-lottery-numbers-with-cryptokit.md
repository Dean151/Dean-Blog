---
layout: post
title:  "Generating lottery numbers using CryptoKit"
date:   2019-06-25 18:30:00 +0200
categories: swift cryptokit
---

**Why?** Because we can!

WWDC19 announcements came with CryptoKit ; a new framework designed for making cryptography easy.

<!--more-->

Today, I want to show how to use CryptoKit to generate numbers. 
It'll a better generator than `arc4random` used by default on iOS since it generate cryptographic keys, keys that are supposed to be the most random and entropic possible!

## A model to generate lottery numbers

First, what are lottery draws?

It's one or more _k among n_ draws!

{% highlight swift %}
/// Represent one `k among n` operation
struct Draw {
    /// The number of number to draw (ie k)
    let draw: UInt

    /// The range of numbers to draw within (ie n)
    let among: ClosedRange<Int>

    /// Generate `draw` numbers within `among` 
    func random() -> Set<Int> {
        // TODO!
        return []
    }
}
{% endhighlight %}

We can then define a lottery as an array of Draws:

{% highlight swift %}
struct Lottery {
    /// The draws for that lottery
    /// Example draw 5 numbers within 1 and 49 & 1 number within 1 and 10.
    let draws: [Draw]

    /// Generate a lottery draw randomly
    func random() -> [Set<Int>] {
        return draws.map { $0.random() }
    }
}
{% endhighlight %}

The most popular french lotteries can then be defined easily within the application:

{% highlight swift %}
extension Lottery {
    static let frenchLoto = Lottery(draws: [
        Draw(draw: 5, among: 1...49),
        Draw(draw: 1, among: 1...10)
        ])

    static let euromillion = Lottery(draws: [
        Draw(draw: 5, among: 1...50),
        Draw(draw: 2, among: 1...12)
        ])
}
{% endhighlight %}

Once the `Draw.random()` method gets implemented, we will be able to generate lottery numbers very easily:

{% highlight swift %}
// Output for now: [Set([]), Set([])]
print(Lottery.euromillion.random())
{% endhighlight %}

## Randomness using default implementation

Generating k number among a range is quite straightforward:

{% highlight swift %}
/// Generate `draw` numbers within `among`
func random() -> Set<Int> {
    var drawable = Set(among), drawnNumbers = Set<Int>()
    while drawnNumbers.count < draw {
        guard let drawn = drawable.randomElement() else {
            // If somehow we do not find any element, it means we want to draw more elements than available
            // Let just break the loop and return all elements.
            break
        }
        // Make the number undrawable for that draw
        drawable.remove(drawn)
        // And add the number to the draw
        drawnNumbers.insert(drawn)
    }
    return drawnNumbers
}
{% endhighlight %}

In this example, the random is handled by `randomElement()`.

That uses by default the `SystemRandomNumberGenerator` that will be either:
- `arc4random_buf` on Apple platforms
- `getrandom` if available or `/dev/urandom` on unix platforms.

## Using CryptoSwift's randomness

Okay, here it becomes a little _hacky_ ; why not using the random bytes securely generated for a key as random source for the lottery numbers?

Doing so is quite easy, since we can use `randomElement(using generator: inout RandomNumberGenerator)`

{% highlight swift %}
import CryptoKit

/// RandomNumberGenerator using CryptoKit
struct CryptoKitRandomNumberGenerator: RandomNumberGenerator {
    mutating func next<T>() -> T where T : FixedWidthInteger, T : UnsignedInteger {
        // Let generate a symmetric key using CryptoKit. It'll be generated using best cryptographic practices to have strong randomness.
        // T will be 8 bytes at most (For UInt64) so generating a bits128 key (ie 16 bytes) is more than overkill already
        let key = SymmetricKey(size: .bits128)
        // Then we use the generated key to extract a random Unsigned Fixed Width Integer.
        return key.withUnsafeBytes { (pointer) -> T in
            // We have a pointer on random bytes generated by our class
            // Let convert those bytes to T ; in order to get our number.
            return pointer.bindMemory(to: T.self).baseAddress!.pointee
        }
    }
}
{% endhighlight %}

And now we can pick numbers using our new generator:

{% highlight swift %}
var generator = CryptoKitRandomNumberGenerator()
let drawn = drawable.randomElement(using: &generator)
{% endhighlight %}

And, in our previous `Draw.random()` implementation, it'll give us this:

{% highlight swift %}
/// Generate `draw` numbers within `among`
func random() -> Set<Int> {
    var drawable = Set(among), drawnNumbers = Set<Int>()
    var generator = CryptoKitRandomNumberGenerator()
    while drawnNumbers.count < draw {
        guard let drawn = drawable.randomElement(using: &generator) else {
            break
        }
        drawable.remove(drawn)
        drawnNumbers.insert(drawn)
    }
    return drawnNumbers
}
{% endhighlight %}

And this is it, you can now generate draws for all sort of Lotteries you may define using [this snippet of code][gist]

{% highlight swift %}
// Output: [Set([27, 13, 21, 29, 4]), Set([1, 3])]
// If you win with those, I claim a 5% tax :D
print(Lottery.euromillion.random())
{% endhighlight %}

## What now?

Okay, let's face it, I really think that using CryptoKit here is a bit **overkill**; but why not? It's so easy to do!

CryptoKit make things like generating secure keys, encrypting, and many more cryptographic operation fairly easy! If you're into cryptography, you should definitely give it a try in a Playground right away!

And if you have questions about CryptoKit: contact-me via GitHub or Twitter ;)

[gist]: https://gist.github.com/Dean151/a11444d0be6c8fde094661dbba38c3be