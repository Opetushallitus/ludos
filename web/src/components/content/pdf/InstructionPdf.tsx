import { InstructionDtoOut, TeachingLanguage } from '../../../types'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from './pdfStyles'
import { isSukoOrPuhviInstruction } from '../../../utils/instructionUtils'
import { convertHtmlToReactPdf } from './HtmlToReactPdf'

type InstructionPdfProps = {
  title: string
  instruction: InstructionDtoOut
  teachingLanguage: TeachingLanguage
}

const InstructionPdf = ({ title, instruction, teachingLanguage }: InstructionPdfProps) => {
  let content
  try {
    content =
      teachingLanguage === 'fi'
        ? convertHtmlToReactPdf(instruction.contentFi)
        : convertHtmlToReactPdf(instruction.contentSv)
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
        {isSukoOrPuhviInstruction(instruction) && (
          <View style={[pdfStyles.section, pdfStyles.instruction]}>
            <Text>{teachingLanguage === 'fi' ? instruction.shortDescriptionFi : instruction.shortDescriptionSv}</Text>
          </View>
        )}
        <View style={[pdfStyles.section, pdfStyles.content]} wrap>
          {content}
        </View>
      </Page>
    </Document>
  )
}

export default InstructionPdf
