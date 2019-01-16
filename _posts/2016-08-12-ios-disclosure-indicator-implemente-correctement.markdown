---
layout: post
title:  "iOS disclosure indicators implémentés correctement"
date:   2016-08-12 21:18:00 +0200
categories: Swift3 iOS
ref: ios-disclosure-indicator
lang: fr
published: false
---

**Mis à jour pour Swift 3 avec Xcode 8.1**

Les *disclosure indicators* sont très communs dans les applications iOS, ils permettent
à l'utilisateur de savoir que si ils choisissent une cellule, ils vont accéder à
une nouvelle vue.
Vous pouvez lire la [documentation Apple][doc-apple-disclosure] à ce sujet.

![a cell with disclosure indicator][cell-with-disclosure-indicator]
Une cellule avec un *disclosure indicator*

Ajouter un *disclosure indicator* pourrait sembler très simple, pourtant quand on
souhaite réaliser une application universelle supportant iPad et iPhone, les choses
deviennent un brin plus complexe. Mais nous allons voir comment implémenter cela
de façon à faire les choses correctement !

### Commencement du projet

Pour débuter le projet, vous pouvez soit choisir le template Xcode *Master - Details*,
soit télécharger/cloner ce [repo Github][github-start] à la branche `start`

Si vous compilez et lancez l'application pour un iPhone, vous verrez qu'Apple n'a
pas inclus de *disclosure indicators* dans son template.
Pourtant, la sélection d'une cellule nous amène bien à une vue différente. Nous
sommes loin des recommandations des [human interface guidelines][human-guidelines].
Peut-être est-ce là le signe que l'implémentation n'est pas si simple ? :)

### Ajoutons les *disclosure indicators*

Dans la méthode `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath)`,
ajoutez simplement juste avant de retourner la cellule :

{% highlight swift %}
tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) {
  ...
  cell.accessoryType = .disclosureIndicator
  return cell
}
{% endhighlight %}

Désormais, lorsque vous compilez et lancez pour iPhone, toutes les cellules ont
un *disclosure indicator*. Simple comme bonjour !

Maintenant, corsons un peu les choses. Nous voulons faire une application universelle,
et ce template utilise un `UISplitViewController` dans ce but.

### Adaptations pour la présentation en split view

Tout d'abord, marquons notre app comme *universelle*, car pour l'instant, il s'agit
simplement d'une application iPhone qui se lancera en mode "iPhone" sur iPad.

