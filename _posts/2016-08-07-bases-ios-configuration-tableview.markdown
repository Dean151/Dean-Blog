---
layout: post
title:  "Bases iOS: configuration d'une UITableView avec Swift 3"
date:   2016-08-07 12:46:07 +0200
categories: Swift3 iOS
ref: ios-tut-1
lang: fr
---

**Écrit pour Swift 3 et Xcode 8 beta 3**

Maintenant que je me sens très familier avec la syntaxe du *Swift* et l'architecture d'une app *iOS* ; et que je suis totalement convaincu de la simplicité à écrire du code Swift, je veux partager avec vous comment utiliser et faire l'une des interfaces les plus communes d'*iOS* : une présentation de données avec une TableView !

C'est le premier article à propos du dévelopement *iOS* sur ce blog, et j'espère pouvoir en écrire beaucoup plus. 

**Note :** il existe deux méthodes pour implémenter une TableView dynamique : en utilisant une `UITableViewController`, ou bien avec une `UIViewController` qui conforme les protocoles `UITableViewDelegate` and `UITableViewDataSource`. J'ai choisi de vous montrer la seconde solution dans ce tutoriel, non pas parce que c'est la plus simple, mais parce que c'est la méthode qui permet le plus de personnalisation dans la mise en page de la vue, ce qui peut être utile.

### Ce que l'on va réaliser

Notre but d'aujourd'hui est la réalisation de la liste des éléments du tableau périodique, classés par numéro atomique. 

![Image du résultat][screenshot]

Heureusement, nous n'allons pas implémenter les données de tous les atomes directement dans le code. À la place, nous allons les récupérer depuis un fichier .plist provenant d'un code exemple d'Apple :

[Elements.plist][elements-plist]

### D'abord : À propos du MVC

MVC pour "Modèle Vue Controleur" est un design pattern qui sépare différents aspects du code dans une application :

- le **Modèle** représente les données que l'on souhaite afficher. En swift, il est recommandé d'adopter une représentation orientée structure plutôt qu'un modèle orienté classe. Mais cela dépend de ce que l'on souhaite réaliser.
- la **Vue**: Ici, ce sera notre TableView. Les vues sont présentées à l'utilisateur et ce dernier peu interragir avec elles.
- le **Controleur**: Pour simplifier, il s'agit de la colle entre le modèle, les vues et les données. L'utilisateur interragit avec les vues, celles-ci le signalent au controleur, qui va modifier les données, et mettre à jour les vues pour prendre en compte les modifications. Lorsque les données changent, le controleur est responsable d'adapter les vues en conséquence.

Pour le développement *iOS*, MVC est le design pattern le plus commun, et UIKit est conçu pour être pro-MVC. Le controleur sera une classe fille de `UIViewControler`. 
Toutes les instances de `UIViewController` contiennent une instance de `UIView`. Ce sera notre vue principale.
Nous allons créer une instance de `UITableView` qui sera une sous-vue de notre `UIView` principale.

Enfin, nos données seront structurées avec une simple structure *Swift*. 

### Commencer le projet

Ouvrez *Xcode 8* et choisissez "create a new iOS project" avec le template "One view". Nommez le projet `ElementsList`.
Assurez-vous que CoreData, Unit Tests et UI Tests sont *décochés*.

Xcode a créé un certain nombre de fichiers qui sont listés sur la gauche ; C'est le point de départ de toute application iOS : Un Storyboard pour designer les vues, un ViewController qui est le premier controleur de l'app, et un AppDelegate qui s'occupe de toute la logique du cycle de vie de l'application.

Ouvrez le StoryBoard, et vous verrez juste une première vue vide. Une des nombreuses façon de procéder pour réaliser le UI des vues de l'applications est de réaliser celles-ci et les relations entre elles directement dans ce fichier. Cependant la seule chose que nous allons faire pour le moment dans ce fichier est d'ajouter un Navigation Controller pour notre application. Cela nous permettra de disposer de la barre de navigation en haut, et pour plus tard de pousser de nouvelles vues dans un tutoriel futur.

Pour ajouter ce NavigationController, selectionnez la vue visible, puis dans le menu : `Editor > Embed in > Navigation Controller`.

Ceci devrait ajouter un View Controller avec une barre de navigation, et une flèche qui pointe vers notre précédent view controller. Vous venez de créer votre première relation entre controllers dans un storyboard. Bravo !

Prochaine étape : le modèle.

### Le modèle

Un bon départ pour une application avant d'implémenter quoique ce soit, est de réfléchir à la façon dont les données vont être représentées dans le code.

Si vous ne l'avez pas déjà fait, ouvrez le fichier de données [Elements.plist][elements-plist] et jetez un coup d'œil aux données qu'il contient.

