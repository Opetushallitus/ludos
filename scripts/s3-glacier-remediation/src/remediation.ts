import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectVersionsCommand,
  PutObjectCommand,
  RestoreObjectCommand,
  S3Client,
  S3ServiceException
} from '@aws-sdk/client-s3'
import { createHash } from 'node:crypto'
import { createReadStream, promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

export type RemediationEnv = 'untuva' | 'qa'

export type ManifestItemStatus =
  | 'discovered'
  | 'destination_missing'
  | 'restore_requested'
  | 'restore_available'
  | 'copied'
  | 'verified'
  | 'restore_failed'
  | 'copy_failed'
  | 'checksum_mismatch'

export type ManifestItem = {
  environment: RemediationEnv
  sourceBucket: string
  sourceKey: string
  sourceVersionId: string
  sourceLastModified: string
  sourceStorageClass: 'GLACIER'
  sourceETag: string | null
  sourceSizeBytes: number | null
  destinationBucket: string
  destinationKey: string
  destinationVersionId: string | null
  sourceSha256: string | null
  destinationSha256: string | null
  checksumMatches: boolean | null
  status: ManifestItemStatus
  error: string | null
  updatedAt: string
}

type Manifest = {
  schemaVersion: 1
  environment: RemediationEnv
  generatedAt: string
  updatedAt: string
  items: ManifestItem[]
}

export type S3VersionLike = {
  Key?: string
  VersionId?: string
  IsLatest?: boolean
  LastModified?: Date
  StorageClass?: string
  ETag?: string
  Size?: number
  IsDeleteMarker?: boolean
}

const cutoffDate = new Date('2026-04-21T00:00:00.000Z')
const region = 'eu-west-1'

export function parseRemediationEnv(env: NodeJS.ProcessEnv): RemediationEnv {
  const value = env.LUDOS_S3_GLACIER_REMEDIATION_ENV
  if (!value) {
    throw new Error('LUDOS_S3_GLACIER_REMEDIATION_ENV is missing')
  }
  if (value === 'prod') {
    throw new Error('Production S3 Glacier remediation is not enabled yet')
  }
  if (value !== 'untuva' && value !== 'qa') {
    throw new Error(`Unsupported S3 Glacier remediation environment '${value}'`)
  }
  return value
}

export function sourceBucketsFor(env: RemediationEnv): string[] {
  return ['certificate', 'image', 'instruction'].map((bucketId) => `ludos-application-${bucketId}-bucket-${env}`)
}

export function archiveBucketFor(env: RemediationEnv): string {
  return `ludos-application-glacier-remediation-archive-${env}`
}

export function manifestKey(env: RemediationEnv): string {
  return `manifests/s3-glacier-remediation-${env}.json`
}

export function destinationKeyFor(sourceBucket: string, sourceKey: string, sourceVersionId: string): string {
  const encodedSourceKey = Buffer.from(sourceKey, 'utf8').toString('base64url')
  return `objects/${sourceBucket}/${encodedSourceKey}/${encodeURIComponent(sourceVersionId)}`
}

function manifestIdentity(item: Pick<ManifestItem, 'sourceBucket' | 'sourceKey' | 'sourceVersionId'>): string {
  return `${item.sourceBucket}\u0000${item.sourceKey}\u0000${item.sourceVersionId}`
}

export function filterRestorableVersions(
  environment: RemediationEnv,
  sourceBucket: string,
  versions: S3VersionLike[],
  olderThan: Date = cutoffDate,
  now: string = new Date().toISOString()
): ManifestItem[] {
  const destinationBucket = archiveBucketFor(environment)

  return versions
    .filter(
      (version) =>
        !version.IsDeleteMarker &&
        version.IsLatest === false &&
        version.StorageClass === 'GLACIER' &&
        version.LastModified !== undefined &&
        version.LastModified.getTime() < olderThan.getTime() &&
        version.Key !== undefined &&
        version.VersionId !== undefined
    )
    .map((version) => ({
      environment,
      sourceBucket,
      sourceKey: version.Key!,
      sourceVersionId: version.VersionId!,
      sourceLastModified: version.LastModified!.toISOString(),
      sourceStorageClass: 'GLACIER',
      sourceETag: version.ETag ?? null,
      sourceSizeBytes: version.Size ?? null,
      destinationBucket,
      destinationKey: destinationKeyFor(sourceBucket, version.Key!, version.VersionId!),
      destinationVersionId: null,
      sourceSha256: null,
      destinationSha256: null,
      checksumMatches: null,
      status: 'discovered',
      error: null,
      updatedAt: now
    }))
}

export function mergeDiscoveredItems(
  existingItems: ManifestItem[],
  discoveredItems: ManifestItem[],
  now: string = new Date().toISOString()
): ManifestItem[] {
  const existingByIdentity = new Map(existingItems.map((item) => [manifestIdentity(item), item]))
  const merged = new Map<string, ManifestItem>()

  for (const item of discoveredItems) {
    const identity = manifestIdentity(item)
    merged.set(identity, existingByIdentity.get(identity) ?? { ...item, updatedAt: now })
  }

  return Array.from(merged.values()).sort((a, b) => manifestIdentity(a).localeCompare(manifestIdentity(b)))
}

function emptyManifest(env: RemediationEnv, now = new Date().toISOString()): Manifest {
  return {
    schemaVersion: 1,
    environment: env,
    generatedAt: now,
    updatedAt: now,
    items: []
  }
}

function isNoSuchKey(error: unknown): boolean {
  return error instanceof S3ServiceException && (error.name === 'NoSuchKey' || error.$metadata.httpStatusCode === 404)
}

function isRestoreAlreadyInProgress(error: unknown): boolean {
  return error instanceof S3ServiceException && error.name === 'RestoreAlreadyInProgress'
}

function isObjectAlreadyRestored(error: unknown): boolean {
  return error instanceof S3ServiceException && error.name === 'ObjectAlreadyInActiveTierError'
}

function isRestoreAvailable(restoreHeader?: string): boolean {
  return restoreHeader?.includes('ongoing-request="false"') ?? false
}

async function responseBodyToReadable(body: unknown): Promise<Readable> {
  if (body instanceof Readable) {
    return body
  }
  if (body instanceof Uint8Array) {
    return Readable.from(body)
  }
  if (typeof body === 'string') {
    return Readable.from(Buffer.from(body))
  }
  const sdkBody = body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined
  if (sdkBody?.transformToByteArray) {
    return Readable.from(Buffer.from(await sdkBody.transformToByteArray()))
  }
  throw new Error('Unsupported S3 response body type')
}

async function responseBodyToString(body: unknown): Promise<string> {
  const readable = await responseBodyToReadable(body)
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  await pipeline(createReadStream(filePath), hash)
  return hash.digest('hex')
}

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'ludos-s3-glacier-remediation-'))
  try {
    return await fn(dir)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
}

