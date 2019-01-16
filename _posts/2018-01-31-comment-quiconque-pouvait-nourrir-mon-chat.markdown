---
layout: post
title:  "Comment n'importe qui pouvait nourrir mon chat"
date:   2018-01-31 12:00:00 +0100
categories: Sécurité Objet-connecté
ref: how-anyone-could-feed-my-cat
lang: fr
published: false
---

En tant qu'ingénieur logiciel chez [DiliTrust][dilitrust], la sécurité du logiciel est la première fonctionnalité que je conçois pour n'importe quel produit ou logiciel.
À chaque fois que nous entendons parler d'une nouvelle faille, nous prenons ça très au sérieux : Comment est-ce possible ? Est-on directement ou indirectement impactés ?

Je crois que je n'étais pas encore prêt pour ce que j'allais découvrir.

### Ce que j'aime dans la domotique

Depuis que j'ai eu mes premiers appareils de domotique : un pack Philips Hue, j'aime beaucoup l'idée de contrôler des choses à distance, ou à proximité depuis mon téléphone, et même avec ma voix. C'est pourquoi j'ai également acheté des capteurs Elgato, pour connaitre la température, l'humidité et la qualité de l'air dans tout mon appartement.

Chaque appareil que j'ai choisi était compatible HomeKit, et je n'ai jamais cherché à utiliser mes appareils depuis l'extérieur. Je ne dispose d'ailleurs pas de concentrateur pour rendre HomeKit disponible depuis n'importe où, et je suis à peu près sûr de moi que mon installation est un minimum sécurisée. Je suppose également, peut-être à tort, qu'Apple impose certaines règles pour imposer un niveau de sécurité minimal. Je suppose aussi que leur implémentation de HomeKit est correcte et sécurisée.

Je sais que HomeKit a déjà fait l'affaire de failles [dans le passé][homekit-flaw], et qu'il y en aura d'autre dans le futur, mais je suis certain qu'Apple réagira toujours afin de les combler au plus vite.

### Quand mon chat fait son entrée

![Mon chat, Newton][newton]

J'ai adopté Newton en juin 2016, et c'est un amour … la plupart du temps. Cependant, depuis que nous l'avons stérilisé, il est devenu complètement glouton, incapable de se réguler avec la nourriture. Nous avons passé un très mauvais moment à essayer de l'empêcher de se nourrir plus que ses réels besoins.

C'est dans ce contexte que je me suis laissé séduire par l'idée d'acheter un distributeur automatique de croquette comme on en trouve beaucoup sur Amazon.
La marque *HoneyGuaridan* était bien notée sur les différents sites, et par les utilisateurs, et leur dernier modèle, le **HoneyGuaridan S25** était très intéressant !

En effet, c'est l'un des rares permettant de programmer au moins 10 repas sur la même journée ! Parfait pour réguler un peu plus mon chat. Cerise sur le gâteau : l'appareil se paramètre et se déclenche depuis un Smartphone : un véritable engin domotique !

### Le moment où tout se complexifie

J'ai reçu l'appareil il y a environ 3 semaines, et mon chat l'a adopté vraiment rapidement !

![Mon chat, attendant des croquettes de sa machine][honey-guaridan]

En dépit d'une application un peu buggée, la machine fonctionne parfaitement, et mon chat se désobsède petit à petit de la nourriture.

De plus, la démarche de mise en place me donnait confiance : j'ai du créer un compte, et il semblait que l'application était constamment connectée à ce compte.

Mais les bugs UI fréquents de l'applications m'embêtaient régulièrement, rendant l'expérience utilisateur assez médiocre. J'ai donc décidé de faire du reverse-engineering pour créer ma propre application, avec certes moins de fonctionnalités, mais aussi moins de bugs !

J'ai donc utilisé [Burp Community Edition][burp-suite] comme proxy HTTP pour intercepter les requêtes envoyées par l'application ; et comprendre comment elles sont constituées.

### Ce que j'ai découvert

L'application communique avec trois serveurs différents : `us1.dev.alnpet.com`, `fr.dev.alnpet.com`, et aussi `183.232.29.249` pour envoyer des données de journalisation avec une couche de sécurité TLS ou SSL.