Nous avons un fichier contenant un tableau de dictionnaires. Chaque dictionnaire représente un élément, et contient un certain nombre de données. C'est toujours une bonne habitude d'implémenter dans le modèle la totalité des données disponible, celà permet d'assurer une adaptibilité simple avec les futures fonctionnalités d'une application sans devoir toucher au modèle.

Pour créer le modèle, créez un nouveau fichier Swift dans le projet, nommez le `Element.swift`. Dans ce fichier, nous allons implémenter la totalité du modèle.

Voici un exemple du modèle que j'ai implémenté pour cette application :

{% highlight swift %}
struct Element {
    enum State: String {
        case Solid, Liquid, Gas, Artificial
    }
    
    let atomicNumber: Int
    let atomicWeight: Float // en g.mol-1
    let discoveryYear: String
    let group: Int
    let name: String
    let period: Int
    let radioactive: Bool
    let state: State
    let symbol: String
    
    // Position dans la table
    let horizPos: Int
    let vertPos: Int
}
{% endhighlight %}

Tous les types sont plutôt simples dans cet exemple : Booléen, Entier, Flottant et chaînes de caractères ; mais il y a aussi une énumération. Les énumérations sont idéals lorsqu'on ne nécessite qu'un nombre limité d'options. C'est le cas ici avec l'état d'un élément. Il n'y a que 4 valeurs possibles.

Notez que j'ai choisi de faire une énumération de String, ce qui signifie qu'un état est en réalité une chaîne de caractères, et que l'on pourra essayer de convertir une chaîne de caractères en State et inversement.

Ce modèle reprend toutes les données du [fichier plist d'apple][elements-plist] et nous permettra de représenter un élément.
Mais comment charger les éléments ? Actuellement, les éléments sont dans un fichier plist, donc nous allons devoir écrire quelque chose nous permettant de transformer ce fichier plist en un tableau contenant *tous les éléments*.

### Chargement des données

Bien, nous avons un modèle, et nous avons les données dans un fichier plist. Cependant nous avons encore besoin de la traduction de nos données vers ce modèle pour pouvoir en profiter.

Je l'implémenterais de cette façon :

{% highlight swift %}
extension Element {
    enum Error: ErrorProtocol {
        case noPlistFile
        case cannotReadFile
    }
    
    /// Charge tous les éléments depuis le plist
    static func loadFromPlist() throws -> [Element] {
        // On cherche le plist dans le projet
        guard let file = Bundle.main.pathForResource("Elements", ofType: "plist") else {
            throw Error.noPlistFile
        }
        
        // Ensuite, on lit ce fichier comme un tableau de dictionnaires
        guard let array = NSArray(contentsOfFile: file) as? [[String: AnyObject]] else {
            throw Error.cannotReadFile
        }
        
        // Initialisation de l'array
        var elements: [Element] = []
        
        // Pour chaque dictionnaire
        for dict in array {
            // On implémente l'élément
            let element = Element.from(dict: dict)
            // Et on l'ajoute à l'array
            elements.append(element)
        }
        
        // Enfin on retourne les éléments
        return elements
    }
    
    /// Créé un élément à partir du dictionnaire en paramètre
    static func from(dict: [String: AnyObject]) -> Element {
        let atomicNumber = dict["atomicNumber"] as! Int
        let atomicWeight = Float(dict["atomicWeight"] as! String) ?? 0
        let discoveryYear = dict["discoveryYear"] as! String
        let group = dict["group"] as! Int
        let name = dict["name"] as! String
        let period = dict["period"] as! Int
        let radioactive = dict["radioactive"] as! String == "True"
        let state = State(rawValue: dict["state"] as! String)!
        let symbol = dict["symbol"] as! String
        let horizPos = dict["horizPos"] as! Int
        let vertPos = dict["vertPos"] as! Int
        
        return Element(atomicNumber: atomicNumber,
                       atomicWeight: atomicWeight,
                       discoveryYear: discoveryYear,
                       group: group,
                       name: name,
                       period: period,
                       radioactive: radioactive,
                       state: state,
                       symbol: symbol,
                       horizPos: horizPos,
                       vertPos: vertPos)
    }
}
{% endhighlight %}

C'est beaucoup de code, mais celà ce lit plutôt facilement, et devrait ne pas être trop difficile à comprendre.

Pour l'essayer, on peut ajouter dans la méthode `viewDidLoad()` de la classe `ViewController` : 

{% highlight swift %}
class ViewController: UIViewController {
    
    // Contient notre array d'éléments
    var elements: [Element] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
        
        elements = try! Element.loadFromPlist()
        print(elements)
    }
}
{% endhighlight %}

Quand on regarde la console d'Xcode pendant l'exécution, les données sont là !

![The loaded elements in the console][elements-loaded]

