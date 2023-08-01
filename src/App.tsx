import {
  createSignal,
  type Component,
  createResource,
  Show,
  Accessor,
} from "solid-js";
import { Editor } from "@tiptap/core";
import { Document } from "@tiptap/extension-document";
import { createTiptapEditor } from "solid-tiptap";
import { Heading } from "@tiptap/extension-heading";
import { Text } from "@tiptap/extension-text";
import { Bold } from "@tiptap/extension-bold";
import { Italic } from "@tiptap/extension-italic";
import { BulletList } from "@tiptap/extension-bullet-list";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { ListItem } from "@tiptap/extension-list-item";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { BubbleMenu } from "@tiptap/extension-bubble-menu";
import { Blockquote } from "@tiptap/extension-blockquote";
import { Code } from "@tiptap/extension-code";
import { CodeBlock } from "@tiptap/extension-code-block";

interface TitleSection {
  id: string;
  title: string;
}

interface ContentSection {
  id: string;
  title: string;
  content: string;
  contentId: string;
}

type Section = TitleSection | ContentSection;

interface SectionMenuProps {
  editor: Editor;
}
const TitleSectionMenu: Component<SectionMenuProps> = ({ editor }) => (
  <>
    <button onClick={() => editor.chain().focus().toggleBold().run()}>
      굵게
    </button>
    <button onClick={() => editor.chain().focus().toggleItalic().run()}>
      기울임
    </button>
    <button onClick={() => editor.chain().focus().toggleSuperscript().run()}>
      위첨자
    </button>
    <button onClick={() => editor.chain().focus().toggleSubscript().run()}>
      아래첨자
    </button>
  </>
);

const ContentSectionMenu: Component<SectionMenuProps> = ({ editor }) => (
  <>
    <button onClick={() => editor.chain().focus().toggleBold().run()}>
      굵게
    </button>
    <button onClick={() => editor.chain().focus().toggleItalic().run()}>
      기울임
    </button>
    <button onClick={() => editor.chain().focus().toggleSuperscript().run()}>
      위첨자
    </button>
    <button onClick={() => editor.chain().focus().toggleSubscript().run()}>
      아래첨자
    </button>
    <button onClick={() => editor.chain().focus().toggleCode().run()}>
      고정폭
    </button>
    <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>
      인용구
    </button>
    <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
      코드 블록
    </button>
    <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
      순서 없는 목록
    </button>
    <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>
      순서 있는 목록
    </button>
  </>
);

const App: Component = () => {
  const [file, setFile] = createSignal<File>(null);
  const [sections] = createResource<Section[], File>(file, async (file) => {
    const text = await file.text();
    const parser = new DOMParser();
    const html = parser.parseFromString(text, "text/html");
    const sections = [];
    for (const section of html.body.children) {
      if (section.tagName !== "SECTION") continue;
      const id = section.id;
      const headline = section.querySelector(".headline");
      const text = section.querySelector(".problem-text");
      if (headline === null || text === null) {
        const title = section.innerHTML;
        sections.push({ id, title });
      } else {
        const title = headline.innerHTML;
        const content = text.innerHTML;
        const contentId = text.id;
        sections.push({ id, title, content, contentId });
      }
    }
    return sections;
  });
  const [editors, setEditors] = createSignal<Map<string, Accessor<Editor>>>(
    new Map()
  );

  const onFileChange = (e: Event & { target: HTMLInputElement }) => {
    const files = e.target.files;
    if (files.length === 0) return;
    setFile(files[0]);
  };

  const problemView = () => {
    const current = sections();
    if (current === undefined) return undefined;
    const editors = new Map();
    const view = current.map((section) => {
      if ("content" in section) {
        let headline!: HTMLDivElement;
        let content!: HTMLDivElement;
        const [headlineMenu, setHeadlineMenu] = createSignal<HTMLElement>();
        const [contentMenu, setContentMenu] = createSignal<HTMLElement>();
        const headlineEditor = createTiptapEditor(() => ({
          element: headline,
          extensions: [
            Document,
            Heading.configure({
              levels: [2],
            }),
            Text,
            BubbleMenu.configure({
              element: headlineMenu(),
            }),
          ],
          content: section.title,
        }));
        editors.set(`${section.id}-headline`, headlineEditor);
        const contentEditor = createTiptapEditor(() => ({
          element: content,
          extensions: [
            Document,
            Heading,
            Text,
            Paragraph,
            BulletList,
            OrderedList,
            Superscript,
            Subscript,
            ListItem,
            Bold,
            Italic,
            BubbleMenu.configure({
              element: contentMenu(),
            }),
            Blockquote,
            Code,
            CodeBlock,
          ],
          content: section.content,
        }));
        editors.set(`${section.id}-content`, contentEditor);
        return (
          <section id={section.id}>
            <nav ref={setHeadlineMenu}>
              <Show when={headlineEditor()} keyed>
                {(editor) => <TitleSectionMenu editor={editor} />}
              </Show>
            </nav>
            <div class="headline" ref={headline} />
            <nav ref={setContentMenu}>
              <Show when={contentEditor()} keyed>
                {(editor) => <ContentSectionMenu editor={editor} />}
              </Show>
            </nav>
            <div id={section.contentId} class="problem-text" ref={content} />
          </section>
        );
      } else {
        let headline!: HTMLDivElement;
        let [menu, setMenu] = createSignal<HTMLElement>();
        const headlineEditor = createTiptapEditor(() => ({
          element: headline,
          extensions: [
            Document,
            Heading.configure({
              levels: [1],
            }),
            Text,
            Superscript,
            Subscript,
            Bold,
            Italic,
            BubbleMenu.configure({
              element: menu(),
            }),
          ],
          content: section.title,
        }));
        editors.set(`${section.id}-headline`, headlineEditor);
        return (
          <section id={section.id}>
            <nav ref={setMenu}>
              <Show when={headlineEditor()} keyed>
                {(editor) => <TitleSectionMenu editor={editor} />}
              </Show>
            </nav>
            <div class="title-headline" ref={headline} />
          </section>
        );
      }
    });
    setEditors(editors);
    return view;
  };

  const fileInput = (
    <input name="file" type="file" accept=".html" onChange={onFileChange} />
  );
  const onExport = () => {
    const current = sections();
    const editor = editors();
    if (current === undefined || editor === undefined) return;
    let html = "";
    for (const section of current) {
      if ("content" in section) {
        const headline = editor.get(`${section.id}-headline`)().getHTML();
        const content = editor.get(`${section.id}-content`)().getHTML();
        html += `<section id="${section.id}">
        <div class="headline">${headline}</div>
        <div id="${section.contentId}" class="problem-text">
        ${content}
        </div>
        </section>\n`;
      } else {
        const headline = editor.get(`${section.id}-headline`)().getHTML();
        html += `<section id="${section.id}">${headline.slice(
          4,
          headline.length - 5
        )}</section>\n`;
      }
    }
    const downAnchor = document.createElement("a");
    downAnchor.style.display = "none";
    downAnchor.href = URL.createObjectURL(
      new Blob([html], { type: "text/html" })
    );
    downAnchor.download = file().name;
    downAnchor.click();
    downAnchor.remove();
  };

  return (
    <div class="container">
      {sections.state === "unresolved" && (
        <h1>파일이 선택되지 않았습니다. 버튼을 눌러 파일을 선택해 주세요.</h1>
      )}
      <div>
        {fileInput}
        {sections.state === "ready" && (
          <button type="button" onClick={onExport}>
            내보내기
          </button>
        )}
      </div>
      {sections.loading && "불러오는 중..."}
      {problemView()}
    </div>
  );
};

export default App;