Dans les paramètres du projet (l'élément le plus haut dans la liste des fichiers),
changeons la section *device* à `Universal`

![La liste de devices dans les réglages du projet][universal-setting]

Compilez et lancez l'application pour iPad. Vous verrez que toutes les cellules
disposent d'un *disclosure indicator*, ce qui n'est pas ce que l'utilisateur attendrait
d'une application iPad dans une présentation split-view.

![Comparatif entre une split view correcte et la notre avec des disclosure indicators][comparative-split-view]

Pour faire notre coup de maître, il faut déceler lorsque le contrôleur est actuellement
présenté dans une split-view, et si c'est le cas, si il y a bien deux contrôleurs visibles
en même temps.

Pour ce faire, je propose cette variable dynamique dans `MasterViewController` :

{% highlight swift %}
/// Retourne false si il n'y a pas de split view ou si elle est collapsed comme sur iPhone
var isInSplitViewPresentation: Bool {
  return !(splitViewController?.isCollapsed ?? true)
}
{% endhighlight %}

Si il n'y a pas de split view controller, l'opérateur `??` fera que les parenthèses valent `true`.
Et `isInSplitViewPresentation` vaut le booléen inverse donc `false`.

Lorsqu'il y a un split view controller, ce qui sera toujours le cas dans notre exemple,
cette ligne va regarder la valeur de `isCollapsed`.

`isCollapsed` sera `true` lorsque la split view présente un unique contrôleur,
ce qui est le cas sur iPhone (sauf l'iPhone 6 plus en paysage, mais on y reviendra).

Maintenant, prenons avantage de ce code,
dans la méthode `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath)`
Remplacez l'ancien code que nous utilisions pour ajouter un *disclosure indicator* par :

{% highlight swift %}
tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) {
  ...
  cell.accessoryType = !isInSplitViewPresentation ? .disclosureIndicator : .none
  return cell
}
{% endhighlight %}

Compilez et lancez l'application sur iPhone, puis iPad.
Tout semble se passer comme prévu ... Enfin *presque* comme prévu !

### L'exception de l'iPhone 6(s) plus

L'iPhone 6 plus est un (très) gros appareil et c'est le seul iPhone qui supporte
l'affichage de split-view en présentant deux contrôleurs.

Faisons un essai. Compilez et lancez l'application pour un iPhone 6 plus, et créez quelques cellules
avec le bouton +.
Comme nous sommes en mode portrait, vous devriez avoir des *disclosure indicators*.

Passez l'appareil en mode paysage avec `cmd + ->` ou `cmd + <-`.
La split-view affiche désormais les deux contrôleurs, mais les cellules ont toujours
leurs *disclosure indicators*.
Si vous créez plus de cellules, ou si vous défilez, les cellules qui (ré)apparaissent
à l'écran n'en disposent pas.

Enfin, si vous retournez en mode portrait, les cellules qui avaient des *indicators* en ont toujours,
et celles qui n'en avaient pas n'en ont toujours pas alors qu'elle devraient.

Le code que nous utilisons jusqu'ici fonction correctement. Cependant, lorsque la
split-view change d'état, nous avons la responsabilité de mettre à jour les cellules
pour refléter ces modifications.

Tout d'abord, modifions un peu le code qui ajoute les *disclosure indicators*.

Créons une extension pour les cellules qui s'occupe de cela :

{% highlight swift %}
extension UITableViewCell {
    func setDisclosureIndicator(visible: Bool) {
        accessoryType = visible ? .disclosureIndicator : .none
    }
}
{% endhighlight %}

Et dans `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath)`
remplacez

{% highlight swift %}
cell.accessoryType = !isInSplitViewPresentation ? .disclosureIndicator : .none
{% endhighlight %}

par

{% highlight swift %}
cell.setDisclosureIndicator(visible: !isInSplitViewPresentation)
{% endhighlight %}

Voilà qui ressemble un peu plus à quelque chose.

Maintenant, ajoutons à `MasterViewController` ce code qui s'occupe de gérer les
changements de taille de notre vue.

{% highlight swift %}
/// Sera appelé à chaque changement de taille
override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {

  // On utilise le coordinator pour suivre la transition
  coordinator.animate(alongsideTransition: nil, completion: { _ in
    // Lorsque la transition s'achève,
    // On itère sur les cellules visibles
    self.tableView.visibleCells.forEach {
      // Et on rafraîchi les disclosure indicator de ces cellules
      $0.setDisclosureIndicator(visible: !self.isInSplitViewPresentation)
      }
  })

  super.viewWillTransition(to: size, with: coordinator)
}
{% endhighlight %}

Ce morceau de code est intéressant, car avant iOS8, nous avions accès aux méthodes
`viewWillRotate` et `viewDidRotate`. Mais celles-ci ont été dépréciées et remplacées
par `viewWillTransition`.

Le principal problème est que nous n'avons pas de méthode `viewDidTransition`
qui aurait été appelée à la fin. Par contre, nous avons un `TransitionCoordinator`
en paramètre.

L'idée est d'utiliser ce coordinateur pour appeler une méthode à la fin de la transition.

Pour ce faire, on ajoute une animation qui doit se faire en même temps que la transition,
mais sans passer aucune animation. On renseigne juste le code à appeler à la fin de la transition.
Dans celui-ci, nous rafraîchissons les *disclosure indicators* de nos cellules visibles.
Comme cela est fait à la fin, nous sommes certains que notre code va ajouter ou retirer
les indicateurs si nécessaire.

Compilez et lancez l'application sur iPhone 6 plus, et quelque soit la rotation,
les *disclosure indicators* se rafraîchissent juste comme il faut.

### Bonus : le mode Split View d'iOS9 sur iPad

Depuis iOS9, certains iPad peuvent afficher jusqu'à deux applications en simultané.

Le truc, c'est que sur iPad air 2 et iPad mini 4, lorsque deux applications sont
affichées simultanément à 50/50, elles sont affichées en mode iPhone, et la split-view
sera donc `collapsed`. On s'attend donc à voir apparaître les *disclosure indicators*.

La bonne nouvelle, c'est que notre code précédent fonctionne correctement avec ce cas
de figure. Sans rien changer à notre code, nous pouvons donc rendre notre application
totalement compatible avec le mode Split View.

Pour essayer, retournez dans les réglages du projet, comme nous l'avons fait quelques points
auparavant, et cochez la rotation supportée `upside down`.
En effet, pour fonctionner, le mode split view nécessite que les 4 orientations
soient autorisée pour l'application. Ne me demandez pas pourquoi, je n'en ai aucune idée.

Compilez et lancez pour iPad air 2, ou pour iPad mini 4 (les deux iPad non-pro qui supportent
à ce jour le mode Split View) et déclenchez le mode split view en glissant votre doigt depuis
la droite de l'écran.

Quand l'application passe en mode iPhone, les *disclosure indicators* apparaissent
comme on pouvait s'y attendre.

### Intégrons cela à un protocole

Notre solution n'est pas encore parfaite : elle suppose que toutes les cellules
de notre table view sont "disclosable", ce qui ne sera pas le cas de toutes les
table views.

Ensuite, notre approche utilise une extension globale sur toutes les cellules.
On est très loin d'une approche locale qui permet d'assurer une simplification du
code et donc de faciliter son maintien.

Retirons donc totalmenet notre extension d'`UITableViewCell` et créons notre protocole :

{% highlight swift %}
/// Represente une cellule qui peut potentiellement discloser
protocol DisclosableCell {
    var canDisclose: Bool { get }
    func setDisclosureIndicator(visible: Bool)
}

extension DisclosableCell where Self: UITableViewCell {
    func setDisclosureIndicator(visible: Bool) {
        accessoryType = canDisclose && visible ? .disclosureIndicator : .none
    }
}
{% endhighlight %}

Bien sûr, cette approche va nécessiter une classe fille de `UITableViewCell`
pour pouvoir fonctionner dans notre exemple de tout à l'heure :

{% highlight swift %}
class MyCell: UITableViewCell, DisclosableCell {
    var canDisclose: Bool {
        // Toutes nos cellules dans l'exemple peuvent discloser
        return true
    }
}
{% endhighlight %}

**Soyez sûr de modifier la classe de la cellule prototype dans le StoryBoard** :
Sélectionnez la cellule prototype, et dans l'*Identity Inspector*, paramétrez la
classe de la cellule comme étant `MyCell`.

Enfin, remplacez l'implémentation de `viewWillTransition` avec:

{% highlight swift %}
/// Sera appelé à chaque changement de taille
override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
  // On utilise le coordinator pour suivre la transition
  coordinator.animate(alongsideTransition: nil, completion: { _ in
    // Lorsque la transition s'achève,
    // On itère sur les cellules visibles
    self.tableView.visibleCells.forEach {
      if let cell = $0 as? DisclosableCell {
        // Et on rafraîchi les disclosure indicator de ces cellules
        cell.setDisclosureIndicator(visible: !self.isInSplitViewPresentation)
      }
    }
  })

  super.viewWillTransition(to: size, with: coordinator)
}
{% endhighlight %}

