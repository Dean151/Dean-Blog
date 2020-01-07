---
layout: page
title: Portfolio
permalink: /portfolio/
index: 98
published: false
---

This portfolio is about my personal projects only. None of my professional project are listed below.

## iOS Libraries

{% include portfolio_begin.html %}

{% include portfolio_item.html
    title="Recording Overlay"
    github="Dean151/RecordingOverlay"
    image="https://github.com/Dean151/RecordingOverlay/raw/master/Screenshots/preview.png"
    description="Adds a border layer of the color of your choice around the device screen. Perfect to show an active state, or a recording state."
%}

{% include portfolio_item.html
    title="Image Utility"
    github="Dean151/ImageUtility"
    description="Helpers API performing image operations on UIKit images. Support resizing, cropping, scaling, color operations and trimming."
%}

{% include portfolio_item.html
    title="People StackView"
    github="Dean151/TDPeopleStackView"
    description="StackView with overlapping to present multiple round profile pictures beautifully."
%}

{% include portfolio_end.html %}

## iOS Apps

{% include portfolio_begin.html %}

- https://github.com/Dean151/KSP-Companion-iOS
- https://github.com/Dean151/Minesweeper-iOS
- https://github.com/Dean151/Eurodisney-iOS

{% include portfolio_end.html %}

## Internet of Things

{% include portfolio_begin.html %}

{% capture description %}
A replacement API intended to communicate with my cat feeder machine ; because the original API was full of <a href="{{ post_url 2018-01-31-how-anyone-could-feed-my-cat }}">security flaws</a>.
{% endcapture %}
{% include portfolio_item.html
    title="Aln Node.js"
    github="Dean151/Aln-NodeJs"
    description=description
%}

{% include portfolio_end.html %}

## Websites

{% include portfolio_begin.html %}

- https://github.com/Dean151/Dean-Blog
- hogwarts.io
- cafelembas.com
- https://github.com/Dean151/Affres-de-Reivax

{% include portfolio_end.html %}

## Advent of code

{% include portfolio_begin.html %}

{% capture description %}
A starter project to solve <a href="https://adventofcode.com">Advent of Code</a> puzzles using Swift programming language.
{% endcapture %}
{% include portfolio_item.html
    title="Advent of Code Swift Starter"
    github="Dean151/Advent-of-code-Swift-Starter"
    description=description
%}

{% capture description %}
My solutions to <a href="https://adventofcode.com/2019">2019 Advent of Code</a> challenge in Swift programming language.
{% endcapture %}
{% include portfolio_item.html
    title="Advent of Code 2019"
    github="Dean151/Advent-of-code-2019"
    description=description
%}

{% capture description %}
My solutions to <a href="https://adventofcode.com/2018">2018 Advent of Code</a> challenge in Swift programming language.
{% endcapture %}
{% include portfolio_item.html
    title="Advent of Code 2018"
    github="Dean151/Advent-of-code-2018"
    description=description
%}

{% capture description %}
My solutions to <a href="https://adventofcode.com/2017">2017 Advent of Code</a> challenge in Swift programming language.
{% endcapture %}
{% include portfolio_item.html
    title="Advent of Code 2017"
    github="Dean151/Advent-of-code-2017"
    description=description
%}

{% include portfolio_end.html %}

## iOS Experiments

{% include portfolio_begin.html %}

- https://github.com/Dean151/Sudoku-Solver
- https://github.com/Dean151/PDF-reader-iOS

{% include portfolio_end.html %}

## Student projects

{% include portfolio_begin.html %}

- https://github.com/Dean151/Go-game
- https://github.com/Dean151/Project-Milano
- https://github.com/Dean151/Connect-Four

{% include portfolio_end.html %}

[advent-of-code-2019]: https://adventofcode.com/2019
[advent-of-code-2018]: https://adventofcode.com/2018
[advent-of-code-2017]: https://adventofcode.com/2017
