import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectVersionsCommand,
  PutObjectCommand,
  RestoreObjectCommand,
  S3ServiceException
} from '@aws-sdk/client-s3'
import {
  copy,
  destinationKeyFor,
  discover,
  filterRestorableVersions,
  type ManifestItem,
  manifestKey,
  mergeDiscoveredItems,
  parseRemediationEnv,
  runCommand
} from './remediation.js'

function noSuchKey(): S3ServiceException {
  return new S3ServiceException({
    name: 'NoSuchKey',
    $fault: 'client',
    $metadata: { httpStatusCode: 404 }
  })
}

function commandName(command: unknown): string {
  return command?.constructor?.name ?? ''
}

function manifestItem(overrides: Partial<ManifestItem> = {}): ManifestItem {
  return {
    environment: 'untuva',
    sourceBucket: 'source-bucket',
    sourceKey: 'old.pdf',
    sourceVersionId: 'source-v1',
    sourceLastModified: '2026-04-20T12:00:00.000Z',
    sourceStorageClass: 'GLACIER',
    sourceETag: '"etag"',
    sourceSizeBytes: 123,
    destinationBucket: 'archive-bucket',
    destinationKey: 'objects/source-bucket/old.pdf/source-v1',
    destinationVersionId: null,
    sourceSha256: null,
    destinationSha256: null,
    checksumMatches: null,
    status: 'destination_missing',
    error: 'Destination object does not exist',
    updatedAt: '2026-08-04T00:00:00.000Z',
    ...overrides
  }
}

function manifest(items: ManifestItem[]) {
  return {
    schemaVersion: 1,
    environment: 'untuva',
    generatedAt: '2026-08-04T00:00:00.000Z',
    updatedAt: '2026-08-04T00:00:00.000Z',
    items
  }
}

test('filters only old non-current Glacier Flexible Retrieval versions', () => {
  const versions = filterRestorableVersions(
    'untuva',
    'ludos-application-certificate-bucket-untuva',
    [
      {
        Key: 'old.pdf',
        VersionId: 'v1',
        IsLatest: false,
        LastModified: new Date('2026-04-20T23:59:59.000Z'),
        StorageClass: 'GLACIER',
        ETag: '"source-etag"',
        Size: 123
      },
      {
        Key: 'current.pdf',
        VersionId: 'v2',
        IsLatest: true,
        LastModified: new Date('2026-04-20T12:00:00.000Z'),
        StorageClass: 'GLACIER',
        ETag: '"current-etag"',
        Size: 456
      },
      {
        Key: 'instant.pdf',
        VersionId: 'v3',
        IsLatest: false,
        LastModified: new Date('2026-04-20T12:00:00.000Z'),
        StorageClass: 'GLACIER_IR',
        ETag: '"instant-etag"',
        Size: 789
      },
      {
        Key: 'new.pdf',
        VersionId: 'v4',
        IsLatest: false,
        LastModified: new Date('2026-04-21T00:00:00.000Z'),
        StorageClass: 'GLACIER',
        ETag: '"new-etag"',
        Size: 1
      },
      {
        Key: 'delete-marker.pdf',
        VersionId: 'v5',
        IsLatest: false,
        LastModified: new Date('2026-04-20T12:00:00.000Z'),
        StorageClass: 'GLACIER',
        ETag: '"delete-etag"',
        Size: 1,
        IsDeleteMarker: true
      }
    ],
    new Date('2026-04-21T00:00:00.000Z')
  )

  assert.equal(versions.length, 1)
  assert.equal(versions[0].sourceKey, 'old.pdf')
  assert.equal(versions[0].sourceVersionId, 'v1')
  assert.equal(versions[0].status, 'discovered')
})

test('parses only allowed remediation environments from launcher-provided env', () => {
  assert.equal(parseRemediationEnv({ LUDOS_S3_GLACIER_REMEDIATION_ENV: 'untuva' }), 'untuva')
  assert.equal(parseRemediationEnv({ LUDOS_S3_GLACIER_REMEDIATION_ENV: 'qa' }), 'qa')
  assert.throws(() => parseRemediationEnv({ LUDOS_S3_GLACIER_REMEDIATION_ENV: 'prod' }), /not enabled/)
  assert.throws(() => parseRemediationEnv({}), /missing/)
})

test('uses deterministic archive keys and manifest keys', () => {
  assert.equal(manifestKey('qa'), 'manifests/s3-glacier-remediation-qa.json')
  assert.equal(
    destinationKeyFor('ludos-application-image-bucket-qa', 'folder/file name.pdf', 'version/1'),
    'objects/ludos-application-image-bucket-qa/Zm9sZGVyL2ZpbGUgbmFtZS5wZGY/version%2F1'
  )
})

