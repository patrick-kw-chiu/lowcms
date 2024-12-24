[LowCMS](https://patrick-kw-chiu.github.io/lowcms/databases) is an instant CMS layer on top of your local JSON files. With built-in support for [JSON Schema](https://json-schema.org/), it lets you manage and edit structured content effortlessly — no need to touch an IDE or text editor!

## 5-steps Demo

## Features

- **Rich and Safer Editing Experience** 🤹🏻
  - Constructs JSON Schemas from your JSON files and safeguards your editing experience
  - Enums support for `string` and `array of strings` field
  - Editing and Sorting of nested data structure `array of objects`
  - (Coming soon) `ID` field
  - (Coming soon) `relationship` field
  - ...and more!
- **Content Filtering** 🔎
  - Filter your content with data-type-specific operators that translate to [MongoDB-like query selectors](https://www.mongodb.com/docs/manual/reference/operator/query/#query-selectors)
  - (Coming soon) Freehand MongoDB-like query
- **Browser-full** 💻 - Thanks to the [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), LowCMS reads and writes content to your authorized directory all from the browser. No software installation.
- **Privacy** 🔏 - No Data is sent to a server. In fact, we don't have a backend server - literally serverless!
