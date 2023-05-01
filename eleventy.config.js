const path = require("path");
const fs = require("fs");

/**
 *
 * @param {Array} collection
 * @param {Boolean} reverse
 * @returns
 */
function archiveRender(collection, reverse) {
	return;
}

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @param {Object.Object} opts
 */
function rarebit(eleventyConfig, opts = {}) {
	let options = Object.assign(
		{
			dir: {
				comic: "_comic",
				image: "",
			},
			imageFormats: ["jpg", "png", "gif"],
			imageRender: (img, alt) => {
				if (img === '') return '';
				return `<img src="${img}" alt="${alt}">`
			},
			archiveRender: (url, thumb, title, date) => {
				return `<a href="${url}">
									<div>
										${options.imageRender(thumb, `Thumbnail for '${title}'`)}
										<h3>${title}</h3>
										<span>${date.toDateString().slice(4)}</span>
									</div>
								</a>`
			},
			thumbnailBaseName: 'thumb',
			dataFileBaseName: ''
		},
		opts
	);

	if (path.isAbsolute(options.dir.comic)) {
		throw new Error(
			"Issue with Rarebit addPlugin second arguement options object (comic argument should be a relative path.)"
		);
	}



	let comicDir = options.dir.comic;
	let outputDir;
	eleventyConfig.on("eleventy.before", async ({ dir, runMode, outputMode }) => {
		comicDir = path.join(dir.input, options.dir.comic);
		outputDir = dir.output;
	});



	eleventyConfig.addGlobalData("rarebitData", () => {
		// Return object with list of chapters and coresponding metadata
		let output = [];

		// https://stackoverflow.com/a/24594123
		try {
			const pages = fs
				.readdirSync(comicDir, { withFileTypes: true })
				.filter((dirent) => dirent.isDirectory())
				.map((dirent) => dirent.name);
		}
		catch (err) {
			console.log(`[eleventy-rarebit] Plugin is installed, but comic folder "${options.dir.comic}" does not exist!`)
			return '';
		}

		// "X folders found. Transforming contents into pages"
		//console.log(pages);

		for (const page of pages) {
			let pageObj = {
				folder: page,
				rarebit: true,
				images: fs
					.readdirSync(path.join(comicDir, page))
					.filter((file) => path.extname(file) !== ".json")
					.filter((file) => path.basename(file, path.extname(file)) !== options.thumbnailBaseName)
			};

			// Get folder data object
			try {
				let pageData = JSON.parse(
					fs.readFileSync(path.join(comicDir, page, `${page}.json`))
				);

				if (pageData.date) {
					pageData = { ...pageData, date: new Date(pageData.date) };
				}

				pageObj = Object.assign(pageData, pageObj);

				if (pageObj.date === undefined) {
					// from image file metadata, get latest modified date
					let dates = [];

					for (const image of pageObj.images) {
						dates.push(fs.statSync(path.join(comicDir, page, image)).mtime);
					}
					pageObj = { ...pageObj, date: new Date(Math.max(...dates.map(e => new Date(e)))) }
				}
			} catch (err) {
				let dates = [];

				for (const image of pageObj.images) {
					dates.push(fs.statSync(path.join(comicDir, page, image)).mtime);
				}
				pageObj = { ...pageObj, date: new Date(Math.max(...dates.map(e => new Date(e)))) }
			}

			// Get thumbnail object
			let thumb = undefined;
			let i = 2;
			while (i > 0) {
				switch (i) {
					case 2:
						try {
							thumb = path.join(page, fs
								.readdirSync(path.join(comicDir, page))
								.filter((file) => file.startsWith(options.thumbnailBaseName))[0]);
							i = 0;
						} catch (err) {
							i--;
						}
						break;
					case 1:
						try {
							thumb = fs
								.readdirSync(comicDir)
								.filter((file) => file.startsWith(options.thumbnailBaseName))[0];
							i = 0;
						} catch (err) {
							i--;
						}
						break;
				}
			}
			if (thumb !== undefined) {
				if (!fs.existsSync(path.join(outputDir, options.dir.image, "thumb"))) {
					fs.mkdirSync(path.join(outputDir, options.dir.image, "thumb"), { recursive: true });
				}
				if (path.dirname(thumb) == '.') {
					if (fs.existsSync(path.join(outputDir, options.dir.image, "thumb", `default${path.extname(thumb)}`))) {
						// Since we shouldn't repeat the copy move anymore than
						// we need to, push to output and continue the loop.
						pageObj = { ...pageObj, thumb: path.join(options.dir.image, "thumb", `default${path.extname(thumb)}`) };
						output.push(pageObj);
						continue;
					}
					fs.copyFile(
						path.join(comicDir, thumb),
						path.join(outputDir, options.dir.image, "thumb", `default${path.extname(thumb)}`),
						(err) => {
							if (err) throw err;
						}
					);
					pageObj = { ...pageObj, thumb: path.join(options.dir.image, "thumb", `default${path.extname(thumb)}`) };
				} else {
					fs.copyFile(
						path.join(comicDir, thumb),
						path.join(outputDir, options.dir.image, "thumb", `${page}${path.extname(thumb)}`),
						(err) => {
							if (err) throw err;
						}
					);
					pageObj = { ...pageObj, thumb: path.join(options.dir.image, "thumb", `${page}${path.extname(thumb)}`) };
				}
			}
			output.push(pageObj);
		}

		return output;
	});



	eleventyConfig.addShortcode("rarebitRenderNav", function (curPage) {
		let output = "";
		let obj;

		if (curPage.href) {
			obj = curPage.href
		} else if (curPage.previous) {
			obj = curPage
		} else {
			throw new Error(
				`Issue with "rarebitRenderNav" shortcode in ${this.page.inputPath} (input not a proper pagination object.)`
			);
		}

		if (this.page.url != obj.first) {
			output = output + `<a href="${obj.first}">First</a> `
		}
		if (obj.previous != null) {
			output = output + `<a href="${obj.previous}">Previous</a> `;
		}
		if (obj.next != null) {
			output = output + `<a href="${obj.next}">Next</a> `;
		}
		if (this.page.url != obj.last) {
			output = output + `<a href="${obj.last}">Last</a> `
		}

		return output;
	})

	eleventyConfig.addShortcode("rarebitRenderComic", function (curPage) {
		let output = "";
		let obj;

		try {
			if (curPage.items) {
				obj = curPage.items[0];
			} else if (curPage.rarebit == undefined) {
				obj = curPage[0];
			} else {
				obj = curPage
			}
		} catch (err) {
			throw new Error(
				`Issue with "rarebitRenderComic" shortcode in ${this.page.inputPath} (input not a proper pagination object.)`
			);
		}

		for (const image of obj.images) {
			let imagePath;
			if (!options.dir.image) {
				if (!fs.existsSync(path.join(outputDir, this.page.url))) {
					fs.mkdirSync(path.join(outputDir, this.page.url), { recursive: true });
				}
				fs.copyFile(
					path.join(comicDir, obj.folder, image), // Input
					path.join(outputDir, this.page.url, image), // Output
					(err) => {
						if (err) throw err;
					}
				);
				imagePath = path.join(this.page.url, image);
			} else {
				if (!fs.existsSync(path.join(outputDir, options.dir.image, obj.folder))) {
					fs.mkdirSync(path.join(outputDir, options.dir.image, obj.folder), { recursive: true });
				}
				fs.copyFile(
					path.join(comicDir, obj.folder, image), // Input
					path.join(outputDir, options.dir.image, obj.folder, image), // Output
					(err) => {
						if (err) throw err;
					}
				);
				imagePath = path.join(options.dir.image, obj.folder, image);
			}

			let altText = '';
			if (typeof obj.alt == 'string') {
				altText = obj.alt;
			} else if (typeof obj.alt == 'object') {
				altText = obj.alt[obj.images.indexOf(image)];
			} else {
				console.log(`[eleventy-rarebit] Missing alt text for ${image} in '${obj.folder}' folder.`);
			}

			output = output + options.imageRender(imagePath, altText);
		}
		return output;
	});

	eleventyConfig.addShortcode("rarebitRenderArchive", function (curPage) {
		let obj;

		if (curPage.data) {
			obj = curPage.data.pagination.items[0];
		} else if (curPage.pagination) {
			obj = curPage.pagination.items[0];
		} else {
			throw new Error(
				`Issue with "rarebitRenderComic" shortcode in ${this.page.inputPath} (input not a proper page object.)`
			);
		}

		const title = () => {
			if (!obj.title) {
				return `Page ${obj.folder}`
			} else {
				return obj.title;
			}
		}

		return options.archiveRender(curPage.page.url, `/${obj.thumb}`, title(), obj.date);
	});



	eleventyConfig.addCollection("rarebit", (collectionApi) => {
		return collectionApi.getAll().filter((item) => {
			if (item.data.pagination) {
				return "rarebit" in item.data.pagination.items[0];
			}
		});
	});

	// Todo: Filter collections by chapter object
	eleventyConfig.addFilter("rarebitChapters", function (value, chapter) {
		//console.log(value.filter(obj => obj.data.pagination.items[0].chapters.includes(chapter)));
		return value.filter(obj => obj.data.pagination.items[0].chapters.includes(chapter));
	});



	eleventyConfig.addWatchTarget(path.join("**", options.dir.comic, "**/*.*"));
}

module.exports = rarebit;