test('manifest discovery merge keeps completed rows resumable', () => {
  const existing: ManifestItem[] = [
    {
      environment: 'untuva' as const,
      sourceBucket: 'bucket',
      sourceKey: 'a',
      sourceVersionId: 'v1',
      sourceLastModified: '2026-04-20T12:00:00.000Z',
      sourceStorageClass: 'GLACIER',
      sourceETag: '"etag"',
      sourceSizeBytes: 1,
      destinationBucket: 'archive',
      destinationKey: 'objects/bucket/a/v1',
      destinationVersionId: 'dest-v1',
      sourceSha256: 'abc',
      destinationSha256: 'abc',
      checksumMatches: true,
      status: 'verified' as const,
      error: null,
      updatedAt: '2026-08-04T00:00:00.000Z'
    }
  ]
  const discovered: ManifestItem[] = [
    {
      ...existing[0],
      destinationVersionId: null,
      sourceSha256: null,
      destinationSha256: null,
      checksumMatches: null,
      status: 'discovered' as const
    },
    { ...existing[0], sourceVersionId: 'v2', destinationKey: 'objects/bucket/a/v2', status: 'discovered' as const }
  ]

  const merged = mergeDiscoveredItems(existing, discovered, '2026-08-04T12:00:00.000Z')

  assert.equal(merged.length, 2)
  assert.equal(merged[0].sourceVersionId, 'v1')
  assert.equal(merged[0].status, 'verified')
  assert.equal(merged[0].checksumMatches, true)
  assert.equal(merged[1].sourceVersionId, 'v2')
  assert.equal(merged[1].status, 'discovered')
})

test('functional command dispatcher rejects unknown commands', async () => {
  await assert.rejects(() => runCommand('untuva', 'unknown-command', {} as any), /Expected command/)
})

test('functional command dispatcher rejects the ambiguous restore command', async () => {
  await assert.rejects(() => runCommand('untuva', 'restore', {} as any), /Expected command/)
})

test('functional command dispatcher rejects the source Glacier restore request command', async () => {
  await assert.rejects(() => runCommand('untuva', 'request-source-glacier-restore', {} as any), /Expected command/)
})

test('copy requests temporary source Glacier restore when source is not readable yet', async () => {
  let savedManifest: any
  let restoreRequested = false
  const originalConsoleLog = console.log
  console.log = () => {}
  const s3 = {
    async send(command: unknown) {
      switch (commandName(command)) {
        case GetObjectCommand.name:
          return { Body: JSON.stringify(manifest([manifestItem()])) }
        case HeadObjectCommand.name:
          return {}
        case RestoreObjectCommand.name:
          restoreRequested = true
          return {}
        case PutObjectCommand.name:
          assert.ok(command instanceof PutObjectCommand)
          savedManifest = JSON.parse(command.input.Body as string)
          return {}
        default:
          throw new Error(`Unexpected command ${commandName(command)}`)
      }
    }
  }

  try {
    const updated = await copy('untuva', s3 as any)

    assert.equal(restoreRequested, true)
    assert.equal(updated.items[0].status, 'restore_requested')
    assert.equal(savedManifest.items[0].status, 'restore_requested')
  } finally {
    console.log = originalConsoleLog
  }
})

test('discover declares missing destination objects in the manifest', async () => {
  let savedManifest: any
  const originalConsoleLog = console.log
  console.log = () => {}
  const s3 = {
    async send(command: unknown) {
      switch (commandName(command)) {
        case GetObjectCommand.name:
          throw noSuchKey()
        case ListObjectVersionsCommand.name:
          return command instanceof ListObjectVersionsCommand &&
            command.input.Bucket === 'ludos-application-certificate-bucket-untuva'
            ? {
                Versions: [
                  {
                    Key: 'old.pdf',
                    VersionId: 'v1',
                    IsLatest: false,
                    LastModified: new Date('2026-04-20T12:00:00.000Z'),
                    StorageClass: 'GLACIER',
                    ETag: '"source-etag"',
                    Size: 123
                  }
                ]
              }
            : { Versions: [] }
        case HeadObjectCommand.name:
          throw noSuchKey()
        case PutObjectCommand.name:
          assert.ok(command instanceof PutObjectCommand)
          savedManifest = JSON.parse(command.input.Body as string)
          return {}
        default:
          throw new Error(`Unexpected command ${commandName(command)}`)
      }
    }
  }

  try {
    const manifest = await discover('untuva', s3 as any)

    assert.equal(savedManifest.items[0].status, 'destination_missing')
    assert.equal(manifest.items[0].status, 'destination_missing')
    assert.match(manifest.items[0].error ?? '', /Destination object does not exist/)
  } finally {
    console.log = originalConsoleLog
  }
})
