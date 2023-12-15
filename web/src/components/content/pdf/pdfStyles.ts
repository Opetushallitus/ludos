import { Font, StyleSheet } from '@react-pdf/renderer'
import colors from '../../../colors'
import italic from '../../../../assets/OpenSans-Italic.ttf'
import boldItalic from '../../../../assets/OpenSans-BoldItalic.ttf'

Font.register({
  family: 'Open Sans',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/opensans/v23/mem8YaGs126MiZpBA-UFVZ0e.ttf'
    },
    {
      src: 'https://fonts.gstatic.com/s/opensans/v23/mem5YaGs126MiZpBA-UNirkOUuhs.ttf',
      fontWeight: 400
    },
    {
      src: 'https://fonts.gstatic.com/s/opensans/v23/mem5YaGs126MiZpBA-UN7rgOUuhs.ttf',
      fontWeight: 700
    },
    {
      src: 'https://fonts.gstatic.com/s/opensans/v23/mem5YaGs126MiZpBA-UN8rsOUuhs.ttf',
      fontWeight: 800
    },
    {
      src: italic,
      fontStyle: 'italic'
    },
    {
      src: boldItalic,
      fontStyle: 'italic',
      fontWeight: 700
    }
  ]
})

export const pdfStyles: { [key: string]: any } = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    fontFamily: 'Open Sans',
    fontSize: 12,
    fontWeight: 400,
    marginTop: 10,
    paddingBottom: 40
  },
  section: {
    paddingLeft: 30,
    paddingRight: 30,
    width: '100%'
  },
  title: {
    paddingTop: 15,
    paddingBottom: 15,
    fontSize: 14,
    fontWeight: 600
  },
  instruction: {
    paddingTop: 15,
    paddingBottom: 15,
    borderTop: `1px solid ${colors.graySeparator}`
  },
  content: {
    paddingTop: 15,
    paddingBottom: 15,
    borderTop: `1px solid ${colors.graySeparator}`
  },
  p: {
    paddingTop: 5,
    paddingBottom: 5
  },
  h1: {
    fontSize: 16,
    fontWeight: 600
  },
  h2: {
    fontSize: 14,
    fontWeight: 600
  },
  h3: {
    fontSize: 13,
    fontWeight: 600
  },
  h4: {
    fontWeight: 500
  },
  blockquote: {
    borderLeftWidth: 1,
    borderLeftColor: colors.graySecondary,
    paddingLeft: 10
  },
  list: {
    marginLeft: 8
  },
  listItem: {
    flexDirection: 'column'
  },
  a: {
    color: colors.greenPrimary
  },
  strong: {
    fontWeight: 700
  },
  em: {
    fontStyle: 'italic'
  },
  strongEm: {
    fontStyle: 'italic'
  },
  smallImageSize: {
    width: 300 // approx 25rem
  },
  largeImageSize: {
    width: 768 // approx 64rem
  },
  originalImageSize: {
    width: 350 // approx 29.4rem // todo: get original image size? https://github.com/diegomura/react-pdf/issues/1612
  },
  leftImageAlign: {},
  centerImageAlign: {
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  contentItem: {
    paddingBottom: 10
  },
  contentItemWithBorder: {
    borderTop: `1px solid ${colors.graySeparator}`,
    paddingTop: 10
  }
})