**Important** : Dans la méthode `Element.from(dict: _)`, j'utilise beaucoup de "force unwrapping" `!` qui va forcer la donnée . J'ai fait ce choix parce que les données sont implémentées dans un fichier qui n'est pas censé changer souvent et qui ne peuvent pas être modifiées facilement. Mais dans une véritable application, l'implémenter de cette façon pourrait causer des crashs lorsque les données ne correspondent pas  à ce qui est attendu, et celà risque fort d'arriver !

### Créons la TableView

D'abord, nous devons créer une intance de tableview, et garder la référence à cette instance. Pour ce faire, il faut ajouter une propriété à la classe `ViewController` juste en dessous de `var elements` :

{% highlight swift %}
    var elements: [Element] = []
    weak var tableView: UITableView! // On la créée weak pour une considération de mémoire
{% endhighlight %}

Ensuite, on créé la tableview à la fin de la méthode `viewDidLoad()` :

{% highlight swift %}
    override func viewDidLoad() {
        ...
        let tableView = UITableView(frame: view.bounds)
        view.addSubview(tableView)
        self.tableView = tableView
        
        tableView.dataSource = self
        tableView.delegate = self
    }
{% endhighlight %}

Aussitôt que vous faites celà, le compilateur devrait se plaindre que *ViewController class does not conform UITableViewDataSource and UITableViewDelegate protocols*, ce qui signifie qu'il faut que le controleur implémente les protocoles que l'on essaie d'assigner sur les deux dernières lignes.

Que devons nous faire ? Et bien, disons au compilateur que nous les implémentons !
Ajoutez à la fin du fichier :

{% highlight swift %}
extension ViewController: UITableViewDataSource, UITableViewDelegate {

}
{% endhighlight %}

Bien, maintenant l'erreur du compilateur à changé, et dit que nous n'implémentons pas le protocole `UITableViewDataSource`.

### Configurons la tableview

Si on regarde la documentation, on se rend compte que le protocole `UITableViewDataSource` contient deux méthodes qu'il est obligatoire d'implémenter :

- `tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int` : Doit retourner le nombre de lignes dans la section en paramètre de la tableview. Dans notre exemple, nous avons qu'une seule section, donc l'implémentation de celle-ci sera très simple :

{% highlight swift %}
func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return elements.count
}
{% endhighlight %}

- `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell` : Doit retourner la cellule correspondant à l'IndexPath en paramètre (un IndexPath est un couple contenant le nombre de la section et le nombre de la ligne)

{% highlight swift %}
func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    // Récupérons le bon élément
    let element = elements[indexPath.row]
    
    // Créons une cellule
    let cell = UITableViewCell(style: .subtitle, reuseIdentifier: "ElementCell")
    
    // On y ajoute les bonnes informations
    cell.textLabel?.text = element.symbol
    cell.detailTextLabel?.text = element.name
    
    // On retourne la cellule
    return cell
}
{% endhighlight %}

Maintenant, on peut compiler et lancer l'app, et voilà, votre première tableview. Mais attendez ! Il y a plus !

### Un problème de mémoire

Si vous lancez l'application en l'état, elle semble bien, mais **Ce n'est pas le cas !**

Pour comprendre pourquoi je dis cela, lorsque l'application est lancée depuis Xcode, regardez l'emprunte mémoire vive dans la console de débug d'Xcode, et faites bien attention à la quantité de mémoire que prend l'application lorsqu'on défile vers le haut ou vers le bas.

