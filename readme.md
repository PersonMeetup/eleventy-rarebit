# eleventy-rarebit

eleventy-rarebit is a plugin that adds the functionality found in [geno7's](https://geno7.neocities.org/) [Rarebit](https://rarebit.neocities.org/) webcomic template to Eleventy.

## Features

- **Drag and Drop**: No more continually fiddling with JavaScript; comic pages can be put into their own dedicated folder to be rendered onto your site.
- **Built-in Shortcodes**: Use eleventy-rarebit's suite of built in shortcodes to help create your webcomic's templates, all without leaving your HTML.
- **Go Further With 11ty**: eleventy-rarebit is a plugin for [Eleventy](https://www.11ty.dev/), a simpler static site generator. It aims to be fully compatable with offical plugins such as [RSS](https://www.11ty.dev/docs/plugins/rss/), [Image](https://www.11ty.dev/docs/plugins/image/), and [i18n](https://www.11ty.dev/docs/plugins/i18n/).

## Getting Started

If you're new to Eleventy, make sure you go over its [Getting Started](https://www.11ty.dev/docs/getting-started/) guide.

### Manual Installation

In the same folder as your Eleventy project, run the following command:

```
npm install eleventy-rarebit
```

After that, open up your Eleventy [config file](https://www.11ty.dev/docs/config/) and add the following code.

```js
const eleventyRarebit = require("eleventy-rarebit");

module.exports = function (eleventyConfig) {
	// If your config already has a module.exports, just
	// add the following code inside of it.
	eleventyConfig.addPlugin(eleventyRarebit);
};
```

## Usage

Comic pages can be stored in any subfolder within your Eleventy project's [input directory](https://www.11ty.dev/docs/config/#input-directory). Comics can be given data through [template and directory data files](https://www.11ty.dev/docs/data-template-dir/), which is also used to declare the folder they're stored in as the root of the comic. That can be done by creating a `some-folder.json` file in the folder (in this case `some-folder`) with the following data.

```json
{
	"comicRoot": "some-folder"
}
```

From there, you can use `collections.comics` in combination with the included `rarebit` filter to render pages using [pagination](https://www.11ty.dev/docs/pagination/). The following is an example of how that would be declared in [front matter](https://www.11ty.dev/docs/data-frontmatter/):

```js
---js
{
	pagination: {
		data: "collections.comics",
		size: 1,
		alias: "comic",
		addAllPagesToCollections: true,
		before: function(paginationData) {
				return this.rarebit(paginationData);
			}
	},
	layout: "rarebit.njk",
	tags: ['myComic'],
	permalink: data => `comic/${data.pagination.pageNumber + 1}/`,
	eleventyComputed: {
		title: data => data.comic.title,
		notes: data => data.comic.notes
	}
}
---
<!-- Rest of template -->
```

### Shortcodes 

- `renderNav`: Takes a `pagination` object to render First, Previous, Next, and Last buttons for comic templates.
- `renderComic`: Takes an alias for a `pagination` object iterating over data that has previously been filtered by `rarebit` (See below). This shortcode copies and renders the actual comic images onto a webpage.
- `renderArchive`: Takes an item from a collection of rendered comic pages to create an archive entry pointing to the rendered page.

### Filters

- `rarebit`: Formats the `collections.comics` object to allow for easier formatting from `renderComic`.
- `chapter`: Filters a collection of rendered comic pages by the contents of a `chapter` array that's declared in a pages template/directory data.

## Options

```js
const eleventyRarebit = require("eleventy-rarebit");

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(eleventyRarebit, {
		imageFormats: ["jpg", "png", "gif"],
		thumbnailBaseName: "thumb",
	});
};
```

### Advanced: Custom Rendering

```js
module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(eleventyRarebit, {
		imageRender: (img, alt) => {
			if (img === "") return "";
			return `<img src="${img}" alt="${alt}">`;
		},
		archiveRender: (url, thumb, title, date) => {
			return `<a href="${url}">
								<div>
									${options.imageRender(thumb, `Thumbnail for '${title}'`)}
									<h3>${title}</h3>
									<span>${date.toDateString().slice(4)}</span>
								</div>
							</a>`;
		}
	});
};
```
