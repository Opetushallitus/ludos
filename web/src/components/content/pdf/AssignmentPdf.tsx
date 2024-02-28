import { AssignmentOut, Language } from '../../../types'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from './pdfStyles'
import { convertHtmlToReactPdf } from './HtmlToReactPdf'

type AssignmentPdfProps = {
  title: string
  assignment: AssignmentOut
  teachingLanguage: Language
}

const convertContentAndInstructionToReactPdf = (
  { contentFi, contentSv, instructionFi, instructionSv }: AssignmentOut,
  language: Language
) => {
  try {
    const content = language === Language.FI ? contentFi : contentSv
    const instruction = language === Language.FI ? instructionFi : instructionSv

    return { content: content.map(convertHtmlToReactPdf), instruction: convertHtmlToReactPdf(instruction) }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e)
    }

    return null
  }
}

const AssignmentPdf = ({ title, assignment, teachingLanguage }: AssignmentPdfProps) => {
  const reactHtmlContent = convertContentAndInstructionToReactPdf(assignment, teachingLanguage)

  if (!reactHtmlContent) {
    return null
  }

  return (
    <Document title={title}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={[pdfStyles.section, pdfStyles.title]}>
          <Text>{title}</Text>
        </View>
        <View style={[pdfStyles.section, pdfStyles.content]}>{reactHtmlContent.instruction}</View>
        <View style={[pdfStyles.section, pdfStyles.content]} wrap>
          {reactHtmlContent.content}
        </View>
      </Page>
    </Document>
  )
}

export default AssignmentPdf