Mais ni `fr.dev.alnpet.com`, ni `us1.dev.alnpet.com` ne se protègent derrière TLS ou SSL pour chiffrer les données transmises. Cela implique une vulnérabilité aux [attaques type man-in-the-middle][man-in-the-middle], et que donc le mot de passe enregistré dans l'application était transmis en clair, permettant à n'importe quel interceptant de le récupérer !

Mais en interceptant d'autres requêtes, quelque chose me titillait : je ne trouvais aucun cookie d'authentification, représentant ma session actuelle, et autorisant mes permissions à déclencher ma machine, ou à modifier sa configuration.

J'ai donc immédiatement essayé une commande `curl`: et juste en disposant de l'identifiant unique de ma machine, mon chat a reçu un nouveau repas, directement depuis mon invité de commande, et sans aucune session.

C'est complètement fou. Et c'est à cet instant que je me suis rendu compte que *n'importe qui* qui s'en donnerait la peine, pouvait vider mon distributeur depuis n'importe où, et éventuellement faire en sorte de rendre mon chat complètement obèse.

### Comment réagir ?

Mon premier réflexe aura été de retirer la configuration Wi-Fi du distributeur, pour être sûr qu'elle n'accède plus à Internet sans mon autorisation. Bien évidemment, j'ai immédiatement réessayé la “requête magique” pour prouver que ma machine était bien hors-ligne, et par conséquent, plus sécurisée.

Par contre, cette solution rendait la machine quasiment inutilisable. Bien qu'elle continue à suivre son planning, je ne pouvais plus changer ce dernier, ou bien déclencher un repas depuis mon téléphone. C'est pourquoi j'ai décider d'aller plus loin dans mon reverse-engineering, pour créer ma propre API, plus sécurisée, pour communiquer avec elle ! (Projet un peu fou, je l'accorde)

J'ai donc cherché mon [Raspberry Pi][raspberry-pi], qui prenait la poussière dans un tiroir, et paramétré un [hotspot Wi-Fi][hotspot-pi] avec.

Cela m'a permis d'analyser la façon dont le distributeur communiquait avec le monde.
Il se trouve qu'elle ne communique à priori qu'avec une seule adresse IP : `47.90.203.137`.

`47.90.203.137` correspond à [alnpet.net][alnpet]. Je reconnais bien le distributeur sur ce site, mais dans une version plus avancée, avec une caméra, et d'autres fonctionnalités. Hum, étrange. De plus, le lien de pré-commande amène sur la page d'accueil de KickStarter. Oula, dans quoi je m'embarque ? Je ne sais pas quel lien il y a entre *HoneyGuaridan* et *Alnpet*. Sont-ils une seule et même entité ?

Autant vous dire que cette adresse IP a été bannie de mon Raspberry Pi :

```
iptables -A INPUT -s 47.90.203.137 -j DROP
iptables -A FORWARD -s 47.90.203.137 -j DROP
iptables -A OUTPUT -s 47.90.203.137 -j DROP
```

Cela assure que le distributeur reste hors ligne, alors qu'il est bien connecté au Wi-Fi créé par mon Raspberry.
L'étape suivante sera d'imiter le serveur d'alnpet, pour faire croire au distributeur qu'il communique avec, alors que ce sera ma propre API.

Pour l'instant j'en suis encore à comprendre comment l'appareil communique avec les serveurs d'alnpet. C'est loin d'être la partie la plus facile, espérons que je réussisse.

Ah, et leçon retenue : je prendrai toujours le temps de vérifier la sécurité de tout appareil que je connecterai à mon réseau personnel, dorénavant.

Suis-je en train de devenir paranoïaque ? Oh, je l'ai toujours été !

[dilitrust]: https://www.dilitrust.com/
[homekit-flaw]: https://9to5mac.com/2017/12/07/homekit-vulnerability/
[newton]: /assets/pictures/newton.jpg
[honey-guaridan]: /assets/pictures/honeyguaridan.jpg
[burp-suite]: https://portswigger.net/burp
[man-in-the-middle]: https://fr.wikipedia.org/wiki/Attaque_de_l%27homme_du_milieu
[raspberry-pi]: https://www.raspberrypi.org/
[hotspot-pi]: https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md
[alnpet]: http://alnpet.com