![Graphique de la mémoire, ne faisant qu'augmenter][memory-issue]

Quoi ? Juste 33Mo ? Et vous me dite que ça ne va pas ?
Oui, ça ne va pas, car on voit bien que lorsqu'on défile, la mémoire vive consommée par l'application ne fait qu'augmenter, augmenter et augmenter. Il existe de la mémoire qui n'est jamais déallouée.
Cela signifie que l'application pourrait (et va) éventuellement crasher pour cause de trop forte consommation de mémoire vive. (outch !)

Que se passe-t-il ?

Et bien, rappelez vous de notre implémentation de `cellForRowAt: indexPath` ? Elle créé une nouvelle cellule à chaque fois qu'elle est appellée par la TableView. Est-ce la bonne façon de faire ? Non, définitivement non.

Que faire ?

On doit **réutiliser** les cellules. Et ne prenez pas peur, c'est très facile à faire !

### Réutilisons les cellules

L'idée de base de la réutilisation des cellules est de récupérer les cellules qui disparaissent lorsqu'on défile, et de les afficher à nouveau là où on en a besoin.

Comme je l'ai dit précedemment, c'est très facile à faire. De plus, on a déjà fait la moitié du travail : nous avons déjà enregistré notre cellule pour être réutilisée !
En effet, regardez le code qui créé une cellule, nous avons paramétré un "reuseIdentifier" pour la cellule. Essayons donc de la réutiliser lorsqu'on le peut.

Quelle va être la logique ?

Et bien, on va essayer de réutiliser une cellule, et si on ne peut pas, créons une cellule de zéro.

Remplaçons simplement
{% highlight swift %}
// Créons une cellule
let cell = UITableViewCell(style: .subtitle, reuseIdentifier: "ElementCell")
{% endhighlight %}
avec
{% highlight swift %}
// Essayons de réutiliser une cellule
let cellIdentifier = "ElementCell"
let cell = tableView.dequeueReusableCell(withIdentifier: cellIdentifier)
    ?? UITableViewCell(style: .subtitle, reuseIdentifier: cellIdentifier)
{% endhighlight %}

Maintenant, lorsqu'on créé une cellule, on essaie d'abord de réutiliser une cellule, en utilisant `dequeueReusableCell(withIdentifier: _)`. Cette fonction va retourner une cellule en cas de succès, et nil en cas d'échec.

Regardons la seconde ligne.
L'opérateur `??` utilise la première valeur quand elle n'est pas `nil`, et va utiliser la seconde valeur lorsque la première est `nil`.

De cette façon, notre cellule sera réutilisée si on le peut, et sera initialisée de zéro comme on le faisait auparavant si cela ne réussi pas. Nous devrions toujours avoir une cellule après ces deux lignes.

Pour être plus précis, la fonction `dequeueReusableCell` va rater uniquement la première fois, car on a pas enregistré de cellule pour l'identifiant "ElementCell". Par contre, par la suite, réutiliser des cellules fonctionne sans problème car la fonction d'Apple créé des cellules lorsqu'elle n'en a pas de disponible à réutiliser.

### Touches finales

Ok, ça commence à ressembler à quelque chose, mais on peut trouver 3 problèmes :

1. Il n'y a pas de titre dans la barre de navigation
2. Quand on touche une cellule, elle reste sélectionnée (grise)
3. Tu nous avais dit que les éléments seraient classées par ordre de numéro atomique ! (Hydrogène d'abord, ensuite l'Hélium, etc...)

Alors corrigeons tout ça, quelques lignes de code par problème !

1) N'importe où dans `viewDidLoad`
{% highlight swift %}
navigationItem.title = "Periodic Elements"
{% endhighlight %}

NavigationItem nous permet de modifier comment un controller est affiché au sein d'un NavigationController. Ici, nous avons juste besoin de modifier le titre.

2) En bas du fichier, au sein de l'extension qui implémente `UITableViewDelegate`
{% highlight swift %}
extension ViewController: UITableViewDataSource, UITableViewDelegate {
    ...
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
    }
}
{% endhighlight %}

Méthode à implémenter de `UITableViewDelegate`, on implémente `tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath)` qui est appelée aussitôt qu'une cellule est sélectionnée. Quand cela arrive, on demande à la tableview de déselectionner l'indexpath avec une animation. Ce qui permet de réaliser une déselection animée pour signaler à l'utilisateur qu'il n'y a rien à faire lorsqu'on sélectionne les cellules, du moins pour l'instant.

3) Dans `viewDidLoad`, juste après `elements = try! Element.loadFromPlist()`
{% highlight swift %}
elements.sort(isOrderedBefore: {
    $0.atomicNumber < $1.atomicNumber
})
{% endhighlight %}
Cela va classer le tableau en place.
Swift 3 arrays disposent de deux fonctions pour classer les tableaux :

- `sort` : Va classer le tableau actuel sur place, ce qui n'est possible que si le tableau est mutable, ce qui est le cas lorsque le tableau est stocké en tant que `var`. Elle retourne `nil`
- `sorted` : Va retourner une copie du tableau, classée. Cette fonction est disponible sur tous les tableaux, y compris lorsque le tableau n'est pas mutable (`let`).

### C'est dans la boite !

Maintenant, lorsque vous lancez l'application, elle a exactement le comportement attendu.
Si vous le souhaitez, vous pouvez cloner le projet depuis [cette branche sur Github][repo-github]

![Image du résultat][screenshot]

### Que faire ensuite ?

Je vais écrire des tutoriels sur la même lancée, permettant d'ajouter à cette application :

- Une vue de détail pour consulter les données de tous nos éléments
- Une vue doublée "split" pour adapter l'application à l'iPad
- Une barre de recherche pour trouver l'élément
- Un mode paysage avec les éléments disposés en table périodique

Vous pouvez aussi essayer d'implémenter tout celà de vous même, en utilisant la documentation d'Apple et d'autres blogs !

[elements-plist]: /assets/ios/tutorial1/Elements.plist
[elements-loaded]: /assets/ios/tutorial1/ElementsInConsole.png
[memory-issue]: /assets/ios/tutorial1/MemoryIssue.png
[screenshot]: /assets/ios/tutorial1/Screenshot.png
[repo-github]: https://github.com/Dean151/ElementsList/tree/tutorial-1
