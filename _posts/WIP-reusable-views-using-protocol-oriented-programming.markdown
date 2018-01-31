---
layout: post
title:  "Reusable views using Swift and Protocol Oriented Programming"
date:   2016-11-20 18:05:00 +0200
categories: Swift3 iOS
ref: ios-reusable-views
lang: en
published: false
---

**Written for Swift 3 with Xcode 8.1**

Reusable views is a beautiful piece of engineering used everywhere under the hoods of iOS.

You may never suspected that, but `UITableView` and `UICollectionView` classes are powered by this mechanism that allow quick scroll, fluidity and nice memory management, even on very large sets of data.

If you've never heard of reusable views, the next part will try to overview how it works. Then, we will see a protocol oriented way to implement it.

### What is the reusable views mechanism ?

...

### Why not use UITableView or UICollectionView implementations?

`UITableView` and `UICollectionView` are both great, and it's almost possible to do everything with a CollectionView, but some time it's needed to go back to their common ancestor : `UIScrollView`

That what I had to do when I needed to implement a PDFViewer from scratch, with a scroll containing pages, but also different kinds of annotations on top of them.

To solve this problem, I have constructed a `UIScrollView`, containing a single `UIView` of the correct size of my document.

The next step was to implement the reusable view algorithm, inspirited by [WWDC11 video Advanced ScrollView Techniques][wwdc11], but making it available for a custom amount of views, and without having to make all of those views inheriting from the same class. Sounds like Protocol Oriented Programming.

### Structuring the protocol

{% highlight swift %}
protocol ReusableView {
    /// The index of the current view to compare when this view is visible
    var index: Int { get }

    /// A static method that will be used to instanciate a new ReusableView when needed
    static func newInstance() -> Self

    /// Method that will be called to prepare the view before it is shown to the user
    /// It's also the function responsible to give the view the correct size and position
    func prepare(for index: Int) throws

    /// Optional method that will be called just before the view is added to the superview
    func willBeAddedToSuperview()

    /// Optional method that will be called right after the view has been added to the superview
    func hasBeenAddedToSuperview()

    /// Optional method that will be called just before the view is removed from the superview
    func willBeRemovedFromSuperview()

    /// Optional method that will be called right after the view has been added to the superview
    func hasBeenRemovedFromSuperview()
}
{% endhighlight %}

As Swift doesn't authorize the `optional` keyword in protocols, we use a small trick involving an extension to have a default implementation for optionals methods :

{% highlight swift %}
extension ReusableView {
    func willBeAddedToSuperview() {}
    func hasBeenAddedToSuperview() {}
    func willBeRemovedFromSuperview() {}
    func hasBeenRemovedFromSuperview() {}
}
{% endhighlight %}

### Implementing the algorithm with a custom UIView container

Each container will be a `UIView`, responsible of one class of `UIView` implementing the `ReusableView` protocol.

In Swift 3, we can translate this constraint as :

{% highlight swift %}
class ReusableContainer<T: UIView>: UIView where T: ReusableView {
}
{% endhighlight %}

We then need to track the view that are visible and those that are not with to Sets.

Sets are the best enumerable dataset in term of performances for the `contains` method. And as this operation will occurs a lot during scrolls, performances matter !

{% highlight swift %}
class ReusableContainer<T: UIView>: UIView where T: ReusableView {
    var visibleViews = Set<T>()
    var reusableViews = Set<T>()
}
{% endhighlight %}

We now need to implement the main function, the one that will remove and add views
and that will be called in `ScrollViewDidScroll` delegate method :

{% highlight swift %}
/// To insert view using a range of ids
func reuseOrInsertViews(first: Int, last: Int) {
    // Removing no longer needed views
    for view in visibleViews {
        if view.index < first || view.index > last {
            reusableViews.insert(view)

            view.willBeRemovedFromSuperview()
            view.removeFromSuperview()
            view.hasBeenRemovedFromSuperview()
        }
    }

    // Removing reusable pages from visible pages array
    visibleViews.subtract(reusableViews)

    // Add the missing views
    for index in first...last {
        if !visibleViews.map({ $0.index }).contains(index) {
            let view = reusableViews.popFirst() ?? T.newInstance() // Getting a new view
            do {
                try view.prepare(for: index)
                visibleViews.insert(view)

                view.willBeAddedToSuperview()
                addSubview(view)
                view.hasBeenAddedToSuperview()
            } catch {
                print("Couldn't prepare view with error: \(error.localizedDescription)")
            }
        }
    }
}
{% endhighlight %}

### Usage

First, we need to implement a `ReusableView` instance :

{% highlight swift %}
final class MyReusableView: UIView, ReusableView {
    var index: Int = 0

    static func newInstance() -> MyReusableView {
        return MyReusableView()
    }

    /// Method that will be called to prepare the view before it is shown to the user
    internal func prepare(for index: Int) throws {
        self.index = index

        // Setting size and position depending on the index
        self.frame = CGRect(origin: position(for: index), size: size(at: index))
    }
}
{% endhighlight %}

Then, simply add a `ReusableContainer<MyReusableView>` in the scrollview, setted at the correct size :

{% highlight swift %}
weak var scrollview: UIScrollView!
weak var container: ReusableContainer<MyReusableView>?

override func viewDidLoad() {
    super.viewDidLoad()

    let scrollview = UIScrollView(frame: view.bounds)
    scrollview.delegate = self
    view.addSubview(scrollview)
    self.scrollview = scrollview

    // Setting the correct size to make the scrollview scrollable
    scrollview.contentSize = scrollSize

    // Adding the container to the scrollview
    let container = ReusableContainer<MyReusableView>(frame: CGRect(origin: .zero, size: scrollSize))
    scrollview.addSubview(container)
    self.container = container
}
{% endhighlight %}

Finally we need to implement the mechanism in the `ScrollViewDidScroll` method of the `scrollview`'s delegate :

{% highlight swift %}
func scrollViewDidScroll(_ scrollView: UIScrollView) {
    let firstIndex: Int = index(at: scrollview.contentOffset)
    let lastIndex: Int = index(at: CGPoint(x: scrollview.contentOffset.x + scrollview.bounds.width, y: scrollview.contentOffset.y + scrollview.bounds.height))

    container?.reuseOrInsertViews(first: firstIndex, last: lastIndex)
}
{% endhighlight %}

You may notice that you're responsible for calculating the position, size of views,
and also calculating witch view you should put at a certain position.
So there is still some geometry calculations involved, but they depends on what you're trying to build.

### Conclusion

The main part of this article is the `reuseOrInsertViews` implementation, that have to be
performant in order to preserve fluidity and memory footprint.

Moreover, always consider using `UITableView`, and the very powerfull `UICollectionView`. They will always be much more performant than anything we will ever build and they will be improved with every new version of iOS (special thoughts with iOS 10).
Only if those two classes doesn't fit your needs, and only then you may interest yourself to that kind of implementations.

You can try a working version of this code by compiling this [gist on Github][gist]

[wwdc11]: https://developer.apple.com/videos/play/wwdc2011/104/
[gist]: https://gist.github.com/Dean151/122c8d2eb2b49a325e8ba5a46e3eff8a