type RemediationContext = {
  env: RemediationEnv
  s3: S3Client
  archiveBucket: string
  manifestObjectKey: string
  sourceBuckets: string[]
}

function remediationContext(env: RemediationEnv, s3: S3Client = new S3Client({ region })): RemediationContext {
  return {
    env,
    s3,
    archiveBucket: archiveBucketFor(env),
    manifestObjectKey: manifestKey(env),
    sourceBuckets: sourceBucketsFor(env)
  }
}

export async function runCommand(
  env: RemediationEnv,
  command: string,
  s3: S3Client = new S3Client({ region })
): Promise<void> {
  const context = remediationContext(env, s3)

  switch (command) {
    case 'discover':
      await discoverWithContext(context)
      return
    case 'copy':
      await copyWithContext(context)
      return
    case 'verify':
      await verifyWithContext(context)
      return
    case 'remediate':
      await discoverWithContext(context)
      await copyWithContext(context)
      await verifyWithContext(context)
      return
    default:
      throw new Error("Expected command to be one of: discover, copy, verify, remediate")
  }
}

export async function discover(env: RemediationEnv, s3: S3Client = new S3Client({ region })): Promise<Manifest> {
  return discoverWithContext(remediationContext(env, s3))
}

export async function copy(env: RemediationEnv, s3: S3Client = new S3Client({ region })): Promise<Manifest> {
  return copyWithContext(remediationContext(env, s3))
}

export async function verify(env: RemediationEnv, s3: S3Client = new S3Client({ region })): Promise<Manifest> {
  return verifyWithContext(remediationContext(env, s3))
}

