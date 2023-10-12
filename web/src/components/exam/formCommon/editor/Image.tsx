/*
import Image from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import styles from './ImageStyles.module.css'

function ImageNode(props: any) {
  const { src, alt } = props.node.attrs
  const { updateAttributes } = props

  let className = styles.image
  if (props.selected) {
    className += ` ${styles['ProseMirror-selectednode']}`
  }

  const onEditAlt = () => {
    const newAlt = prompt('Set alt text:', alt || '')
    updateAttributes({ alt: newAlt })
  }

  return (
    <NodeViewWrapper className={className} data-drag-handle>
      <img src={src} alt={alt} />
      <span className={styles['alt-text-indicator']}>
        {alt ? (
          <span className={`${styles.symbol} ${styles['symbol-positive']}`}>✔</span>
        ) : (
          <span className={`${styles.symbol} ${styles['symbol-negative']}`}>!</span>
        )}
        {alt ? (
          <span className={styles.text}>Alt teksti: "{alt}".</span>
        ) : (
          <span className={styles.text}>Alt teksti puuttuu.</span>
        )}
        <button className={styles.edit} type="button" onClick={onEditAlt}>
          Muokkaa
        </button>
      </span>
    </NodeViewWrapper>
  )
}

export default Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNode)
  }
})
*/
