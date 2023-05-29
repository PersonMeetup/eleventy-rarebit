const path = require("path");
const fs = require("fs");

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @param {Object.Object} opts
 */
function rarebit(eleventyConfig, opts = {}) {
  let options = {
    ...{
      imageFormats: ["jpg", "png", "gif"], // Todo: Filter images by extensions
      imageRender: (img, alt) => {  // Todo: Break into class? Also add image handler for coping files?
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
      },
      thumbnailBaseName: "thumb",
    },
    opts,
  };

  eleventyConfig.addTemplateFormats(options.imageFormats);

  eleventyConfig.addExtension(options.imageFormats, {
    outputFileExtension: "*",
    compile: async (inputContent, inputPath) => {
      return async () => {
        return;
      };
    },
  });

  eleventyConfig.addGlobalData(
    "eleventyComputed.eleventyExcludeFromCollections",
    () => {
      return (data) => {
        if (
          options.imageFormats.includes(path.extname(data.page.inputPath)) &&
          !path
            .normalize(image.page.filePathStem)
            .split(path.sep)
            .includes(data.comicRoot)
        ) {
          return true;
        }
        return data.eleventyExcludeFromCollections;
      };
    }
  );

  eleventyConfig.addCollection("comics", (collectionApi) => {
    return collectionApi.getAll().filter((item) => {
      return "comicRoot" in item.data;
    });
  });

  eleventyConfig.addFilter("rarebit", function (value) {
    let output = [];
    let genericThumb = "";

    for (let collectionPos = 0; collectionPos < value.length; collectionPos++) {
      const image = value[collectionPos];
      const outputPath = path.normalize(image.page.outputPath).split(path.sep);
      const rootPos = outputPath.indexOf(image.data.comicRoot);
      let pageThumb = "";
      let pageFolder = "";
      let pageExists = false;

      // Images stored in comicRoot become the name of their target folder
      if (outputPath[rootPos + 1] == path.basename(image.page.outputPath)) {
        pageFolder = image.page.fileSlug;
      } else {
        pageFolder = outputPath[rootPos + 1];
      }

      if (
        path.basename(image.page.outputPath).includes(options.thumbnailBaseName)
      ) {
        // We found a thumbnail image; store it so we can update data in a moment
        if (!genericThumb && pageFolder === options.thumbnailBaseName) {
          genericThumb = image.page.inputPath;
        }
        pageThumb = image.page.inputPath;
      }

      // Add on to existing objects
      for (let outputPos = 0; outputPos < output.length; outputPos++) {
        if (output[outputPos].folder === pageFolder) {
          if (pageThumb) {
            output[outputPos] = { ...output[outputPos], thumb: pageThumb };
          } else {
            if (!output[outputPos].images) {
              output[outputPos] = {
                ...output[outputPos],
                images: [image.page.inputPath],
              };
            } else {
              output[outputPos].images.push(image.page.inputPath);
              output[outputPos].images.sort((a, b) => a.localeCompare(b));
            }
            // Todo: Update date to latest time given?
          }
          pageExists = true;
          continue;
        }
      }
      if (pageExists || pageFolder === options.thumbnailBaseName) {
        continue;
      }

      const {
        eleventyComputed,
        eleventy,
        pkg,
        page,
        collections,
        eleventyExcludeFromCollections,
        comicRoot,
        ...filteredData
      } = image.data;

      let pageObj = {
        ...filteredData,
        outputDir: outputPath.slice(0, rootPos).join("/"),
        folder: pageFolder,
        date: image.page.date,
      };

      if (pageThumb) {
        pageObj = { ...pageObj, thumb: pageThumb };
      } else {
        pageObj = { ...pageObj, images: [image.page.inputPath] };
      }

      output.push(pageObj);
    }

    for (let outputPos = 0; outputPos < output.length; outputPos++) {
      if (!output[outputPos].thumb) {
        output[outputPos] = { ...output[outputPos], thumb: genericThumb };
      }
    }

    return output.sort((a, b) =>
      a.folder > b.folder ? 1 : b.folder > a.folder ? -1 : 0
    );
  });

  eleventyConfig.addFilter("chapter", function (value, chapter) {
    return value.filter((obj) => obj.data.comic.chapters.includes(chapter));
  });

  eleventyConfig.addShortcode("renderNav", function (curPage) {
    let output = "";
    let obj;

    if (!curPage) {
      throw new Error(
        `Issue with "renderNav" shortcode in ${this.page.inputPath} (input is undefined.)`
      );
    }

    if (curPage.href) {
      obj = curPage.href;
    } else if (curPage.previous) {
      obj = curPage;
    } else {
      throw new Error(
        `Issue with "renderNav" shortcode in ${this.page.inputPath} (input not a proper pagination object.)`
      );
    }

    // Todo: Include option for images in navigation
    if (this.page.url != obj.first) {
      output = output + `<a href="${obj.first}">First</a> `;
    }
    if (obj.previous != null) {
      output = output + `<a href="${obj.previous}">Previous</a> `;
    }
    if (obj.next != null) {
      output = output + `<a href="${obj.next}">Next</a> `;
    }
    if (this.page.url != obj.last) {
      output = output + `<a href="${obj.last}">Last</a> `;
    }

    return output;
  });

  eleventyConfig.addShortcode("renderComic", function (curPage) {
    let output = "";

    if (!curPage) {
      throw new Error(
        `Issue with "renderComic" shortcode in ${this.page.inputPath} (input is undefined.)`
      );
    }

    for (const image of curPage.images) {
      let imagePath;
      if (!fs.existsSync(path.join(curPage.outputDir, this.page.url))) {
        fs.mkdirSync(path.join(curPage.outputDir, this.page.url), {
          recursive: true,
        });
      }
      fs.copyFile(
        path.join(image), // Input
        path.join(curPage.outputDir, this.page.url, path.basename(image)), // Output
        (err) => {
          if (err) throw err;
        }
      );
      imagePath = path.join(this.page.url, path.basename(image));

      let altText = "";
      if (typeof curPage.alt == "string") {
        altText = curPage.alt;
      } else if (typeof curPage.alt == "object") {
        altText = curPage.alt[curPage.images.indexOf(image)];
      } else {
        console.log(`[eleventy-rarebit] Missing alt text for ${image}.`);
      }

      output = output + options.imageRender(imagePath, altText);
    }
    return output;
  });

  eleventyConfig.addShortcode("renderArchive", function (curPage) {
    if (!curPage) {
      throw new Error(
        `Issue with "renderArchive" shortcode in ${this.page.inputPath} (input is undefined.)`
      );
    }

    // Copy thumbnail to comic folders
    if (!fs.existsSync(path.join(curPage.comic.outputDir, curPage.page.url))) {
      fs.mkdirSync(path.join(curPage.comic.outputDir, curPage.page.url), {
        recursive: true,
      });
    }
    fs.copyFile(
      path.join(curPage.comic.thumb), // Input
      path.join(
        curPage.comic.outputDir,
        curPage.page.url,
        path.basename(curPage.comic.thumb)
      ), // Output
      (err) => {
        if (err) throw err;
      }
    );
    thumbPath = path.join(curPage.page.url, path.basename(curPage.comic.thumb));

    const title = () => {
      if (!curPage.comic.title) {
        return `Page ${path
          .normalize(curPage.page.url)
          .split(path.sep)
          .at(-2)}`;
      } else {
        return curPage.comic.title;
      }
    };

    return options.archiveRender(
      curPage.page.url,
      thumbPath,
      title(),
      curPage.page.date
    );
  });
}

module.exports = rarebit;
