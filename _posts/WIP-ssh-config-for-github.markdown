---
layout: post
title:  "Seamless SSH configuration for git with GitHub"
date:   2017-07-12 23:55:00 +0200
categories: Git
ref: ssh-config-for-github
published: false
---

Every developers use (or should use) a version control software to deal with code changes. And Git is becoming one of the most used version control software.

As git is emerging, the number 1 code hosting made for git is probably [GitHub][github], a very powerful website that allow unlimited public git repositories. It supports both HTTPS and SSH ; and is widely used over the Internet, and is the reference I use along this blog.

## First approach: using HTTPS

By default, GitHub suggest to clone repositories with HTTPS. This works fine most of the time, but if your repository is private, or if you want to write to the repository, you'll need to authenticate yourself.

{% highlight bash %}
$ git clone https://github.com/Dean151/Dean-Blog.git
{% endhighlight %}

The result will look like:
```
Cloning into 'Dean-Blog'...
remote: Counting objects: 214, done.
remote: Total 214 (delta 0), reused 0 (delta 0), pack-reused 214
Receiving objects: 100% (214/214), 1.93 MiB | 1.44 MiB/s, done.
Resolving deltas: 100% (79/79), done.
$ cd Dean-Blog/
$ git push
Username for 'https://github.com':
```

The major problem is that HTTPS authentication is not compatible with the **Two Factor Authentication** system, that I strongly recommand to use!

Of course, it's possible to generate a GitHub [*“Personal Access Token”*][github-token], and use it instead of our password to make it work, even when TFA option is enabled ; But it's far more secure to use SSH instead of HTTPS

## Using SSH to connect to GitHub

### What is a SSH Key ?

Long story short, it's a secure and powerful way of authenticating. When you generate a SSH Key, you generate a **public**, and a **private** key.

The private key must remain secret, and protected on your computer. It's also strongly recommanded to protect it with a **passphase** when generating it.

The public key is complementary. That's the key you'll give to GitHub, that they'll store as "trusted". When you'll need to login, GitHub will challenge your computer using your public key, and only the private key will be able to pass this challenge. As only you know the private key, it's as secure (maybe even most secure) than using a password or a token.

### Generating a SSH Key

It's good practive to use a strong algorithm to generate the key.
In the following example, we'll use the `ed25519` that is both secure and fast.

{% highlight bash %}
$ ssh-keygen -t ed25519
{% endhighlight %}

If your system cannot handle it yet, you can use `rsa` instead, with a key size of at least 4096 bytes:

{% highlight bash %}
$ ssh-keygen -t rsa -b 4096
{% endhighlight %}

The output should look like:
```
Generating public/private ed25519 key pair.
# Give the key a name you'll recognize later. Here it'll be github_key
Enter file in which to save the key (~/.ssh/id_ed25519): ~/.ssh/github_key
# It's strongly recommanded you choose a strong passphrase for your key, that'll prevent a catastrophe if someone steal your keys.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
# This is your private key. Never give it to anyone!
Your identification has been saved in /Users/thomas/.ssh/github_key.
# This contains your public key, Okay to give it to a peer, like GitHub
Your public key has been saved in /Users/thomas/.ssh/github_key.pub.
The key fingerprint is:
SHA256:S/IqXHcO7hLHiZLtzgnV7tCkjfazbAzzhmJSKYeiAKE contact@thomasdurand.fr
The key's randomart image is:
+--[ED25519 256]--+
|                 |
|.                |
|..               |
|E      .         |
|.  . +ooS.       |
|o o *.B@*..      |
|o. =.+=@*+       |
|. . =++BB .      |
|   o +==*o       |
+----[SHA256]-----+
```

> Please note this couple of keys have never been used anywhere.
> For a real life key, don't post the public/private signature, fingerprint or randomart anywhere!

### Giving GitHub your Public Key

When connected to GitHub, you'll find authorized keys associated to your account in your [Profile Settings][github-keys].
Don't forget to revoke any old keys you're not using anymore, if there's any.

First, we'll need to copy our public key we just generated.

For mac users, you can use pbcopy that will copy the content of the key in your pasteboard:

{% highlight bash %}
$ pbcopy < ~/.ssh/github_key.pub
{% endhighlight %}

For other users, you can use `cat` to print the key, and copy it from the terminal without adding any spaces or line break that would mess it up :

{% highlight bash %}
$ cat ~/.ssh/github_key.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICJ6/fS2C+gTqy6eLd6OUZ/wRznCoAHxDHU1CSz0BEtG contact@thomasdurand.fr
{% endhighlight %}

The thing that you should copy-paste in GitHub start with the protocol (`ssh-ed25519` in that case) and ends with your email.

Once you're ready, go to your [Profile Settings][github-keys] -> New SSH Key.
Give it a recognizable title, and paste your public key in the textarea.

Your password may be asked for, and then your SSH key should be added to your keys list, marked as "Never used"

### Configure SSH to make it work with your SSH key

#### Using SSH-Agent

In github's tutorial, they suggest to use the SSH-Agent :

{% highlight bash %}
$ eval "$(ssh-agent -s)"
Agent pid 59566
$ ssh-add -K ~/.ssh/id_rsa
{% endhighlight %}

This is not the best method.

The main reason why is that you'll have to reproduce this step each time you log-in to your computer. (yurk)

#### Using SSH-Config

This is the method I use everyday, and that I would advice to someone!
This method will be completely automatic.

First, create your SSH config file:

{% highlight bash %}
touch ~/.ssh/config
{% endhighlight %}

Then, open it, for example with nano:

{% highlight bash %}
nano ~/.ssh/config
{% endhighlight %}

### Test your key

You can test your configuration using ssh :

{% highlight bash %}
$ ssh -T git@github.com
Hi Dean151! You've successfully authenticated, but GitHub does not
provide shell access.
{% endhighlight %}

When prompted, you'll need to give your passphrase, and eventually set the fingerprint of the server as trusted.

### Conclusion

[github]: https://github.com
[github-token]: https://github.com/settings/tokens
[github-keys]: https://github.com/settings/keys
