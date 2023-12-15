import { Image, Link, Text, View } from '@react-pdf/renderer'
import parse, { Element } from 'html-react-parser'
import { pdfStyles } from './pdfStyles'
import { Element as DOMElement, isTag, isText } from 'domhandler'
import { ChildNode } from 'domhandler/lib/node'

type ListContext = { type: 'ul' | 'ol'; index: number }
type TextStyleContext = { type: 'strong' | 'em' }
type HtmlContext = {
  listContext?: ListContext
  textStyleContext?: TextStyleContext
}

export const convertHtmlToReactPdf = (html: string) =>
  parse(html, {
    replace: (node) => handleChildNode(node, {})
  })

const renderImage = (element: Element) => {
  const convertToCamelCase = (str: string) =>
    str
      .split('-')
      .map((word, index) => {
        if (index === 0) {
          return word
        }
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join('')

  const extractClassName = (classes: string[], prefix: string): string => {
    const className = classes.find((c) => c.includes(prefix))
    return convertToCamelCase(className?.slice(prefix.length) || '')
  }

  const classList = element.attribs?.class?.split(' ') || []
  const size = extractClassName(classList, 'tiptap-image-size-')
  const alignment = extractClassName(classList, 'tiptap-image-align-')
  const imageClass = [pdfStyles[`${size}ImageSize`] || {}, pdfStyles[`${alignment}ImageAlign`] || {}]

  const src = element.attribs?.src || ''

  return <Image src={src} style={imageClass} />
}

const renderListItem = (element: DOMElement, currentHtmlContext?: HtmlContext) => {
  if (!currentHtmlContext) {
    throw Error('cant render list item outside of list')
  }

  return (
    <View style={pdfStyles.listItem}>
      {element.children.map((childNode) => handleChildNode(childNode, currentHtmlContext))}
    </View>
  )
}

function handleElementNode(element: Element, currentHtmlContext: HtmlContext): JSX.Element {
  const elementName = element.name

  switch (elementName) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
      return (
        <Text style={pdfStyles[elementName]}>
          {element.children.map((childNode) => handleChildNode(childNode, currentHtmlContext))}
        </Text>
      )
    case 'strong':
    case 'em':
    case 'b':
    case 'i':
      const canonicalElementName = elementName === 'strong' || elementName === 'b' ? 'strong' : 'em'

      const isBoldItalic =
        currentHtmlContext.textStyleContext &&
        ((currentHtmlContext.textStyleContext.type === 'strong' && canonicalElementName === 'em') ||
          (currentHtmlContext.textStyleContext.type === 'em' && canonicalElementName === 'strong'))

      const textStyle = isBoldItalic ? pdfStyles.strongEm : pdfStyles[canonicalElementName]

      const contextForChildren: HtmlContext = {
        ...currentHtmlContext,
        textStyleContext: { type: canonicalElementName }
      }

      return (
        <Text style={textStyle}>
          {element.children.map((childNode) => handleChildNode(childNode, contextForChildren))}
        </Text>
      )

    case 'p':
      if (!currentHtmlContext.listContext) {
        return (
          <Text style={pdfStyles.p}>
            {element.children.map((childNode) => handleChildNode(childNode, currentHtmlContext))}
          </Text>
        )
      } else {
        return (
          <Text>
            {currentHtmlContext.listContext.type === 'ol' ? `${currentHtmlContext.listContext.index}. ` : '\u2022 '}
            {element.children.map((childNode) => handleChildNode(childNode, currentHtmlContext))}
          </Text>
        )
      }
    case 'a':
      return (
        <Link src={element.attribs.href} style={pdfStyles.a}>
          {element.children.map((childNode) => handleChildNode(childNode, currentHtmlContext))}
        </Link>
      )
    case 'ul':
    case 'ol':
      return (
        <View style={pdfStyles.list}>
          {element.children.map((childNode, i) =>
            handleChildNode(childNode, {
              listContext: {
                type: elementName,
                index: 1 + i
              }
            })
          )}
        </View>
      )
    case 'li':
      return renderListItem(element, currentHtmlContext)
    case 'blockquote':
      return (
        <View style={pdfStyles.blockquote}>
          {element.children.map((childNode) => handleChildNode(childNode, currentHtmlContext))}
        </View>
      )
    case 'img':
      return renderImage(element)

    default:
      throw Error(`Couldn't handle element type: ${elementName}`)
  }
}

function handleChildNode(node: ChildNode, htmlContext: HtmlContext) {
  if (isText(node)) {
    return <Text>{node.data}</Text>
  } else if (isTag(node)) {
    return handleElementNode(node, htmlContext)
  } else {
    throw Error(`Unknown typeof node: ${node}`)
  }
}
