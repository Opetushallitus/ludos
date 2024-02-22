import { Editor } from '@tiptap/react'
import { useRef, useState } from 'react'
import { Icon } from '../../../Icon'
import { Button } from '../../../Button'
import { useTranslation } from 'react-i18next'
import { TextInputModal } from '../../../modal/TextInputModal'
import { ImageSelector } from './ImageSelector'
import { ImageDtoOut } from '../../../../types'

export const TipTapToolBar = ({ editor }: { editor: Editor }) => {
  const { t } = useTranslation()
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  const handleAddUrlAction = (url: string) => {
    if (url !== '' && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    // If the URL is empty, unset the link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()

    setIsUrlModalOpen(false)
  }

  const handleAddImageAction = (imageDtoOut: ImageDtoOut) => {
    editor.chain().focus().setImage({ src: imageDtoOut.url, alt: '' }).run()
  }

  return (
    <div className="flex flex-wrap border-b border-gray-light bg-gray-bg px-2 py-1">
      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        variant="buttonGhost"
        data-testid="undo"
        aria-label="undo">
        <Icon name="undo" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        variant="buttonGhost"
        aria-label="redo"
        data-testid="redo">
        <Icon name="redo" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        variant="buttonGhost"
        customClass={`${editor.isActive('bold') ? 'bg-gray-active' : ''}`}
        data-testid="bold"
        aria-label="bold">
        <Icon name="lihavointi" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        variant="buttonGhost"
        customClass={`${editor.isActive('italic') ? 'bg-gray-active' : ''}`}
        data-testid="italic"
        aria-label="italic">
        <Icon name="kursiivi" color="text-black" />
      </Button>

      <Button
        variant="buttonGhost"
        customClass={`text-xs ${editor.isActive('paragraph') ? 'bg-gray-active' : ''}`}
        onClick={() => editor.chain().focus().setParagraph().run()}
        data-testid="paragraph"
        aria-label="paragraph">
        <span className="mt-1">{t('editor.leipateksti-nappi')}</span>
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        variant="buttonGhost"
        customClass={editor.isActive('heading', { level: 1 }) ? 'bg-gray-active' : ''}
        data-testid="heading-1"
        aria-label="heading 1">
        <Icon name="h1" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant="buttonGhost"
        customClass={editor.isActive('heading', { level: 2 }) ? 'bg-gray-active' : ''}
        data-testid="heading-2"
        aria-label="heading 2">
        <Icon name="h2" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        variant="buttonGhost"
        customClass={editor.isActive('heading', { level: 3 }) ? 'bg-gray-active' : ''}
        data-testid="heading-3"
        aria-label="heading 3">
        <Icon name="h3" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        variant="buttonGhost"
        customClass={editor.isActive('heading', { level: 4 }) ? 'bg-gray-active' : ''}
        data-testid="heading-4"
        aria-label="heading 4">
        <Icon name="h4" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant="buttonGhost"
        customClass={editor.isActive('bulletList') ? 'bg-gray-active' : ''}
        data-testid="bullet-list"
        aria-label="bullet list">
        <Icon name="bulletList" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        variant="buttonGhost"
        customClass={editor.isActive('orderedList') ? 'bg-gray-active' : ''}
        data-testid="ordered-list"
        aria-label="ordered list">
        <Icon name="orderedList" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        variant="buttonGhost"
        customClass={editor.isActive('blockquote') ? 'bg-gray-active' : ''}
        data-testid="blockquote"
        aria-label="blockquote">
        <Icon name="blockQuote" color="text-black" />
      </Button>

      <Button
        onClick={() => setIsUrlModalOpen(true)}
        variant="buttonGhost"
        customClass={editor.isActive('link') ? 'bg-gray-active' : ''}
        data-testid="link"
        aria-label="link">
        <Icon name="link" color="text-black" />
      </Button>
      {isUrlModalOpen && (
        <TextInputModal
          modalTitle={t('tiptap.modal.lisaa-url')}
          inputLabel={t('form.lisaa-url')}
          onAddText={handleAddUrlAction}
          onClose={() => setIsUrlModalOpen(false)}
          dataTestId="add-url-modal"
          aria-label="add url modal"
        />
      )}
      <Button
        onClick={() => imageFileInputRef.current?.click()}
        variant="buttonGhost"
        data-testid="add-image"
        aria-label="image">
        <Icon name="kuva" color="text-black" />
      </Button>
      <ImageSelector onImageUploaded={handleAddImageAction} imageFileInputRef={imageFileInputRef} />
    </div>
  )
}
