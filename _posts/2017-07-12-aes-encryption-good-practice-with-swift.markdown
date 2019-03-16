---
layout: post
title:  "Avoid 5 common mistakes with AES encryption"
date:   2017-07-12 21:30:00 +0200
categories: Security Encryption
ref: aes-good-practice-for-ios-app
---

**Written for Swift 3 with Xcode 8.1**

With libraries like [CryptoSwift][crypto-swift-github], it's easier and easier to
use encryption in your code. But there are also some common mistakes not to fall
into when using cryptography!

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

Let make things clear right now, there are **no better place** to store sensitive
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

Encrypting data is a good practice to prevent anyone to read sensitive data.

But what if analytics allow an attacker to read your data without the key, just
by looking at the encrypted data?

That's what make Initialization Vector so important!

Let say you need to encrypt a boolean, because you don't wan't anyone to figure out
who has opt-in and who haven't.

Let check the storage table after encryption:

 value   | no IV (or shared IV)       | randomized IV
---------|----------------------------|----------------------------
 `false` | `HspSmVFeseu7kpt5ZJE13A==` | `6sM2RzgShVcu1OPM8sH0mw==`
 `false` | `HspSmVFeseu7kpt5ZJE13A==` | `ylJjMWFq4MoqKvpn5WSYOQ==`
 `true`  | `sdkaq/5TFZKjFjx35Cl0rw==` | `JZHeEoBfgQgk8/8eOQlQxQ==`
 `true`  | `sdkaq/5TFZKjFjx35Cl0rw==` | `byfgDi+CD7pAo2NXYk8tVw==`
 `false` | `HspSmVFeseu7kpt5ZJE13A==` | `XxWfqQXe3EwNuJ3AzvgOig==`

Any clue of what's wrong ?
Well, every same value, encrypted with the same key and iv result in the same cipher result.

And that's bad for your data, because an attacker that would eventually see the data
(and trust me, he will on an iOS device except if it's in the Keychain), can perform
some analytics process to deduct the decrypted data.

To prevent that, it's important to generate a random IV for every encryption you
may perform.

Of course this IV is needed to decrypt the data, along with the key.
A good place to store the IV is alongside the data, yes, in the table, just like you would
do with a [salt for a password hash][password-salt].

{% highlight swift %}
// We generate a one time use IV:
let iv = AES.randomIV(AES.blockSize)

// We encrypt the data:
let crypted = try AES(key: key, iv: iv).encrypt(data)

// We then store the crypted data and the iv
myStorage.securedData = (crypted, iv)
{% endhighlight %}

### 5. Do not use ECB block mode

The block mode you set in the AES algorithm correspond to the method used by the
algorithm to perform the encryption.

The choice of a good block mode is primordial to make the encryption useful and
secure.

{% highlight swift %}
// Some encryptions available
let encryptedWithCBC = try AES(key: key, iv: iv, blockMode: .CBC, padding: PKCS7()).encrypt(input)
let encryptedWithCTR = try AES(key: key, iv: iv, blockMode: .CTR, padding: PKCS7()).encrypt(input)

// And the one you should never use...
let encryptedWithECB = try AES(key: key, iv: iv, blockMode: .ECB, padding: PKCS7()).encrypt(input)
{% endhighlight %}

But why is ECB a very poor choice?

ECB stand for Electronic Code Book, that encrypt every block of your input separately.
The treat is that this method will encrypt the same way two same blocks, and just
like the lack of Initialization Vector, makes the encryption predictable.

It can also lead to replay attacks and information leaks.

If you want to be confident about the ECB lack of security, check this example
of encryption using an image, from [Wikipedia][ecb-wikipedia].

![Illustration of ECB lack of security with a picture encryption][ecb-picture]

Wow, with ECB block mode, we cannot say that the content of the picture became
unpredictable and unreadable. That's why it should **never** be used as a cryptographic
block mode.

To prevent that, use CBC (Cipher Block Chaining) that make the next block encryption
dependent from the previous one, and make the result unpredictable and randomized.

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
[ecb-wikipedia]: https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation
[ecb-picture]: /assets/ios/crypto-practices/ECB-en.png
[password-salt]: https://en.wikipedia.org/wiki/Salt_(cryptography)