Et dans la méthode `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath)`:

{% highlight swift %}
override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
  ...
  if let cell = cell as? DisclosableCell {
    cell.setDisclosureIndicator(visible: !isInSplitViewPresentation)
  }
  return cell
}
{% endhighlight %}

**Et c'est tout !**
Vous disposez d'une implémentation complète et réutilisable pour nos cellules
qui sont *disclosables*. C'est maintenant un protocol que différentes classes filles
de `UITableViewCell` peuvent conformer.
Le bon point, c'est donc qu'une seule instance de `UITableViewController` peut gérer
différentes cellules, avec certaines qui seraient disclosables, d'autre pas, le
tout dans une application universelle ; avec un comportement **correct**.

Vous pouvez cloner le repo contenant l'implémentation complète du protocol sur [github][github-end]

Si vous avez des idées d'amélioration pour ce code, n'hésitez pas à ouvrir une issue
sur github afin que l'on puisse en discuter ! :)

[cell-with-disclosure-indicator]: /assets/ios/disclosure-indicator/cell-with-disclosure.png
[comparative-split-view]: /assets/ios/disclosure-indicator/comparatif.png
[doc-apple-disclosure]:https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/TableView_iPhone/TableViewStyles/TableViewCharacteristics.html
[github-start]: https://github.com/Dean151/disclosure-indicators-done-right/tree/start
[github-end]: https://github.com/Dean151/disclosure-indicators-done-right
[human-guidelines]: https://developer.apple.com/ios/human-interface-guidelines/ui-views/tables/
[universal-setting]: /assets/ios/disclosure-indicator/universal.png