async function discoverWithContext(context: RemediationContext): Promise<Manifest> {
  const manifest = await loadManifest(context)
  const discovered: ManifestItem[] = []

  for (const sourceBucket of context.sourceBuckets) {
    let keyMarker: string | undefined
    let versionIdMarker: string | undefined
    do {
      const response = await context.s3.send(
        new ListObjectVersionsCommand({
          Bucket: sourceBucket,
          KeyMarker: keyMarker,
          VersionIdMarker: versionIdMarker
        })
      )
      discovered.push(...filterRestorableVersions(context.env, sourceBucket, response.Versions ?? []))
      keyMarker = response.NextKeyMarker
      versionIdMarker = response.NextVersionIdMarker
    } while (keyMarker !== undefined || versionIdMarker !== undefined)
  }

  const now = new Date().toISOString()
  const items = await verifyDestinationObjects(context, mergeDiscoveredItems(manifest.items, discovered, now), now)
  const updated = {
    ...manifest,
    items,
    updatedAt: now
  }
  await saveManifest(context, updated)
  logSummary(context, 'discover', updated)
  return updated
}

async function copyWithContext(context: RemediationContext): Promise<Manifest> {
  const manifest = await loadManifest(context)
  const now = new Date().toISOString()
  const items: ManifestItem[] = []

  for (const item of manifest.items) {
    if (!['destination_missing', 'restore_requested', 'restore_failed', 'restore_available', 'copy_failed'].includes(item.status)) {
      items.push(item)
      continue
    }

    try {
      const sourceRestoreStatus = await requestSourceRestoreIfNeeded(context, item, now)
      if (sourceRestoreStatus) {
        items.push(sourceRestoreStatus)
        continue
      }

      const copied = await withTempDir(async (dir) => {
        const sourcePath = path.join(dir, 'source-object')
        await downloadObject(context, item.sourceBucket, item.sourceKey, item.sourceVersionId, sourcePath)
        const sourceSha256 = await sha256File(sourcePath)
        const stat = await fs.stat(sourcePath)
        const upload = await context.s3.send(
          new PutObjectCommand({
            Bucket: item.destinationBucket,
            Key: item.destinationKey,
            Body: createReadStream(sourcePath),
            ContentLength: stat.size,
            StorageClass: 'GLACIER_IR',
            Metadata: {
              sourcebucket: item.sourceBucket,
              sourcekeybase64url: Buffer.from(item.sourceKey, 'utf8').toString('base64url'),
              sourceversionid: item.sourceVersionId,
              sourcelastmodified: item.sourceLastModified,
              sourcestorageclass: item.sourceStorageClass
            }
          })
        )

        return {
          ...item,
          destinationVersionId: upload.VersionId ?? null,
          sourceSha256,
          status: 'copied' as const,
          error: null,
          updatedAt: now
        }
      })
      items.push(copied)
    } catch (error) {
      items.push({ ...item, status: 'copy_failed', error: String(error), updatedAt: now })
    }
  }

  const updated = { ...manifest, items, updatedAt: now }
  await saveManifest(context, updated)
  logSummary(context, 'copy', updated)
  return updated
}

async function requestSourceRestoreIfNeeded(
  context: RemediationContext,
  item: ManifestItem,
  now: string
): Promise<ManifestItem | null> {
  try {
    const head = await context.s3.send(
      new HeadObjectCommand({
        Bucket: item.sourceBucket,
        Key: item.sourceKey,
        VersionId: item.sourceVersionId
      })
    )
    if (isRestoreAvailable(head.Restore)) {
      return null
    }

    await context.s3.send(
      new RestoreObjectCommand({
        Bucket: item.sourceBucket,
        Key: item.sourceKey,
        VersionId: item.sourceVersionId,
        RestoreRequest: {
          Days: 7,
          GlacierJobParameters: {
            Tier: 'Standard'
          }
        }
      })
    )
    return { ...item, status: 'restore_requested', error: null, updatedAt: now }
  } catch (error) {
    if (isRestoreAlreadyInProgress(error)) {
      return { ...item, status: 'restore_requested', error: null, updatedAt: now }
    }
    if (isObjectAlreadyRestored(error)) {
      return null
    }
    return { ...item, status: 'restore_failed', error: String(error), updatedAt: now }
  }
}

