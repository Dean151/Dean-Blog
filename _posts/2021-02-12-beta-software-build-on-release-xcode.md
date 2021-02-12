---
layout: post
title:  "Target iOS beta while using regular Xcode.app"
date:   2021-02-12 09:00:00 +0100
categories: apple xcode
---

One of the most frustrating thing that could happen when developing with Xcode is the fact that using release version of Xcode can't build an App for a device that is currently running a beta software.
You'll have to open Xcode-Beta in order to build your current work on your device, and eventually get back on Xcode to re-gain stability.

But there is another very simple way. Using symlink can save you time by building on your Beta device directly from non-beta Xcode!

<!--more-->

## A frustrating build on device problem

At the time I write those lines, I use iOS 14.5 on my iPhone, and WatchOS 7.4 ; very useful for unlocking my iPhone with my Apple watch in those masked-on times.
I also use iPadOS 14.5 to play using my DualSense on iPad.

The main downside of this is that I do not want to use Xcode-beta to work on my apps, and I don't have that much spare devices either. (I know that I shouldn't run beta software on my main devices, but I like to live dangerously).

## Build for iOS 14.5 using Xcode 12.4

Thankfully, there is a very easy thing to do to prevent having to switch from one Xcode to another every time I need to debug the app on a real device!

And it just takes a few steps:

1. Install Xcode-beta.app from [developer.apple.com/downloads][developer-apple-download]

It is required to have the latest SDK on your machine, and this one is only included in the latest beta version of Xcode. So we won't be skipping the unxiping this time!

2. Symlink the SDK you wanna use from Xcode-beta

Example: if you want to use iOS 14.5 on your regular Xcode:

    sudo ln -s /Applications/Xcode-beta.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport/14.5 /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport/14.5

The same goes for WatchOS 7.4 support:

    sudo ln -s /Applications/Xcode-beta.app/Contents/Developer/Platforms/WatchOS.platform/DeviceSupport/7.4 /Applications/Xcode.app/Contents/Developer/Platforms/WatchOS.platform/DeviceSupport/7.4

3. Reboot Xcode

Because if it were live, it need to reload the supported devices versions.

4. Build!

That's it, now your beta iPhone will accept to run debugger from regular Xcode.

## What's next?

Don't forget to update Xcode-beta.app when new versions are released ; thankfully you won't need to symlink again after the update, thanks to the power of symlink.

Then, I still have no visibility on what will happen when Xcode.app will get updated (I use the AppStore version of Xcode). If something breaks and it requires a small manual step to be updated, I'll update this post.

[developer-apple-download]: https://developer.apple.com/download
