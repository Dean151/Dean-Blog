---
layout: post
title:  "Cinq erreurs classiques avec le chiffrement AES"
date:   2017-07-12 23:55:00 +0200
categories: Sécurité Chiffrement
ref: aes-good-practice-for-ios-app
lang: fr
published: false
---

**Écrit pour Swift 3 avec Xcode 8.1**

Avec des librairies comme [CryptoSwift][crypto-swift-github], il est devenu de plus en plus
aisé d'utiliser le chiffrement dans votre code. Cependant, il y a de nombreux pièges
dans lesquels il ne faut pas tomber lorsqu'on utilise la cryptographie !

La suite de cet article utilisera CryptoSwift pour ses exemples.

### 1. Ne pas “Hard Coder” les clés dans le code

Tout ce que vous placez dans le code est, d'une façon ou d'une autre, lisible par n'importe qui.
C'est toujours possible pour un attaquant de retrouver quelque chose, même caché dans le code
compilé de votre application.

De plus, “hard coder” une clé signifie que la clé est la même pour tous les utilisateurs,
ce qui permettrait à un attaquant de déchiffrer les données de n'importe qui après avoir
analysé le code de l'application.

Le dernier point, c'est l'importance de l'aléatoire dans une clé :
Une clé doit être entropique, elle doit pouvoir être n'importe quoi.
Le prochain octet doit pouvoir correspondre à n'importe quoi, ce qui n'est pas
vraiment le cas d'une chaîne de caractère UTF8, par exemple.

La solution ?\\
Il faut **générer** une clé lorsque vous en avez besoin d'une nouvelle, et la stocker dans un endroit sécurisé.

On peut générer une clé pour  :

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

// La taille de la clé pour l'AES 256 est 256 ÷ 8 = 32
let myAES256keyData = try generateRandomData(size: 32)

// Stockez la clé dans un endroit sûr
{% endhighlight %}

### 2. Stockez vos clés dans le Keychain

Autant mettre les choses aux clair tout de suite, il n'y a **pas de meilleur endroit** pour stocker
une donnée sensible comme une clé ou un mot de passe que le [Keychain][keychain-doc].

