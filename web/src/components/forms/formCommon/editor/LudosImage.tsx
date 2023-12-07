// noinspection JSUnusedGlobalSymbols

import { NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import './tiptapStyles.css'
import { mergeAttributes, Node } from '@tiptap/core'
import i18n from 'i18next'
import { ImageAlignOption, ImageSizeOption } from '../../../../types'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'

const sizeOptions: ImageSizeOption[] = ['original', 'large', 'small']

const alignOptions: ImageAlignOption[] = ['left', 'center']

const t = i18n.t

function ImageNode({ node, updateAttributes, editor, selected }: NodeViewProps) {
  const { lt, t } = useLudosTranslation()
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
              <legend className="font-semibold">{t('file.label.koko')}</legend>
              <div className="row gap-3 w-full py-1">
                {sizeOptions.map((sizeValue, i) => (
                  <fieldset key={i}>
                    <input
                      type="radio"
                      value={sizeValue}
                      checked={sizeValue === size}
                      onChange={() => setSizeClass(sizeValue)}
                      id={`${sizeValue}-${src}`}
                      data-testid={`image-size-radio-${sizeValue}`}
                      className="mr-1 hover:cursor-pointer"
                    />
                    <label className="hover:cursor-pointer" htmlFor={`${sizeValue}-${src}`}>
                      {lt.tiptapImageSizeOptions[sizeValue]}
                    </label>
                  </fieldset>
                ))}
              </div>
              <legend className="mb-2 font-semibold">{t('file.label.asemointi')}</legend>
              <div className="row gap-5 w-full">
                {alignOptions.map((alignValue, i) => (
                  <fieldset key={i}>
                    <input
                      type="radio"
                      value={alignValue}
                      checked={alignValue === align}
                      onChange={() => setAlignmentClass(alignValue)}
                      id={`${alignValue}-${src}`}
                      data-testid={`image-align-radio-${alignValue}`}
                      className="mr-1 hover:cursor-pointer"
                    />
                    <label className="hover:cursor-pointer" htmlFor={`${alignValue}-${src}`}>
                      {lt.tiptapImageAlignOptions[alignValue]}
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
