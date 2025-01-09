import { AssignmentOut, Exam, Language } from '../../../types'
import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from './pdfStyles'
import { convertHtmlToReactPdf } from './HtmlToReactPdf'
import logo from '../../../../assets/oph_fin_vaaka.png'
import { Features } from '../../../request'
import { getInstructionToShow } from '../AssignmentContent'

type AssignmentPdfProps = {
  title: string
  assignment: AssignmentOut
  teachingLanguage: Language
  features: Features
}

const convertContentAndInstructionToReactPdf = (
  assignment: AssignmentOut,
  language: Language,
  features: Features
) => {
  try {
    const { contentFi, contentSv, instructionFi, instructionSv } = assignment
    const content = language === Language.FI ? contentFi : contentSv
    const instruction = getInstructionToShow(assignment, language, features)  ? instructionFi : instructionSv

    return { content: content.map(convertHtmlToReactPdf), instruction: convertHtmlToReactPdf(instruction) }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e)
    }

    return null
  }
}

const AssignmentPdf = ({ title, assignment, teachingLanguage, features }: AssignmentPdfProps) => {
  const reactHtmlContent = convertContentAndInstructionToReactPdf(assignment, teachingLanguage, features)

  if (!reactHtmlContent) {
    return null
  }

  return (
    <Document title={title}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={[pdfStyles.section, pdfStyles.title]}>
          <Text>{title}</Text>
        </View>
        <View style={[pdfStyles.section, pdfStyles.content]} wrap>
          {reactHtmlContent.instruction}
        </View>
        <View style={[pdfStyles.section, pdfStyles.content]} wrap>
          {reactHtmlContent.content}
        </View>
        <View style={[pdfStyles.section, pdfStyles.footerImage]}>
          <Image src={logo} />
        </View>
      </Page>
    </Document>
  )
}

export default AssignmentPdf
