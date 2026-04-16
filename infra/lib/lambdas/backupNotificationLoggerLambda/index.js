exports.handler = async (event) => {
  console.log('Received backup notification event:', JSON.stringify(event, null, 2))

  for (const record of event.Records ?? []) {
    const message = record.Sns?.Message

    try {
      const parsedMessage = JSON.parse(message)
      console.log('Parsed backup notification message:', JSON.stringify(parsedMessage, null, 2))
    } catch {
      console.log('Backup notification message:', message)
    }
  }
}
