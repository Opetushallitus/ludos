import Blockquote from '@tiptap/extension-blockquote'
import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import Document from '@tiptap/extension-document'
import Heading from '@tiptap/extension-heading'
import History from '@tiptap/extension-history'
import Italic from '@tiptap/extension-italic'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, mergeAttributes, useEditor } from '@tiptap/react'
import LudosImage from './LudosImage'
import { TipTapToolBar } from './TipTapToolBar'
import './tiptapStyles.css'
import { twMerge } from 'tailwind-merge'

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
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'tiptap-link'
    }
  }),
  LudosImage
]

type TipTapProps = {
  content: string | undefined
  onContentChange?: (newContent: string) => void
  editable?: boolean
  label?: string
  fieldError?: boolean
  dataTestId: string
}

export const TipTap = ({
  content,
  onContentChange,
  editable = true,
  label = '',
  fieldError = false,
  dataTestId
}: TipTapProps) => {
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
          <div
            className={twMerge('mt-2 border border-gray-border max-w-[80vw]', fieldError && 'border-red-primary')}
            data-testid={dataTestId}
          >
            <TipTapToolBar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </fieldset>
      ) : (
        <EditorContent editor={editor} data-testid={dataTestId} />
      )}
    </>
  )
}