async function verifyWithContext(context: RemediationContext): Promise<Manifest> {
  const manifest = await loadManifest(context)
  const now = new Date().toISOString()
  const items: ManifestItem[] = []

  for (const item of manifest.items) {
    if (item.status !== 'copied' && item.status !== 'checksum_mismatch') {
      items.push(item)
      continue
    }
    if (!item.sourceSha256) {
      items.push({ ...item, status: 'copy_failed', error: 'Missing sourceSha256', updatedAt: now })
      continue
    }

    try {
      const verified = await withTempDir(async (dir) => {
        const destinationPath = path.join(dir, 'destination-object')
        await downloadObject(context, item.destinationBucket, item.destinationKey, item.destinationVersionId, destinationPath)
        const destinationSha256 = await sha256File(destinationPath)
        const checksumMatches = item.sourceSha256 === destinationSha256

        return {
          ...item,
          destinationSha256,
          checksumMatches,
          status: checksumMatches ? ('verified' as const) : ('checksum_mismatch' as const),
          error: checksumMatches ? null : 'Source and destination SHA-256 checksums differ',
          updatedAt: now
        }
      })
      items.push(verified)
    } catch (error) {
      items.push(isNoSuchKey(error) ? destinationMissing(item, now) : { ...item, status: 'checksum_mismatch', error: String(error), updatedAt: now })
    }
  }

  const updated = { ...manifest, items, updatedAt: now }
  await saveManifest(context, updated)
  logSummary(context, 'verify', updated)
  const mismatch = updated.items.find((item) => item.status === 'checksum_mismatch')
  if (mismatch) {
    throw new Error(`Checksum verification failed for ${mismatch.sourceBucket}/${mismatch.sourceKey}`)
  }
  return updated
}

async function verifyDestinationObjects(
  context: RemediationContext,
  items: ManifestItem[],
  now: string
): Promise<ManifestItem[]> {
  const verified: ManifestItem[] = []

  for (const item of items) {
    try {
      const head = await context.s3.send(
        new HeadObjectCommand({
          Bucket: item.destinationBucket,
          Key: item.destinationKey,
          VersionId: item.destinationVersionId ?? undefined
        })
      )
      verified.push({
        ...item,
        destinationVersionId: item.destinationVersionId ?? head.VersionId ?? null,
        status: item.status === 'destination_missing' ? 'discovered' : item.status,
        error: item.status === 'destination_missing' ? null : item.error,
        updatedAt: item.status === 'destination_missing' ? now : item.updatedAt
      })
    } catch (error) {
      if (isNoSuchKey(error)) {
        verified.push(destinationMissing(item, now))
        continue
      }
      verified.push({ ...item, error: `Could not verify destination object: ${String(error)}`, updatedAt: now })
    }
  }

  return verified
}

function destinationMissing(item: ManifestItem, now: string): ManifestItem {
  return {
    ...item,
    destinationVersionId: null,
    destinationSha256: null,
    checksumMatches: false,
    status: 'destination_missing',
    error: 'Destination object does not exist',
    updatedAt: now
  }
}

async function loadManifest(context: RemediationContext): Promise<Manifest> {
  try {
    const response = await context.s3.send(
      new GetObjectCommand({ Bucket: context.archiveBucket, Key: context.manifestObjectKey })
    )
    return JSON.parse(await responseBodyToString(response.Body)) as Manifest
  } catch (error) {
    if (isNoSuchKey(error)) {
      return emptyManifest(context.env)
    }
    throw error
  }
}

async function saveManifest(context: RemediationContext, manifest: Manifest): Promise<void> {
  await context.s3.send(
    new PutObjectCommand({
      Bucket: context.archiveBucket,
      Key: context.manifestObjectKey,
      Body: JSON.stringify(manifest, null, 2),
      ContentType: 'application/json',
      StorageClass: 'STANDARD'
    })
  )
}

async function downloadObject(
  context: RemediationContext,
  bucket: string,
  key: string,
  versionId: string | null,
  destinationPath: string
): Promise<void> {
  const response = await context.s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      VersionId: versionId ?? undefined
    })
  )
  const fileHandle = await fs.open(destinationPath, 'w')
  await pipeline(await responseBodyToReadable(response.Body), fileHandle.createWriteStream())
}

function logSummary(context: RemediationContext, phase: string, manifest: Manifest): void {
  const counts = manifest.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    return acc
  }, {})
  console.log(`${phase} complete for ${context.env}: ${JSON.stringify(counts)}`)
}