Il s'agit d'un logiciel d'Apple designé pour stocker de façon très sécurisée
les mots de passe, certificats, et clés de chiffrement.
Le Keychain est maintenu par Apple avec des mises à jour régulières des logiciels,
et finalement, il tire parti des composants matériels comme [l'enclave sécurisée][secure-enclave] 
pour assurer les meilleurs niveaux de sécurité.

TL;DR: Utilisez le Keychain, C'est l'alternative la plus sécurisée que vous avez !

Il est très aisé de stocker et d'accéder au Keychain lorsqu'on utilise un wrapper comme [Keychain-Swift][keychain-swift]:

{% highlight swift %}
import KeychainSwift

let keychain = KeychainSwift()

// Stockons la clé créée précédemment
keychain.set(dataObject, forKey: "my key", withAccess: .accessibleWhenUnlockedThisDeviceOnly)

// Récupérons la clé quand on en a besoin
let key = keychain.getData("my key")
{% endhighlight %}

### 3. Paramétrer correctement l'accès au Keychain

Vous n'avez peut-être pas encore remarqué, mais j'ai utilisé un paramètre d'accès dans
le setter dans le point précédent.

`accessibleWhenUnlockedThisDeviceOnly` ([ref][when-unlocked]) est le minimum acceptable que 
j'utilise dans mon exemple précédent.\\
Il vaut mieux utiliser `accessibleWhenPasscodeSetThisDeviceOnly` 
([ref][when-password-set]) lorsqu'il est disponible.

That is needed to provide a correct level of security for your stored key.
It make sure the device is unlocked, prevent backups and keychain sharing between
devices, and it can also make sure the device is secured by an unlock code.

### 4. Utilisez un vecteur d'initialisation

Chiffrer les données est de bonne pratique pour éviter quiconque de lire les données sensibles.

Mais que ce passe-t-il si un attaquant peut lire les données sans posséder la clé,
simplement en analysant les données chiffrées ?

C'est ce qui rend le vecteur d'initialisation si important !

Prenons un exemple où nous avons besoin de chiffrer un booléen, car on ne souhaite 
pas qu'un attaquant puisse avoir qui possède une fonctionnalité ou non.

Consultons les données après le chiffrement :

 valeur  | pas d'IV (ou partagé)      | IV aléatoire
---------|----------------------------|----------------------------
 `false` | `HspSmVFeseu7kpt5ZJE13A==` | `6sM2RzgShVcu1OPM8sH0mw==`
 `false` | `HspSmVFeseu7kpt5ZJE13A==` | `ylJjMWFq4MoqKvpn5WSYOQ==`
 `true`  | `sdkaq/5TFZKjFjx35Cl0rw==` | `JZHeEoBfgQgk8/8eOQlQxQ==`
 `true`  | `sdkaq/5TFZKjFjx35Cl0rw==` | `byfgDi+CD7pAo2NXYk8tVw==`
 `false` | `HspSmVFeseu7kpt5ZJE13A==` | `XxWfqQXe3EwNuJ3AzvgOig==`

Une idée de ce qui ne va pas ?
Toutes les données identiques, chiffrées avec la même clé et le même vecteur d'initialisation
auront le même résultat.

La conséquence est très mauvaise pour vos données, car l'attaquant pourrait éventuellement
accéder aux données chiffrées (et croyez moi, ça n'a rien de sorcier sur une application iOS),
puis réaliser des analyses sur les donénes pour en déduire la valeur initiale.

Pour éviter cela, il est primordial de générer un vecteur d'initialisation unique et aléatoire
à chaque opération de chiffrement que vous pourriez réaliser.

Bien évidemment, ce vecteur est indispensable pour le déchiffrement de la donnée, au même
titre que la clé.
Un endroit opportunt pour stocker le vecteur d'initialisation, c'est avec la donnée chiffrée, 
exactement comme on le ferait pour le [sel d'un hashage de mot de passe][password-salt].

{% highlight swift %}
// On génère un vecteur d'initialisation à usage unique :
let iv = AES.randomIV(AES.blockSize)

// On chiffre les données :
let crypted = try AES(key: key, iv: iv).encrypt(data)

// Puis on stocke les données chiffrées avec son vecteur associé
myStorage.securedData = (crypted, iv)
{% endhighlight %}

### 5. N'utilisez pas le mode de traitement de bloc ECB

Le mode de traitement de bloc que vous choisissez dans votre algorithme de chiffrement
correspond à la méthode utilisée par l'algorithme pour effectuer le chiffrement

Le choix d'un bon mode de traitement est donc essentiel pour rendre votre chiffrement utile et sécurisé.

{% highlight swift %}
// Quelques méthodes disponibles
let encryptedWithCBC = try AES(key: key, iv: iv, blockMode: .CBC, padding: PKCS7()).encrypt(input)
let encryptedWithCTR = try AES(key: key, iv: iv, blockMode: .CTR, padding: PKCS7()).encrypt(input)

// Et celle que vous ne devriez jamais utiliser...
let encryptedWithECB = try AES(key: key, iv: iv, blockMode: .ECB, padding: PKCS7()).encrypt(input)
{% endhighlight %}

Mais pourquoi l'ECB est-il un mauvais choix ?

ECB (Electronic Code Book) chiffre chaque bloc de données de votre entrée de façon séparée.
Le danger se situe dans le fait que cette méthode chiffrera de la même manière tout bloc similaire,
et tout comme le manque de vecteur d'initialisation, cela rend le chiffrement prévisible.

Cela peut aussi causer des attaques par répétition, et à la fuite d'informations.

Pour vous prouver que l'ECB n'est pas une méthode chiffrement sécurisée, rien ne
vaut cet exemple de [Wikipedia][ecb-wikipedia] utilisant une image comme données à chiffrer :

![Illustration du manque de sécurité liée à l'utilisation de ECB pour le chiffrement d'une image][ecb-picture]

Il est donc clair qu'avec ce mode d'opération, le contenu de l'image n'est pas devenu
totalement illisible. Il y a un manque d'imprédicitiblité lié à la conception même de ce
mode de fonctionnement. C'est aussi pourquoi ce mode ne devrait **jamais** être utilisé
à des fin cryptographiques.

Pour éviter cela, il faut utiliser CBC (Cipher Block Chaining) qui utilise le bloc précédent 
pour chiffrer le suivant, ce qui rend le résultat beaucoup plus aléatoire et imprédictible. 

### Conclusion

Bien qu'il soit aisé d'utiliser le chiffrement aujourd'hui, en tant que développeur,
il est aussi très facile de faire des erreurs lorsqu'on utilise AES, ce qui rend le
procédé insécure, voire même parfois, inutile.

La principale raison, c'est que lorsqu'on à affaire à du chiffrement, il est important de
comprendre ce qu'il se passe, et les objets que l'on utilise, et aussi connaitre les
erreurs classiques à éviter.

J'espère que vos fonctionnalités de chiffrement seront sécurisées un brin plus après la lecture de cet article !

[crypto-swift-github]: https://github.com/krzyzanowskim/CryptoSwift
[keychain-doc]: https://developer.apple.com/documentation/security/keychain_services
[secure-enclave]: https://www.quora.com/What-is-Apple’s-new-Secure-Enclave-and-why-is-it-important
[keychain-swift]: https://github.com/evgenyneu/keychain-swift
[when-unlocked]: https://developer.apple.com/documentation/security/ksecattraccessiblewhenunlockedthisdeviceonly
[when-password-set]: https://developer.apple.com/documentation/security/ksecattraccessiblewhenpasscodesetthisdeviceonly
[ecb-wikipedia]: https://fr.wikipedia.org/wiki/Mode_d%27opération_(cryptographie)
[ecb-picture]: /assets/ios/crypto-practices/ECB-fr.png
[password-salt]: https://fr.wikipedia.org/wiki/Salage_(cryptographie)
