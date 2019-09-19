# picosite
Markdown-powered SPAs – really just a very simple way to publish a site.

### Features
- no build step
- no compilation step
- no templating

### Quick Start
Want to see what picosite is? Try this:
```bash
npx picosite -o ~/Desktop/picosite && npx @picosite/serve -i ~/Desktop/picosite
```

## Getting Started
To get started, initialize a picosite somewhere on your computer:
```bash
npx picosite -o path/to/site
```
You can now run this site locally:
```bash
npx @picosite/serve --local -i path/to/site
```
Open your browser to [127.0.0.1:4000](http://127.0.0.1:4000) (or click on the
link in your terminal) to view your site.

### Adding Content
But wait! It's just a loading spinner. You need to add some content.

Define an `index.md` in the root of your project and write some markdown. Your
site should automatically update with your content!

#### Pages
Any other markdown files you create become your routes.
- an `about.md` file becomes `/about` in your browser
- a nested file `/posts/hello-worl.md` becomes `/posts/hello-world`

**Note:** directory roots are not generated automatically. For example, to
create a `/posts` directory listing, create a `posts.md` file, and link to each
of the posts within the directory.

#### Formatting
Markdown is parsed by [marked](https://github.com/markedjs/marked), and supports
HTML tags. This makes it easy to define more complex layouts. Just write vanilla
CSS in the `index.html` file!

`picosite` also parses YAML front matter, which allows you to define page titles
for each of your markdown pages.

### Publishing
When you're ready to publish, push your code up to a public GitHub repository,
and edit the `repo` query string parameter from the `picosite.umd.js` file in
your `index.html`.

For example, to publish `github.com/username/repo`, your script `src` should
look something like this:
```html
.../picosite.umd.js?version=0.5.1&repo=username/repo&theme=default
```

#### Publishing Existing Repo
If you've already got a repo full of markdown files, you can pass the `--repo`
flag to the `picosite` CLI when creating your site. It'll generate that URL for
you.
```bash
npx picosite -o path/to/site --repo username/repo
```

#### Hosting
All you need to do is host the `index.html` file in your root directory
somewhere on the internet, like [Netlify](https://www.netlify.com/) or
[Zeit](https://zeit.co), or even
[Dropbox](https://alexcican.com/post/guide-hosting-website-dropbox-github/).
`picosite` will take care of the rest!

### License
MIT License © [Eric Bailey](https://estrattonbailey.com)
