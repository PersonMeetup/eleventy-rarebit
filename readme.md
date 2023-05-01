# eleventy-rarebit

eleventy-rarebit is a plugin that adds similar functionality found in [geno7's](https://geno7.neocities.org/) [Rarebit](https://rarebit.neocities.org/) webcomic template to Eleventy.

## Features

- **Drag and Drop**: No mode fiddling with JavaScript; comic pages can be put into their own dedicated folder to be rendered onto your site.
- **Built-in Shortcodes**: Use eleventy-rarebit's suite of built in shortcodes to help create your webcomic's templates, all without leaving your HTML.
- **Go Further With 11ty**: eleventy-rarebit is a plugin for [Eleventy](https://www.11ty.dev/), a simpler static site generator. It aims to be fully compatable with offical plugins such as [RSS](https://www.11ty.dev/docs/plugins/rss/), [Image](https://www.11ty.dev/docs/plugins/image/), and [i18n](https://www.11ty.dev/docs/plugins/i18n/).

## Getting Started

If you're new to Eleventy, make sure you go over its [Getting Started](https://www.11ty.dev/docs/getting-started/) guide.

### Manual Installation 

In the same folder as your Eleventy project, run the following command:

```
npm command here lol
```

### Setup

Open up your Eleventy [config file](https://www.11ty.dev/docs/config/) and add the following code.

```js
const eleventyRarebit = require("eleventy-rarebit");

module.exports = function (eleventyConfig) {
	// If your config already has a module.exports, just
	// add the following code inside of it.
	eleventyConfig.addPlugin(eleventyRarebit);
}
```

## Usage

## Options

```js
const eleventyRarebit = require("eleventy-rarebit");

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(eleventyRarebit, {
		dir: {
			comic: "_comic",
			img: ""
		},
		thumbnailBaseName: 'thumb'
	});
}
```