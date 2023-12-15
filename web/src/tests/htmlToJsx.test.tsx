import { describe, expect, it } from 'vitest'
import { convertHtmlToReactPdf } from '../components/content/pdf/HtmlToReactPdf'
import { Image, Link, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from '../components/content/pdf/pdfStyles'
import { formatJSXElement } from './formatJsxElement'

describe('Test html conversion to JSX', () => {
  it('h1 renders', () => {
    const expectedJsx = (
      <Text style={pdfStyles.h1}>
        <Text>h1</Text>
      </Text>
    )
    const jsx = convertHtmlToReactPdf('<h1 class="tiptap-text-h1">h1</h1>')

    expect(formatJSXElement(jsx)).toEqual(formatJSXElement(expectedJsx))
  })

  it('paragraph with bold renders', () => {
    const expectedJsx = (
      <Text style={pdfStyles.p}>
        <Text>paragraph</Text>
        <Text style={pdfStyles.strong}>
          <Text>strong</Text>
        </Text>
        <Text style={pdfStyles.em}>
          <Text>italic</Text>
        </Text>
        <Text>paragraph</Text>
      </Text>
    )
    const jsx = convertHtmlToReactPdf('<p>paragraph<strong>strong</strong><em>italic</em>paragraph</p>')

    expect(formatJSXElement(jsx)).toEqual(formatJSXElement(expectedJsx))
  })

  it('string without html tags renders', () => {
    const expectedJsx = <Text>hello world</Text>
    const jsx = convertHtmlToReactPdf('hello world')

    expect(formatJSXElement(jsx)).toEqual(formatJSXElement(expectedJsx))
  })

  it('various HTML elements render', () => {
    const inputHtml = `
             <h1 class='tiptap-text-h1'>h1</h1>
             <h2 class='tiptap-text-h2'>h2</h2>
             <h3 class='tiptap-text-h3'>h3</h3>
             <h4 class='tiptap-text-h4'>h4</h4>
             <ul class='tiptap-bullet-list'><li><p>ul li 1</p></li><li><p>ul li 2</p></li></ul>
             <ol class='tiptap-bullet-list'><li><p>ol li 1</p></li><li><p>ol li 2</p></li></ol>
             <blockquote class='tiptap-blockquote'><p>blockquote</p></blockquote>
             <p><a target='_blank' rel='noopener noreferrer nofollow' class='tiptap-link' href='https://oph.fi'>oph.fi</a></p>
             <img src='/api/image' alt='test image' class='tiptap-image-size-original tiptap-image-align-center'>
          `.replace(/\s*\n\s*/g, '')

    const jsx = convertHtmlToReactPdf(inputHtml)

    const expectedJsx = [
      <Text style={pdfStyles.h1}>
        <Text>h1</Text>
      </Text>,
      <Text style={pdfStyles.h2}>
        <Text>h2</Text>
      </Text>,
      <Text style={pdfStyles.h3}>
        <Text>h3</Text>
      </Text>,
      <Text style={pdfStyles.h4}>
        <Text>h4</Text>
      </Text>,
      <View style={pdfStyles.list}>
        <View style={pdfStyles.listItem}>
          <Text>
            • <Text>ul li 1</Text>
          </Text>
        </View>
        <View style={pdfStyles.listItem}>
          <Text>
            • <Text>ul li 2</Text>
          </Text>
        </View>
      </View>,
      <View style={pdfStyles.list}>
        <View style={pdfStyles.listItem}>
          <Text>
            1. <Text>ol li 1</Text>
          </Text>
        </View>
        <View style={pdfStyles.listItem}>
          <Text>
            2. <Text>ol li 2</Text>
          </Text>
        </View>
      </View>,
      <View style={pdfStyles.blockquote}>
        <Text style={pdfStyles.p}>
          <Text>blockquote</Text>
        </Text>
      </View>,
      <Text style={pdfStyles.p}>
        <Link src="https://oph.fi" style={pdfStyles.a}>
          <Text>oph.fi</Text>
        </Link>
      </Text>,
      <Image src="/api/image" style={[pdfStyles.originalImageSize, pdfStyles.centerImageAlign]}></Image>
    ]

    expect(formatJSXElement(jsx)).toStrictEqual(formatJSXElement(expectedJsx))
  })

  it('renders nested lists', () => {
    const inputHtml = `
        <ul class='tiptap-bullet-list'>
          <li>
            <p>ul li 1</p>
            <ol class='tiptap-numbered-list'>
              <li>
                <p>ol li 1</p>
              </li>
              <ol class='tiptap-numbered-list'>
                <li>
                  <p>ol li 1</p>
                </li>
              </ol>
            </ol>
          </li>
        </ul>`.replace(/\s*\n\s*/g, '')

    const jsx = convertHtmlToReactPdf(inputHtml)

    const expectedJsx = (
      <View style={pdfStyles.list}>
        <View style={pdfStyles.listItem}>
          <Text>
            • <Text>ul li 1</Text>
          </Text>
          <View style={pdfStyles.list}>
            <View style={pdfStyles.listItem}>
              <Text>
                1. <Text>ol li 1</Text>
              </Text>
            </View>
            <View style={pdfStyles.list}>
              <View style={pdfStyles.listItem}>
                <Text>
                  1. <Text>ol li 1</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    )

    expect(formatJSXElement(jsx)).toStrictEqual(formatJSXElement(expectedJsx))
  })

  it('converts complex assignment content HTML elements correctly to jsx', () => {
    const inputHtml = `
      <h1 class='tiptap-text-h1'>Assignment Title</h1>
      <p class='tiptap-paragraph'>This is an <strong>important</strong> assignment with various <em>text stylings</em>.</p>
      <ul class='tiptap-bullet-list'>
        <li><p>First bullet point</p></li>
        <li><p>Second bullet point with a <a href='https://example.com'>link</a></p></li>
      </ul>
      <p class='tiptap-paragraph'>Here is an image:</p>
      <img src='/path/to/image.jpg' alt='Descriptive Image' class='tiptap-image-size-original tiptap-image-align-center'>
      <blockquote class='tiptap-blockquote'>
        <h1>Quote header</h1>
        <p>A meaningful quote.</p>
        <p>A meaningful quote with a strong <strong>message</strong>.</p>
              <ul class='tiptap-bullet-list'>
        <li><p>First bullet point</p></li>
        <li><p>Second bullet point with a <a href='https://example.com'>link</a></p></li>
      </ul>
      </blockquote>
    `.replace(/\s*\n\s*/g, '')

    const jsx = convertHtmlToReactPdf(inputHtml)

    const expectedJsx = [
      <Text style={pdfStyles.h1}>
        <Text>Assignment Title</Text>
      </Text>,
      <Text style={pdfStyles.p}>
        <Text>This is an </Text>
        <Text style={pdfStyles.strong}>
          <Text>important</Text>
        </Text>
        <Text> assignment with various </Text>
        <Text style={pdfStyles.em}>
          <Text>text stylings</Text>
        </Text>
        <Text>.</Text>
      </Text>,
      <View style={pdfStyles.list} key="ul">
        <View style={pdfStyles.listItem}>
          <Text>
            • <Text>First bullet point</Text>
          </Text>
        </View>
        <View style={pdfStyles.listItem}>
          <Text>
            • <Text>Second bullet point with a </Text>
            <Link src="https://example.com" style={pdfStyles.a}>
              <Text>link</Text>
            </Link>
          </Text>
        </View>
      </View>,
      <Text style={pdfStyles.p} key="p2">
        <Text>Here is an image:</Text>
      </Text>,
      <Image src="/path/to/image.jpg" style={[pdfStyles.originalImageSize, pdfStyles.centerImageAlign]} key="img" />,
      <View style={pdfStyles.blockquote} key="blockquote">
        <Text style={pdfStyles.h1}>
          <Text>Quote header</Text>
        </Text>
        <Text style={pdfStyles.p}>
          <Text>A meaningful quote.</Text>
        </Text>
        <Text style={pdfStyles.p}>
          <Text>A meaningful quote with a strong </Text>
          <Text style={pdfStyles.strong}>
            <Text>message</Text>
          </Text>
          <Text>.</Text>
        </Text>
        <View style={pdfStyles.list} key="ul">
          <View style={pdfStyles.listItem}>
            <Text>
              • <Text>First bullet point</Text>
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text>
              • <Text>Second bullet point with a </Text>
              <Link src="https://example.com" style={pdfStyles.a}>
                <Text>link</Text>
              </Link>
            </Text>
          </View>
        </View>
      </View>
    ]

    expect(formatJSXElement(jsx)).toStrictEqual(formatJSXElement(expectedJsx))
  })

  it('strong italic renders', () => {
    const inputHtml = '<p><em>foo </em><strong><em>bar</em></strong><em> baz</em><em><strong>bar</strong></em></p>'
    const jsx = convertHtmlToReactPdf(inputHtml)

    const expectedJsx = (
      <Text style={pdfStyles.p}>
        <Text style={pdfStyles.em}>
          <Text>foo </Text>
        </Text>
        <Text style={pdfStyles.strong}>
          <Text style={pdfStyles.em}>
            <Text>bar</Text>
          </Text>
        </Text>
        <Text style={pdfStyles.em}>
          <Text> baz</Text>
        </Text>
        <Text style={pdfStyles.em}>
          {/* FIXME: should be strong? */}
          <Text style={pdfStyles.em}>
            <Text>bar</Text>
          </Text>
        </Text>
      </Text>
    )

    expect(formatJSXElement(jsx)).toStrictEqual(formatJSXElement(expectedJsx))
  })

  it('b and i elements render', () => {
    const inputHtml = '<p><i>foo</i><b>bar</b></p>'
    const jsx = convertHtmlToReactPdf(inputHtml)

    const expectedJsx = (
      <Text style={pdfStyles.p}>
        <Text style={pdfStyles.em}>
          <Text>foo</Text>
        </Text>
        <Text style={pdfStyles.strong}>
          <Text>bar</Text>
        </Text>
      </Text>
    )

    expect(formatJSXElement(jsx)).toStrictEqual(formatJSXElement(expectedJsx))
  })
})
