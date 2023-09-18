import { Editor } from '@tiptap/react'
import { useCallback, useState } from 'react'
import { Icon } from '../../../Icon'
import { Button } from '../../../Button'
import { useTranslation } from 'react-i18next'
import { TipTapAddUrlModal } from '../../../modal/TipTapAddUrlModal'

export const TipTapToolBar = ({ editor, dataTestId }: { editor: Editor; dataTestId?: string }) => {
  const { t } = useTranslation()
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)

  const handleAddUrlAction = (url: string) => {
    if (url !== '' && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }

    // If URL is empty, unset the link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()

    setIsUrlModalOpen(false)
  }

  const addImage = useCallback(() => {
    const url = window.prompt('URL')

    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap border-b border-gray-light bg-gray-bg px-2 py-1">
      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        variant="buttonGhost"
        data-testid={`undo-${dataTestId}`}
        aria-label="undo">
        <Icon name="undo" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        variant="buttonGhost"
        aria-label="redo"
        data-testid={`undo-${dataTestId}`}>
        <Icon name="redo" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        variant="buttonGhost"
        customClass={`${editor.isActive('bold') ? 'bg-gray-active' : ''}`}
        data-testid={`bold-${dataTestId}`}
        aria-label="bold">
        <Icon name="lihavointi" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        variant="buttonGhost"
        customClass={`${editor.isActive('italic') ? 'bg-gray-active' : ''}`}
        data-testid={`italic-${dataTestId}`}
        aria-label="italic">
        <Icon name="kursiivi" color="text-black" />
      </Button>

      <Button
        variant="buttonGhost"
        customClass={`text-xs ${editor.isActive('paragraph') ? 'bg-gray-active' : ''}`}
        onClick={() => editor.chain().focus().setParagraph().run()}
        data-testid={`paragraph-${dataTestId}`}
        aria-label="paragraph">
        <span className="mt-1">{t('editor.leipateksti-nappi')}</span>
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        variant="buttonGhost"
        customClass={editor.isActive('heading', { level: 1 }) ? 'bg-gray-active' : ''}
        data-testid={`heading-1-${dataTestId}`}
        aria-label="heading 1">
        <Icon name="h1" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant="buttonGhost"
        customClass={editor.isActive('heading', { level: 2 }) ? 'bg-gray-active' : ''}
        data-testid={`heading-2-${dataTestId}`}
        aria-label="heading 2">
        <Icon name="h2" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        variant="buttonGhost"
        customClass={editor.isActive('heading', { level: 3 }) ? 'bg-gray-active' : ''}
        data-testid={`heading-3-${dataTestId}`}
        aria-label="heading 3">
        <Icon name="h3" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        variant="buttonGhost"
        customClass={editor.isActive('heading', { level: 4 }) ? 'bg-gray-active' : ''}
        data-testid={`heading-4-${dataTestId}`}
        aria-label="heading 4">
        <Icon name="h4" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant="buttonGhost"
        customClass={editor.isActive('bulletList') ? 'bg-gray-active' : ''}
        data-testid={`bullet-list-${dataTestId}`}
        aria-label="bullet list">
        <Icon name="bulletList" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        variant="buttonGhost"
        customClass={editor.isActive('orderedList') ? 'bg-gray-active' : ''}
        data-testid={`ordered-list-${dataTestId}`}
        aria-label="ordered list">
        <Icon name="orderedList" color="text-black" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        variant="buttonGhost"
        customClass={editor.isActive('blockquote') ? 'bg-gray-active' : ''}
        data-testid={`blockquote-${dataTestId}`}
        aria-label="blockquote">
        <Icon name="blockQuote" color="text-black" />
      </Button>

      <Button
        onClick={() => setIsUrlModalOpen(true)}
        variant="buttonGhost"
        customClass={editor.isActive('link') ? 'bg-gray-active' : ''}
        data-testid={`link-${dataTestId}`}
        aria-label="link">
        <Icon name="link" color="text-black" />
      </Button>
      {/*<Button onClick={addImage} variant="buttonGhost" aria-label="image">*/}
      {/*  <Icon name="kuva" color="text-black" />*/}
      {/*</Button>*/}
      <TipTapAddUrlModal
        modalTitle={t('file.ohje-poista-liite')}
        open={isUrlModalOpen}
        onAddUrlAction={handleAddUrlAction}
        onClose={() => setIsUrlModalOpen(false)}
        dataTestId={`add-url-modal-${dataTestId}`}
        aria-label="add url modal"
      />
    </div>
  )
}
