import { AssignmentOut, Language } from '../../../types'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from './pdfStyles'
import { convertHtmlToReactPdf } from './HtmlToReactPdf'

type AssignmentPdfProps = {
  title: string
  assignment: AssignmentOut
  teachingLanguage: Language
}

const AssignmentPdf = ({ title, assignment, teachingLanguage }: AssignmentPdfProps) => {
  let content
  try {
    content =
      teachingLanguage === 'FI'
        ? assignment.contentFi.map(convertHtmlToReactPdf)
        : assignment.contentSv.map(convertHtmlToReactPdf)
  } catch (e) {
    if (e instanceof Error) {
      console.error(e)
    }
    return null
  }

  return (
    <Document title={title}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={[pdfStyles.section, pdfStyles.title]}>
          <Text>{title}</Text>
        </View>
        <View style={[pdfStyles.section, pdfStyles.instruction]}>
          <Text>{teachingLanguage === 'FI' ? assignment.instructionFi : assignment.instructionSv}</Text>
        </View>
        <View style={[pdfStyles.section, pdfStyles.content]} wrap>
          {content}
        </View>
      </Page>
    </Document>
  )
}

export default AssignmentPdf
