// noinspection JSUnusedGlobalSymbols

import { NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import './tiptapStyles.css'
import { mergeAttributes, Node } from '@tiptap/core'
import i18n from 'i18next'
import { ImageAlignOption, ImageSizeOption } from '../../../../types'

const sizeOptions: { label: string; value: ImageSizeOption }[] = [
  { label: 'file.koko.alkuperainen', value: 'original' },
  { label: 'file.koko.suuri', value: 'large' },
  { label: 'file.koko.pieni', value: 'small' }
]

const alignOptions: { label: string; value: ImageAlignOption }[] = [
  { label: 'file.asemointi.ei-mitaan', value: 'left' },
  { label: 'file.asemointi.keskitetty', value: 'center' }
]

const t = i18n.t

function ImageNode({ node, updateAttributes, editor, selected }: NodeViewProps) {
  const { t } = useTranslation()
  const { src, alt, class: imgClass } = node.attrs
  const [align, setAlign] = useState<ImageAlignOption>(getAlign)
  const [size, setSize] = useState<ImageSizeOption>(getSize)

  function getAlign(): ImageAlignOption {
    const currentAlign = imgClass.split(' ').find((c: string | string[]) => c.includes('tiptap-image-align-'))
    if (!currentAlign) {
      return 'left'
    }

    return currentAlign.split('-')[3]
  }

  function getSize(): ImageSizeOption {
    const currentSize = imgClass.split(' ').find((c: string | string[]) => c.includes('tiptap-image-size-'))

    if (!currentSize) {
      return 'original'
    }

    return currentSize.split('-')[3]
  }

  const setAlignmentClass = (newAlign: ImageAlignOption) => {
    setAlign(newAlign)
    updateAttributes({ class: `tiptap-image-size-${size} tiptap-image-align-${newAlign}` })
  }
  const setSizeClass = (newSize: ImageSizeOption) => {
    setSize(newSize)
    updateAttributes({ class: `tiptap-image-size-${newSize} tiptap-image-align-${align}` })
  }

  const isEditable = editor.view.editable

  return (
    <>
      <NodeViewWrapper className="w-full" data-drag-handle data-alt={alt}>
        <img className={twMerge(imgClass, isEditable && selected && 'border-2 border-red-light')} src={src} alt={alt} />
        {isEditable && (
          <div className="text-white pl-2 text-xs w-full py-2 bg-black/75">
            <div className="row w-full flex-wrap">
              <label className="font-semibold" htmlFor={`alt-${src}`}>
                {t('file.vaihtoehtoinen-teksti')} <span className="ml-1 text-green-light">*</span>
              </label>
              <div className="row w-full py-1">
                <input
                  id={`alt-${src}`}
                  className="w-1/2 text-black pl-1"
                  type="text"
                  value={alt}
                  onChange={(e) => updateAttributes({ alt: e.target.value })}
                  data-testid="image-alt-input"
                />
              </div>
              <legend className="font-semibold">{t('file.koko')}</legend>
              <div className="row gap-3 w-full py-1">
                {sizeOptions.map(({ value, label }, i) => (
                  <fieldset key={i}>
                    <input
                      type="radio"
                      value={value}
                      checked={value === size}
                      onChange={() => setSizeClass(value)}
                      id={`${value}-${src}`}
                      data-testid={`image-size-radio-${value}`}
                      className="mr-1 hover:cursor-pointer"
                    />
                    <label className="hover:cursor-pointer" htmlFor={`${value}-${src}`}>
                      {label}
                    </label>
                  </fieldset>
                ))}
              </div>
              <legend className="mb-2 font-semibold">{t('file.asemointi')}</legend>
              <div className="row gap-5 w-full">
                {alignOptions.map(({ value, label }, i) => (
                  <fieldset key={i}>
                    <input
                      type="radio"
                      value={value}
                      checked={value === align}
                      onChange={() => setAlignmentClass(value)}
                      id={`${value}-${src}`}
                      data-testid={`image-align-radio-${value}`}
                      className="mr-1 hover:cursor-pointer"
                    />
                    <label className="hover:cursor-pointer" htmlFor={`${value}-${src}`}>
                      {label}
                    </label>
                  </fieldset>
                ))}
              </div>
            </div>
          </div>
        )}
      </NodeViewWrapper>
    </>
  )
}

interface LudosImageOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  // noinspection JSUnusedGlobalSymbols
  interface Commands<ReturnType> {
    image: {
      setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType
    }
  }
}

// perustuu @tiptap/extension-image:een
export default Node.create<LudosImageOptions>({
  name: 'image',

  addNodeView() {
    return ReactNodeViewRenderer(ImageNode)
  },
  addOptions() {
    return {
      HTMLAttributes: {}
    }
  },

  inline() {
    return false
  },

  group() {
    return 'block'
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null
      },
      alt: {
        default: null
      },
      class: {
        default: 'tiptap-image-size-original tiptap-image-align-left'
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img',
        getAttrs: (node: string | HTMLElement) => {
          // Nimestään huolimatta getAttrs päättää, hyväksytäänkö kuva
          if (typeof node === 'string') {
            return false
          }
          const src = node.getAttribute('src')
          if (!src || !src.startsWith('/')) {
            // Hyväksytään vain oman juuren alla asuvat kuvat
            // Tämä estää kuvan pasteamisen ja drag&dropin
            this.editor &&
              this.editor.chain().focus().setParagraph().insertContent(t('error.ei-tuettu-kuvalisays')).run()
            return false
          }
          return null
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options
          })
        }
    }
  }
})
