---
layout: post
title:  "Avoid 6 common mistakes with AES encryption"
date:   2017-07-12 00:09:00 +0200
categories: Security Encryption
ref: aes-good-practice-for-ios-app
lang: en
published: false
---

**Written for Swift 3 with Xcode 8.1**

With libraries like [CryptoSwift][crypto-swift-github], it's easier and easier to
use encryption in your code. But there are also some common mistakes not to fall
into when using cryptography !

The rest of this article will use CryptoSwift as an example.

### 1. Don't hard code your cryptographic key

Anything you put in the code is, in a way, readable by anyone. It's always possible
for an attacker to find something, even hidden in the compiled code of your application.

Plus, hardcoding a key means it's the same encryption key for everyone, witch would
make a very bad encryption system since the key is shipped with the app.

One last point is randomness. It's primordial that a key reflect entropy.
It need to be anything. The next byte of a key need to be able anything, and there
is no less entropic than an UTF8 string used as a key.

Solution ?\\
You need to **generate** a key every time you need one, and store it locally in a safe place.

You can generate a AES256 key this way :

{% highlight swift %}
func generateRandomData(size: Int) throws -> Data {
    var data = Data(count: size)
    let result = data.withUnsafeMutableBytes {
        (mutableBytes: UnsafeMutablePointer<UInt8>) -> Int32 in
        SecRandomCopyBytes(kSecRandomDefault, data.count, mutableBytes)
    }

    if result != errSecSuccess {
        throw Errors.unableToGenerateData
    }

    return data
}

// The size of the key for AES256 is 256 ÷ 8 = 32
let myAES256keyData = try generateRandomData(size: 32)

// Store your key in a safe place
{% endhighlight %}

### 2. Store your keys in the Keychain

let make things clear right now, there are **no better place** to store sensitive
data like cryptographic keys or password than the [Keychain][keychain-doc].

It's designed by Apple to be able to store securely password, certificates and keys.
It's also maintained by regular updates of Apple software, and finally, it uses hardware
module like the [Secure enclave][secure-enclave] to assure a high level of security.

TL;DR: Use the Keychain, it the most secure alternative you've got!

You can store and access the keychain very simply on your own when you use a wrapper like [Keychain-Swift][keychain-swift]:

{% highlight swift %}
import KeychainSwift

let keychain = KeychainSwift()

// Store the previously created key
keychain.set(dataObject, forKey: "my key", withAccess: .accessibleWhenUnlockedThisDeviceOnly)

// Receive from keychain our key
let key = keychain.getData("my key")
{% endhighlight %}

### 3. Set a correct Keychain Item Access

You may have not noticed yet, but I used an access parameter to the keychain setter in point 2.

`accessibleWhenUnlockedThisDeviceOnly` ([ref][when-unlocked]) is a bare minimum, that I use in my below example.\\
Use `accessibleWhenPasscodeSetThisDeviceOnly` ([ref][when-password-set]) when available.

That is needed to provide a correct level of security for your stored key.
It make sure the device is unlocked, prevent backups and keychain sharing between
devices, and it can also make sure the device is secured by an unlock code.

### 4. Use an Initialization Vector

TODO...

### 5. Do not use ECB block mode

TODO...

![Illustration of ECB lack of security with a picture encryption][ecb-picture]

TODO...

### 6. Use PKCS7 padding

TODO...

### Conclusion

Although it's very easy to use encryption today as a developer, it's also very easy
to make a lot of mistakes when using AES, making the whole process unsecure and,
sometime, useless.

The main reason is that when dealing with encryption, it's important to know what you do,
what you're dealing with, and also the classic errors to avoid.

I hope that your app will become a little bit more secure with what you just read!

[crypto-swift-github]: https://github.com/krzyzanowskim/CryptoSwift
[keychain-doc]: https://developer.apple.com/documentation/security/keychain_services
[secure-enclave]: https://www.quora.com/What-is-Apple’s-new-Secure-Enclave-and-why-is-it-important
[keychain-swift]: https://github.com/evgenyneu/keychain-swift
[when-unlocked]: https://developer.apple.com/documentation/security/ksecattraccessiblewhenunlockedthisdeviceonly
[when-password-set]: https://developer.apple.com/documentation/security/ksecattraccessiblewhenpasscodesetthisdeviceonly
[ecb-picture]: /assets/ios/crypto-practices/ECB-en.png
