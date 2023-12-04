import { Children, isValidElement, ReactNode } from 'react'

export function formatJSXElement(element: ReactNode, depth = 0): string {
  if (element === null || element === undefined) {
    throw Error('no element')
  }

  const indent = '  '.repeat(depth)

  if (typeof element === 'string' || typeof element === 'number') {
    return `${indent}${element}\n`
  }

  function formatValidElement(element: ReactNode) {
    if (!isValidElement(element)) {
      throw Error('invalid element')
    }

    const type = element.type
    const props = element.props
    const children = Children.toArray(props.children)
      .map((child) => formatJSXElement(child, depth + 1))
      .join('')

    const propString = Object.keys(props)
      .filter((key) => key !== 'children')
      .map((key) => `${key}=${JSON.stringify(props[key])}`)
      .join(' ')

    return `${indent}<${type} ${propString}>\n${children}${indent}</${type}>\n`
  }

  if (isValidElement(element)) {
    return formatValidElement(element)
  } else if (Array.isArray(element)) {
    return element.filter(isValidElement).map(formatValidElement).join('\n')
  } else {
    throw Error('is not valid element nor array')
  }
}
