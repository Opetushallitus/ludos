import { mergeAttributes, nodeInputRule, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import CustomImageNode from './Image'

export const CustomImageResize = Node.create({
  name: 'customImageResize',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      resizeIcon: <>JLHAJKLDFHASJKLDHJKASHDJKL</>,
      useFigure: false
    }
  },
  addAttributes() {
    return {
      width: {
        default: '100%',
        renderHTML: (attributes) => {
          return {
            width: attributes.width
          }
        }
      },
      height: {
        default: 'auto',
        renderHTML: (attributes) => {
          return {
            height: attributes.height
          }
        }
      },
      isDraggable: {
        default: true,
        renderHTML: (attributes) => {
          return {}
        }
      }
    }
  },
  parseHTML() {
    return [
      {
        tag: 'image-resizer'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['image-resizer', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  // Define your renderHTML and other methods as needed
  // renderHTML({ HTMLAttributes }) { ... },

  // Define your addNodeView method to specify the rendering of the node
  addNodeView() {
    return ReactNodeViewRenderer(CustomImageNode)
  },

  // Define your addInputRules to handle input detection
  addInputRules() {
    return [
      nodeInputRule({
        find: /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)$/,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title, height, width, isDraggable] = match
          return { src, alt, title, height, width, isDraggable }
        }
      })
    ]
  }
})
