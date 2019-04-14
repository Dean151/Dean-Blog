---
layout: post
title:  "Keep PHP up to date on Debian 9"
date:   2019-03-20 12:00:00 +0000
categories: server configuration
---

When installing PHP on Debian 9, the default version is **PHP 7.0**.\\
This version have been declared *End-of-life* [since January 10, 2019][php-end-of-life]. \\
PHP 7.0 will not go further version *7.0.33* on Debian 9.

## Adding a new repository for newer versions of PHP

First, this repository uses *APT Transport over HTTPS*. This is basicly getting packages over a TLS connexion.\\
Let's install the necesary packages, if you do not have them already:

{% highlight bash %}
sudo apt-get install ca-certificates apt-transport-https 
{% endhighlight %}

Then, we add `https://packages.sury.org/php` that will be our new source for installing and updating PHP:

{% highlight bash %}
wget -q https://packages.sury.org/php/apt.gpg -O- | sudo apt-key add -
echo "deb https://packages.sury.org/php/ stretch main" | sudo tee /etc/apt/sources.list.d/php.list
{% endhighlight %}

## Upgrading PHP 7.0 with patches

If you have already `php7.0` packages installed on your system, you can get patches right away:

{% highlight bash %}
sudo apt-get update
sudo apt-get upgrade
{% endhighlight %}

Now the installed version of PHP is (at the time of writing) `v7.0.33-5+0~20190309015553.9`.\\
It contains some patchs from higher version of PHP, added by the community.

This gives you extra time to update your code and support higher version of PHP before upgrading.

## Upgrade PHP

You may want to update PHP to a later release, after you've made sure your code can support it!

You have 2 options: installing the lastest release (7.3 when this was written), or installing a specific version (7.1 or 7.2).
You can also perform both, if you need more than one version installed.

Those operations will not uninstall other version of PHP, and will not change Apache and/or Nginx configuration, so your websites will still use 7.0 by default.

### a) Install PHP's latest version

You can now install the **current version** of PHP (as of today, the 7.3) using:

{% highlight bash %}
sudo apt-get install php php-cli php-fpm php-mysql
{% endhighlight %}

If the package is already installed, you may need to run instead:

{% highlight bash %}
sudo apt-get dist-upgrade
{% endhighlight %}

### b) Install PHP 7.x

You may want to install any version of PHP using any of the following commands:

{% highlight bash %}
# PHP 7.1
sudo apt-get install php7.1 php7.1-cli php7.1-fpm php7.1-mysql

# PHP 7.2
sudo apt-get install php7.2 php7.2-cli php7.2-fpm php7.2-mysql
{% endhighlight %}

You're free to install any additional extensions that fit your needs.

## Update your HTTP server

In order to your server to use the new version of PHP, you have to update its configuration.

### a) Apache2

On Apache, you need to disable the old PHP handler before using the new.\\
More advanced configurations will allow you to use different versions of PHP on differents websites if needed.

{% highlight bash %}
sudo a2dismod php7.0
sudo a2enmod php7.3 # Adapt the version of PHP with the version you want to use
sudo service apache2 restart
{% endhighlight %}

### b) Nginx

With Nginx, you just need to edit your fastcgi configuration to make usage of the fpm version you need:

By default, those settings are in nginx.conf, but they may be inside a `sites-availables/` subfolder, or in a included custom configuration file.

{% highlight bash %}
sudo nano /etc/nginx/nginx.conf
{% endhighlight %}

Update the `fastcgi_pass` value according to the PHP version you'd like to use.

Then, simply restart nginx:

{% highlight bash %}
sudo service nginx restart
{% endhighlight %}

## Optional: uninstall PHP 7.0

If you don't need it anymore, it can be nice to perform some cleanup operations and remove PHP 7.0 from your server.

**Be carefull not to delete package that you still need by reviewing them before confirming!**

{% highlight bash %}
sudo apt-get purge "php7.0*"
{% endhighlight %}

If the list seems okay, you may confirm the deletion, and now PHP 7.0 is completely gone!

[php-end-of-life]: https://secure.php.net/supported-versions.php
