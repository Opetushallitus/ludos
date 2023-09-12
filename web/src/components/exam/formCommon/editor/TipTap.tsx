import { useTranslation } from 'react-i18next'
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

type Levels = 1 | 2 | 3

const classes: Record<Levels, string> = {
  1: 'text-xl',
  2: 'text-sm',
  3: 'text-xs'
}

const extensions = [
  Text,
  Paragraph,
  Document,
  Bold,
  Italic,
  History,
  Heading.configure({ levels: [1, 2, 3] }).extend({
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
      class: 'list-disc ml-6 pl-6'
    },
    keepAttributes: false, // keep the attributes from a previous line after toggling the list either using inputRule or using the button
    keepMarks: true // keep the marks from a previous line after toggling the list either using inputRule or using the button
  }),
  Blockquote.configure({
    HTMLAttributes: {
      class: 'border-l-2 border-gray-300 pl-4'
    }
  }),
  OrderedList.configure({
    itemTypeName: 'listItem',
    keepMarks: true,
    keepAttributes: false,
    HTMLAttributes: {
      class: 'list-decimal ml-6 pl-6'
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
      class: 'text-green-primary underline'
    }
  })
]

export const TipTap = ({
  content,
  onContentChange,
  editable = true,
  labelKey = '',
  dataTestId
}: {
  content: string | undefined
  onContentChange?: (newContent: string) => void
  editable?: boolean
  labelKey?: string
  dataTestId: string
}) => {
  const { t } = useTranslation()
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
          <legend className="font-semibold">{t(labelKey)}</legend>
          <div className="mt-2 border border-gray-border" id="rich-text-editor">
            <TipTapToolBar editor={editor} dataTestId={dataTestId} />
            <EditorContent editor={editor} data-testid={dataTestId} />
          </div>
        </fieldset>
      ) : (
        <EditorContent editor={editor} />
      )}
    </>
  )
}
