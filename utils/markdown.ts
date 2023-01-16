import MarkdownIt from "markdown-it"
// @ts-ignore
import NamedHeadings from "markdown-it-named-headings"

const md = new MarkdownIt().use(NamedHeadings)

export function renderMarkdown(markdown: string): string {
    return md.render(markdown)
}