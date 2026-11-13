# Publishing

**New post:** on github.com copy `templates/post.md` to `src/content/posts/your-headline.md` (lowercase, hyphens), fill in the fields, set `draft: false`, commit. Live in about a minute.
Fields: `category` = government | participation. `type` = reporting | opinion | explainer. Capitals don't matter.
Images go in `src/content/posts/images/`; `alt` is required.

**If the build fails:** open the red ✗ on the commit (Actions tab). The error names the file and field. The live site stays on the last good version.

**Remove samples:** delete every `sample-*` file in `src/content/posts/`.

**New puzzle edition:** copy an existing file in `src/content/puzzles/`, bump `number`, change the content. Crossfloor grids are 5 rows of 5 (`#` = black square) and every numbered entry needs a clue.
