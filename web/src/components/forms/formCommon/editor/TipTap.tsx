import { EditorContent, mergeAttributes, useEditor } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import Link from '@tiptap/extension-link'
import BulletList from '@tiptap/extension-bullet-list'
import Blockquote from '@tiptap/extension-blockquote'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import History from '@tiptap/extension-history'
import { TipTapToolBar } from './TipTapToolBar'
import './styles.css'

type Levels = 1 | 2 | 3 | 4

const classes: Record<Levels, string> = {
  1: 'tiptap-text-h1',
  2: 'tiptap-text-h2',
  3: 'tiptap-text-h3',
  4: 'tiptap-text-h4'
}

const extensions = [
  Text,
  Paragraph,
  Document,
  Bold,
  Italic,
  History,
  Heading.configure({ levels: [1, 2, 3, 4] }).extend({
    renderHTML({ node, HTMLAttributes }) {
      const hasLevel = this.options.levels.includes(node.attrs.level)
      const level: Levels = hasLevel ? node.attrs.level : this.options.levels[0]

      return [
        `h${level}`,
        mergeAttributes(HTMLAttributes, {
          class: `${classes[level]}`
        }),
        0
      ]
    }
  }),
  BulletList.configure({
    itemTypeName: 'listItem',
    HTMLAttributes: {
      class: 'tiptap-bullet-list'
    },
    keepAttributes: false, // keep the attributes from a previous line after toggling the list either using inputRule or using the button
    keepMarks: true // keep the marks from a previous line after toggling the list either using inputRule or using the button
  }),
  Blockquote.configure({
    HTMLAttributes: {
      class: 'tiptap-blockquote'
    }
  }),
  OrderedList.configure({
    itemTypeName: 'listItem',
    keepMarks: true,
    keepAttributes: false,
    HTMLAttributes: {
      class: 'tiptap-numbered-list'
    }
  }),
  ListItem,
  // Image.configure({
  //   inline: true,
  //   HTMLAttributes: {
  //     class: 'h-[20rem]'
  //   }
  // }),
  // CustomImageResize.configure({
  //   inline: true
  // }),
  // CustomImage,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'tiptap-link'
    }
  })
]

export const TipTap = ({
  content,
  onContentChange,
  editable = true,
  label = '',
  dataTestId
}: {
  content: string | undefined
  onContentChange?: (newContent: string) => void
  editable?: boolean
  label?: string
  dataTestId: string
}) => {
  const editor = useEditor({
    editable,
    extensions,
    content,
    onUpdate({ editor }) {
      onContentChange && onContentChange(editor.getHTML())
    }
  })

  if (!editor) {
    return null
  }

  return (
    <>
      {editable ? (
        <fieldset className="mt-6">
          <legend className="font-semibold">{label}</legend>
          <div className="mt-2 border border-gray-border">
            <TipTapToolBar editor={editor} dataTestId={dataTestId} />
            <EditorContent editor={editor} data-testid={dataTestId} />
          </div>
        </fieldset>
      ) : (
        <EditorContent editor={editor} data-testid={dataTestId} />
      )}
    </>
  )
}
